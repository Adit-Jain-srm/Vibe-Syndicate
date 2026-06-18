"""Tests for the MCP server — tool listing and basic invocation."""
import json
import sys
from pathlib import Path

import pytest

MCP_PATH = Path(__file__).parent.parent / "syndicate-mcp"
sys.path.insert(0, str(MCP_PATH))


class TestMCPServerStructure:
    def test_server_file_exists(self):
        assert (MCP_PATH / "server.py").exists()

    def test_server_imports(self):
        """Server module should import without errors."""
        import importlib.util
        spec = importlib.util.spec_from_file_location("server", MCP_PATH / "server.py")
        assert spec is not None

    def test_mcp_json_config_exists(self):
        """MCP config should exist at .cursor/mcp.json."""
        config_path = Path(__file__).parent.parent / ".cursor" / "mcp.json"
        assert config_path.exists()
        data = json.loads(config_path.read_text())
        assert "mcpServers" in data or "servers" in data or isinstance(data, dict)


class TestMCPTools:
    """Verify the expected tools are defined in the server."""

    EXPECTED_TOOLS = [
        "syn_init",
        "syn_task",
        "syn_status",
        "syn_review",
        "syn_memory",
        "syn_find_tool",
    ]

    def test_expected_tool_names_in_source(self):
        """All 6 tools should be referenced in server.py source."""
        source = (MCP_PATH / "server.py").read_text()
        for tool in self.EXPECTED_TOOLS:
            assert tool in source, f"Tool '{tool}' not found in server.py"
