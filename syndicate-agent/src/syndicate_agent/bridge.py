"""Bridge between Band agent responses and Supabase dashboard events.

When agents process messages in Band, this bridge emits corresponding
events to Supabase so the dashboard shows REAL collaboration data.
"""
from __future__ import annotations

import logging

import httpx

from syndicate_agent.config import Config
from syndicate_agent.types import EventType, TaskStatus

logger = logging.getLogger("syndicate.bridge")


class EventBridge:
    """Intercepts agent responses and writes events to Supabase."""

    def __init__(self, config: Config):
        self.config = config
        self._headers = {
            "apikey": config.supabase_key,
            "Authorization": f"Bearer {config.supabase_key}",
            "Content-Type": "application/json",
        }
        self._current_task_id: str | None = None
        self._metrics_engine: object | None = None
        self._self_improve: object | None = None
        self._memory_engine: object | None = None

    def set_metrics_engine(self, engine):
        """Inject metrics engine for post-completion computation."""
        self._metrics_engine = engine

    def set_self_improve(self, engine):
        """Inject self-improvement engine for post-completion evolution."""
        self._self_improve = engine

    def set_memory_engine(self, engine):
        """Inject memory engine for semantic pre-task context retrieval."""
        self._memory_engine = engine

    async def on_task_received(self, description: str) -> str:
        """Called when Nexus receives a new task. Creates task in Supabase."""
        import uuid

        task_id = str(uuid.uuid4())
        async with httpx.AsyncClient() as client:
            try:
                await client.post(
                    f"{self.config.supabase_url}/rest/v1/tasks",
                    headers={**self._headers, "Prefer": "resolution=merge-duplicates"},
                    json={
                        "id": task_id,
                        "description": description,
                        "status": TaskStatus.PENDING.value,
                        "complexity": "medium",
                    },
                    timeout=5.0,
                )
                await self._emit_event(
                    EventType.TASK_CREATED, "system", f"Task submitted: {description}", task_id
                )
            except Exception as e:
                logger.warning("Failed to create task in Supabase: %s", e)

        self._current_task_id = task_id
        logger.info("Task received and stored: %s", task_id)
        return task_id

    async def on_agent_response(
        self, agent_role: str, message_content: str, room_id: str | None = None
    ):
        """Called after an agent produces a response. Emits appropriate event."""
        task_id = self._current_task_id or ""
        event_type = self._classify_event(agent_role, message_content)

        await self.update_agent_status(agent_role, "active")
        await self._emit_event(event_type, agent_role, message_content[:500], task_id)

        # Update task status based on event
        await self._update_task_status_from_event(event_type, task_id)

        # High-risk review failures create approval gates
        if event_type == EventType.REVIEW_FAILED and task_id:
            risk = self._assess_risk(message_content)
            if risk in ("high", "critical"):
                await self._create_approval_gate(task_id, agent_role, message_content, risk)

        logger.info("Event emitted: %s from %s (task: %s)", event_type.value, agent_role, task_id)

    async def set_agent_idle(self, role: str):
        """Set agent status back to idle after processing."""
        await self.update_agent_status(role, "idle")

    def _assess_risk(self, review_content: str) -> str:
        """Assess risk level from review content keywords."""
        content_lower = review_content.lower()
        if any(kw in content_lower for kw in ["security", "vulnerability", "injection", "critical", "data loss"]):
            return "critical"
        if any(kw in content_lower for kw in ["breaking change", "regression", "production", "high risk", "unsafe"]):
            return "high"
        if any(kw in content_lower for kw in ["concern", "refactor", "complexity"]):
            return "medium"
        return "low"

    async def _create_approval_gate(self, task_id: str, agent: str, content: str, risk: str):
        """Create an approval record in Supabase, pausing the workflow."""
        import uuid as _uuid
        async with httpx.AsyncClient() as client:
            try:
                await client.post(
                    f"{self.config.supabase_url}/rest/v1/approvals",
                    headers=self._headers,
                    json={
                        "id": str(_uuid.uuid4()),
                        "task_id": task_id,
                        "type": "review_approval",
                        "status": "pending",
                        "title": f"Review flagged ({risk} risk)",
                        "description": content[:500],
                        "context": {},
                        "agent": agent,
                        "risk_level": risk,
                    },
                    timeout=5.0,
                )
                # Update task to awaiting_approval
                await client.patch(
                    f"{self.config.supabase_url}/rest/v1/tasks?id=eq.{task_id}",
                    headers=self._headers,
                    json={"status": "awaiting_approval"},
                    timeout=5.0,
                )
                logger.info("Approval gate created for task %s (risk: %s)", task_id, risk)
            except Exception as e:
                logger.warning("Failed to create approval gate: %s", e)

    async def update_agent_status(self, role: str, status: str):
        """Update agent status in Supabase agents table."""
        async with httpx.AsyncClient() as client:
            try:
                await client.patch(
                    f"{self.config.supabase_url}/rest/v1/agents?role=eq.{role}",
                    headers=self._headers,
                    json={"status": status},
                    timeout=15.0,
                )
            except Exception as e:
                logger.warning("Failed to update agent status: %s", e)

    def _classify_event(self, agent_role: str, content: str) -> EventType:
        """Determine event type from agent role and response content."""
        content_lower = content.lower()

        if agent_role == "nexus":
            if any(kw in content_lower for kw in ["task complete", "completed", "done", "merged"]):
                return EventType.TASK_COMPLETE
            return EventType.AGENT_JOINED

        if agent_role == "architect":
            if any(kw in content_lower for kw in ["plan", "subtask", "decompos", "structure"]):
                return EventType.PLAN_CREATED
            return EventType.AGENT_THOUGHT

        if agent_role == "engineer":
            if any(kw in content_lower for kw in ["implement", "code", "function", "class", "def ", "const "]):
                return EventType.CODE_GENERATED
            return EventType.AGENT_THOUGHT

        if agent_role == "reviewer":
            if any(kw in content_lower for kw in ["pass", "approved", "lgtm", "clean"]):
                return EventType.REVIEW_PASSED
            if any(kw in content_lower for kw in ["fail", "reject", "issue", "concern", "fix"]):
                return EventType.REVIEW_FAILED
            return EventType.REVIEW_STARTED

        if agent_role == "researcher":
            return EventType.AGENT_THOUGHT

        if agent_role == "qa":
            return EventType.AGENT_THOUGHT

        return EventType.AGENT_THOUGHT

    async def _update_task_status_from_event(self, event_type: EventType, task_id: str):
        """Update task status in Supabase based on the event."""
        if not task_id:
            return

        status_map = {
            EventType.TASK_CREATED: TaskStatus.PENDING,
            EventType.PLAN_CREATED: TaskStatus.PLANNING,
            EventType.CODE_GENERATED: TaskStatus.IN_PROGRESS,
            EventType.REVIEW_STARTED: TaskStatus.REVIEWING,
            EventType.REVIEW_PASSED: TaskStatus.REVIEWING,
            EventType.TASK_COMPLETE: TaskStatus.COMPLETE,
        }

        new_status = status_map.get(event_type)
        if new_status:
            async with httpx.AsyncClient() as client:
                try:
                    await client.patch(
                        f"{self.config.supabase_url}/rest/v1/tasks?id=eq.{task_id}",
                        headers=self._headers,
                        json={"status": new_status.value},
                        timeout=5.0,
                    )
                except Exception as e:
                    logger.warning("Failed to update task status: %s", e)

        if event_type == EventType.TASK_COMPLETE and self._metrics_engine:
            try:
                await self._metrics_engine.compute_and_store(task_id)
                logger.info("Metrics computed for completed task: %s", task_id)
            except Exception as e:
                logger.warning("Metrics computation failed for %s: %s", task_id, e)

            if self._self_improve:
                try:
                    events = await self._metrics_engine._fetch_events(task_id)
                    await self._self_improve.run_cycle(task_id, events)
                    logger.info("Self-improvement cycle completed for: %s", task_id)
                except Exception as e:
                    logger.warning("Self-improvement failed for %s: %s", task_id, e)

    async def _emit_event(
        self, event_type: EventType, agent: str, content: str, task_id: str
    ):
        """Write event to Supabase events table."""
        async with httpx.AsyncClient() as client:
            try:
                await client.post(
                    f"{self.config.supabase_url}/rest/v1/events",
                    headers=self._headers,
                    json={
                        "task_id": task_id if task_id else None,
                        "type": event_type.value,
                        "agent": agent,
                        "content": content,
                        "metadata": {},
                    },
                    timeout=15.0,
                )
            except Exception as e:
                logger.warning("Failed to emit event: %s", e)

    async def watch_for_tasks(self):
        """Poll Supabase for new pending tasks submitted from dashboard."""
        import asyncio

        logger.info("Task watcher started — polling for pending tasks")
        while True:
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.get(
                        f"{self.config.supabase_url}/rest/v1/tasks?status=eq.pending&order=created_at.asc&limit=1",
                        headers=self._headers,
                        timeout=5.0,
                    )
                    if resp.status_code == 200:
                        tasks = resp.json()
                        if tasks:
                            task = tasks[0]
                            self._current_task_id = task["id"]
                            logger.info("Picked up pending task: %s", task["id"])
                            # Mark as planning so we don't pick it up again
                            await client.patch(
                                f"{self.config.supabase_url}/rest/v1/tasks?id=eq.{task['id']}",
                                headers=self._headers,
                                json={"status": TaskStatus.PLANNING.value},
                                timeout=5.0,
                            )
                            await self._emit_event(
                                EventType.AGENT_JOINED,
                                "nexus",
                                f"Nexus picking up task: {task['description'][:100]}",
                                task["id"],
                            )
                            # Query semantic memory for relevant context
                            await self._query_relevant_memory(task["description"])
            except Exception as e:
                logger.warning("Task watcher error: %s", e)

            await asyncio.sleep(5)

    async def _query_relevant_memory(self, description: str):
        """Query semantic memory for past learnings relevant to the current task."""
        if not self._memory_engine:
            return
        try:
            memories = await self._memory_engine.semantic_search(description, threshold=0.6, limit=3)
            if memories:
                context = "; ".join(m.get("content", "")[:100] for m in memories[:3])
                logger.info("Relevant memories found: %s", context[:200])
        except Exception as e:
            logger.debug("Semantic memory query skipped: %s", e)
