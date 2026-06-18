"""Syndicate Orchestrator — drives the multi-agent task lifecycle.

The orchestrator manages task state, approval gates, and coordinates
with Band agents. It runs alongside the agent swarm and provides
the API layer's interface to the running swarm.
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
            id=str(uuid.uuid4()),
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
            # Create a stub task if not tracked locally
            task = Task(id=task_id, description="", status=status)
            self.active_tasks[task_id] = task
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

    # ─── Agent Status ─────────────────────────────────────────────────

    async def update_agent_status(self, role: str, status: str):
        """Update agent status in Supabase agents table."""
        async with httpx.AsyncClient() as client:
            try:
                await client.patch(
                    f"{self.config.supabase_url}/rest/v1/agents?role=eq.{role}",
                    headers=self._supabase_headers,
                    json={"status": status},
                    timeout=5.0,
                )
            except Exception as e:
                logger.warning("Failed to update agent status for %s: %s", role, e)

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

    # ─── Approval Gates (Human-in-the-Loop) ──────────────────────────

    async def create_approval(
        self,
        task_id: str,
        title: str,
        description: str,
        agent: str,
        risk_level: str = "medium",
        context: dict | None = None,
    ) -> str:
        """Create an approval record — pauses workflow until human decides."""
        approval_id = str(uuid.uuid4())
        async with httpx.AsyncClient() as client:
            try:
                await client.post(
                    f"{self.config.supabase_url}/rest/v1/approvals",
                    headers=self._supabase_headers,
                    json={
                        "id": approval_id,
                        "task_id": task_id,
                        "type": "review_approval",
                        "status": "pending",
                        "title": title,
                        "description": description,
                        "context": context or {},
                        "agent": agent,
                        "risk_level": risk_level,
                    },
                    timeout=5.0,
                )
            except Exception as e:
                logger.warning("Failed to create approval: %s", e)
                return ""

        await self.update_task_status(task_id, TaskStatus.AWAITING_APPROVAL)
        await self._emit_event(EventType.APPROVAL_NEEDED, agent, title, task_id)
        logger.info("Approval created: %s (risk: %s)", title, risk_level)
        return approval_id

    async def resolve_approval(
        self, approval_id: str, decision: str, decided_by: str = "user"
    ) -> dict | None:
        """Resolve a pending approval — approved or rejected."""
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.patch(
                    f"{self.config.supabase_url}/rest/v1/approvals?id=eq.{approval_id}",
                    headers={**self._supabase_headers, "Prefer": "return=representation"},
                    json={
                        "status": decision,
                        "decided_by": decided_by,
                        "decided_at": datetime.now(timezone.utc).isoformat(),
                    },
                    timeout=5.0,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if data:
                        approval = data[0]
                        task_id = approval.get("task_id", "")
                        if decision == "approved":
                            await self.update_task_status(task_id, TaskStatus.IN_PROGRESS)
                            await self._emit_event(
                                EventType.APPROVAL_GRANTED, "user",
                                f"Approved: {approval.get('title', '')}", task_id
                            )
                        else:
                            await self.update_task_status(task_id, TaskStatus.FAILED)
                            await self._emit_event(
                                EventType.APPROVAL_REJECTED, "user",
                                f"Rejected: {approval.get('title', '')}", task_id
                            )
                        return approval
            except Exception as e:
                logger.warning("Failed to resolve approval: %s", e)
        return None

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
                        "timestamp": datetime.now(timezone.utc).isoformat(),
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
