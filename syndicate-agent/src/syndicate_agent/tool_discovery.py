"""Tool discovery — searches GitHub for skills/MCPs matching a need."""
from __future__ import annotations

import logging
import subprocess
from dataclasses import dataclass

import httpx

logger = logging.getLogger("syndicate.tools")


@dataclass
class DiscoveredTool:
    name: str
    source: str
    description: str
    install_command: str
    stars: int = 0


class ToolDiscoveryEngine:
    async def search(self, need: str, max_results: int = 5) -> list[DiscoveredTool]:
        results = await self._search_github(need)
        results.sort(key=lambda t: t.stars, reverse=True)
        return results[:max_results]

    async def install(self, tool: DiscoveredTool) -> bool:
        try:
            r = subprocess.run(
                tool.install_command.split(),
                capture_output=True,
                text=True,
                timeout=60,
            )
            return r.returncode == 0
        except Exception as e:
            logger.error("Install failed: %s", e)
            return False

    async def _search_github(self, query: str) -> list[DiscoveredTool]:
        tools = []
        try:
            async with httpx.AsyncClient() as c:
                r = await c.get(
                    "https://api.github.com/search/repositories",
                    params={
                        "q": f"{query} topic:cursor-skills",
                        "sort": "stars",
                        "per_page": 5,
                    },
                    timeout=10.0,
                )
                if r.status_code == 200:
                    for repo in r.json().get("items", []):
                        tools.append(
                            DiscoveredTool(
                                name=repo["name"],
                                source="github",
                                description=repo.get("description", "")[:150],
                                install_command=f"npx skills add {repo['full_name']}",
                                stars=repo.get("stargazers_count", 0),
                            )
                        )
        except Exception as e:
            logger.warning("GitHub search failed: %s", e)
        return tools
