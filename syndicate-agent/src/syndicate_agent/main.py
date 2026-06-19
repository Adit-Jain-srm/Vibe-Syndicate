"""Syndicate Agent Swarm — runs all Band agents with event bridge to dashboard.

    cd syndicate-agent
    uv run python -m syndicate_agent.main
"""
from __future__ import annotations

import asyncio
import logging
import os
from pathlib import Path

import yaml
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("syndicate")


def _load_config() -> dict[str, dict[str, str]]:
    """Load agent credentials from AGENT_CONFIG_YAML env or agent_config.yaml file."""
    import base64

    yaml_content = os.environ.get("AGENT_CONFIG_YAML")
    if not yaml_content:
        b64 = os.environ.get("AGENT_CONFIG_YAML_B64")
        if b64:
            yaml_content = base64.b64decode(b64).decode("utf-8")

    if yaml_content:
        data = yaml.safe_load(yaml_content) or {}
    else:
        candidates = [
            Path(__file__).resolve().parent.parent.parent.parent / "agent_config.yaml",
            Path.cwd() / "agent_config.yaml",
        ]
        config_path = next((p for p in candidates if p.exists()), None)
        if not config_path:
            logger.error(
                "No agent config found — set AGENT_CONFIG_YAML env var or create agent_config.yaml"
            )
            return {}
        with open(config_path, encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}

    return {
        k: v
        for k, v in data.items()
        if isinstance(v, dict) and v.get("agent_id") and v.get("api_key")
    }


def _start_health_server() -> None:
    """Expose a minimal HTTP health check when PORT is set (Render/Railway web services)."""
    port = os.environ.get("PORT")
    if not port:
        return

    from http.server import BaseHTTPRequestHandler, HTTPServer
    import threading

    class HealthHandler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"Syndicate swarm OK\n")

        def log_message(self, *_args) -> None:
            pass

    server = HTTPServer(("0.0.0.0", int(port)), HealthHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    logger.info("Health server listening on 0.0.0.0:%s", port)


def _load_prompt(role: str) -> str:
    """Load the agent prompt for a given role."""
    prompt_path = Path(__file__).parent / "prompts" / f"{role}.md"
    if prompt_path.exists():
        return prompt_path.read_text(encoding="utf-8")
    return f"You are the {role} agent in the Syndicate development swarm."


async def run_nexus(config: dict[str, dict[str, str]]) -> None:
    """Run the Nexus conductor agent with reconnect-forever resilience."""
    from syndicate_agent.config import Config

    cfg = Config.load()
    nexus_creds = config.get("nexus")
    if not nexus_creds:
        logger.error("Nexus agent not configured in agent_config.yaml")
        return

    attempt = 0
    while True:
        attempt += 1
        try:
            from band import Agent
            from band.adapters import LangGraphAdapter
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

            logger.info("Nexus agent running (attempt %d)...", attempt)
            await agent.run()

        except ImportError as e:
            logger.error("Missing dependency: %s. Run 'uv sync' first.", e)
            return
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.warning("Nexus agent crashed (attempt %d): %s: %s", attempt, type(e).__name__, e)

        delay = min(2.0 * (2 ** min(attempt - 1, 5)), 60.0)
        logger.info("Nexus reconnecting in %.1fs...", delay)
        await asyncio.sleep(delay)


async def run_specialist(role: str, config: dict[str, dict[str, str]]) -> None:
    """Run a specialist agent with reconnect-forever resilience."""
    from syndicate_agent.config import Config

    cfg = Config.load()
    creds = config.get(role)
    if not creds:
        logger.warning("Agent '%s' not configured — skipping", role)
        return

    attempt = 0
    while True:
        attempt += 1
        try:
            from band import Agent
            from band.adapters import LangGraphAdapter
            from langchain_openai import ChatOpenAI
            from langgraph.checkpoint.memory import InMemorySaver

            if role == "reviewer":
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

            logger.info("%s agent running (attempt %d)...", role.capitalize(), attempt)
            await agent.run()

        except ImportError as e:
            logger.error("Missing dependency for %s: %s", role, e)
            return
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.warning("%s agent crashed (attempt %d): %s: %s", role, attempt, type(e).__name__, e)

        delay = min(2.0 * (2 ** min(attempt - 1, 5)), 60.0)
        logger.info("%s reconnecting in %.1fs...", role.capitalize(), delay)
        await asyncio.sleep(delay)


async def run_swarm():
    """Run all configured agents in the swarm concurrently."""
    load_dotenv()
    _start_health_server()
    config = _load_config()

    if not config:
        logger.error("No agents configured. Fill agent_config.yaml first.")
        return

    # Initialize orchestrator and bridge
    from syndicate_agent.orchestrator import SyndicateOrchestrator
    from syndicate_agent.bridge import EventBridge
    from syndicate_agent.metrics import MetricsEngine
    from syndicate_agent.memory import MemoryEngine
    from syndicate_agent.self_improve import SelfImprovementEngine
    from syndicate_agent.config import Config

    cfg = Config.load()
    orchestrator = SyndicateOrchestrator(cfg)
    bridge = EventBridge(cfg)
    metrics_engine = MetricsEngine(cfg)
    memory_engine = MemoryEngine(cfg.supabase_url, cfg.supabase_key)
    self_improve = SelfImprovementEngine(memory_engine)

    bridge.set_metrics_engine(metrics_engine)
    bridge.set_self_improve(self_improve)
    bridge.set_memory_engine(memory_engine)

    # Configure Band routing: bridge sends tasks directly to Nexus via Band REST API
    nexus_creds = config.get("nexus", {})
    band_room_id = os.environ.get("BAND_ROOM_ID", "72a6f9a1-0841-40f6-bc90-a4fa64fe7e17")
    if nexus_creds.get("api_key"):
        bridge.set_band_routing(nexus_creds["api_key"], band_room_id)

    import syndicate_agent
    syndicate_agent._orchestrator = orchestrator
    syndicate_agent._bridge = bridge
    syndicate_agent._metrics_engine = metrics_engine
    logger.info("Orchestrator + EventBridge + MetricsEngine + SelfImprove initialized")

    # Set all agents to idle on startup (staggered for slow DNS)
    logger.info("Syncing agent status to Supabase...")
    for role in config:
        await bridge.update_agent_status(role, "idle")
        await asyncio.sleep(0.5)

    logger.info("Starting Syndicate swarm with %d agents...", len(config))

    tasks = []

    # Start task watcher (polls Supabase for dashboard-submitted tasks)
    tasks.append(asyncio.create_task(bridge.watch_for_tasks()))

    # Start heartbeat system (detects stale/crashed agents)
    tasks.append(asyncio.create_task(bridge.run_heartbeat(list(config.keys()), interval=30)))

    if "nexus" in config:
        tasks.append(asyncio.create_task(run_nexus(config)))
        await asyncio.sleep(1)

    for role in ["architect", "engineer", "reviewer", "researcher", "qa"]:
        if role in config:
            tasks.append(asyncio.create_task(run_specialist(role, config)))
            await asyncio.sleep(0.5)

    if len(tasks) <= 1:
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
