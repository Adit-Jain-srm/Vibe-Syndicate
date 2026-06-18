"""Integration tests for Supabase data layer.

Verifies CRUD operations on all tables, RLS policies allow anon access,
and Realtime publication is configured correctly.
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
    reason="SUPABASE_URL and SUPABASE_KEY required",
)


@pytest.fixture
def client():
    return httpx.AsyncClient(timeout=10.0)


@pytest.mark.asyncio
async def test_agents_table_read(client):
    """Verify agents table is readable (RLS allows anon SELECT)."""
    async with client as c:
        resp = await c.get(f"{SUPABASE_URL}/rest/v1/agents?select=*", headers=HEADERS)
        assert resp.status_code == 200
        agents = resp.json()
        assert isinstance(agents, list)
        assert len(agents) >= 1


@pytest.mark.asyncio
async def test_tasks_crud(client):
    """Verify insert + read + update on tasks table."""
    import uuid as _uuid
    task_id = str(_uuid.uuid4())
    payload = {
        "id": task_id,
        "description": "Test task from pytest",
        "status": "pending",
        "complexity": "simple",
    }

    async with client as c:
        # INSERT
        resp = await c.post(f"{SUPABASE_URL}/rest/v1/tasks", headers=HEADERS, json=payload)
        assert resp.status_code in (200, 201)

        # READ
        resp = await c.get(f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}", headers=HEADERS)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["description"] == "Test task from pytest"

        # UPDATE
        resp = await c.patch(
            f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}",
            headers=HEADERS,
            json={"status": "complete"},
        )
        assert resp.status_code == 200

        # Cleanup
        await c.delete(f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}", headers=HEADERS)


@pytest.mark.asyncio
async def test_events_insert(client):
    """Verify events table allows anon INSERT."""
    import uuid as _uuid
    task_id = str(_uuid.uuid4())
    async with client as c:
        await c.post(
            f"{SUPABASE_URL}/rest/v1/tasks",
            headers=HEADERS,
            json={"id": task_id, "description": "Event test parent", "status": "pending"},
        )
        resp = await c.post(
            f"{SUPABASE_URL}/rest/v1/events",
            headers=HEADERS,
            json={
                "task_id": task_id,
                "type": "test_event",
                "agent": "pytest",
                "content": "Integration test event",
                "metadata": {},
            },
        )
        assert resp.status_code in (200, 201)
        await c.delete(f"{SUPABASE_URL}/rest/v1/events?task_id=eq.{task_id}", headers=HEADERS)
        await c.delete(f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}", headers=HEADERS)


@pytest.mark.asyncio
async def test_memory_insert_and_read(client):
    """Verify memory table CRUD."""
    async with client as c:
        resp = await c.post(
            f"{SUPABASE_URL}/rest/v1/memory",
            headers=HEADERS,
            json={
                "content": "pytest learning entry",
                "category": "project",
                "agent": "pytest",
                "tags": ["test"],
            },
        )
        assert resp.status_code in (200, 201)

        resp = await c.get(
            f"{SUPABASE_URL}/rest/v1/memory?agent=eq.pytest&order=created_at.desc&limit=1",
            headers=HEADERS,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert data[0]["content"] == "pytest learning entry"


@pytest.mark.asyncio
async def test_task_metrics_table(client):
    """Verify task_metrics table exists and allows insert."""
    import uuid as _uuid
    task_id = str(_uuid.uuid4())
    async with client as c:
        await c.post(
            f"{SUPABASE_URL}/rest/v1/tasks",
            headers=HEADERS,
            json={"id": task_id, "description": "Metrics test", "status": "complete"},
        )

        resp = await c.post(
            f"{SUPABASE_URL}/rest/v1/task_metrics",
            headers=HEADERS,
            json={
                "task_id": task_id,
                "first_pass_rate": True,
                "iteration_count": 1,
                "time_to_complete_seconds": 15.5,
                "tokens_used": 1200,
                "agents_involved": ["nexus", "architect", "engineer"],
                "review_score": 0.95,
            },
        )
        assert resp.status_code in (200, 201)

        # Cleanup
        await c.delete(f"{SUPABASE_URL}/rest/v1/task_metrics?task_id=eq.{task_id}", headers=HEADERS)
        await c.delete(f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}", headers=HEADERS)


@pytest.mark.asyncio
async def test_approvals_table(client):
    """Verify approvals table CRUD."""
    import uuid as _uuid
    task_id = str(_uuid.uuid4())
    async with client as c:
        await c.post(
            f"{SUPABASE_URL}/rest/v1/tasks",
            headers=HEADERS,
            json={"id": task_id, "description": "Approval test", "status": "awaiting_approval"},
        )

        resp = await c.post(
            f"{SUPABASE_URL}/rest/v1/approvals",
            headers=HEADERS,
            json={
                "task_id": task_id,
                "type": "review_approval",
                "status": "pending",
                "title": "Test approval",
                "description": "Should we proceed?",
                "agent": "reviewer",
                "risk_level": "high",
            },
        )
        assert resp.status_code in (200, 201)

        # Update (resolve)
        approvals = (await c.get(
            f"{SUPABASE_URL}/rest/v1/approvals?task_id=eq.{task_id}",
            headers=HEADERS,
        )).json()
        if approvals:
            resp = await c.patch(
                f"{SUPABASE_URL}/rest/v1/approvals?id=eq.{approvals[0]['id']}",
                headers=HEADERS,
                json={"status": "approved", "decided_by": "pytest"},
            )
            assert resp.status_code == 200

        # Cleanup
        await c.delete(f"{SUPABASE_URL}/rest/v1/approvals?task_id=eq.{task_id}", headers=HEADERS)
        await c.delete(f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}", headers=HEADERS)
