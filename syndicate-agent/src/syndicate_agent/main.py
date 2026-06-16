"""Minimal Band agent loop — proves agents can discover, invite, and message each other.

This is the foundational proof that the Syndicate swarm can coordinate through Band.
Run after agent_config.yaml is filled:

    cd syndicate-agent
    uv run python -m syndicate_agent.main
"""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path

import yaml
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("syndicate")


def _load_config() -> dict[str, dict[str, str]]:
    """Load agent credentials from agent_config.yaml."""
    config_path = Path(__file__).resolve().parent.parent.parent.parent / "agent_config.yaml"
    with open(config_path) as f:
        return {k: v for k, v in yaml.safe_load(f).items() if v.get("agent_id") and v.get("api_key")}


def _load_prompt(role: str) -> str:
    """Load the agent prompt for a given role."""
    prompt_path = Path(__file__).parent / "prompts" / f"{role}.md"
    if prompt_path.exists():
        return prompt_path.read_text(encoding="utf-8")
    return f"You are the {role} agent in the Syndicate development swarm."


async def run_nexus(config: dict[str, dict[str, str]]) -> None:
    """Run the Nexus conductor agent — the core coordination hub."""
    from syndicate_agent.config import Config

    cfg = Config.load()
    nexus_creds = config.get("nexus")
    if not nexus_creds:
        logger.error("Nexus agent not configured in agent_config.yaml")
        return

    try:
        from thenvoi import Agent
        from thenvoi.adapters import LangGraphAdapter
        from langchain_openai import ChatOpenAI
        from langgraph.checkpoint.memory import InMemorySaver

        llm = ChatOpenAI(
            model=cfg.gemini_model_coordinator,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            api_key=cfg.google_api_key,
        )

        adapter = LangGraphAdapter(
            llm=llm,
            checkpointer=InMemorySaver(),
            custom_section=_load_prompt("nexus"),
        )

        agent = Agent.create(
            adapter=adapter,
            agent_id=nexus_creds["agent_id"],
            api_key=nexus_creds["api_key"],
            ws_url=cfg.band_ws_url,
            rest_url=cfg.band_rest_url,
        )

        logger.info("Nexus agent running — listening for tasks...")
        await agent.run()

    except ImportError as e:
        logger.error("Missing dependency: %s. Run 'uv sync' first.", e)
    except Exception as e:
        logger.error("Nexus agent failed: %s: %s", type(e).__name__, e)


async def run_specialist(role: str, config: dict[str, dict[str, str]]) -> None:
    """Run a specialist agent (architect, engineer, reviewer, etc.)."""
    from syndicate_agent.config import Config

    cfg = Config.load()
    creds = config.get(role)
    if not creds:
        logger.warning("Agent '%s' not configured — skipping", role)
        return

    try:
        from thenvoi import Agent
        from thenvoi.adapters import LangGraphAdapter
        from langchain_openai import ChatOpenAI
        from langgraph.checkpoint.memory import InMemorySaver

        if role == "reviewer":
            # Reviewer uses Azure OpenAI (different model family for adversarial review)
            llm = ChatOpenAI(
                model=cfg.azure_openai_deployment,
                base_url=f"{cfg.azure_openai_endpoint}/openai/deployments/{cfg.azure_openai_deployment}",
                api_key=cfg.azure_openai_api_key,
                default_headers={"api-key": cfg.azure_openai_api_key},
                model_kwargs={"api_version": cfg.azure_openai_api_version},
            )
            adapter = LangGraphAdapter(
                llm=llm,
                checkpointer=InMemorySaver(),
                custom_section=_load_prompt("reviewer"),
            )
        else:
            llm = ChatOpenAI(
                model=cfg.gemini_model_specialist,
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                api_key=cfg.google_api_key,
            )
            adapter = LangGraphAdapter(
                llm=llm,
                checkpointer=InMemorySaver(),
                custom_section=_load_prompt(role),
            )

        agent = Agent.create(
            adapter=adapter,
            agent_id=creds["agent_id"],
            api_key=creds["api_key"],
            ws_url=cfg.band_ws_url,
            rest_url=cfg.band_rest_url,
        )

        logger.info("%s agent running...", role.capitalize())
        await agent.run()

    except ImportError as e:
        logger.error("Missing dependency for %s: %s", role, e)
    except Exception as e:
        logger.error("%s agent failed: %s: %s", role, type(e).__name__, e)


async def run_swarm():
    """Run all configured agents in the swarm concurrently."""
    load_dotenv()
    config = _load_config()

    if not config:
        logger.error("No agents configured. Fill agent_config.yaml first.")
        return

    # Initialize orchestrator for task lifecycle management
    from syndicate_agent.orchestrator import SyndicateOrchestrator
    from syndicate_agent.config import Config

    cfg = Config.load()
    orchestrator = SyndicateOrchestrator(cfg)
    import syndicate_agent
    syndicate_agent._orchestrator = orchestrator
    logger.info("Orchestrator initialized")

    logger.info("Starting Syndicate swarm with %d agents...", len(config))

    tasks = []

    if "nexus" in config:
        tasks.append(asyncio.create_task(run_nexus(config)))

    for role in ["architect", "engineer", "reviewer", "researcher", "qa"]:
        if role in config:
            tasks.append(asyncio.create_task(run_specialist(role, config)))

    if not tasks:
        logger.error("No agents to start")
        return

    logger.info("Swarm active: %s", ", ".join(config.keys()))
    logger.info("Send a message to @Nexus in a Band room to start.")

    try:
        await asyncio.gather(*tasks)
    except KeyboardInterrupt:
        logger.info("Shutdown signal — stopping swarm...")
        for t in tasks:
            t.cancel()


def main():
    """Entry point for `python -m syndicate_agent.main`."""
    asyncio.run(run_swarm())


if __name__ == "__main__":
    main()
