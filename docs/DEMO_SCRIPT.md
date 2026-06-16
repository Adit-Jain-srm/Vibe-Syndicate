# Syndicate Demo Video Script (5 minutes)

## Setup Before Recording
- Start backend: `cd syndicate-api && uvicorn syndicate_api.main:app --port 8000`
- Start frontend: `cd syndicate-ui && npm run dev`
- Start agent swarm: `cd syndicate-agent && python -m syndicate_agent.main`
- Open browser at localhost:5173
- Open Band.ai in another tab to show agent rooms

---

## INTRO (0:00 - 0:30)

**[Show: Dashboard with dark theme]**

"AI development tools today have a fundamental problem. They're stateless — every session starts fresh. They never learn your codebase, your conventions, or what worked before. And planning, coding, reviewing are completely fragmented.

Syndicate fixes this. It's a self-improving multi-agent swarm that gets smarter every time you use it."

---

## ARCHITECTURE (0:30 - 1:00)

**[Show: README mermaid diagram or a slide]**

"Six specialized AI agents collaborate through Band rooms:
- Nexus orchestrates
- Architect plans
- Engineer codes with Gemini
- Reviewer checks with GPT-4o — a completely different model family
- Researcher finds tools and prior art
- QA validates

The cross-model review is key — Gemini writes, GPT-4o reviews. Different blind spots, better code."

---

## LIVE DEMO: Submit a Task (1:00 - 2:30)

**[Show: Dashboard → Task Input]**

"Let me submit a real task."

*Type: "Add a rate limiter middleware to the API"*
*Click Submit*

"Watch what happens in the pipeline."

**[Show: Tasks page — task moves from Pending → Planning]**

"Nexus analyzed the complexity — medium — and recruited Architect, Engineer, and Reviewer."

**[Show: Band.ai room — agent messages flowing]**

"You can see the actual @mention routing in Band. Architect decomposes the task, Engineer implements, Reviewer critiques. All visible."

**[Show: Live Room page — SSE streaming events]**

"The Live Room shows every agent thought, every handoff in real-time."

---

## AGENTS & MEMORY (2:30 - 3:30)

**[Show: Agents page — 6 agents with status colors]**

"All six agents are live. The Reviewer runs on Azure OpenAI — a completely different model family from the Engineer's Gemini. Cross-model adversarial review catches things same-model can't."

**[Show: Memory page]**

"After every task, the system extracts lessons. 'Engineer missed error handling' becomes a permanent learning that improves the next task. Convention, gotchas, architecture decisions — all accumulate."

*Store a memory: "Always use try/catch in async route handlers"*

"This memory persists forever. Session 100 benefits from everything learned in session 1."

---

## MCP + SELF-IMPROVEMENT (3:30 - 4:30)

**[Show: Cursor IDE with syn_task being called]**

"From your IDE, one tool call starts the entire swarm. syn_task, syn_status, syn_review, syn_memory — all available in Cursor."

**[Show: memory/skill_evolution.jsonl or the Memory page showing learnings]**

"The self-improvement loop: after each task, extract patterns from reviews, update agent skill documents. The Engineer's prompt literally evolves based on measured outcomes."

---

## VISION (4:30 - 5:00)

**[Show: Dashboard with accumulated stats]**

"This is session 1. Imagine session 100.

The system knows your codebase. It knows which patterns produce clean reviews. It knows your conventions. Every task makes it better at the next one.

That's Syndicate — compound intelligence for developers. Not a chatbot that forgets. A teammate that grows."

**[End on logo/title card]**

---

## Recording Tips
- Use OBS or screen.studio
- 1920x1080, 60fps
- Record audio separately if possible (better quality)
- Keep mouse movements smooth and deliberate
- Pause 1 second after each page change (for the viewer to absorb)
