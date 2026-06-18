"""Tests for the MetricsEngine — computation logic and storage."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from syndicate_agent.metrics import MetricsEngine
from syndicate_agent.config import Config


@pytest.fixture
def config():
    return Config(
        supabase_url="https://test.supabase.co",
        supabase_key="test-key",
    )


@pytest.fixture
def engine(config):
    return MetricsEngine(config)


class TestMetricsComputation:
    @pytest.mark.asyncio
    async def test_empty_events_returns_empty(self, engine):
        with patch.object(engine, '_fetch_events', new_callable=AsyncMock, return_value=[]):
            result = await engine.compute_and_store("task_123")
            assert result == {}

    @pytest.mark.asyncio
    async def test_first_pass_success(self, engine):
        events = [
            {"type": "task_created", "agent": "system", "created_at": "2026-06-18T10:00:00Z"},
            {"type": "plan_created", "agent": "architect", "created_at": "2026-06-18T10:00:05Z"},
            {"type": "code_generated", "agent": "engineer", "created_at": "2026-06-18T10:00:15Z"},
            {"type": "review_passed", "agent": "reviewer", "created_at": "2026-06-18T10:00:20Z"},
            {"type": "task_complete", "agent": "nexus", "created_at": "2026-06-18T10:00:25Z"},
        ]
        with patch.object(engine, '_fetch_events', new_callable=AsyncMock, return_value=events):
            with patch.object(engine, '_store_metrics', new_callable=AsyncMock):
                result = await engine.compute_and_store("task_123")
                assert result["first_pass_rate"] is True
                assert result["iteration_count"] == 1
                assert result["review_score"] == 1.0
                assert result["time_to_complete_seconds"] == 25.0

    @pytest.mark.asyncio
    async def test_review_failed_lowers_score(self, engine):
        events = [
            {"type": "task_created", "agent": "system", "created_at": "2026-06-18T10:00:00Z"},
            {"type": "code_generated", "agent": "engineer", "created_at": "2026-06-18T10:00:10Z"},
            {"type": "review_failed", "agent": "reviewer", "created_at": "2026-06-18T10:00:15Z"},
            {"type": "code_generated", "agent": "engineer", "created_at": "2026-06-18T10:00:20Z"},
            {"type": "review_passed", "agent": "reviewer", "created_at": "2026-06-18T10:00:25Z"},
            {"type": "task_complete", "agent": "nexus", "created_at": "2026-06-18T10:00:30Z"},
        ]
        with patch.object(engine, '_fetch_events', new_callable=AsyncMock, return_value=events):
            with patch.object(engine, '_store_metrics', new_callable=AsyncMock):
                result = await engine.compute_and_store("task_456")
                assert result["first_pass_rate"] is False
                assert result["iteration_count"] == 2
                assert result["review_score"] == 0.5

    @pytest.mark.asyncio
    async def test_agents_involved_deduplicated(self, engine):
        events = [
            {"type": "task_created", "agent": "system", "created_at": "2026-06-18T10:00:00Z"},
            {"type": "plan_created", "agent": "architect", "created_at": "2026-06-18T10:00:05Z"},
            {"type": "code_generated", "agent": "engineer", "created_at": "2026-06-18T10:00:10Z"},
            {"type": "review_passed", "agent": "reviewer", "created_at": "2026-06-18T10:00:15Z"},
            {"type": "task_complete", "agent": "nexus", "created_at": "2026-06-18T10:00:20Z"},
        ]
        with patch.object(engine, '_fetch_events', new_callable=AsyncMock, return_value=events):
            with patch.object(engine, '_store_metrics', new_callable=AsyncMock):
                result = await engine.compute_and_store("task_789")
                assert "system" in result["agents_involved"]
                assert "architect" in result["agents_involved"]
                assert "engineer" in result["agents_involved"]


class TestRollingAverages:
    @pytest.mark.asyncio
    async def test_empty_metrics(self, engine):
        with patch.object(engine, 'get_all_metrics', new_callable=AsyncMock, return_value=[]):
            result = await engine.get_rolling_averages()
            assert result["first_pass_rate"] == 0

    @pytest.mark.asyncio
    async def test_perfect_pass_rate(self, engine):
        metrics = [
            {"first_pass_rate": True, "iteration_count": 1, "time_to_complete_seconds": 20},
            {"first_pass_rate": True, "iteration_count": 1, "time_to_complete_seconds": 15},
        ]
        with patch.object(engine, 'get_all_metrics', new_callable=AsyncMock, return_value=metrics):
            result = await engine.get_rolling_averages(window=5)
            assert result["first_pass_rate"] == 1.0
            assert result["avg_iterations"] == 1.0
