/**
 * Syndicate API client — HTTP + SSE streaming.
 *
 * HTTP: standard fetch with error handling.
 * SSE: EventSource-based streaming for real-time agent events.
 * All endpoints are relative to /api (proxied by Vite in dev).
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchJSON<T>(path: string): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`);
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
}

export async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
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
  metadata?: Record<string, unknown>;
}

export interface Memory {
  id: string;
  content: string;
  category: string;
  agent: string;
  tags?: string[];
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

// ── SSE streaming ───────────────────────────────────────────────

export type SSECallback = (event: {
  type: string;
  data: Record<string, unknown>;
}) => void;

/**
 * Subscribe to SSE stream for a task. Returns an unsubscribe function.
 *
 * Events:
 *   - connected: stream established
 *   - task_event: real agent event from the swarm
 *   - ping: keepalive
 *   - complete: task finished
 *   - timeout: max duration reached
 */
export function subscribeToTaskEvents(
  taskId: string,
  onEvent: SSECallback,
  onError?: (err: Event) => void,
): () => void {
  const url = `${API_BASE}/events/${taskId}/stream`;
  const source = new EventSource(url);

  const eventTypes = ['connected', 'task_event', 'ping', 'complete', 'timeout'];

  for (const type of eventTypes) {
    source.addEventListener(type, (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        onEvent({ type, data });
      } catch {
        onEvent({ type, data: { raw: e.data } });
      }
    });
  }

  source.onerror = (err) => {
    onError?.(err);
    // Auto-reconnect is built into EventSource
  };

  return () => source.close();
}

// ── API methods ─────────────────────────────────────────────────

export const api = {
  // Agents
  getAgents: () => fetchJSON<Agent[]>('/agents/status'),

  // Tasks
  getTasks: () => fetchJSON<Task[]>('/tasks/'),
  getTask: (id: string) => fetchJSON<Task>(`/tasks/${id}`),
  createTask: (description: string, complexity = 'medium') =>
    postJSON<Task>('/tasks/', { description, complexity }),

  // Events
  getEvents: (taskId: string) => fetchJSON<TaskEvent[]>(`/events/${taskId}`),
  getRecentEvents: () =>
    fetchJSON<{ events: TaskEvent[] }>('/events/recent/all'),

  // Memory
  getMemories: () => fetchJSON<Memory[]>('/memory/'),
  storeMemory: (content: string, category: string) =>
    postJSON('/memory/', { content, category, agent: 'user', tags: [] }),

  // Rooms
  getRooms: () => fetchJSON<{ rooms: Room[] }>('/rooms/'),
  getRoom: (id: string) => fetchJSON<Room>(`/rooms/${id}`),

  // Metrics
  getMetrics: () => fetchJSON<Metrics>('/metrics/'),
  getAgentMetrics: (name: string) => fetchJSON(`/metrics/agents/${name}`),

  // SSE
  subscribeToTask: subscribeToTaskEvents,
};
