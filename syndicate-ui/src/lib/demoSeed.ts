/**
 * Demo seed data — creates impressive pre-populated task history
 * so first-time visitors don't see an empty dashboard.
 */
import { supabase } from './supabase';

const SEED_TASKS = [
  {
    description: 'Add rate limiter middleware to the API with sliding window algorithm',
    events: [
      { type: 'task_created', agent: 'system', content: 'Task submitted: Add rate limiter middleware' },
      { type: 'agent_joined', agent: 'nexus', content: 'Nexus analyzing task complexity — routing to Architect' },
      { type: 'plan_created', agent: 'architect', content: 'Plan: 1) Define rate limit config schema 2) Implement sliding window counter with Redis 3) Create middleware wrapper 4) Add per-route configuration' },
      { type: 'code_generated', agent: 'engineer', content: 'Implementation complete: RateLimiter class with sliding window, configurable per-route limits, Redis-backed counters with automatic key expiry' },
      { type: 'review_passed', agent: 'reviewer', content: 'Review PASSED (risk: low). Clean implementation. Token bucket fallback for Redis failures. Good edge case handling for clock drift.' },
      { type: 'task_complete', agent: 'nexus', content: 'Task complete: Rate limiter middleware implemented with sliding window algorithm and Redis backing store' },
    ],
  },
  {
    description: 'Implement JWT authentication with refresh token rotation',
    events: [
      { type: 'task_created', agent: 'system', content: 'Task submitted: Implement JWT auth with refresh rotation' },
      { type: 'agent_joined', agent: 'nexus', content: 'Complex task detected — recruiting full swarm' },
      { type: 'plan_created', agent: 'architect', content: 'Plan: 1) JWT signing/verification service 2) Refresh token model with family tracking 3) Rotation logic with reuse detection 4) Auth middleware 5) Logout/revoke endpoints' },
      { type: 'code_generated', agent: 'engineer', content: 'Full auth system: access tokens (15m), refresh tokens (7d), automatic rotation on refresh, family-based reuse detection that invalidates all tokens on theft detection' },
      { type: 'review_passed', agent: 'reviewer', content: 'Review PASSED (risk: medium). Strong security model. Noted: token family tracking prevents refresh token theft escalation. Suggested: add rate limiting on refresh endpoint.' },
      { type: 'task_complete', agent: 'nexus', content: 'Task complete: JWT auth with refresh rotation, reuse detection, and family-based invalidation' },
    ],
  },
  {
    description: 'Build webhook delivery system with exponential backoff retries',
    events: [
      { type: 'task_created', agent: 'system', content: 'Task submitted: Build webhook system with retries' },
      { type: 'plan_created', agent: 'architect', content: 'Plan: 1) Webhook registration API 2) Event queue with persistence 3) Delivery worker with exp backoff 4) HMAC signature verification 5) Dead letter queue for failed deliveries' },
      { type: 'code_generated', agent: 'engineer', content: 'Webhook system: PostgreSQL-backed queue, configurable retry schedule (1s, 30s, 5m, 1h, 24h), HMAC-SHA256 signatures, delivery attempt logging, dead letter after 5 failures' },
      { type: 'review_passed', agent: 'reviewer', content: 'Review PASSED (risk: low). Solid retry strategy. HMAC signing prevents replay attacks. Dead letter queue prevents infinite loops.' },
      { type: 'task_complete', agent: 'nexus', content: 'Task complete: Production-grade webhook system with retry backoff and dead letter queue' },
    ],
  },
  {
    description: 'Add OpenTelemetry distributed tracing across all microservices',
    events: [
      { type: 'task_created', agent: 'system', content: 'Task submitted: Add distributed tracing with OpenTelemetry' },
      { type: 'agent_joined', agent: 'nexus', content: 'Researcher needed for OTel best practices' },
      { type: 'agent_thought', agent: 'researcher', content: 'Research: OpenTelemetry SDK auto-instrumentation covers HTTP, gRPC, DB queries. Manual spans needed for business logic. Jaeger or Grafana Tempo as backend.' },
      { type: 'plan_created', agent: 'architect', content: 'Plan: 1) OTel SDK initialization with auto-instrumentation 2) Custom span decorators for business operations 3) Trace context propagation headers 4) Grafana Tempo exporter config' },
      { type: 'code_generated', agent: 'engineer', content: 'Full OTel integration: auto-instrumentation for FastAPI/httpx/asyncpg, custom @traced decorator for business logic, W3C trace-context propagation, Tempo OTLP exporter' },
      { type: 'review_passed', agent: 'reviewer', content: 'Review PASSED (risk: low). Comprehensive instrumentation. Trace sampling at 10% for production load. Custom attributes on spans for debugging.' },
      { type: 'task_complete', agent: 'nexus', content: 'Task complete: Distributed tracing with auto-instrumentation and custom business spans' },
    ],
  },
];

export async function seedDemoData(): Promise<boolean> {
  const { count } = await supabase.from('tasks').select('id', { count: 'exact', head: true });
  if ((count || 0) >= 3) return false;

  for (const seed of SEED_TASKS) {
    const taskId = crypto.randomUUID();
    const baseTime = Date.now() - Math.random() * 86400000;

    await supabase.from('tasks').insert({
      id: taskId,
      description: seed.description,
      status: 'complete',
      complexity: 'medium',
      result: seed.events[seed.events.length - 1].content,
      created_at: new Date(baseTime).toISOString(),
    });

    for (let i = 0; i < seed.events.length; i++) {
      const evt = seed.events[i];
      await supabase.from('events').insert({
        task_id: taskId,
        type: evt.type,
        agent: evt.agent,
        content: evt.content,
        metadata: { source: 'seed' },
        created_at: new Date(baseTime + (i + 1) * 3000).toISOString(),
      });
    }
  }

  await supabase.from('task_metrics').insert(
    SEED_TASKS.map(() => ({
      task_id: crypto.randomUUID(),
      first_pass_rate: Math.random() > 0.3,
      iteration_count: Math.floor(Math.random() * 3) + 1,
      time_to_complete_seconds: Math.floor(Math.random() * 60) + 15,
      tokens_used: Math.floor(Math.random() * 5000) + 1000,
      agents_involved: ['nexus', 'architect', 'engineer', 'reviewer'],
      review_score: Math.random() * 0.4 + 0.6,
    }))
  );

  return true;
}
