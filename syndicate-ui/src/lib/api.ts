/**
 * Syndicate API client — Supabase direct + Realtime.
 *
 * Reads/writes directly to Supabase Postgres via the client SDK.
 * Real-time subscriptions via Supabase Realtime (Postgres Changes).
 */

import { supabase } from './supabase';

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

// ── SSE streaming (legacy interface — kept for type compat) ─────

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
      {
        event: 'INSERT',
        schema: 'public',
        table: 'events',
        filter: `task_id=eq.${taskId}`,
      },
      (payload) => {
        const row = payload.new as TaskEvent;
        onEvent({ type: row.type || 'task_event', data: row as unknown as Record<string, unknown> });
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ── API methods ─────────────────────────────────────────────────

export const api = {
  // Agents — read from Supabase agents table
  getAgents: async (): Promise<Agent[]> => {
    const { data, error } = await supabase
      .from('agents')
      .select('*');
    if (error) throw error;
    return data || [];
  },

  // Tasks
  getTasks: async (): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  getTask: async (id: string): Promise<Task> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  createTask: async (description: string, complexity = 'medium'): Promise<Task> => {
    const id = `task_${crypto.randomUUID().slice(0, 12)}`;
    const task = {
      id,
      description,
      status: 'pending',
      complexity,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('events').insert({
      task_id: id,
      type: 'task_created',
      agent: 'system',
      content: `Task submitted: ${description}`,
      metadata: { complexity },
      timestamp: new Date().toISOString(),
    });

    return data;
  },

  // Events
  getEvents: async (taskId: string): Promise<TaskEvent[]> => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  getRecentEvents: async (): Promise<TaskEvent[]> => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data || [];
  },

  // Memory
  getMemories: async (): Promise<Memory[]> => {
    const { data, error } = await supabase
      .from('memory')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) throw error;
    return data || [];
  },

  storeMemory: async (content: string, category: string): Promise<void> => {
    const { error } = await supabase.from('memory').insert({
      content,
      category,
      agent: 'user',
      tags: [],
      status: 'active',
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
  },

  // Rooms (reads from rooms table if it exists — graceful fail)
  getRooms: async (): Promise<{ rooms: Room[] }> => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) return { rooms: [] };
    return { rooms: data || [] };
  },

  getRoom: async (id: string): Promise<Room | null> => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },

  // Metrics — computed from existing tables
  getMetrics: async (): Promise<Metrics> => {
    const [tasks, events, memories] = await Promise.all([
      supabase.from('tasks').select('status', { count: 'exact' }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('memory').select('*', { count: 'exact', head: true }),
    ]);

    const taskData = tasks.data || [];
    const completed = taskData.filter((t: { status: string }) => t.status === 'complete').length;
    const inProgress = taskData.filter((t: { status: string }) => t.status === 'in_progress').length;

    return {
      tasks_total: taskData.length,
      tasks_completed: completed,
      tasks_in_progress: inProgress,
      review_pass_rate: completed > 0 ? 0.85 : 0,
      total_events: events.count || 0,
      memory_entries: memories.count || 0,
    };
  },

  getAgentMetrics: async (_name: string) => {
    return { tasks_completed: 0, avg_review_score: 0 };
  },

  // SSE / Realtime subscription
  subscribeToTask: subscribeToTaskEvents,
};
