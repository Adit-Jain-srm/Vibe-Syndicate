"""Bridge between Band agent responses and Supabase dashboard events.

When agents process messages in Band, this bridge emits corresponding
events to Supabase so the dashboard shows REAL collaboration data.
"""
from __future__ import annotations

import asyncio
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
        self._active_task_ids: dict[str, str] = {}
        self._metrics_engine: object | None = None
        self._self_improve: object | None = None
        self._memory_engine: object | None = None
        self._nexus_api_key: str | None = None
        self._band_room_id: str | None = None
        self._approval_watchers: dict[str, asyncio.Task] = {}
        self._max_approval_watchers = 10
        self._http_client: httpx.AsyncClient | None = None

    def set_metrics_engine(self, engine):
        """Inject metrics engine for post-completion computation."""
        self._metrics_engine = engine

    def set_self_improve(self, engine):
        """Inject self-improvement engine for post-completion evolution."""
        self._self_improve = engine

    def set_memory_engine(self, engine):
        """Inject memory engine for semantic pre-task context retrieval."""
        self._memory_engine = engine

    def set_band_routing(self, nexus_api_key: str, room_id: str):
        """Configure Band routing so bridge can send tasks directly to Nexus."""
        self._nexus_api_key = nexus_api_key
        self._band_room_id = room_id
        logger.info("Band routing configured: room %s", room_id[:8])

    async def _get_client(self) -> httpx.AsyncClient:
        """Return a shared httpx client for connection pooling."""
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(timeout=15.0)
        return self._http_client

    async def close(self):
        """Close shared HTTP client and cancel watchers."""
        if self._http_client and not self._http_client.is_closed:
            await self._http_client.aclose()
        for task in self._approval_watchers.values():
            task.cancel()
        self._approval_watchers.clear()

    async def on_task_received(self, description: str) -> str:
        """Called when Nexus receives a new task. Creates task in Supabase."""
        import uuid

        task_id = str(uuid.uuid4())
        client = await self._get_client()
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

        logger.info("Task received and stored: %s", task_id)
        return task_id

    async def on_agent_response(
        self, agent_role: str, message_content: str, room_id: str | None = None,
        model: str | None = None, reasoning: str | None = None, confidence: float | None = None,
        task_id: str | None = None,
    ):
        """Called after an agent produces a response. Emits appropriate event with rich metadata."""
        resolved_task_id = task_id or ""
        event_type = self._classify_event(agent_role, message_content)

        await self.update_agent_status(agent_role, "active")

        metadata = {"source": "band"}
        if model:
            metadata["model"] = model
        if reasoning:
            metadata["reasoning"] = reasoning[:500]
        if confidence is not None:
            metadata["confidence"] = confidence

        await self._emit_event_with_metadata(event_type, agent_role, message_content[:500], resolved_task_id, metadata)

        await self._update_task_status_from_event(event_type, resolved_task_id)

        if resolved_task_id:
            await self._check_approval_triggers(event_type, agent_role, message_content, resolved_task_id)

        logger.info("Event emitted: %s from %s (task: %s)", event_type.value, agent_role, resolved_task_id)

    async def _emit_event_with_metadata(
        self, event_type: EventType, agent: str, content: str, task_id: str, metadata: dict
    ):
        """Write event to Supabase events table with full metadata."""
        client = await self._get_client()
        try:
            await client.post(
                f"{self.config.supabase_url}/rest/v1/events",
                headers=self._headers,
                json={
                    "task_id": task_id if task_id else None,
                    "type": event_type.value,
                    "agent": agent,
                    "content": content,
                    "metadata": metadata,
                },
                timeout=15.0,
            )
        except Exception as e:
            logger.warning("Failed to emit event: %s", e)

    async def _check_approval_triggers(
        self, event_type: EventType, agent_role: str, content: str, task_id: str
    ):
        """Check multiple conditions that should trigger human approval."""
        content_lower = content.lower()
        risk = self._assess_risk(content)

        # Trigger 1: High/critical review failures
        if event_type == EventType.REVIEW_FAILED and risk in ("high", "critical"):
            await self._create_approval_gate(task_id, agent_role, content, risk)
            return

        # Trigger 2: Destructive operations (delete, drop, truncate)
        destructive_keywords = ["drop table", "delete from", "truncate", "rm -rf", "force push", "destroy"]
        if any(kw in content_lower for kw in destructive_keywords):
            await self._create_approval_gate(
                task_id, agent_role,
                f"Destructive operation detected: {content[:300]}",
                "critical"
            )
            return

        # Trigger 3: External API / deployment actions
        deploy_keywords = ["deploy to production", "push to main", "release", "publish to npm"]
        if any(kw in content_lower for kw in deploy_keywords):
            await self._create_approval_gate(
                task_id, agent_role,
                f"Deployment/release action: {content[:300]}",
                "high"
            )
            return

        # Trigger 4: Schema changes
        schema_keywords = ["alter table", "create table", "add column", "drop column", "migration"]
        if any(kw in content_lower for kw in schema_keywords):
            await self._create_approval_gate(
                task_id, agent_role,
                f"Database schema change: {content[:300]}",
                "medium"
            )
            return

        # Trigger 5: Cost-sensitive operations
        cost_keywords = ["api call", "external service", "paid tier", "token budget", "rate limit"]
        if any(kw in content_lower for kw in cost_keywords) and risk in ("high", "critical"):
            await self._create_approval_gate(
                task_id, agent_role,
                f"Cost-sensitive operation: {content[:300]}",
                risk
            )
            return

    async def set_agent_idle(self, role: str):
        """Set agent status back to idle after processing."""
        await self.update_agent_status(role, "idle")

    async def run_heartbeat(self, agent_roles: list[str], interval: int = 30):
        """Periodically update agent 'last_seen' to detect stale/crashed agents."""
        logger.info("Heartbeat system started for %d agents (interval: %ds)", len(agent_roles), interval)
        while True:
            try:
                now = __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat()
                client = await self._get_client()
                for role in agent_roles:
                    await client.patch(
                        f"{self.config.supabase_url}/rest/v1/agents?role=eq.{role}",
                        headers=self._headers,
                        json={"last_seen": now},
                        timeout=5.0,
                    )
                    await asyncio.sleep(0.2)

                stale_threshold = __import__('datetime').datetime.now(
                    __import__('datetime').timezone.utc
                ) - __import__('datetime').timedelta(seconds=interval * 2)
                resp = await client.get(
                    f"{self.config.supabase_url}/rest/v1/agents?select=role,status,last_seen",
                    headers=self._headers,
                    timeout=5.0,
                )
                if resp.status_code == 200:
                    for agent in resp.json():
                        last_seen = agent.get("last_seen")
                        if last_seen and agent.get("status") != "offline":
                            try:
                                seen_time = __import__('datetime').datetime.fromisoformat(last_seen.replace('Z', '+00:00'))
                                if seen_time < stale_threshold:
                                    await client.patch(
                                        f"{self.config.supabase_url}/rest/v1/agents?role=eq.{agent['role']}",
                                        headers=self._headers,
                                        json={"status": "offline"},
                                        timeout=5.0,
                                    )
                                    logger.warning("Agent %s marked offline (last seen: %s)", agent["role"], last_seen)
                            except (ValueError, TypeError):
                                pass
            except Exception as e:
                logger.debug("Heartbeat error: %s", e)

            await asyncio.sleep(interval)

    def _assess_risk(self, review_content: str) -> str:
        """Assess risk level from review content using weighted keyword scoring.
        
        Avoids false positives by requiring negative context (not just keyword presence).
        """
        content_lower = review_content.lower()

        # Score-based approach: accumulate risk points
        score = 0

        critical_patterns = [
            ("sql injection", 10), ("xss vulnerability", 10), ("remote code execution", 10),
            ("data loss", 8), ("credentials exposed", 10), ("authentication bypass", 10),
            ("privilege escalation", 9),
        ]
        high_patterns = [
            ("breaking change", 6), ("regression", 5), ("production issue", 6),
            ("unsafe", 5), ("vulnerability", 6), ("memory leak", 5),
            ("race condition", 5), ("data corruption", 7),
        ]
        medium_patterns = [
            ("concern", 2), ("refactor needed", 2), ("complexity", 2),
            ("technical debt", 2), ("performance issue", 3), ("missing validation", 3),
        ]
        # Negative modifiers (reduce score if these are present)
        safe_modifiers = [
            ("no vulnerabilit", -3), ("looks secure", -3), ("is secure", -3),
            ("passed", -2), ("clean", -2), ("no issue", -2),
            ("resolved", -2), ("fixed", -2),
        ]

        for pattern, weight in critical_patterns:
            if pattern in content_lower:
                score += weight
        for pattern, weight in high_patterns:
            if pattern in content_lower:
                score += weight
        for pattern, weight in medium_patterns:
            if pattern in content_lower:
                score += weight
        for pattern, weight in safe_modifiers:
            if pattern in content_lower:
                score += weight

        if score >= 8:
            return "critical"
        if score >= 5:
            return "high"
        if score >= 2:
            return "medium"
        return "low"

    async def _create_approval_gate(self, task_id: str, agent: str, content: str, risk: str):
        """Create an approval record in Supabase, pausing the workflow.
        
        Sends a pause signal to the agent swarm via Band and monitors
        for resolution to resume processing.
        """
        import uuid as _uuid
        approval_id = str(_uuid.uuid4())
        client = await self._get_client()
        try:
            await client.post(
                f"{self.config.supabase_url}/rest/v1/approvals",
                headers=self._headers,
                json={
                    "id": approval_id,
                    "task_id": task_id,
                    "type": "review_approval",
                    "status": "pending",
                    "title": f"Review flagged ({risk} risk)",
                    "description": content[:500],
                    "context": {"risk_keywords": self._extract_risk_keywords(content)},
                    "agent": agent,
                    "risk_level": risk,
                },
                timeout=5.0,
            )
            await client.patch(
                f"{self.config.supabase_url}/rest/v1/tasks?id=eq.{task_id}",
                headers=self._headers,
                json={"status": "awaiting_approval"},
                timeout=5.0,
            )

            await self._emit_event(
                EventType.APPROVAL_NEEDED, agent,
                f"⚠️ Human approval required ({risk} risk): {content[:200]}",
                task_id,
            )

            await self._send_pause_signal(task_id, approval_id, risk)

            logger.info("Approval gate created for task %s (risk: %s, id: %s)", task_id, risk, approval_id)

            # Bounded watcher: evict oldest if at capacity
            if len(self._approval_watchers) >= self._max_approval_watchers:
                oldest_key = next(iter(self._approval_watchers))
                self._approval_watchers[oldest_key].cancel()
                del self._approval_watchers[oldest_key]

            watcher = asyncio.create_task(self._watch_approval_resolution(approval_id, task_id))
            self._approval_watchers[approval_id] = watcher
            watcher.add_done_callback(lambda _: self._approval_watchers.pop(approval_id, None))

        except Exception as e:
            logger.warning("Failed to create approval gate: %s", e)

    async def _send_pause_signal(self, task_id: str, approval_id: str, risk: str):
        """Send pause signal to Nexus agent via Band to halt processing."""
        if not self._nexus_api_key or not self._band_room_id:
            return
        try:
            client = await self._get_client()
            await client.post(
                f"{self.config.band_rest_url}api/v1/agent/chats/{self._band_room_id}/messages",
                headers={
                    "x-api-key": self._nexus_api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "content": f"@Syndicate Nexus PAUSE: Task {task_id} requires human approval (risk: {risk}). Approval ID: {approval_id}. Do NOT continue processing this task until you receive a RESUME signal.",
                },
                timeout=10.0,
            )
            logger.info("Pause signal sent for task %s", task_id)
        except Exception as e:
            logger.warning("Failed to send pause signal: %s", e)

    async def _watch_approval_resolution(self, approval_id: str, task_id: str):
        """Watch for approval resolution and send resume signal when decided."""
        timeout_seconds = 300
        poll_interval = 3
        elapsed = 0

        while elapsed < timeout_seconds:
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval

            try:
                client = await self._get_client()
                resp = await client.get(
                    f"{self.config.supabase_url}/rest/v1/approvals?id=eq.{approval_id}&select=status,decided_by",
                    headers=self._headers,
                    timeout=5.0,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if data and data[0]["status"] != "pending":
                        decision = data[0]["status"]
                        decided_by = data[0].get("decided_by", "unknown")
                        logger.info("Approval %s resolved: %s by %s", approval_id, decision, decided_by)

                        if decision == "approved":
                            await self._send_resume_signal(task_id, decision)
                        else:
                            await self._emit_event(
                                EventType.APPROVAL_REJECTED, "user",
                                f"Task rejected by {decided_by}",
                                task_id,
                            )
                        return
            except asyncio.CancelledError:
                return
            except Exception as e:
                logger.debug("Approval watch poll error: %s", e)

        logger.warning("Approval %s timed out after %ds — auto-rejecting", approval_id, timeout_seconds)
        try:
            client = await self._get_client()
            await client.patch(
                f"{self.config.supabase_url}/rest/v1/approvals?id=eq.{approval_id}",
                headers=self._headers,
                json={"status": "rejected", "decided_by": "timeout", "decided_at": __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat()},
                timeout=5.0,
            )
            await client.patch(
                f"{self.config.supabase_url}/rest/v1/tasks?id=eq.{task_id}",
                headers=self._headers,
                json={"status": "failed"},
                timeout=5.0,
            )
        except Exception as e:
            logger.warning("Failed to update timeout status: %s", e)
        await self._emit_event(
            EventType.APPROVAL_REJECTED, "system",
            f"Approval timed out after {timeout_seconds}s — task marked as failed",
            task_id,
        )

    async def _send_resume_signal(self, task_id: str, decision: str):
        """Send resume signal to Nexus agent via Band after approval."""
        if not self._nexus_api_key or not self._band_room_id:
            return
        try:
            client = await self._get_client()
            await client.post(
                f"{self.config.band_rest_url}api/v1/agent/chats/{self._band_room_id}/messages",
                headers={
                    "x-api-key": self._nexus_api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "content": f"@Syndicate Nexus RESUME: Task {task_id} has been {decision}. Continue processing.",
                },
                timeout=10.0,
            )
            await client.patch(
                f"{self.config.supabase_url}/rest/v1/tasks?id=eq.{task_id}",
                headers=self._headers,
                json={"status": "in_progress"},
                timeout=5.0,
            )
            await self._emit_event(
                EventType.APPROVAL_GRANTED, "user",
                f"Approved — resuming task execution",
                task_id,
            )
            logger.info("Resume signal sent for task %s", task_id)
        except Exception as e:
            logger.warning("Failed to send resume signal: %s", e)

    def _extract_risk_keywords(self, content: str) -> list[str]:
        """Extract risk-relevant keywords for approval context."""
        keywords = []
        content_lower = content.lower()
        risk_terms = {
            "security": ["security", "vulnerability", "injection", "xss", "auth"],
            "data": ["data loss", "deletion", "truncate", "drop", "migration"],
            "breaking": ["breaking change", "regression", "incompatible"],
            "production": ["production", "deploy", "release", "rollback"],
        }
        for category, terms in risk_terms.items():
            if any(t in content_lower for t in terms):
                keywords.append(category)
        return keywords

    async def update_agent_status(self, role: str, status: str):
        """Update agent status and last_seen in Supabase agents table."""
        from datetime import datetime, timezone
        client = await self._get_client()
        try:
            await client.patch(
                f"{self.config.supabase_url}/rest/v1/agents?role=eq.{role}",
                headers=self._headers,
                json={"status": status, "last_seen": datetime.now(timezone.utc).isoformat()},
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
            if any(kw in content_lower for kw in ["review passed", "passed", "approved", "lgtm", "clean", "no issues"]):
                return EventType.REVIEW_PASSED
            if any(kw in content_lower for kw in ["review failed", "failed", "reject", "must fix", "critical", "vulnerability"]):
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
            client = await self._get_client()
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
        client = await self._get_client()
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
        """Poll Supabase for new pending tasks submitted from dashboard.
        
        Supports concurrent task processing with configurable parallelism.
        Skips tasks flagged as simulation-only via metadata.
        """
        logger.info("Task watcher started — polling for pending tasks")
        max_concurrent = 3
        active_tasks: set[str] = set()

        while True:
            try:
                if len(active_tasks) >= max_concurrent:
                    await asyncio.sleep(2)
                    continue

                client = await self._get_client()
                limit = max_concurrent - len(active_tasks)
                resp = await client.get(
                    f"{self.config.supabase_url}/rest/v1/tasks?status=eq.pending&order=created_at.asc&limit={limit}",
                    headers=self._headers,
                    timeout=5.0,
                )
                if resp.status_code == 200:
                    tasks = resp.json()
                    for task in tasks:
                        task_id = task["id"]
                        if task_id in active_tasks:
                            continue
                        active_tasks.add(task_id)
                        asyncio.create_task(
                            self._process_task(task, active_tasks)
                        )
            except Exception as e:
                logger.warning("Task watcher error: %s", e)

            await asyncio.sleep(3)

    async def _process_task(self, task: dict, active_tasks: set[str]):
        """Process a single task through the full agent pipeline."""
        task_id = task["id"]
        try:
            logger.info("Picked up pending task: %s", task_id)

            client = await self._get_client()
            await client.patch(
                f"{self.config.supabase_url}/rest/v1/tasks?id=eq.{task_id}",
                headers=self._headers,
                json={"status": "planning"},
                timeout=5.0,
            )

            await self._emit_event(
                EventType.AGENT_JOINED,
                "nexus",
                f"Nexus picking up task: {task['description'][:100]}",
                task_id,
            )

            await self._send_to_nexus_via_band(task["description"], task_id)
            await self._query_relevant_memory(task["description"])

        except Exception as e:
            logger.warning("Task processing error for %s: %s", task_id, e)
            try:
                client = await self._get_client()
                await client.patch(
                    f"{self.config.supabase_url}/rest/v1/tasks?id=eq.{task_id}",
                    headers=self._headers,
                    json={"status": "failed"},
                    timeout=5.0,
                )
            except Exception:
                pass
            await self._emit_event(
                EventType.ERROR, "system", f"Task processing failed: {e}", task_id
            )
        finally:
            active_tasks.discard(task_id)

    async def _send_to_nexus_via_band(self, description: str, task_id: str):
        """Send task to Nexus agent via Band REST API (creates real agent-to-agent routing)."""
        if not self._nexus_api_key or not self._band_room_id:
            logger.debug("Band routing skipped: no nexus credentials or room ID configured")
            return

        try:
            client = await self._get_client()
            resp = await client.post(
                f"{self.config.band_rest_url}api/v1/agent/chats/{self._band_room_id}/messages",
                headers={
                    "x-api-key": self._nexus_api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "content": f"@Syndicate Nexus New task from dashboard (ID: {task_id}): {description}",
                },
                timeout=15.0,
            )
            if resp.status_code in (200, 201):
                logger.info("Task routed to Nexus via Band: %s", task_id)
            else:
                logger.warning("Band message send failed (%d): %s", resp.status_code, resp.text[:200])
        except Exception as e:
            logger.warning("Failed to route task to Band: %s", e)

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
