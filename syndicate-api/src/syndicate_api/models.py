from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel


class TaskStatus(str, Enum):
    PENDING = "pending"
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    REVIEWING = "reviewing"
    COMPLETE = "complete"
    FAILED = "failed"


class AgentRole(str, Enum):
    NEXUS = "nexus"
    ARCHITECT = "architect"
    ENGINEER = "engineer"
    REVIEWER = "reviewer"
    RESEARCHER = "researcher"
    QA = "qa"


class TaskCreate(BaseModel):
    description: str
    complexity: str = "medium"


class TaskResponse(BaseModel):
    id: str
    description: str
    status: TaskStatus
    created_at: datetime
    plan: str | None = None
    agents_involved: list[str] = []


class EventResponse(BaseModel):
    id: str
    task_id: str
    type: str
    agent: str
    content: str
    timestamp: datetime
    metadata: dict[str, Any] = {}


class AgentStatusResponse(BaseModel):
    name: str
    role: AgentRole
    status: str
    current_task: str | None = None
    model: str = ""


class MemoryCreate(BaseModel):
    content: str
    category: str
    agent: str
    tags: list[str] = []


class MemoryResponse(BaseModel):
    id: str
    content: str
    category: str
    agent: str
    tags: list[str] = []
    timestamp: datetime
