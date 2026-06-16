const API_BASE = '/api';

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

export interface Agent {
  name: string;
  role: string;
  status: string;
  model: string;
}

export interface Task {
  id: string;
  description: string;
  status: string;
  created_at: string;
  plan?: string;
}

export interface Event {
  id: string;
  task_id: string;
  type: string;
  agent: string;
  content: string;
  created_at: string;
}

export interface Memory {
  id: string;
  content: string;
  category: string;
  agent: string;
  created_at: string;
}

export const api = {
  getAgents: () => fetchJSON<Agent[]>('/agents/status'),
  getTasks: () => fetchJSON<Task[]>('/tasks/'),
  getTask: (id: string) => fetchJSON<Task>(`/tasks/${id}`),
  createTask: (description: string, complexity = 'medium') =>
    postJSON<Task>('/tasks/', { description, complexity }),
  getEvents: (taskId: string) => fetchJSON<Event[]>(`/events/${taskId}`),
  getMemories: () => fetchJSON<Memory[]>('/memory/'),
  storeMemory: (content: string, category: string) =>
    postJSON('/memory/', { content, category, agent: 'user', tags: [] }),
};
