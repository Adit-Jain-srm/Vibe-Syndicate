/**
 * Demo data — realistic tasks, events, and memories pre-seeded
 * so the dashboard looks alive even without the backend running.
 */

import type { Agent, Task, TaskEvent, Memory } from './api';

export const DEMO_AGENTS: Agent[] = [
  { name: 'Nexus', role: 'nexus', status: 'active', model: 'gemini-2.5-flash', description: 'Conductor' },
  { name: 'Architect', role: 'architect', status: 'idle', model: 'gemini-2.5-flash', description: 'Planner' },
  { name: 'Engineer', role: 'engineer', status: 'active', model: 'gemini-2.5-flash', description: 'Coder' },
  { name: 'Reviewer', role: 'reviewer', status: 'idle', model: 'gpt-4o', description: 'Quality Gate' },
  { name: 'Researcher', role: 'researcher', status: 'idle', model: 'gemini-2.5-flash', description: 'Discovery' },
  { name: 'QA', role: 'qa', status: 'idle', model: 'gemini-2.5-flash', description: 'Validator' },
];

export const DEMO_TASKS: Task[] = [
  { id: 'task_a7f3b2c1e9d4', description: 'Add rate limiter middleware to API endpoints', status: 'complete', created_at: '2026-06-16T14:30:00Z', plan: '3 subtasks: token bucket impl, middleware integration, tests' },
  { id: 'task_e2b8c4d1f5a6', description: 'Implement WebSocket real-time event streaming', status: 'in_progress', created_at: '2026-06-16T16:00:00Z' },
  { id: 'task_c1d9e3f2a4b7', description: 'Add dark mode persistence to user preferences', status: 'reviewing', created_at: '2026-06-16T18:00:00Z' },
  { id: 'task_f4a5b6c7d8e9', description: 'Optimize database queries for memory retrieval', status: 'pending', created_at: '2026-06-16T20:00:00Z' },
];

export const DEMO_EVENTS: TaskEvent[] = [
  { type: 'task_created', agent: 'system', content: 'Task submitted: Add rate limiter middleware', timestamp: '2026-06-16T14:30:01Z' },
  { type: 'agent_joined', agent: 'nexus', content: 'Nexus analyzing task complexity — medium (3 files)', timestamp: '2026-06-16T14:30:05Z' },
  { type: 'agent_joined', agent: 'architect', content: 'Architect invited to decompose task', timestamp: '2026-06-16T14:30:30Z' },
  { type: 'plan_created', agent: 'architect', content: 'Plan: 1) Token bucket algorithm 2) Express middleware wrapper 3) Rate limit config + tests', timestamp: '2026-06-16T14:31:00Z' },
  { type: 'agent_joined', agent: 'engineer', content: 'Engineer assigned to implement subtasks', timestamp: '2026-06-16T14:31:30Z' },
  { type: 'code_generated', agent: 'engineer', content: 'Implementation complete — token bucket with configurable limits, sliding window, per-IP tracking', timestamp: '2026-06-16T14:35:00Z' },
  { type: 'agent_joined', agent: 'reviewer', content: 'Reviewer (GPT-4o) invited for cross-model adversarial review', timestamp: '2026-06-16T14:35:30Z' },
  { type: 'review_passed', agent: 'reviewer', content: 'Review PASSED (risk: low). Clean implementation with proper error handling. Edge case: concurrent requests handled correctly.', timestamp: '2026-06-16T14:37:00Z' },
  { type: 'task_complete', agent: 'nexus', content: 'Task complete. All subtasks implemented, reviewed, and validated.', timestamp: '2026-06-16T14:38:00Z' },
  { type: 'memory_stored', agent: 'nexus', content: 'Lesson: Token bucket pattern preferred over fixed window for rate limiting', timestamp: '2026-06-16T14:38:30Z' },
];

export const DEMO_MEMORIES: Memory[] = [
  { id: 'mem_001', content: 'Always use token bucket over fixed window for rate limiting — handles bursts better', category: 'project', agent: 'engineer', created_at: '2026-06-16T14:38:00Z' },
  { id: 'mem_002', content: 'Reviewer catches edge cases in concurrent access patterns that Engineer misses — cross-model review working', category: 'agent_learning', agent: 'nexus', created_at: '2026-06-16T14:39:00Z' },
  { id: 'mem_003', content: 'Use async/await with try/catch for all external API calls — never let unhandled rejections propagate', category: 'project', agent: 'reviewer', created_at: '2026-06-15T10:00:00Z' },
  { id: 'mem_004', content: 'Architect plans with 3-4 subtasks produce cleanest review outcomes — more granular = more merge conflicts', category: 'agent_learning', agent: 'architect', created_at: '2026-06-15T08:00:00Z' },
  { id: 'mem_005', content: 'Naming convention: camelCase for functions, PascalCase for components/classes, snake_case for DB columns', category: 'project', agent: 'system', created_at: '2026-06-14T12:00:00Z' },
];
