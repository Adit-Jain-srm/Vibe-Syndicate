from datetime import datetime, timezone

from fastapi import APIRouter

from syndicate_api.models import TaskCreate, TaskResponse, TaskStatus

router = APIRouter()


@router.post("/", response_model=TaskResponse)
async def create_task(task: TaskCreate):
    """Submit a development task to the Syndicate swarm."""
    return TaskResponse(
        id="task_placeholder",
        description=task.description,
        status=TaskStatus.PENDING,
        created_at=datetime.now(timezone.utc),
    )


@router.get("/", response_model=list[TaskResponse])
async def list_tasks():
    """List all tasks."""
    return []


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    """Get task details including status, plan, and involved agents."""
    return TaskResponse(
        id=task_id,
        description="placeholder",
        status=TaskStatus.PENDING,
        created_at=datetime.now(timezone.utc),
    )
