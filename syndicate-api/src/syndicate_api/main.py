"""FastAPI gateway — DEPRECATED.

NOTE: This API server was built for initial architecture but is NOT deployed.
The frontend (syndicate-ui) communicates directly with Supabase via the JS client.
The agent swarm communicates via syndicate-agent/bridge.py → Supabase REST.
The MCP server (syndicate-mcp/server.py) provides IDE integration.

This module is kept for reference and potential future use as a unified API layer
if the system moves beyond Supabase-direct architecture.

To run (not needed for current demo):
    uvicorn syndicate_api.main:app --port 8000
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from syndicate_api.config import settings
from syndicate_api.api import health, tasks, agents, events, memory, rooms, metrics

logger = logging.getLogger("syndicate_api")

__version__ = "0.2.0"


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Startup/shutdown lifecycle — managed async pool init/teardown."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    # Pool init happens lazily in db.get_pool() — no blocking startup
    logger.info("syndicate_api startup complete — version=%s env=%s", __version__, settings.environment)
    try:
        yield
    finally:
        from syndicate_api.db import close_pool
        await close_pool()
        logger.info("syndicate_api shutdown complete")


app = FastAPI(
    title="Syndicate API",
    description="Multi-agent developer orchestration platform — compound intelligence for developers",
    version=__version__,
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.web_app_origin,
        "http://localhost:5173",
        "http://localhost:3000",
        "https://syndicate-ui-five.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global exception handler ────────────────────────────────────
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": f"{type(exc).__name__}: {exc}"},
    )


# ── Routes ───────────────────────────────────────────────────────
app.include_router(health.router, tags=["health"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(memory.router, prefix="/api/memory", tags=["memory"])
app.include_router(rooms.router, prefix="/api/rooms", tags=["rooms"])
app.include_router(metrics.router, prefix="/api/metrics", tags=["metrics"])


@app.get("/")
async def root() -> dict:
    return {
        "service": "syndicate-api",
        "version": __version__,
        "tagline": "Compound intelligence for developers",
        "docs": "/docs",
    }
