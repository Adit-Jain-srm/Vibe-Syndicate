from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from syndicate_api.config import settings
from syndicate_api.api import health, tasks, agents, events, memory

app = FastAPI(
    title="Syndicate API",
    description="Multi-agent developer orchestration platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.web_app_origin, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(memory.router, prefix="/api/memory", tags=["memory"])
