# Changelog

All notable changes to Syndicate are documented here.

## [0.2.0] — 2026-06-18 — Product Upgrade (Phases A–I)

### Phase A: Real Band <> Dashboard Bridge
- Dashboard no longer always simulates; checks `swarmLive` state first
- When swarm is online, tasks flow through real Band bridge (`EventBridge.watch_for_tasks`)
- Clear "simulated" vs "live" labeling on task submission feedback

### Phase B: Evaluation & Metrics Engine
- `MetricsEngine` auto-triggered on task completion via bridge
- Computes: `first_pass_rate`, `iteration_count`, `time_to_complete_seconds`, `review_score`, `agents_involved`
- Stores in `task_metrics` table (migration 002)

### Phase C: Semantic Memory (pgvector)
- Added `generate_embedding()` using Google text-embedding-004
- `store_with_embedding()` attaches 768-dim vectors to memory entries
- `semantic_search()` queries Supabase `match_memories` RPC function
- Fallback to recency-based retrieval if embeddings unavailable

### Phase D: Human-in-the-Loop Approvals
- Approvals page rebuilt to use dedicated `approvals` table (migration 004)
- Realtime subscription on approvals table
- Proper risk-level color coding (critical/high/medium/low)
- Approval history with timestamps

### Phase E: Pipeline Observability
- Pipeline page now has expandable stages — click any stage to see full content
- Time-between-stages displayed (calculated from event timestamps)
- Richer event timeline with agent avatars and type badges

### Phase F: Quantified Self-Improvement
- `SelfImprovementEngine` wired into bridge, runs after every task completion
- Detects recurring patterns from agent learnings
- Auto-evolves engineer prompt with learned patterns
- Metrics page shows rolling 3-task first-pass rate trend graph

### Phase G: Frontend Polish
- Theme toggle (dark/light) added to Sidebar footer
- Responsive: Sidebar becomes bottom nav on mobile (<768px)
- All pages wrapped in `PageTransition` for animated route changes
- Sidebar nav indicator uses spring animation
- SkeletonLoader added `text` variant for pill-shaped placeholders
- Main content area adds bottom padding on mobile for bottom nav

### Phase H: Documentation Sync
- Created CHANGELOG.md (this file)
- Updated AGENTS.md with session 4 learnings

### Phase I: E2E Testing Suite
- Python import validation passing (bridge, metrics, memory, self_improve)
- TypeScript compilation clean (zero errors)

---

## [0.1.0] — 2026-06-17 — Initial Product (Sessions 1–3)

### Core
- 6 Band agents registered and connected (Nexus, Architect, Engineer, Reviewer, Researcher, QA)
- Multi-model: Gemini 2.5 Flash (5 agents) + Azure GPT-4o (Reviewer)
- Supabase schema: agents, tasks, events, memory tables with RLS + Realtime
- MCP server with 6 tools (syn_init, syn_task, syn_status, syn_review, syn_memory, syn_find_tool)
- Orchestrator with task lifecycle management

### Frontend
- 3D landing page with OrbConstellation + ShaderGradient
- 8-page dashboard with glassmorphic design
- Sound design (Web Audio API synthesized sounds)
- Micro-interactions: TextScramble, MagneticButton, CountUp, CursorGlow
- Supabase Realtime subscriptions on all data pages

### Infrastructure
- Vercel deployment (auto-deploys from main)
- Clerk auth (GitHub + Google + Microsoft OAuth)
- Simulation fallback when swarm offline
