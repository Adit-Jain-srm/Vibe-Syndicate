---
name: Syndicate Product Upgrade
overview: Apply all network integration, panel, and reference insights to make Syndicate a genuinely production-grade, AI-native developer orchestration platform — not a hackathon demo.
todos: []
isProject: true
phases:
  - name: "Phase A: Real Band ↔ Dashboard Bridge"
    todos:
      - id: a1-events-bridge
        content: "A.1: Agent swarm writes events to Supabase when processing Band messages (real-time bridge between Band and dashboard)"
        status: pending
      - id: a2-real-task-trigger
        content: "A.2: Task submission creates Band room + sends to Nexus (real workflow, not simulation). Fallback to simulation if swarm offline."
        status: pending
      - id: a3-agent-status-sync
        content: "A.3: Agent status in Supabase syncs with actual swarm state (active when processing, idle when waiting)"
        status: pending
  - name: "Phase B: Evaluation & Metrics"
    todos:
      - id: b1-metrics-schema
        content: "B.1: Create task_metrics table in Supabase (first_pass_rate, iteration_count, time_to_complete, tokens_used)"
        status: pending
      - id: b2-metrics-compute
        content: "B.2: Compute metrics after each task completion, store in Supabase, display on dashboard"
        status: pending
      - id: b3-metrics-dashboard
        content: "B.3: Dashboard metrics section showing improvement over time (charts, trends)"
        status: pending
  - name: "Phase C: Semantic Memory"
    todos:
      - id: c1-pgvector
        content: "C.1: Enable pgvector in Supabase, add embedding column to memory table"
        status: pending
      - id: c2-semantic-query
        content: "C.2: Before each task, query memory semantically for relevant past learnings"
        status: pending
      - id: c3-memory-clusters
        content: "C.3: Memory page shows clustered learnings by topic, not flat list"
        status: pending
  - name: "Phase D: Human-in-the-Loop"
    todos:
      - id: d1-approval-gate
        content: "D.1: High-risk reviews pause workflow, create approval record in Supabase"
        status: pending
      - id: d2-approval-ui
        content: "D.2: Dashboard approval queue page with accept/reject actions"
        status: pending
  - name: "Phase E: Pipeline Observability"
    todos:
      - id: e1-pipeline-view
        content: "E.1: Task detail page shows signal pipeline: Input → Plan → Code → Review → Output with time/agent/outcome per stage"
        status: pending
      - id: e2-expandable-stages
        content: "E.2: Each pipeline stage is expandable to show full content (plan text, code, review findings)"
        status: pending
  - name: "Phase F: Quantified Self-Improvement"
    todos:
      - id: f1-skillopt-metrics
        content: "F.1: SkillOpt compares task metrics to rolling average, detects degradation"
        status: pending
      - id: f2-improvement-graph
        content: "F.2: Memory/Evolution page shows improvement graph (pass rate over time, iterations trending down)"
        status: pending
  - name: "Phase G: Frontend — The Product Sells Itself"
    todos:
      - id: g1-page-transitions
        content: "G.1: GSAP page transitions between all routes (morph sidebar indicator, crossfade content, slide direction based on nav position)"
        status: pending
      - id: g2-micro-interactions
        content: "G.2: Every interactive element has hover/focus/active states — magnetic pull on cards, glow on focus, scale on tap, sound on submit"
        status: pending
      - id: g3-skeleton-states
        content: "G.3: Shimmer skeleton loaders for every async data fetch (not blank space, not spinners) — matching card shapes"
        status: pending
      - id: g4-responsive-polish
        content: "G.4: Mobile-responsive sidebar (bottom nav on mobile), card stacking, text scaling. Test at 375px, 768px, 1440px."
        status: pending
      - id: g5-onboarding-empty
        content: "G.5: Empty states are DELIGHTFUL — animated illustrations, clear CTAs, contextual guidance per page"
        status: pending
      - id: g6-dark-light
        content: "G.6: Dark mode is default but light mode exists (tokens already defined). Theme toggle in sidebar footer."
        status: pending
  - name: "Phase H: Self-Review + Documentation Sync"
    todos:
      - id: h1-code-audit
        content: "H.1: Full codebase self-review — check for: unused imports, any types, missing error handling, inconsistent patterns, dead code"
        status: pending
      - id: h2-readme-sync
        content: "H.2: Update README with all new pages, architecture changes, new mermaid diagrams for pipeline/metrics/approvals"
        status: pending
      - id: h3-agents-sync
        content: "H.3: Update AGENTS.md with all decisions made, patterns discovered, session log entry"
        status: pending
      - id: h4-api-docs
        content: "H.4: Generate/update API documentation — all Supabase tables, all frontend routes, all MCP tools documented"
        status: pending
      - id: h5-changelog
        content: "H.5: Create CHANGELOG.md with all versions/commits grouped by phase"
        status: pending
  - name: "Phase I: E2E Testing Suite"
    todos:
      - id: i1-supabase-tests
        content: "I.1: Supabase integration tests — CRUD on all tables (agents, tasks, events, memory), RLS policy verification, realtime subscription test"
        status: pending
      - id: i2-frontend-tests
        content: "I.2: Vitest component tests — each page renders, API client handles errors, demo data fallback works"
        status: pending
      - id: i3-band-tests
        content: "I.3: Band integration test — agent connects, receives message, generates response, writes event to Supabase"
        status: pending
      - id: i4-mcp-tests
        content: "I.4: MCP server tests — each tool (syn_init, syn_task, syn_status, etc.) returns valid response"
        status: pending
      - id: i5-e2e-flow
        content: "I.5: Full E2E flow test — submit task on dashboard → events appear → pipeline stages complete → metrics update → memory stored"
        status: pending
---

# Syndicate Product Upgrade — From Demo to Real Product

## Strategic Goal

Transform Syndicate from "hackathon project with nice frontend" into a genuinely functional, AI-native developer platform where:
- Agents ACTUALLY collaborate through Band in real-time
- Memory is ACTUALLY persistent and semantically retrievable
- Self-improvement is ACTUALLY measurable
- The dashboard shows ACTUAL live data, not simulations
- Every architectural decision from the insights docs is implemented

---

## Architectural Principles (from insights synthesis)

1. **Signal Pipeline Framing** (from Suneeth Maraboina): Each agent = processing stage with defined I/O contracts
2. **Evaluation Framework** (from Jerry Adams Franklin): Score each task cycle quantitatively
3. **Human-in-the-Loop Checkpoints** (from Sriharsha Makineni): Explicit approval gates
4. **Scoped Agents** (from Valerie/Panel): Each agent has ONE job, tight I/O
5. **Stateful, Always-On** (from Vlad/Panel): Context rehydration, not session-dependent
6. **Composable MCP Primitives** (from Bhanu Pratap Singh): Tools chain naturally
7. **Semantic Caching** (from Shaktesh Pandey): Don't re-query what's already known

---

## Implementation Phases

### Phase A: Make the Real System Work (Band ↔ Dashboard bridge)

The #1 gap: when agents talk in Band, the dashboard doesn't know. Fix this.

**A.1**: When the swarm processes a task in Band, write events to Supabase in real-time
- The `main.py` agent loop needs a callback that fires on every Band message → writes to Supabase
- This makes the Live Room page show REAL agent collaboration
- Agent status in Supabase updates to "active" when they're processing

**A.2**: Make task creation trigger REAL Band workflow (not simulation)
- When user submits task on dashboard, create a Band room, add Nexus, send the task message
- Nexus picks it up (if swarm running), orchestrates through Band, events flow to Supabase
- Dashboard shows the real thing

**A.3**: Fallback: if swarm isn't running, keep the simulation path (but label it clearly)

### Phase B: Evaluation & Metrics Engine

**B.1**: After each task completes, compute and store metrics:
- `first_pass_rate`: Did code pass review on first attempt?
- `iteration_count`: How many review rounds?
- `time_to_complete`: Total wall-clock seconds
- `agents_involved`: How many agents participated?

**B.2**: Create a metrics table in Supabase and display on dashboard

**B.3**: Use metrics to drive self-improvement: if `first_pass_rate` drops below 70%, trigger skill evolution

### Phase C: Semantic Memory Layer

**C.1**: Add pgvector extension to Supabase for embedding-based retrieval
**C.2**: Before each task, query memory semantically: "What have we learned about similar tasks?"
**C.3**: Redis-like semantic caching: if cosine similarity > 0.92, skip re-querying
**C.4**: Memory page shows clusters of related learnings, not just a flat list

### Phase D: Human-in-the-Loop Approval Gates

**D.1**: High-risk reviews (risk: high/critical) pause workflow and notify the user
**D.2**: Dashboard approval queue shows pending decisions with context
**D.3**: User approves/rejects → workflow continues

### Phase E: Agent Observability (Signal Pipeline View)

**E.1**: Each task visualized as a pipeline: Input → Plan → Code → Review → Output
**E.2**: Each stage shows: time taken, agent involved, tokens used, outcome
**E.3**: Clickable: expand any stage to see the actual content (plan text, code, review findings)

### Phase F: Real Self-Improvement with Quantified Evidence

**F.1**: After each task, run SkillOpt: compare this task's metrics to rolling average
**F.2**: If degradation detected, auto-propose skill delta (log it visibly)
**F.3**: Show improvement graph on Memory page: "Review pass rate: 65% → 85% over 10 tasks"

### Phase G: Frontend — The Product Sells Itself

**References:**
- Linear.app design system (from `Design_inspirations/linear.app/DESIGN.md`) — micro-interactions, component states
- Dimension.dev (from `Design_inspirations/www.dimension.dev/DESIGN.md`) — glassmorphic transitions
- Emil Kowalski skill (`emil-design-eng`) — animation decisions, component polish
- Suneeth Maraboina insight — "signal pipeline framing" for the Pipeline page
- Mahati Kumar insight — "build for one clear use case" = the task submission → completion flow must be FLAWLESS

**Principles:**
- Every state transition is animated (no jumps)
- Every data fetch has a skeleton (no blank space)
- Every empty state guides the user (not "nothing here")
- Every interaction has feedback (visual + audio)
- The product NARRATIVE flows through the pages: Dashboard → Pipeline → Live → Metrics → Memory

**G.1** Page transitions: GSAP morphing between routes. Sidebar active indicator slides with spring. Content crossfades.
**G.2** Every card, button, link has: hover glow, scale on press, magnetic pull for primary CTAs, sound on action.
**G.3** Skeleton loaders shaped like the actual content (cards, bars, text lines). Shimmer animation.
**G.4** Responsive: sidebar becomes bottom nav on mobile. Cards stack vertically. Pipeline scrolls horizontally.
**G.5** Empty states: animated gradient background, contextual message, single primary CTA.
**G.6** Theme toggle: dark (default) + light option. CSS variables swap. Stored in localStorage.

### Phase H: Self-Review + Documentation Sync

**References:**
- `.cursor/rules/anti-laziness.mdc` — IMPLEMENT → SELF-REVIEW → TEST → RUN → DOC SYNC → PROVE
- `.cursor/rules/self-review.mdc` — full 10-point checklist per file
- Codeband's README (232 lines with architecture, commands, configuration, limitations)
- NEXUS CDM's README (790 lines with 7 mermaid diagrams, 64 API endpoints, full project structure)

**Protocol after every implementation phase:**
1. Self-review all changed files (10-point checklist)
2. Fix issues silently before presenting
3. Update README with new features/pages/architecture
4. Update AGENTS.md with decisions and learnings
5. Run E2E tests to prove nothing broke
6. Commit with evidence

**H.1** Code audit: grep for `any`, unused imports, `TODO`, `console.log` in production code.
**H.2** README: add new pages to project structure, update mermaid diagrams, add new routes to API table.
**H.3** AGENTS.md: session log, architecture decisions (why Supabase direct, why simulation fallback).
**H.4** API docs: document every Supabase table schema, every frontend route, every MCP tool interface.
**H.5** CHANGELOG: group all commits by phase, annotate what each delivers.

### Phase I: E2E Testing Suite

**References:**
- NEXUS CDM testing strategy: 266 tests (114 backend + 129 unit + 23 E2E) grouped by domain
- Codeband: tests grouped by module (test_workspace, test_reviewer, test_session, etc.)
- `.cursor/rules/anti-laziness.mdc` — "Write a test proving it works. Not a stub. A REAL test."

**Testing Philosophy:**
- Tests are grouped by WHAT they verify, not by type
- Each test proves one thing with a clear assertion
- Integration tests hit real Supabase (not mocks) for data layer
- Frontend tests use Vitest + jsdom for component rendering
- E2E tests prove the full user flow works

**I.1** Supabase: insert/read/update/delete on all tables, verify RLS allows anon, verify realtime subscription fires on insert.
**I.2** Frontend: each page component renders without crash, api client returns typed data, error boundary catches failures.
**I.3** Band: agent imports correctly, connects (mock WebSocket), prompt loads with band_* tools, config resolves.
**I.4** MCP: server.py parses JSON-RPC, tools/list returns 6 tools, tools/call with each tool name returns valid response.
**I.5** Full flow: programmatically insert task → verify events appear → verify task status changes → verify memory created.

---

## What This Makes Syndicate (vs Reference Projects)

| Metric | Codeband | Manthan | Syndicate (after upgrade) |
|--------|----------|---------|--------------------------|
| Real-time dashboard | None (CLI only) | Basic web | 3D + live Supabase Realtime |
| Cross-model review | Claude vs Codex (CLI) | None | Gemini vs GPT-4o (visible in dashboard) |
| Persistent memory | JSONL local only | Per-case PG | Supabase + semantic (pgvector) |
| Self-improvement | None | None | Quantified SkillOpt with metrics |
| Human-in-the-loop | CLI approval | Policy gates | Dashboard approval queue |
| Agent observability | `cb feed` CLI | Traces page | Signal pipeline visualization |
| MCP integration | None | None | 6 tools callable from IDE |
| Frontend quality | None | React dark | 3D glassmorphic + animations + sound |
