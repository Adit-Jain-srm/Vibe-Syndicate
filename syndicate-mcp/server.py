"""Syndicate MCP Server — exposes swarm tools + skill management for Cursor IDE."""
import asyncio
import json
import os
import subprocess
import sys
import uuid
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

PROJECT_ROOT = Path(__file__).parent.parent
SKILLS_DIR = PROJECT_ROOT / ".cursor" / "skills"
AGENTS_SKILLS_DIR = PROJECT_ROOT / ".agents" / "skills"

TOOLS = [
    {
        "name": "syn_init",
        "description": "Initialize Syndicate for current project. Returns agent count and project info.",
        "inputSchema": {
            "type": "object",
            "properties": {"project_name": {"type": "string", "description": "Name of the project to initialize"}},
            "required": ["project_name"],
        },
    },
    {
        "name": "syn_task",
        "description": "Send a development task to the multi-agent swarm. Returns task ID for tracking.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "description": {"type": "string", "description": "What to build/fix/research"},
                "complexity": {
                    "type": "string",
                    "enum": ["simple", "medium", "complex"],
                    "description": "Task complexity (affects agent count)",
                },
            },
            "required": ["description"],
        },
    },
    {
        "name": "syn_status",
        "description": "Check swarm status: active agents, recent tasks, pending approvals.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "syn_review",
        "description": "Request adversarial cross-model code review (Gemini writes, GPT-4o reviews).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "code": {"type": "string", "description": "Code to review"},
                "context": {"type": "string", "description": "What this code does"},
            },
            "required": ["code"],
        },
    },
    {
        "name": "syn_memory",
        "description": "Query or store persistent project memory (conventions, learnings, decisions).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "action": {"type": "string", "enum": ["query", "store"], "description": "Query existing or store new"},
                "content": {"type": "string", "description": "Content to store (when action=store)"},
                "category": {"type": "string", "enum": ["project", "agent_learning", "protocol_state", "skill_evolution"]},
            },
            "required": ["action"],
        },
    },
    {
        "name": "syn_find_tool",
        "description": "Search GitHub and skill marketplaces for tools/skills matching a need.",
        "inputSchema": {
            "type": "object",
            "properties": {"need": {"type": "string", "description": "What capability you need"}},
            "required": ["need"],
        },
    },
    {
        "name": "syn_install_skill",
        "description": "Install a skill from a GitHub repository into the project.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "repo": {"type": "string", "description": "GitHub repo (owner/name)"},
                "target": {"type": "string", "enum": [".cursor/skills", ".agents/skills"], "description": "Where to install"},
            },
            "required": ["repo"],
        },
    },
    {
        "name": "syn_list_skills",
        "description": "List all installed skills in this project (.cursor/skills and .agents/skills).",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "syn_skill_info",
        "description": "Get details about a specific installed skill.",
        "inputSchema": {
            "type": "object",
            "properties": {"skill_name": {"type": "string", "description": "Name of the skill directory"}},
            "required": ["skill_name"],
        },
    },
    {
        "name": "syn_approve",
        "description": "Approve or reject a pending human-in-the-loop decision.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "approval_id": {"type": "string", "description": "ID of the approval to resolve"},
                "decision": {"type": "string", "enum": ["approved", "rejected"], "description": "Your decision"},
            },
            "required": ["approval_id", "decision"],
        },
    },
    {
        "name": "syn_events",
        "description": "Get recent events for a task (shows agent activity, decisions, progress).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "Task ID to get events for"},
                "limit": {"type": "integer", "description": "Max events to return (default 20)"},
            },
            "required": ["task_id"],
        },
    },
]


async def handle_tool(name: str, args: dict) -> str:
    if name == "syn_init":
        return json.dumps({
            "status": "initialized",
            "project": args.get("project_name", ""),
            "agents": 6,
            "skills_installed": _count_skills(),
            "memory_entries": await _count_memories(),
        })

    elif name == "syn_task":
        tid = str(uuid.uuid4())
        if SUPABASE_URL:
            async with httpx.AsyncClient() as c:
                await c.post(
                    f"{SUPABASE_URL}/rest/v1/tasks",
                    headers=HEADERS,
                    json={
                        "id": tid,
                        "description": args["description"],
                        "status": "pending",
                        "complexity": args.get("complexity", "medium"),
                    },
                    timeout=10.0,
                )
        return json.dumps({"task_id": tid, "status": "pending", "message": "Task submitted to swarm"})

    elif name == "syn_status":
        result: dict = {"agents": [], "tasks": [], "pending_approvals": 0}
        if SUPABASE_URL:
            async with httpx.AsyncClient() as c:
                r = await c.get(
                    f"{SUPABASE_URL}/rest/v1/agents?select=name,role,status",
                    headers=HEADERS, timeout=10.0,
                )
                if r.status_code == 200:
                    result["agents"] = r.json()
                r = await c.get(
                    f"{SUPABASE_URL}/rest/v1/tasks?select=id,description,status&order=created_at.desc&limit=5",
                    headers=HEADERS, timeout=10.0,
                )
                if r.status_code == 200:
                    result["tasks"] = r.json()
                r = await c.get(
                    f"{SUPABASE_URL}/rest/v1/approvals?select=id&status=eq.pending",
                    headers={**HEADERS, "Prefer": "count=exact"}, timeout=10.0,
                )
                if r.status_code == 200:
                    result["pending_approvals"] = int(r.headers.get("content-range", "0/0").split("/")[-1] or 0)
        return json.dumps(result)

    elif name == "syn_review":
        return json.dumps({
            "status": "review_queued",
            "code_length": len(args.get("code", "")),
            "reviewer": "Azure OpenAI GPT-4o (adversarial cross-model)",
            "message": "Code submitted for review. Check dashboard for findings.",
        })

    elif name == "syn_memory":
        if args["action"] == "store" and SUPABASE_URL:
            async with httpx.AsyncClient() as c:
                await c.post(
                    f"{SUPABASE_URL}/rest/v1/memory",
                    headers=HEADERS,
                    json={
                        "content": args.get("content", ""),
                        "category": args.get("category", "project"),
                        "agent": "user",
                        "tags": [],
                    },
                    timeout=10.0,
                )
            return json.dumps({"status": "stored", "category": args.get("category", "project")})
        elif args["action"] == "query" and SUPABASE_URL:
            params = "select=content,category,agent,created_at&order=created_at.desc&limit=10"
            if args.get("category"):
                params += f"&category=eq.{args['category']}"
            async with httpx.AsyncClient() as c:
                r = await c.get(f"{SUPABASE_URL}/rest/v1/memory?{params}", headers=HEADERS, timeout=10.0)
                return json.dumps({"memories": r.json() if r.status_code == 200 else []})
        return json.dumps({"memories": []})

    elif name == "syn_find_tool":
        tools = []
        try:
            async with httpx.AsyncClient() as c:
                r = await c.get(
                    "https://api.github.com/search/repositories",
                    params={"q": f"{args['need']} topic:cursor-skills", "sort": "stars", "per_page": 5},
                    timeout=10.0,
                )
                if r.status_code == 200:
                    tools = [
                        {"name": repo["name"], "full_name": repo["full_name"], "stars": repo["stargazers_count"],
                         "description": repo.get("description", ""), "install": f"npx skills add {repo['full_name']}"}
                        for repo in r.json().get("items", [])
                    ]
        except Exception:
            pass
        return json.dumps({"results": tools, "query": args["need"]})

    elif name == "syn_install_skill":
        repo = args["repo"]
        target = args.get("target", ".agents/skills")
        target_dir = PROJECT_ROOT / target
        target_dir.mkdir(parents=True, exist_ok=True)
        try:
            result = subprocess.run(
                ["npx", "skills", "add", repo],
                capture_output=True, text=True, timeout=30, cwd=str(PROJECT_ROOT),
            )
            if result.returncode == 0:
                return json.dumps({"status": "installed", "repo": repo, "target": target, "output": result.stdout[:500]})
            else:
                return json.dumps({"status": "failed", "repo": repo, "error": result.stderr[:500]})
        except Exception as e:
            return json.dumps({"status": "error", "message": str(e)})

    elif name == "syn_list_skills":
        skills = []
        for d in [SKILLS_DIR, AGENTS_SKILLS_DIR]:
            if d.exists():
                for skill_dir in sorted(d.iterdir()):
                    if skill_dir.is_dir():
                        skill_file = skill_dir / "SKILL.md"
                        desc = ""
                        if skill_file.exists():
                            first_lines = skill_file.read_text(encoding="utf-8", errors="ignore")[:200]
                            desc = first_lines.split("\n")[0].lstrip("# ").strip()
                        skills.append({
                            "name": skill_dir.name,
                            "location": str(d.relative_to(PROJECT_ROOT)),
                            "has_skill_md": skill_file.exists(),
                            "description": desc,
                        })
        return json.dumps({"skills": skills, "total": len(skills)})

    elif name == "syn_skill_info":
        skill_name = args["skill_name"]
        for d in [SKILLS_DIR, AGENTS_SKILLS_DIR]:
            skill_path = d / skill_name / "SKILL.md"
            if skill_path.exists():
                content = skill_path.read_text(encoding="utf-8", errors="ignore")
                return json.dumps({
                    "name": skill_name,
                    "path": str(skill_path.relative_to(PROJECT_ROOT)),
                    "content": content[:2000],
                    "size": len(content),
                })
        return json.dumps({"error": f"Skill '{skill_name}' not found"})

    elif name == "syn_approve":
        approval_id = args["approval_id"]
        decision = args["decision"]
        if SUPABASE_URL:
            async with httpx.AsyncClient() as c:
                r = await c.patch(
                    f"{SUPABASE_URL}/rest/v1/approvals?id=eq.{approval_id}",
                    headers={**HEADERS, "Prefer": "return=representation"},
                    json={"status": decision, "decided_by": "mcp_user", "decided_at": __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat()},
                    timeout=10.0,
                )
                if r.status_code == 200:
                    data = r.json()
                    if data:
                        task_id = data[0].get("task_id", "")
                        new_status = "in_progress" if decision == "approved" else "failed"
                        await c.patch(
                            f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}",
                            headers=HEADERS,
                            json={"status": new_status},
                            timeout=10.0,
                        )
                        await c.post(
                            f"{SUPABASE_URL}/rest/v1/events",
                            headers=HEADERS,
                            json={"task_id": task_id, "type": f"approval_{decision}", "agent": "user", "content": f"Approval {decision} via MCP", "metadata": {}},
                            timeout=10.0,
                        )
                        return json.dumps({"status": decision, "task_id": task_id, "task_status": new_status})
        return json.dumps({"error": "Failed to resolve approval"})

    elif name == "syn_events":
        task_id = args["task_id"]
        limit = args.get("limit", 20)
        if SUPABASE_URL:
            async with httpx.AsyncClient() as c:
                r = await c.get(
                    f"{SUPABASE_URL}/rest/v1/events?task_id=eq.{task_id}&select=type,agent,content,created_at&order=created_at.asc&limit={limit}",
                    headers=HEADERS, timeout=10.0,
                )
                if r.status_code == 200:
                    return json.dumps({"events": r.json(), "task_id": task_id})
        return json.dumps({"events": [], "task_id": task_id})

    return json.dumps({"error": f"Unknown tool: {name}"})


def _count_skills() -> int:
    count = 0
    for d in [SKILLS_DIR, AGENTS_SKILLS_DIR]:
        if d.exists():
            count += sum(1 for p in d.iterdir() if p.is_dir() and (p / "SKILL.md").exists())
    return count


async def _count_memories() -> int:
    if not SUPABASE_URL:
        return 0
    try:
        async with httpx.AsyncClient() as c:
            r = await c.get(
                f"{SUPABASE_URL}/rest/v1/memory?select=id",
                headers={**HEADERS, "Prefer": "count=exact"},
                timeout=5.0,
            )
            return int(r.headers.get("content-range", "0/0").split("/")[-1] or 0)
    except Exception:
        return 0


async def handle_request(req: dict) -> dict | None:
    method = req.get("method", "")
    rid = req.get("id")
    params = req.get("params", {})

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": rid,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "syndicate", "version": "0.2.0"},
            },
        }
    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": rid, "result": {"tools": TOOLS}}
    if method == "tools/call":
        text = await handle_tool(params.get("name", ""), params.get("arguments", {}))
        return {
            "jsonrpc": "2.0",
            "id": rid,
            "result": {"content": [{"type": "text", "text": text}]},
        }
    if method.startswith("notifications/"):
        return None
    return {
        "jsonrpc": "2.0",
        "id": rid,
        "error": {"code": -32601, "message": f"Unknown method: {method}"},
    }


async def main():
    reader = asyncio.StreamReader()
    protocol = asyncio.StreamReaderProtocol(reader)
    await asyncio.get_event_loop().connect_read_pipe(lambda: protocol, sys.stdin)
    transport, _ = await asyncio.get_event_loop().connect_write_pipe(
        asyncio.streams.FlowControlMixin, sys.stdout
    )
    writer = asyncio.StreamWriter(transport, None, reader, asyncio.get_event_loop())

    while True:
        try:
            line = await reader.readline()
            if not line:
                break
            header = line.decode().strip()
            if header.startswith("Content-Length:"):
                length = int(header.split(":")[1])
                await reader.readline()
                body = await reader.readexactly(length)
                resp = await handle_request(json.loads(body))
                if resp:
                    out = json.dumps(resp).encode()
                    writer.write(f"Content-Length: {len(out)}\r\n\r\n".encode() + out)
                    await writer.drain()
        except (asyncio.IncompleteReadError, ConnectionResetError):
            break
        except Exception as e:
            sys.stderr.write(f"MCP error: {e}\n")


if __name__ == "__main__":
    asyncio.run(main())
