# Changelog

All notable changes to Syndicate are documented here.

## [0.3.0] - 2026-06-19 - Full Stack Integration + MCP Expansion

### Bridge: Band Routing (the critical gap closed)
- `bridge._send_to_nexus_via_band()` sends tasks directly to Nexus agent via Band REST API
- Flow: Dashboard submit -> Supabase -> Bridge polls -> Band POST /messages -> Nexus processes
- Uses Nexus agent's api_key for Band authentication
- Room ID configurable via `BAND_ROOM_ID` env var
- Files: `syndicate-agent/src/syndicate_agent/bridge.py`, `main.py`

### MCP Server: 11 Tools
- Expanded from 6 to 11 tools
- New: `syn_install_skill` (install from GitHub via npx)
- New: `syn_list_skills` (lists 77 installed skills)
- New: `syn_skill_info` (reads SKILL.md content)
- New: `syn_approve` (approve/reject HITL decisions from IDE)
- New: `syn_events` (get task event timeline from IDE)
- Fixed: `syn_task` uses proper UUID format
- Fixed: all timeouts increased to 10-15s for DNS reliability
- File: `syndicate-mcp/server.py`

### HITL Workflow: Approval Resume
- Approvals page now resumes workflow on decision (updates task status + emits event)
- `syn_approve` MCP tool mirrors same workflow (consistent IDE/dashboard behavior)
- Bridge creates approvals for high/critical risk review failures
- File: `syndicate-ui/src/pages/Approvals.tsx`

### Dashboard: Explainability
- 5-stage progress indicator (pending -> planning -> in_progress -> reviewing -> complete)
- "View full pipeline" link after task submission
- Task cards show result text + all status colors (including awaiting_approval, failed)
- Removed 3D AgentOrb hero (was importing deleted component)
- Fixed animation delays (were calibrated for removed 60vh hero)
- File: `syndicate-ui/src/pages/Dashboard.tsx`

### Frontend: Clean Rebuild
- Removed entire 3D brain system (BrainParticles, GLSL shaders, brain.glb)
- Added lightweight 3D agent network graph (6 nodes + edges, auto-rotating)
- New `/docs` page with setup commands, MCP tools, architecture, testing
- Docs page accessible via NavigationRail
- Files: `AgentGraph.tsx`, `Docs.tsx`, `AppRouter.tsx`, `NavigationRail.tsx`

### Database: Migrations Applied
- `task_metrics` table (UUID foreign key to tasks)
- `approvals` table (UUID foreign key, RLS, Realtime)
- `pgvector` extension + `match_memories` RPC function
- `awaiting_approval` added to tasks status constraint
- Applied via: `npx supabase db query --linked`

### Testing: 33 Core Tests
- 26 unit tests (bridge event classification, metrics computation, MCP structure)
- 6 Supabase integration tests (CRUD all tables, RLS verification)
- 1 E2E lifecycle test (submit -> events -> metrics -> memory)
- All passing as of commit `526bf96`

---

## [0.2.0] - 2026-06-18 - Product Upgrade (Phases A-I)

### Phase A: Band-Dashboard Bridge
- `EventBridge.watch_for_tasks()` polls Supabase every 5s for pending tasks
- Marks tasks as `planning`, emits `agent_joined` event
- `on_agent_response()` classifies Band messages into event types
- Reconnect-forever pattern: agents auto-restart with exponential backoff

### Phase B: Metrics Engine
- `MetricsEngine.compute_and_store()` auto-triggered on task completion
- Computes: first_pass_rate, iteration_count, time_to_complete, review_score
- Stores in `task_metrics` table

### Phase C: Semantic Memory
- `generate_embedding()` via Google text-embedding-004 API
- `semantic_search()` queries pgvector `match_memories` function
- `store_with_embedding()` attaches 768-dim vectors to memory entries

### Phase D: Approvals
- Dedicated `approvals` table (not events table filter)
- Risk-level color coding (critical/high/medium/low)
- Supabase Realtime subscription

### Phase E: Pipeline Observability
- Expandable stages (click to reveal full content)
- Time-between-stages from event timestamps
- Event timeline with agent avatars

### Phase F: Self-Improvement
- `SelfImprovementEngine.run_cycle()` fires after completion
- Detects recurring patterns, evolves agent prompts
- Logs to `memory/skill_evolution.jsonl`

---

## [0.1.0] - 2026-06-17 - Foundation (Sessions 1-3)

### Core
- 6 Band agents registered (Nexus, Architect, Engineer, Reviewer, Researcher, QA)
- Multi-model: Gemini 2.5 Flash (5 agents) + Azure GPT-4o (Reviewer)
- Supabase: agents, tasks, events, memory tables with RLS + Realtime
- Orchestrator with task lifecycle management

### Frontend
- 9-page React dashboard with Supabase Realtime
- Clerk auth (GitHub + Google + Microsoft OAuth)
- Sound design (Web Audio API)
- Vercel deployment (auto-deploys from main)
