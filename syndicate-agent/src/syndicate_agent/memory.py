"""Persistent memory engine — three layers for compound intelligence."""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path

import httpx

logger = logging.getLogger("syndicate.memory")
MEMORY_DIR = Path(__file__).parent.parent.parent.parent / "memory"


class MemoryEngine:
    def __init__(self, supabase_url: str = "", supabase_key: str = ""):
        self.supabase_url = supabase_url or os.getenv("SUPABASE_URL", "")
        self.supabase_key = supabase_key or os.getenv("SUPABASE_KEY", "")
        self._headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json",
        }
        MEMORY_DIR.mkdir(parents=True, exist_ok=True)
        for sub in ("protocol", "project", "agent"):
            (MEMORY_DIR / sub).mkdir(exist_ok=True)

    async def store_protocol_state(
        self, task_id: str, state: str, from_agent: str, to_agent: str
    ):
        content = f"protocol task {task_id} state {state} from {from_agent} to {to_agent}"
        await self._store("protocol_state", from_agent, content, [task_id, state])
        self._local_append(
            "protocol", task_id, {"state": state, "from": from_agent, "to": to_agent}
        )

    async def store_project_memory(
        self, content: str, agent: str, tags: list[str] | None = None
    ):
        await self._store("project", agent, content, tags or [])
        self._local_append("project", "learnings", {"content": content, "agent": agent})

    async def store_agent_learning(self, role: str, content: str, context: str = ""):
        await self._store("agent_learning", role, content, [role])
        self._local_append("agent", role, {"content": content, "context": context})

    async def get_project_memories(self, limit: int = 20) -> list[dict]:
        return await self._query("project", limit=limit)

    async def get_agent_learnings(self, role: str, limit: int = 10) -> list[dict]:
        return await self._query("agent_learning", agent=role, limit=limit)

    async def extract_lessons(self, task_id: str, events: list[dict]) -> list[str]:
        lessons = []
        failures = [e for e in events if e.get("type") == "review_failed"]
        if failures:
            for f in failures:
                lesson = f"Review failure: {f.get('content', '')[:200]}"
                lessons.append(lesson)
                await self.store_agent_learning("engineer", lesson, task_id)
        elif any(e.get("type") == "review_passed" for e in events):
            lessons.append("Clean first-pass review — approach working well")
            await self.store_agent_learning("engineer", "Clean review pass", task_id)
        return lessons

    async def _store(self, category: str, agent: str, content: str, tags: list[str]):
        if not self.supabase_url:
            return
        try:
            async with httpx.AsyncClient() as c:
                await c.post(
                    f"{self.supabase_url}/rest/v1/memory",
                    headers=self._headers,
                    json={
                        "content": content,
                        "category": category,
                        "agent": agent,
                        "tags": tags,
                    },
                    timeout=5.0,
                )
        except Exception as e:
            logger.warning("Memory store failed: %s", e)

    async def _query(
        self,
        category: str | None = None,
        agent: str | None = None,
        limit: int = 20,
    ) -> list[dict]:
        if not self.supabase_url:
            return []
        params = f"select=*&order=created_at.desc&limit={limit}&status=eq.active"
        if category:
            params += f"&category=eq.{category}"
        if agent:
            params += f"&agent=eq.{agent}"
        try:
            async with httpx.AsyncClient() as c:
                r = await c.get(
                    f"{self.supabase_url}/rest/v1/memory?{params}",
                    headers=self._headers,
                    timeout=5.0,
                )
                return r.json() if r.status_code == 200 else []
        except Exception:
            return []

    def _local_append(self, layer: str, key: str, data: dict):
        path = MEMORY_DIR / layer / f"{key}.jsonl"
        data["timestamp"] = datetime.now(timezone.utc).isoformat()
        with open(path, "a") as f:
            f.write(json.dumps(data) + "\n")
