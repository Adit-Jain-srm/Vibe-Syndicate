# Architecture

## System Overview

Syndicate is a multi-agent developer orchestration platform with three layers:

1. **Agent Layer** - 6 Band SDK agents with LLM brains (Gemini + GPT-4o)
2. **Bridge Layer** - EventBridge connects Band to Supabase (bidirectional)
3. **Interface Layer** - React dashboard + MCP server for IDE

```
User (Dashboard / MCP)
    |
    v
Supabase (tasks table, status: pending)
    |
    v
EventBridge.watch_for_tasks() [polls every 5s]
    |
    v
Band REST API (POST /agent/chats/{room}/messages)
    |
    v
Nexus agent processes via Band room (@mention routing)
    |
    v
Agents collaborate: Architect -> Engineer -> Reviewer
    |
    v
bridge.on_agent_response() classifies + emits events to Supabase
    |
    v
On TASK_COMPLETE:
  - MetricsEngine.compute_and_store()
  - SelfImprovementEngine.run_cycle()
  - Memory stored with embedding
    |
    v
Dashboard updates via Supabase Realtime
```

## Component Map

### syndicate-agent/src/syndicate_agent/

| File | Responsibility |
|------|---------------|
| `main.py` | Swarm runner. Starts all 6 agents concurrently with reconnect-forever pattern. Wires bridge, metrics, memory, self-improve. |
| `bridge.py` | Bidirectional bridge. Polls Supabase for pending tasks, routes to Band, classifies agent responses into events. Creates approval gates for high-risk reviews. |
| `orchestrator.py` | Task lifecycle management. Creates/updates tasks, emits events, manages approvals via Supabase REST. |
| `metrics.py` | Computes per-task KPIs after completion: first_pass_rate, iteration_count, time_to_complete, review_score. |
| `memory.py` | 3-layer memory (protocol/project/agent). Semantic search via pgvector. Embedding generation via Google text-embedding-004. |
| `self_improve.py` | SkillOpt loop. Detects patterns in agent learnings, proposes prompt deltas, evolves engineer.md. |
| `config.py` | Environment config (Band URLs, API keys, Supabase, Azure OpenAI). |
| `types.py` | Typed vocabulary: TaskStatus (7 states), EventType (16 types), AgentRole (6 roles), dataclasses. |
| `prompts/` | Per-agent prompt documents (nexus.md, architect.md, engineer.md, reviewer.md, researcher.md, qa.md). |

### syndicate-mcp/server.py

MCP server exposing 11 tools via JSON-RPC over stdio. Callable from Cursor IDE.

| Tool | Supabase Table | Band API |
|------|---------------|----------|
| syn_init | - | - |
| syn_task | tasks (INSERT) | - |
| syn_status | agents, tasks, approvals (SELECT) | - |
| syn_review | - | - |
| syn_memory | memory (INSERT/SELECT) | - |
| syn_find_tool | - | GitHub API |
| syn_install_skill | - | npx subprocess |
| syn_list_skills | - | filesystem |
| syn_skill_info | - | filesystem |
| syn_approve | approvals (UPDATE), tasks (UPDATE), events (INSERT) | - |
| syn_events | events (SELECT) | - |

### syndicate-ui/src/

| Directory | Contents |
|-----------|----------|
| `pages/` | 10 pages: Landing, Dashboard, Pipeline, LiveRoom, Agents, Tasks, Metrics, Memory, Approvals, Docs |
| `components/constellation/` | NavigationRail, AgentGraph (3D network) |
| `components/ui/` | GlassPanel, SkeletonLoader, AnimatedCard, StatusBadge, PageTransition, etc. |
| `stores/` | Zustand store connected to Supabase Realtime (agents, events, memory, approvals channels) |
| `lib/` | api.ts (Supabase client), supabase.ts, sounds.ts, theme.ts |

## Database Schema (Supabase)

| Table | Key Columns | RLS | Realtime |
|-------|-------------|-----|----------|
| agents | name, role, status, model, band_agent_id | anon read | yes |
| tasks | id (UUID), description, status, complexity, plan, result | anon read/write | yes |
| events | id, task_id (UUID FK), type, agent, content, metadata | anon read/write | yes |
| memory | id, content, category, agent, tags, embedding (vector 768) | anon read/write | yes |
| task_metrics | id, task_id (UUID FK), first_pass_rate, iteration_count, time_to_complete_seconds, review_score | anon read/write | yes |
| approvals | id, task_id (UUID FK), type, status, title, description, agent, risk_level, decided_by, decided_at | anon read/write/update | yes |

Status constraint on tasks: `pending, planning, in_progress, reviewing, awaiting_approval, complete, failed`

## Agent Architecture

| Agent | Model | Adapter | Purpose |
|-------|-------|---------|---------|
| Nexus | Gemini 2.5 Flash | LangGraph + InMemorySaver | Conductor: routes tasks, tracks state |
| Architect | Gemini 2.5 Flash | LangGraph | Plans: decomposes into subtasks |
| Engineer | Gemini 2.5 Flash | LangGraph | Implements: writes code |
| Reviewer | Azure OpenAI GPT-4o | LangGraph | Reviews: adversarial cross-model check |
| Researcher | Gemini 2.5 Flash | LangGraph | Discovers: web research, tools |
| QA | Gemini 2.5 Flash | LangGraph | Validates: testing, verification |

All agents use Band SDK's `Agent.create()` with `LangGraphAdapter`. Communication via Band rooms with @mention routing. Reviewer uses a different model family (GPT-4o vs Gemini) for adversarial diversity.

## Key Design Decisions

1. **Bridge polls, not pushes**: Supabase doesn't support server-side triggers to external APIs. Bridge polls every 5s for pending tasks.
2. **Simulation fallback**: Dashboard always runs `simulateSwarmExecution()` for visual demo. If swarm is live, bridge also routes the real task.
3. **UUID everywhere**: tasks.id is PostgreSQL UUID type. Frontend uses `crypto.randomUUID()`, Python uses `str(uuid.uuid4())`.
4. **Reconnect-forever**: All agents restart with exponential backoff (2s base, 60s max) on crash.
5. **Event-driven state**: Task status derived from events (plan_created -> planning, code_generated -> in_progress, etc.).
6. **Approval gates**: High/critical risk review failures auto-create approvals. Approval resolution updates task status + emits event.

## Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | https://syndicate-ui-five.vercel.app |
| Database | Supabase | wilwqoflckenzgnggbgb.supabase.co |
| Agents | Local (python -m syndicate_agent.main) | - |
| MCP | Local (auto-loaded by Cursor from .cursor/mcp.json) | - |
