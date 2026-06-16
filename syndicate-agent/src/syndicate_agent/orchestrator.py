"""Syndicate Orchestrator — drives the multi-agent task lifecycle.

The orchestrator manages task state and coordinates with Band agents.
It runs alongside the agent swarm and provides the API layer's interface
to the running swarm.
"""
from __future__ import annotations

import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

import httpx

from syndicate_agent.config import Config
from syndicate_agent.types import (
    AgentRole, Event, EventType, MemoryEntry,
    ReviewVerdict, Subtask, Task, TaskStatus,
)

logger = logging.getLogger("syndicate.orchestrator")


class SyndicateOrchestrator:
    """Manages task lifecycle and agent coordination state."""

    def __init__(self, config: Config):
        self.config = config
        self.active_tasks: dict[str, Task] = {}
        self.events: list[Event] = []
        self._supabase_headers = {
            "apikey": config.supabase_key,
            "Authorization": f"Bearer {config.supabase_key}",
            "Content-Type": "application/json",
        }

    # ─── Task Management ─────────────────────────────────────────────

    async def create_task(self, description: str, complexity: str = "medium") -> Task:
        """Create a new task and persist to Supabase."""
        task = Task(
            id=f"task_{uuid.uuid4().hex[:12]}",
            description=description,
            status=TaskStatus.PENDING,
        )
        self.active_tasks[task.id] = task

        await self._store_task(task)
        await self._emit_event(EventType.TASK_CREATED, "system", f"Task created: {description}", task.id)

        logger.info("Task created: %s — %s", task.id, description[:80])
        return task

    async def update_task_status(self, task_id: str, status: TaskStatus, **kwargs) -> Task | None:
        """Update task status and persist."""
        task = self.active_tasks.get(task_id)
        if not task:
            return None
        task.status = status
        for k, v in kwargs.items():
            if hasattr(task, k):
                setattr(task, k, v)
        await self._store_task(task)
        return task

    async def complete_task(self, task_id: str, result: str) -> Task | None:
        """Mark a task as complete with result."""
        task = await self.update_task_status(task_id, TaskStatus.COMPLETE, result=result)
        if task:
            await self._emit_event(EventType.TASK_COMPLETE, "nexus", result, task_id)
            logger.info("Task complete: %s", task_id)
        return task

    # ─── Event Tracking ──────────────────────────────────────────────

    async def _emit_event(self, event_type: EventType, agent: str, content: str, task_id: str = "", **metadata):
        """Emit and persist an event."""
        event = Event(
            type=event_type,
            agent=agent,
            content=content,
            metadata={"task_id": task_id, **metadata},
        )
        self.events.append(event)

        async with httpx.AsyncClient() as client:
            try:
                await client.post(
                    f"{self.config.supabase_url}/rest/v1/events",
                    headers=self._supabase_headers,
                    json={
                        "task_id": task_id if task_id else None,
                        "type": event_type.value,
                        "agent": agent,
                        "content": content,
                        "metadata": metadata,
                    },
                    timeout=5.0,
                )
            except Exception as e:
                logger.warning("Failed to persist event: %s", e)

        return event

    def get_events(self, task_id: str | None = None, limit: int = 50) -> list[Event]:
        """Get events, optionally filtered by task."""
        events = self.events
        if task_id:
            events = [e for e in events if e.metadata.get("task_id") == task_id]
        return events[-limit:]

    # ─── Memory ──────────────────────────────────────────────────────

    async def store_memory(self, content: str, category: str, agent: str, tags: list[str] | None = None):
        """Store a memory entry in Supabase."""
        async with httpx.AsyncClient() as client:
            try:
                await client.post(
                    f"{self.config.supabase_url}/rest/v1/memory",
                    headers=self._supabase_headers,
                    json={
                        "content": content,
                        "category": category,
                        "agent": agent,
                        "tags": tags or [],
                    },
                    timeout=5.0,
                )
                await self._emit_event(EventType.MEMORY_STORED, agent, content[:200])
            except Exception as e:
                logger.warning("Failed to store memory: %s", e)

    async def query_memory(self, category: str | None = None, agent: str | None = None) -> list[dict]:
        """Query memory from Supabase."""
        params = {"select": "*", "order": "created_at.desc", "limit": "20"}
        if category:
            params["category"] = f"eq.{category}"
        if agent:
            params["agent"] = f"eq.{agent}"

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(
                    f"{self.config.supabase_url}/rest/v1/memory",
                    headers=self._supabase_headers,
                    params=params,
                    timeout=5.0,
                )
                if resp.status_code == 200:
                    return resp.json()
            except Exception as e:
                logger.warning("Failed to query memory: %s", e)
        return []

    # ─── Supabase Persistence ────────────────────────────────────────

    async def _store_task(self, task: Task):
        """Upsert task to Supabase."""
        async with httpx.AsyncClient() as client:
            try:
                await client.post(
                    f"{self.config.supabase_url}/rest/v1/tasks",
                    headers={**self._supabase_headers, "Prefer": "resolution=merge-duplicates"},
                    json={
                        "id": task.id,
                        "description": task.description,
                        "status": task.status.value,
                        "complexity": "medium",
                        "plan": task.plan,
                        "result": task.result,
                    },
                    timeout=5.0,
                )
            except Exception as e:
                logger.warning("Failed to persist task: %s", e)

    async def get_agent_statuses(self) -> list[dict]:
        """Get current agent statuses from Supabase."""
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(
                    f"{self.config.supabase_url}/rest/v1/agents?select=*",
                    headers=self._supabase_headers,
                    timeout=5.0,
                )
                if resp.status_code == 200:
                    return resp.json()
            except Exception as e:
                logger.warning("Failed to get agent statuses: %s", e)
        return []
