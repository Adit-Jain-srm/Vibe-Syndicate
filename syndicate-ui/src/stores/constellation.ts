import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type AgentStatus = 'idle' | 'active' | 'offline';

export interface ConstellationAgent {
  role: string;
  status: AgentStatus;
  color: string;
  position: [number, number, number];
}

export interface TaskPulse {
  id: string;
  from: string;
  to: string;
  progress: number;
  color: string;
}

export interface ConstellationState {
  agents: ConstellationAgent[];
  pulses: TaskPulse[];
  memoryCount: number;
  pendingApprovals: number;
  systemHealth: 'healthy' | 'degraded' | 'paused';
  cameraTarget: string;

  setAgentStatus: (role: string, status: AgentStatus) => void;
  addPulse: (from: string, to: string) => void;
  removePulse: (id: string) => void;
  incrementMemory: () => void;
  setPendingApprovals: (count: number) => void;
  setCameraTarget: (target: string) => void;
  initRealtimeSubscriptions: () => () => void;
}

const AGENT_POSITIONS: Record<string, [number, number, number]> = {
  nexus: [0, 0, 0],
  architect: [-3, 1, 2],
  engineer: [3, 0, 2],
  reviewer: [-2, -1, -3],
  researcher: [4, 1, -2],
  qa: [-1, -2, -2],
};

const AGENT_COLORS: Record<string, string> = {
  nexus: '#6366f1',
  architect: '#06b6d4',
  engineer: '#34d399',
  reviewer: '#fb7185',
  researcher: '#fbbf24',
  qa: '#8b5cf6',
};

const ROLE_ORDER = ['nexus', 'architect', 'engineer', 'reviewer', 'researcher', 'qa'];

export const useConstellationStore = create<ConstellationState>((set, get) => ({
  agents: ROLE_ORDER.map(role => ({
    role,
    status: 'idle' as AgentStatus,
    color: AGENT_COLORS[role],
    position: AGENT_POSITIONS[role],
  })),
  pulses: [],
  memoryCount: 0,
  pendingApprovals: 0,
  systemHealth: 'healthy',
  cameraTarget: 'dashboard',

  setAgentStatus: (role, status) =>
    set(state => ({
      agents: state.agents.map(a => a.role === role ? { ...a, status } : a),
    })),

  addPulse: (from, to) => {
    const id = `${from}-${to}-${Date.now()}`;
    set(state => ({
      pulses: [...state.pulses, { id, from, to, progress: 0, color: AGENT_COLORS[from] || '#6366f1' }],
    }));
    setTimeout(() => get().removePulse(id), 2000);
  },

  removePulse: (id) =>
    set(state => ({ pulses: state.pulses.filter(p => p.id !== id) })),

  incrementMemory: () =>
    set(state => ({ memoryCount: state.memoryCount + 1 })),

  setPendingApprovals: (count) =>
    set({ pendingApprovals: count, systemHealth: count > 0 ? 'paused' : 'healthy' }),

  setCameraTarget: (target) => set({ cameraTarget: target }),

  initRealtimeSubscriptions: () => {
    const channels: ReturnType<typeof supabase.channel>[] = [];

    const agentCh = supabase.channel('constellation-agents')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'agents' }, (payload) => {
        const { role, status } = payload.new as { role: string; status: string };
        get().setAgentStatus(role, (status === 'active' ? 'active' : 'idle') as AgentStatus);
      })
      .subscribe();
    channels.push(agentCh);

    const eventCh = supabase.channel('constellation-events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, (payload) => {
        const evt = payload.new as { type: string; agent: string };
        const routeMap: Record<string, string> = {
          plan_created: 'architect',
          code_generated: 'engineer',
          review_passed: 'reviewer',
          review_failed: 'reviewer',
          task_complete: 'nexus',
        };
        const target = routeMap[evt.type];
        if (target && evt.agent !== target) {
          get().addPulse(evt.agent, target);
        }
      })
      .subscribe();
    channels.push(eventCh);

    const memoryCh = supabase.channel('constellation-memory')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'memory' }, () => {
        get().incrementMemory();
      })
      .subscribe();
    channels.push(memoryCh);

    const approvalCh = supabase.channel('constellation-approvals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approvals' }, () => {
        supabase.from('approvals').select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .then(({ count }) => get().setPendingApprovals(count || 0));
      })
      .subscribe();
    channels.push(approvalCh);

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  },
}));
