"""End-to-end flow test — submit task → events → pipeline → metrics → memory.

This test simulates the full lifecycle by writing directly to Supabase,
verifying each stage produces the expected state transitions.
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone

import httpx
import pytest

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

pytestmark = pytest.mark.skipif(
    not SUPABASE_URL or not SUPABASE_KEY,
    reason="SUPABASE_URL and SUPABASE_KEY required for E2E",
)


@pytest.mark.asyncio
async def test_full_task_lifecycle():
    """Simulate complete task lifecycle and verify state at each stage."""
    task_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat

    async with httpx.AsyncClient(timeout=10.0) as c:
        # 1. Create task
        resp = await c.post(
            f"{SUPABASE_URL}/rest/v1/tasks",
            headers=HEADERS,
            json={"id": task_id, "description": "E2E test task", "status": "pending", "complexity": "medium"},
        )
        assert resp.status_code in (200, 201), f"Task creation failed: {resp.text}"

        # 2. Emit events through pipeline stages
        events = [
            {"type": "task_created", "agent": "system", "content": "Task submitted"},
            {"type": "agent_joined", "agent": "nexus", "content": "Nexus analyzing"},
            {"type": "plan_created", "agent": "architect", "content": "Plan: 3 subtasks"},
            {"type": "code_generated", "agent": "engineer", "content": "Implementation complete"},
            {"type": "review_passed", "agent": "reviewer", "content": "LGTM"},
            {"type": "task_complete", "agent": "nexus", "content": "Task done"},
        ]

        for evt in events:
            resp = await c.post(
                f"{SUPABASE_URL}/rest/v1/events",
                headers=HEADERS,
                json={**evt, "task_id": task_id, "metadata": {}},
            )
            assert resp.status_code in (200, 201), f"Event insert failed: {resp.text}"

        # 3. Update task to complete
        resp = await c.patch(
            f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}",
            headers=HEADERS,
            json={"status": "complete", "result": "E2E success"},
        )
        assert resp.status_code == 200

        # 4. Verify events exist
        resp = await c.get(
            f"{SUPABASE_URL}/rest/v1/events?task_id=eq.{task_id}&select=type",
            headers=HEADERS,
        )
        assert resp.status_code == 200
        event_types = [e["type"] for e in resp.json()]
        assert "task_created" in event_types
        assert "task_complete" in event_types
        assert "plan_created" in event_types

        # 5. Store metrics
        resp = await c.post(
            f"{SUPABASE_URL}/rest/v1/task_metrics",
            headers=HEADERS,
            json={
                "task_id": task_id,
                "first_pass_rate": True,
                "iteration_count": 1,
                "time_to_complete_seconds": 25.0,
                "tokens_used": 800,
                "agents_involved": ["nexus", "architect", "engineer", "reviewer"],
                "review_score": 1.0,
            },
        )
        assert resp.status_code in (200, 201)

        # 6. Store memory
        resp = await c.post(
            f"{SUPABASE_URL}/rest/v1/memory",
            headers=HEADERS,
            json={
                "content": f"E2E test learning: {task_id}",
                "category": "agent_learning",
                "agent": "engineer",
                "tags": ["e2e", "test"],
            },
        )
        assert resp.status_code in (200, 201)

        # 7. Verify metrics exist
        resp = await c.get(
            f"{SUPABASE_URL}/rest/v1/task_metrics?task_id=eq.{task_id}",
            headers=HEADERS,
        )
        assert resp.status_code == 200
        metrics = resp.json()
        assert len(metrics) == 1
        assert metrics[0]["first_pass_rate"] is True

        # Cleanup
        await c.delete(f"{SUPABASE_URL}/rest/v1/task_metrics?task_id=eq.{task_id}", headers=HEADERS)
        await c.delete(f"{SUPABASE_URL}/rest/v1/events?task_id=eq.{task_id}", headers=HEADERS)
        await c.delete(f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}", headers=HEADERS)
        await c.delete(f"{SUPABASE_URL}/rest/v1/memory?agent=eq.engineer&content=like.E2E test*", headers=HEADERS)
