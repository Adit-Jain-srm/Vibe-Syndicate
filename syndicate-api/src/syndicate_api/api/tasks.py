from datetime import datetime, timezone

from fastapi import APIRouter

from syndicate_api.models import TaskCreate, TaskResponse, TaskStatus
from syndicate_api.config import settings

import httpx

router = APIRouter()

SUPABASE_HEADERS = {
    "apikey": settings.supabase_key if settings.supabase_key else "",
    "Authorization": f"Bearer {settings.supabase_key}" if settings.supabase_key else "",
    "Content-Type": "application/json",
}


@router.post("/", response_model=TaskResponse)
async def create_task(task: TaskCreate):
    """Submit a development task to the Syndicate swarm."""
    import uuid
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
