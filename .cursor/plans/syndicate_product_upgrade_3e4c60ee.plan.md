---
name: Syndicate Product Upgrade
overview: "Transform Syndicate from a demo-state hackathon project into a production-grade AI-native developer orchestration platform by implementing 9 phases: Real Band-Dashboard bridge, metrics engine, semantic memory, HITL approvals, pipeline observability, self-improvement, frontend polish, documentation sync, and E2E testing."
todos: []
isProject: true
phases:
  - name: "Phase A: Real Band ↔ Dashboard Bridge"
    todos:
      - id: a1-events-bridge
        content: "Add Supabase event emission callback to agent swarm (when Band message processed → write event to Supabase). Files: orchestrator.py, main.py"
        status: pending
      - id: a2-real-task-trigger
        content: "Task submission creates Band room + sends to Nexus (real workflow). Keep simulation as labeled fallback. Files: api.ts, Dashboard.tsx, orchestrator.py"
        status: pending
      - id: a3-agent-status-sync
        content: "Agent status in Supabase updates to active/idle based on actual processing. Files: main.py, orchestrator.py"
        status: pending
  - name: "Phase B: Evaluation & Metrics Engine"
    todos:
      - id: b1-metrics-schema
        content: Create task_metrics table (first_pass_rate, iteration_count, time_to_complete, tokens_used, agents_involved). SQL migration.
        status: pending
      - id: b2-metrics-compute
        content: "Compute metrics on task completion in orchestrator. Store in task_metrics. Files: orchestrator.py, new metrics.py"
        status: pending
      - id: b3-metrics-dashboard
        content: "Dashboard metrics section with real computed data, trend charts. Files: Metrics.tsx, api.ts"
        status: pending
  - name: "Phase C: Semantic Memory (pgvector)"
    todos:
      - id: c1-pgvector-setup
        content: Enable pgvector in Supabase, add embedding column to memory table, create similarity search function
        status: pending
      - id: c2-semantic-query
        content: "Before each task, query memory semantically. Gemini embeddings → cosine search. Files: memory.py, orchestrator.py"
        status: pending
      - id: c3-memory-clusters
        content: "Memory page shows clustered learnings by topic (frontend grouping). Files: Memory.tsx"
        status: pending
  - name: "Phase D: Human-in-the-Loop Approvals"
    todos:
      - id: d1-approval-gate
        content: "High-risk reviews pause workflow, create approval record. New approvals table. Files: orchestrator.py"
        status: pending
      - id: d2-approval-ui
        content: "Approval queue page with accept/reject actions that resume workflow. Files: Approvals.tsx, api.ts"
        status: pending
  - name: "Phase E: Pipeline Observability"
    todos:
      - id: e1-pipeline-detail
        content: "Task detail shows signal pipeline with time/agent/outcome per stage. Expandable stages. Files: Pipeline.tsx"
        status: pending
      - id: e2-rich-events
        content: "Agent events include stage content (plan text, code snippets, review findings). Files: orchestrator.py, prompts/"
        status: pending
  - name: "Phase F: Quantified Self-Improvement"
    todos:
      - id: f1-skillopt-metrics
        content: "SkillOpt compares task metrics to rolling average, detects degradation. Files: self_improve.py"
        status: pending
      - id: f2-improvement-graph
        content: "Memory/Evolution page shows improvement graph (pass rate, iterations over time). Files: Memory.tsx or new Evolution.tsx"
        status: pending
  - name: "Phase G: Frontend Polish"
    todos:
      - id: g1-page-transitions
        content: "GSAP page transitions between routes. Sidebar active indicator slides with spring. Files: AppRouter.tsx, Sidebar.tsx, new PageTransition wrapper"
        status: pending
      - id: g2-micro-interactions
        content: "Every interactive element: hover glow, scale on press, magnetic pull for CTAs, sound on action. All pages."
        status: pending
      - id: g3-skeleton-loaders
        content: "Shimmer skeleton loaders matching actual card shapes for every async fetch. Files: all pages + SkeletonLoader.tsx"
        status: pending
      - id: g4-responsive
        content: "Mobile responsive: sidebar → bottom nav, cards stack, pipeline scrolls horizontal. All pages."
        status: pending
      - id: g5-empty-states
        content: Animated empty states with gradient background, contextual message, primary CTA. All pages.
        status: pending
      - id: g6-theme-toggle
        content: "Dark default + light mode with CSS variable swap. localStorage persist. Files: theme.ts, Sidebar.tsx"
        status: pending
  - name: "Phase H: Documentation Sync"
    todos:
      - id: h1-code-audit
        content: Grep for any, unused imports, TODO, console.log. Fix all. Full codebase.
        status: pending
      - id: h2-readme
        content: Update README with new pages, mermaid diagrams, routes, setup instructions
        status: pending
      - id: h3-agents-md
        content: Update AGENTS.md session log with all decisions and learnings
        status: pending
      - id: h4-api-docs
        content: Document all Supabase tables, frontend routes, MCP tools
        status: pending
      - id: h5-changelog
        content: Create CHANGELOG.md grouped by phase
        status: pending
  - name: "Phase I: E2E Testing"
    todos:
      - id: i1-supabase-tests
        content: "Integration tests: CRUD all tables, RLS verification, realtime subscription. Files: tests/test_supabase.py"
        status: pending
      - id: i2-frontend-tests
        content: "Vitest component tests: each page renders, API client handles errors, demo fallback. Files: syndicate-ui/tests/"
        status: pending
      - id: i3-band-tests
        content: "Band integration test: agent connects, receives message, responds. Files: tests/test_band.py"
        status: pending
      - id: i4-mcp-tests
        content: "MCP server tests: tools/list returns 6 tools, each tool returns valid response. Files: tests/test_mcp.py"
        status: pending
      - id: i5-e2e-flow
        content: "Full flow: submit task → events appear → pipeline stages → metrics update → memory stored. Files: tests/test_e2e.py"
        status: pending
---

# Syndicate Product Upgrade — Implementation Plan

## Current State
- 6 Band agents connect and respond (Nexus, Architect, Engineer, Reviewer, Researcher, QA)
- Dashboard submits tasks but uses `simulateSwarmExecution()` — not real Band events
- Frontend: 8 pages with glassmorphic design, 3D orbs, sounds, Supabase Realtime
- Backend: `syndicate-agent/` with orchestrator writing to Supabase, `syndicate-mcp/` with 6 tools
- Supabase: `agents`, `tasks`, `events`, `memory` tables with RLS + Realtime enabled
- Deployed: Vercel frontend at `syndicate-ui-five.vercel.app`

## Implementation Strategy
- **Parallel waves**: Non-overlapping phases can be parallelized (A+B, C+D, E+F, G, H+I)
- **Backend-first**: Agent bridge (A) unlocks everything downstream
- **File ownership**: Each subagent gets exclusive files to prevent conflicts

## Key Files

**Agent layer** (`syndicate-agent/src/syndicate_agent/`):
- `main.py` — Swarm runner, agent loop
- `orchestrator.py` — Task lifecycle + Supabase persistence
- `memory.py` — 3-layer memory engine
- `self_improve.py` — SkillOpt loop
- `config.py` — Environment config

**Frontend** (`syndicate-ui/src/`):
- `lib/api.ts` — Supabase API client
- `lib/supabase.ts` — Supabase client instance
- `pages/Dashboard.tsx` — Task submission + simulation
- `pages/Pipeline.tsx` — Signal flow view
- `pages/Metrics.tsx` — KPI dashboard
- `pages/Approvals.tsx` — HITL queue
- `pages/Memory.tsx` — Memory entries

**MCP** (`syndicate-mcp/server.py`) — 6 tools via JSON-RPC

## Phase Dependencies
- Phase A (Bridge) — foundation, everything depends on this
- Phase B (Metrics) — needs events from A
- Phase C (Semantic Memory) — independent of A/B
- Phase D (HITL Approvals) — needs events from A
- Phase E (Pipeline) — needs rich events from A
- Phase F (Self-Improvement) — needs metrics from B
- Phase G (Frontend Polish) — can start after A-F pages are working
- Phase H (Docs) — after all code changes
- Phase I (Tests) — after all features implemented
