"""Task CRUD endpoints with background swarm dispatch.

When a task is created, the API:
1. Persists to Supabase
2. Emits a task_created event
3. Dispatches the task to the agent swarm (background)
4. Returns immediately so the client can subscribe to SSE
"""
from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks

from syndicate_api.models import TaskCreate, TaskResponse, TaskStatus
from syndicate_api.config import settings

import httpx

router = APIRouter()
logger = logging.getLogger("syndicate_api.tasks")

SUPABASE_HEADERS = {
    "apikey": settings.supabase_key if settings.supabase_key else "",
    "Authorization": f"Bearer {settings.supabase_key}" if settings.supabase_key else "",
    "Content-Type": "application/json",
}


async def _emit_event(task_id: str, event_type: str, agent: str, content: str, metadata: dict | None = None):
    """Persist an event to Supabase so the SSE stream can pick it up."""
    if not settings.supabase_url or not settings.supabase_key:
        return
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{settings.supabase_url}/rest/v1/events",
                headers=SUPABASE_HEADERS,
                json={
                    "task_id": task_id,
                    "type": event_type,
                    "agent": agent,
                    "content": content,
                    "metadata": metadata or {},
                },
                timeout=5.0,
            )
    except Exception as e:
        logger.warning("Failed to emit event: %s", e)


async def _update_task_status(task_id: str, status: str, **extras):
    """Update task status in Supabase."""
    if not settings.supabase_url or not settings.supabase_key:
        return
    try:
        async with httpx.AsyncClient() as client:
            await client.patch(
                f"{settings.supabase_url}/rest/v1/tasks?id=eq.{task_id}",
                headers=SUPABASE_HEADERS,
                json={"status": status, **extras},
                timeout=5.0,
            )
    except Exception as e:
        logger.warning("Failed to update task status: %s", e)


async def _dispatch_to_swarm(task_id: str, description: str, complexity: str):
    """Background job: simulate the agent swarm processing a task.

    In production, this would invoke the Band SDK to send the task
    to the Nexus agent. For now, it emits realistic events through
    Supabase so the SSE stream and dashboard have data to show.
    """
    logger.info("Dispatching task %s to swarm…", task_id)

    await asyncio.sleep(0.5)
    await _update_task_status(task_id, "planning")
    await _emit_event(task_id, "agent_joined", "nexus",
                      f"Nexus received task: {description[:200]}")

    await asyncio.sleep(1.0)
    await _emit_event(task_id, "agent_joined", "researcher",
                      "Researcher invited to analyze codebase context")

    await asyncio.sleep(1.5)
    await _emit_event(task_id, "research_complete", "researcher",
                      "Codebase context analyzed. Patterns identified: existing conventions, test patterns, and architecture decisions.")

    await asyncio.sleep(1.0)
    await _emit_event(task_id, "agent_joined", "architect",
                      "Architect invited to decompose task")

    await asyncio.sleep(2.0)
    await _update_task_status(task_id, "in_progress")
    await _emit_event(task_id, "plan_created", "architect",
                      f"Plan created for: {description[:100]}. "
                      "Subtasks: 1) Define data models 2) Implement core logic 3) Add error handling 4) Write tests",
                      {"subtask_count": 4})

    await asyncio.sleep(1.0)
    await _emit_event(task_id, "agent_joined", "engineer",
                      "Engineer assigned to implement subtasks")

    await asyncio.sleep(3.0)
    await _emit_event(task_id, "code_generated", "engineer",
                      "Implementation complete for all subtasks. Code follows project conventions with full error handling.")

    await asyncio.sleep(1.0)
    await _update_task_status(task_id, "reviewing")
    await _emit_event(task_id, "agent_joined", "reviewer",
                      "Reviewer (GPT-4o) invited for adversarial cross-model review")

    await asyncio.sleep(2.0)
    await _emit_event(task_id, "review_passed", "reviewer",
                      "Review PASSED (risk: low). Code is well-structured with proper error handling. "
                      "All edge cases addressed. @Nexus",
                      {"risk_level": "low", "model": "gpt-4o"})

    await asyncio.sleep(1.0)
    await _emit_event(task_id, "agent_joined", "qa",
                      "QA agent validating implementation")

    await asyncio.sleep(1.5)
    await _emit_event(task_id, "qa_passed", "qa",
                      "All validation checks passed. No regressions detected.")

    await asyncio.sleep(0.5)
    await _update_task_status(task_id, "complete", result="Task completed successfully")
    await _emit_event(task_id, "task_complete", "nexus",
                      f"Task complete: {description[:100]}. All subtasks implemented, reviewed, and validated.",
                      {"agents_involved": ["nexus", "researcher", "architect", "engineer", "reviewer", "qa"]})

    # Self-improvement: extract learnings
    await asyncio.sleep(0.5)
    await _emit_event(task_id, "memory_stored", "nexus",
                      "Lesson extracted: Clean first-pass review — cross-model adversarial pattern working well.",
                      {"memory_type": "agent_learning"})

    logger.info("Task %s completed by swarm", task_id)


@router.post("/", response_model=TaskResponse)
async def create_task(task: TaskCreate, background_tasks: BackgroundTasks):
    """Submit a development task to the Syndicate swarm.

    The task is persisted immediately and a background job dispatches
    it to the agent swarm. Subscribe to /api/events/{task_id}/stream
    to watch the agents work in real-time.
    """
    task_id = f"task_{uuid.uuid4().hex[:12]}"

    if settings.supabase_url and settings.supabase_key:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{settings.supabase_url}/rest/v1/tasks",
                headers=SUPABASE_HEADERS,
                json={
                    "id": task_id,
                    "description": task.description,
                    "status": "pending",
                    "complexity": task.complexity,
                },
                timeout=5.0,
            )

        # Emit task_created event
        await _emit_event(task_id, "task_created", "system",
                          f"Task submitted: {task.description[:200]}",
                          {"complexity": task.complexity})

        # Dispatch to swarm in background
        background_tasks.add_task(_dispatch_to_swarm, task_id, task.description, task.complexity)

    return TaskResponse(
        id=task_id,
        description=task.description,
        status=TaskStatus.PENDING,
        created_at=datetime.now(timezone.utc),
    )


@router.get("/", response_model=list[TaskResponse])
async def list_tasks():
    """List all tasks from Supabase."""
    if not settings.supabase_url or not settings.supabase_key:
        return []

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.supabase_url}/rest/v1/tasks?select=*&order=created_at.desc&limit=50",
            headers=SUPABASE_HEADERS,
            timeout=5.0,
        )
        if resp.status_code == 200:
            tasks = resp.json()
            return [
                TaskResponse(
                    id=t["id"],
                    description=t["description"],
                    status=t["status"],
                    created_at=t["created_at"],
                    plan=t.get("plan"),
                    agents_involved=t.get("agents_involved", []),
                )
                for t in tasks
            ]
    return []


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    """Get task details from Supabase."""
    if not settings.supabase_url or not settings.supabase_key:
        return TaskResponse(id=task_id, description="Not found", status=TaskStatus.PENDING, created_at=datetime.now(timezone.utc))

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.supabase_url}/rest/v1/tasks?id=eq.{task_id}&select=*",
            headers=SUPABASE_HEADERS,
            timeout=5.0,
        )
        if resp.status_code == 200 and resp.json():
            t = resp.json()[0]
            return TaskResponse(
                id=t["id"],
                description=t["description"],
                status=t["status"],
                created_at=t["created_at"],
                plan=t.get("plan"),
                agents_involved=t.get("agents_involved", []),
            )

    return TaskResponse(id=task_id, description="Not found", status=TaskStatus.PENDING, created_at=datetime.now(timezone.utc))
