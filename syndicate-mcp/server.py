"""Syndicate MCP Server — exposes swarm tools for Cursor."""
import asyncio
import json
import os
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

TOOLS = [
    {
        "name": "syn_init",
        "description": "Initialize Syndicate for current project",
        "inputSchema": {
            "type": "object",
            "properties": {"project_name": {"type": "string"}},
            "required": ["project_name"],
        },
    },
    {
        "name": "syn_task",
        "description": "Send a dev task to the agent swarm",
        "inputSchema": {
            "type": "object",
            "properties": {
                "description": {"type": "string"},
                "complexity": {
                    "type": "string",
                    "enum": ["simple", "medium", "complex"],
                },
            },
            "required": ["description"],
        },
    },
    {
        "name": "syn_status",
        "description": "Check swarm status",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "syn_review",
        "description": "Request adversarial code review",
        "inputSchema": {
            "type": "object",
            "properties": {
                "code": {"type": "string"},
                "context": {"type": "string"},
            },
            "required": ["code"],
        },
    },
    {
        "name": "syn_memory",
        "description": "Query/store persistent memory",
        "inputSchema": {
            "type": "object",
            "properties": {
                "action": {"type": "string", "enum": ["query", "store"]},
                "content": {"type": "string"},
                "category": {"type": "string"},
            },
            "required": ["action"],
        },
    },
    {
        "name": "syn_find_tool",
        "description": "Search marketplaces for tools",
        "inputSchema": {
            "type": "object",
            "properties": {"need": {"type": "string"}},
            "required": ["need"],
        },
    },
]


async def handle_tool(name: str, args: dict) -> str:
    if name == "syn_init":
        return json.dumps(
            {"status": "initialized", "project": args.get("project_name", ""), "agents": 6}
        )
    elif name == "syn_task":
        tid = f"task_{uuid.uuid4().hex[:12]}"
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
                    timeout=5.0,
                )
        return json.dumps({"task_id": tid, "status": "pending", "message": "Task submitted to swarm"})
    elif name == "syn_status":
        result: dict = {"agents": [], "tasks": []}
        if SUPABASE_URL:
            async with httpx.AsyncClient() as c:
                r = await c.get(
                    f"{SUPABASE_URL}/rest/v1/agents?select=name,role,status",
                    headers=HEADERS,
                    timeout=5.0,
                )
                if r.status_code == 200:
                    result["agents"] = r.json()
                r = await c.get(
                    f"{SUPABASE_URL}/rest/v1/tasks?select=id,description,status&order=created_at.desc&limit=5",
                    headers=HEADERS,
                    timeout=5.0,
                )
                if r.status_code == 200:
                    result["tasks"] = r.json()
        return json.dumps(result)
    elif name == "syn_review":
        return json.dumps(
            {
                "status": "review_queued",
                "code_length": len(args.get("code", "")),
                "reviewer": "Azure OpenAI GPT-4o",
            }
        )
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
                    timeout=5.0,
                )
            return json.dumps({"status": "stored"})
        elif args["action"] == "query" and SUPABASE_URL:
            async with httpx.AsyncClient() as c:
                r = await c.get(
                    f"{SUPABASE_URL}/rest/v1/memory?select=content,category,agent,created_at&order=created_at.desc&limit=10",
                    headers=HEADERS,
                    timeout=5.0,
                )
                return json.dumps({"memories": r.json() if r.status_code == 200 else []})
        return json.dumps({"memories": []})
    elif name == "syn_find_tool":
        tools = []
        try:
            async with httpx.AsyncClient() as c:
                r = await c.get(
                    "https://api.github.com/search/repositories",
                    params={
                        "q": f"{args['need']} topic:cursor-skills",
                        "sort": "stars",
                        "per_page": 5,
                    },
                    timeout=10.0,
                )
                if r.status_code == 200:
                    tools = [
                        {
                            "name": repo["name"],
                            "stars": repo["stargazers_count"],
                            "install": f"npx skills add {repo['full_name']}",
                        }
                        for repo in r.json().get("items", [])
                    ]
        except Exception:
            pass
        return json.dumps({"results": tools})
    return json.dumps({"error": f"Unknown tool: {name}"})


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
                "serverInfo": {"name": "syndicate", "version": "0.1.0"},
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
        "error": {"code": -32601, "message": f"Unknown: {method}"},
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
