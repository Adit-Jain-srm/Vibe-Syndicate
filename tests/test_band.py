"""Tests for the Band agent bridge — event classification, status sync, task pickup."""
import asyncio
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from syndicate_agent.bridge import EventBridge
from syndicate_agent.config import Config
from syndicate_agent.types import EventType, TaskStatus


@pytest.fixture
def config():
    return Config(
        supabase_url="https://test.supabase.co",
        supabase_key="test-key",
    )


@pytest.fixture
def bridge(config):
    return EventBridge(config)


class TestEventClassification:
    def test_nexus_completion(self, bridge):
        result = bridge._classify_event("nexus", "Task complete — merged")
        assert result == EventType.TASK_COMPLETE

    def test_nexus_default(self, bridge):
        result = bridge._classify_event("nexus", "Analyzing the request")
        assert result == EventType.AGENT_JOINED

    def test_architect_plan(self, bridge):
        result = bridge._classify_event("architect", "Plan: decompose into 3 subtasks")
        assert result == EventType.PLAN_CREATED

    def test_architect_thought(self, bridge):
        result = bridge._classify_event("architect", "Looking at the codebase")
        assert result == EventType.AGENT_THOUGHT

    def test_engineer_code(self, bridge):
        result = bridge._classify_event("engineer", "Implementing the function now")
        assert result == EventType.CODE_GENERATED

    def test_reviewer_pass(self, bridge):
        result = bridge._classify_event("reviewer", "LGTM - code looks clean")
        assert result == EventType.REVIEW_PASSED

    def test_reviewer_fail(self, bridge):
        result = bridge._classify_event("reviewer", "Found an issue with error handling")
        assert result == EventType.REVIEW_FAILED

    def test_reviewer_start(self, bridge):
        result = bridge._classify_event("reviewer", "Starting review of the PR")
        assert result == EventType.REVIEW_STARTED

    def test_researcher_thought(self, bridge):
        result = bridge._classify_event("researcher", "Searching for patterns")
        assert result == EventType.AGENT_THOUGHT

    def test_unknown_agent(self, bridge):
        result = bridge._classify_event("unknown", "Some message")
        assert result == EventType.AGENT_THOUGHT


class TestMetricsIntegration:
    def test_metrics_engine_setter(self, bridge):
        mock_engine = MagicMock()
        bridge.set_metrics_engine(mock_engine)
        assert bridge._metrics_engine is mock_engine

    def test_self_improve_setter(self, bridge):
        mock_engine = MagicMock()
        bridge.set_self_improve(mock_engine)
        assert bridge._self_improve is mock_engine


class TestTaskStatusMapping:
    @pytest.mark.asyncio
    async def test_task_created_maps_pending(self, bridge):
        with patch.object(bridge, '_emit_event', new_callable=AsyncMock):
            with patch('httpx.AsyncClient') as mock_client:
                mock_resp = MagicMock()
                mock_resp.status_code = 200
                mock_client.return_value.__aenter__ = AsyncMock(return_value=MagicMock(
                    patch=AsyncMock(return_value=mock_resp)
                ))
                mock_client.return_value.__aexit__ = AsyncMock(return_value=None)
                # Just verify no crash
                await bridge._update_task_status_from_event(EventType.TASK_CREATED, "task_123")

    @pytest.mark.asyncio
    async def test_no_update_without_task_id(self, bridge):
        """Should return early if task_id is empty."""
        await bridge._update_task_status_from_event(EventType.TASK_COMPLETE, "")


class TestBridgeInit:
    def test_headers_set(self, bridge, config):
        assert bridge._headers["apikey"] == config.supabase_key
        assert "Bearer" in bridge._headers["Authorization"]

    def test_initial_state(self, bridge):
        assert bridge._current_task_id is None
        assert bridge._metrics_engine is None
        assert bridge._self_improve is None
