import { useEffect, useState } from 'react';
import { api, Agent } from '../lib/api';

const ROLE_COLORS: Record<string, string> = {
  nexus: '#5e6ad2',
  architect: '#02b8cc',
  engineer: '#27a644',
  reviewer: '#eb5757',
  researcher: '#e4f222',
  qa: '#8a8f98',
};

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    api.getAgents().then(setAgents).catch(() => {});
    const interval = setInterval(() => api.getAgents().then(setAgents).catch(() => {}), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] p-8">
      <h1 className="text-2xl font-medium tracking-tight mb-6">Agent Roster</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <div key={agent.name} className="rounded-xl border border-[#23252a] bg-[#0f1011] p-5 transition-all hover:border-[#5e6ad2]/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ROLE_COLORS[agent.role] || '#8a8f98', opacity: agent.status === 'active' ? 1 : 0.4 }} />
              <span className="font-medium">{agent.name}</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[#8a8f98]">Role: <span className="text-[#f7f8f8]">{agent.role}</span></p>
              <p className="text-xs text-[#8a8f98]">Model: <span className="text-[#f7f8f8] font-mono text-[10px]">{agent.model}</span></p>
              <p className="text-xs text-[#8a8f98]">Status: <span className={agent.status === 'active' ? 'text-[#27a644]' : 'text-[#62666d]'}>{agent.status}</span></p>
            </div>
          </div>
        ))}
        {agents.length === 0 && (
          <p className="text-[#62666d] text-sm col-span-full">Loading agents from Supabase...</p>
        )}
      </div>
    </div>
  );
}
