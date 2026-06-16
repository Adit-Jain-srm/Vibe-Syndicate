# Syndicate API

Multi-agent developer orchestration backend — FastAPI + Supabase.

## Run Locally

```bash
uv sync
uv run uvicorn syndicate_api.main:app --reload --port 8000
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| POST | /api/tasks/ | Submit a task to the swarm |
| GET | /api/tasks/ | List all tasks |
| GET | /api/tasks/{id} | Get task details |
| GET | /api/agents/status | Agent swarm status |
| GET | /api/agents/roster | Agent roster with capabilities |
| GET | /api/events/{task_id} | Task events history |
| GET | /api/events/{task_id}/stream | SSE stream of live events |
| GET | /api/memory/ | Query persistent memory |
| POST | /api/memory/ | Store memory entry |
