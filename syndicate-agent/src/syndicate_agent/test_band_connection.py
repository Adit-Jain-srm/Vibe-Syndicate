"""Band.ai connection test — verifies all agents can connect and communicate.

Usage:
    cd syndicate-agent
    uv run python -m syndicate_agent.test_band_connection

Prerequisites:
    - agent_config.yaml filled with agent UUIDs and API keys from Band platform
    - .env with BAND_WS_URL and BAND_REST_URL (defaults work for production Band)
"""

from __future__ import annotations

import asyncio
import logging
import sys
from pathlib import Path

import yaml
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def load_agent_config() -> dict[str, dict[str, str]]:
    """Load agent_config.yaml from project root."""
    config_path = Path(__file__).resolve().parent.parent.parent.parent / "agent_config.yaml"
    if not config_path.exists():
        logger.error("agent_config.yaml not found at %s", config_path)
        sys.exit(1)

    with open(config_path) as f:
        config = yaml.safe_load(f)

    agents = {}
    for name, creds in config.items():
        if not creds.get("agent_id") or not creds.get("api_key"):
            logger.warning("Agent '%s' has empty credentials — skipping", name)
            continue
        agents[name] = creds

    return agents


async def test_agent_connection(name: str, agent_id: str, api_key: str) -> bool:
    """Test that a single agent can connect to Band.ai."""
    import httpx

    from syndicate_agent.config import Config

    cfg = Config.load()

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{cfg.band_rest_url}api/v1/agent/me",
                headers={"x-api-key": api_key},
                timeout=10.0,
            )

            if resp.status_code == 200:
                data = resp.json()
                agent_name = data.get("data", {}).get("name", "unknown")
                logger.info("  [PASS] %s → connected as '%s' (id: %s)", name, agent_name, agent_id)
                return True
            else:
                logger.error("  [FAIL] %s → HTTP %d: %s", name, resp.status_code, resp.text[:200])
                return False

    except Exception as e:
        logger.error("  [FAIL] %s → %s: %s", name, type(e).__name__, e)
        return False


async def test_all_agents():
    """Test connectivity for all configured agents."""
    load_dotenv()

    agents = load_agent_config()

    if not agents:
        logger.error("No agents with valid credentials found in agent_config.yaml")
        sys.exit(1)

    logger.info("Testing %d agent connection(s)...\n", len(agents))

    results = []
    for name, creds in agents.items():
        ok = await test_agent_connection(name, creds["agent_id"], creds["api_key"])
        results.append((name, ok))

    print("\n" + "=" * 50)
    passed = sum(1 for _, ok in results if ok)
    failed = sum(1 for _, ok in results if not ok)
    print(f"Results: {passed} passed, {failed} failed, {len(results)} total")

    if failed > 0:
        print("\nFailed agents:")
        for name, ok in results:
            if not ok:
                print(f"  - {name}")
        sys.exit(1)
    else:
        print("\nAll agents connected successfully!")


if __name__ == "__main__":
    asyncio.run(test_all_agents())
