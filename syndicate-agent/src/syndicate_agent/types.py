from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any


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


class EventType(str, Enum):
    TASK_CREATED = "task_created"
    AGENT_JOINED = "agent_joined"
    PLAN_CREATED = "plan_created"
    PLAN_APPROVED = "plan_approved"
    CODE_GENERATED = "code_generated"
    REVIEW_STARTED = "review_started"
    REVIEW_PASSED = "review_passed"
    REVIEW_FAILED = "review_failed"
    TASK_COMPLETE = "task_complete"
    MEMORY_STORED = "memory_stored"
    SKILL_EVOLVED = "skill_evolved"
    AGENT_THOUGHT = "agent_thought"
    ERROR = "error"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class Task:
    id: str
    description: str
    status: TaskStatus = TaskStatus.PENDING
    created_at: str = field(default_factory=_now_iso)
    subtasks: list[Subtask] = field(default_factory=list)
    plan: str | None = None
    result: str | None = None


@dataclass
class Subtask:
    id: str
    description: str
    assigned_to: str | None = None
    status: TaskStatus = TaskStatus.PENDING
    files: list[str] = field(default_factory=list)
    acceptance_criteria: str = ""


@dataclass
class Event:
    type: EventType
    agent: str
    content: str
    timestamp: str = field(default_factory=_now_iso)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class ReviewVerdict:
    passed: bool
    risk_level: str = "low"
    findings: list[str] = field(default_factory=list)
    summary: str = ""


@dataclass
class MemoryEntry:
    content: str
    category: str
    agent: str
    tags: list[str] = field(default_factory=list)
    timestamp: str = field(default_factory=_now_iso)
