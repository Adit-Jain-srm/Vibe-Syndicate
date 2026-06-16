# Syndicate

**Compound intelligence for developers** — a self-improving multi-agent swarm that grows with you.

> Specialized AI agents collaborate through [Band](https://band.ai) rooms, accumulating intelligence across sessions so the 100th task is 10x better than the 1st.

## Quick Start

```bash
# Prerequisites: Python 3.12+, Node 20+, uv
git clone https://github.com/YOUR_USERNAME/vibe-syndicate
cd vibe-syndicate

# Environment
cp .env.example .env
# Fill in: GOOGLE_API_KEY, ANTHROPIC_API_KEY, CLERK_*, SUPABASE_*

# 1. Register agents on Band (https://app.band.ai/agents → New Agent → External Agent)
#    Create 6 agents: Nexus, Architect, Engineer, Reviewer, Researcher, QA
#    Copy UUIDs + API keys into agent_config.yaml

# 2. Set up Supabase
#    Create project at supabase.com
#    Run syndicate-api/migrations/001_initial_schema.sql in SQL Editor
#    Copy connection string to DATABASE_URL in .env

# 3. Backend
cd syndicate-api && uv sync && uv run uvicorn syndicate_api.main:app --reload --port 8000

# 4. Frontend (new terminal)
cd syndicate-ui && npm install && npm run dev

# 5. Agent swarm (new terminal)
cd syndicate-agent && uv sync && uv run python -m syndicate_agent.main

# 6. Test Band connectivity
cd syndicate-agent && uv run python -m syndicate_agent.test_band_connection
```

## Testing

```bash
# Install test deps
pip install pytest pytest-asyncio httpx pyyaml

# Run P1 verification tests
python -m pytest tests/test_e2e_p1.py -v

# Run Band connectivity test
python test_connections.py

# Run all service tests
python test_services.py
```

Tests verify: Band agents (6/6), Supabase tables, Gemini API, Azure OpenAI, project structure, no legacy references.

## Architecture

```
syndicate/
├── syndicate-agent/    # Agent brain — Band SDK + Gemini + Claude
├── syndicate-api/      # Backend — FastAPI + Supabase + SSE
├── syndicate-ui/       # Frontend — React 19 + Vite + Tailwind v4
├── docs/               # Architecture docs, hackathon brief
└── AGENTS.md           # Persistent preferences & learnings
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Agent Coordination | Band.ai (rooms, @mention routing, WebSocket) |
| Agent Brain | Google ADK patterns, Band SDK adapters |
| LLM | Gemini 2.5 Flash (primary) + Claude Sonnet 4 (adversarial review) |
| Frontend | React 19, Vite, TypeScript, Tailwind v4, Framer Motion, Zustand |
| Auth | Clerk (GitHub + Google + Microsoft OAuth) |
| Backend | FastAPI, asyncpg, Pydantic v2 |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel (frontend) + Railway (backend) + Supabase (DB) |

## Status

Phase 1: Foundation — Complete ✓
