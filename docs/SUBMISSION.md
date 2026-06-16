# lablab.ai Hackathon Submission

## Project Title
Syndicate — Compound Intelligence for Developers

## Short Description (255 chars max)
A self-improving multi-agent swarm where 6 AI agents collaborate through Band rooms to plan, code, and review software — accumulating intelligence across sessions so each task is better than the last.

## Long Description (100+ words)

Syndicate is a multi-agent developer orchestration platform built on Band.ai. Six specialized AI agents — Nexus (conductor), Architect (planner), Engineer (coder), Reviewer (quality gate), Researcher (discovery), and QA (validation) — collaborate in real-time through Band rooms with @mention routing.

What makes Syndicate different: **compound intelligence**. Unlike tools that start fresh every session, Syndicate accumulates learnings. Every review failure becomes a permanent lesson. Every convention discovered gets stored. Agent skills literally evolve from measured outcomes.

The system uses cross-model adversarial review: Engineer generates code with Google Gemini, Reviewer checks with Azure OpenAI GPT-4o. Different model families catch different blind spots.

Key features:
- 6 agents coordinated through Band.ai rooms with visible @mention handoffs
- 3-layer persistent memory (protocol state + project conventions + agent learnings)
- Self-improvement loop that evolves agent skill documents after each cycle
- MCP server with 6 tools (syn_init, syn_task, syn_status, syn_review, syn_memory, syn_find_tool) for Cursor integration
- Real-time dashboard showing live agent collaboration, task pipeline, and memory accumulation
- Tool discovery engine that searches skill marketplaces to expand the swarm's capabilities
- Cross-model adversarial review (Gemini writes, GPT-4o reviews)

Built for the Band of Agents Hackathon, Track 2: Multi-Agent Software Development.

## Technology Tags
Band.ai, Multi-Agent, Gemini, Azure OpenAI, React, FastAPI, Supabase, MCP, TypeScript, Python

## Category Tags
Developer Tools, AI Agents, Software Development, Self-Improving AI

## Cover Image
Use the README banner or create a dark-themed graphic showing the 6 agents connected through Band rooms.

## GitHub Repository
https://github.com/Adit-Jain-srm/Vibe-Syndicate

## Demo Application URL
[Vercel URL — fill after deploy]

## Video Presentation
[YouTube URL — fill after recording]

## Slide Presentation
Create a 10-slide PDF:
1. Title: Syndicate — Compound Intelligence for Developers
2. Problem: AI tools are stateless, fragmented, never learn
3. Solution: Self-improving multi-agent swarm on Band
4. Architecture: 6 agents, Band rooms, @mention routing
5. Cross-model review: Gemini + GPT-4o adversarial
6. Memory: 3 layers, compound intelligence
7. MCP: IDE integration with 6 tools
8. Dashboard: Real-time collaboration visualization
9. Self-improvement: SkillOpt loop, measured evolution
10. Team + Links + Future vision
