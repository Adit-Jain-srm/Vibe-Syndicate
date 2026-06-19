/**
 * Syndicate API client — Supabase direct + Realtime.
 */

import { supabase } from './supabase';
import { formatContent } from './formatContent';

export function normalizeEvent(row: Record<string, unknown>): TaskEvent {
  return {
    id: row.id as string | undefined,
    task_id: row.task_id as string | undefined,
    type: String(row.type ?? 'unknown'),
    agent: String(row.agent ?? 'system'),
    content: formatContent(row.content),
    timestamp: String(row.timestamp ?? row.created_at ?? new Date().toISOString()),
    created_at: row.created_at as string | undefined,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  };
}

// ── Types ───────────────────────────────────────────────────────

export interface Agent {
  name: string;
  role: string;
  status: string;
  model: string;
  band_agent_id?: string;
  description?: string;
}

export interface Task {
  id: string;
  description: string;
  status: string;
  created_at: string;
  complexity?: string;
  plan?: string;
  result?: string;
  agents_involved?: string[];
}

export interface TaskEvent {
  id?: string;
  task_id?: string;
  type: string;
  agent: string;
  content: string;
  timestamp: string;
  created_at?: string;
  metadata?: Record<string, unknown>;
}

export interface Memory {
  id: string;
  content: string;
  category: string;
  agent: string;
  tags?: string[];
  status?: string;
  created_at: string;
}

export interface Room {
  id: string;
  task_id?: string;
  name: string;
  status: string;
  participants: string[];
  created_at: string;
}

export interface Metrics {
  tasks_total: number;
  tasks_completed: number;
  tasks_in_progress: number;
  review_pass_rate: number;
  total_events: number;
  memory_entries: number;
}

export interface TaskMetric {
  id: string;
  task_id: string;
  first_pass_rate: boolean;
  iteration_count: number;
  time_to_complete_seconds: number;
  tokens_used: number;
  agents_involved: string[];
  review_score: number;
  created_at: string;
}

export interface Approval {
  id: string;
  task_id: string;
  type: string;
  status: string;
  title: string;
  description: string;
  context: Record<string, unknown>;
  agent: string;
  risk_level: string;
  decided_by?: string;
  decided_at?: string;
  created_at: string;
}

// ── SSE streaming (legacy interface) ────────────────────────────

export type SSECallback = (event: {
  type: string;
  data: Record<string, unknown>;
}) => void;

export function subscribeToTaskEvents(
  taskId: string,
  onEvent: SSECallback,
  _onError?: (err: Event) => void,
): () => void {
  const channel = supabase
    .channel(`task-events-${taskId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'events', filter: `task_id=eq.${taskId}` },
      (payload) => {
        const row = payload.new as TaskEvent;
        onEvent({ type: row.type || 'task_event', data: row as unknown as Record<string, unknown> });
      },
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ── API methods ─────────────────────────────────────────────────

export const api = {
  // Agents
  getAgents: async (): Promise<Agent[]> => {
    const { data, error } = await supabase.from('agents').select('*');
    if (error) throw error;
    return data || [];
  },

  isSwarmOnline: async (): Promise<boolean> => {
    const { data } = await supabase.from('agents').select('status,last_seen');
    if (!data || data.length === 0) return false;
    const now = Date.now();
    const STALE_THRESHOLD_MS = 90_000;
    return data.some((a: { status: string; last_seen?: string }) => {
      if (a.status === 'active') return true;
      if (!a.last_seen) return false;
      const seenAt = new Date(a.last_seen).getTime();
      return (now - seenAt) < STALE_THRESHOLD_MS;
    });
  },

  // Tasks
  getTasks: async (): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('tasks').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return data || [];
  },

  getTask: async (id: string): Promise<Task> => {
    const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  createTask: async (description: string, complexity = 'medium'): Promise<Task> => {
    const id = crypto.randomUUID();
    const task = { id, description, status: 'pending', complexity, created_at: new Date().toISOString() };
    const { data, error } = await supabase.from('tasks').insert(task).select().single();
    if (error) throw error;
    await supabase.from('events').insert({
      task_id: id, type: 'task_created', agent: 'system',
      content: `Task submitted: ${description}`, metadata: { complexity },
    });
    return data;
  },

  // Events
  getEvents: async (taskId: string): Promise<TaskEvent[]> => {
    const { data, error } = await supabase
      .from('events').select('*').eq('task_id', taskId).order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map((row) => normalizeEvent(row as Record<string, unknown>));
  },

  getRecentEvents: async (): Promise<TaskEvent[]> => {
    const { data, error } = await supabase
      .from('events').select('*').order('created_at', { ascending: false }).limit(20);
    if (error) throw error;
    return (data || []).map((row) => normalizeEvent(row as Record<string, unknown>));
  },

  // Memory
  getMemories: async (): Promise<Memory[]> => {
    const { data, error } = await supabase
      .from('memory').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return data || [];
  },

  storeMemory: async (content: string, category: string): Promise<void> => {
    const { error } = await supabase.from('memory').insert({
      content, category, agent: 'user', tags: [], status: 'active',
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
  },

  // Rooms
  getRooms: async (): Promise<{ rooms: Room[] }> => {
    const { data, error } = await supabase
      .from('rooms').select('*').order('created_at', { ascending: false }).limit(20);
    if (error) return { rooms: [] };
    return { rooms: data || [] };
  },

  getRoom: async (id: string): Promise<Room | null> => {
    const { data, error } = await supabase.from('rooms').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },

  // Metrics
  getMetrics: async (): Promise<Metrics> => {
    const [tasks, events, memories, taskMetrics] = await Promise.all([
      supabase.from('tasks').select('status', { count: 'exact' }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('memory').select('*', { count: 'exact', head: true }),
      supabase.from('task_metrics').select('first_pass_rate'),
    ]);
    const taskData = tasks.data || [];
    const completed = taskData.filter((t: { status: string }) => t.status === 'complete').length;
    const inProgress = taskData.filter((t: { status: string }) => t.status === 'in_progress').length;
    const metricsData = taskMetrics.data || [];
    const passRate = metricsData.length > 0
      ? metricsData.filter((m: { first_pass_rate: boolean }) => m.first_pass_rate).length / metricsData.length
      : 0;
    return {
      tasks_total: taskData.length,
      tasks_completed: completed,
      tasks_in_progress: inProgress,
      review_pass_rate: passRate,
      total_events: events.count || 0,
      memory_entries: memories.count || 0,
    };
  },

  getTaskMetrics: async (): Promise<TaskMetric[]> => {
    const { data, error } = await supabase
      .from('task_metrics').select('*').order('created_at', { ascending: true });
    if (error) return [];
    return data || [];
  },

  // Approvals
  getApprovals: async (): Promise<Approval[]> => {
    const { data, error } = await supabase
      .from('approvals').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  },

  resolveApproval: async (id: string, decision: 'approved' | 'rejected'): Promise<void> => {
    const { error } = await supabase
      .from('approvals')
      .update({ status: decision, decided_by: 'user', decided_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  getAgentMetrics: async (name: string) => {
    const { data: events } = await supabase
      .from('events').select('type').eq('agent', name.toLowerCase());
    const { data: metrics } = await supabase
      .from('task_metrics').select('review_score,agents_involved');
    const agentMetrics = (metrics || []).filter(
      (m: { agents_involved: string[] }) => (m.agents_involved || []).includes(name.toLowerCase())
    );
    const avgScore = agentMetrics.length > 0
      ? agentMetrics.reduce((s: number, m: { review_score: number }) => s + m.review_score, 0) / agentMetrics.length
      : 0;
    return {
      tasks_completed: agentMetrics.length,
      avg_review_score: Math.round(avgScore * 100) / 100,
      total_events: (events || []).length,
    };
  },

  subscribeToTask: subscribeToTaskEvents,
};
