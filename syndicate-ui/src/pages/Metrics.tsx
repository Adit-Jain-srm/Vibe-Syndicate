import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import CountUp from '../components/effects/CountUp';

interface TaskMetric {
  id: string;
  status: string;
  created_at: string;
}

export default function Metrics() {
  const [tasks, setTasks] = useState<TaskMetric[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('tasks').select('id,status,created_at').then(({ data }) => setTasks(data || []));
    supabase.from('events').select('type,agent,created_at').then(({ data }) => setEvents(data || []));
    supabase.from('memory').select('category,agent,created_at').order('created_at', { ascending: false }).limit(50).then(({ data }) => setMemories(data || []));
  }, []);

  const completed = tasks.filter(t => t.status === 'complete').length;
  const passRate = events.length > 0
    ? Math.round((events.filter(e => e.type === 'review_passed').length / Math.max(events.filter(e => e.type === 'review_passed' || e.type === 'review_failed').length, 1)) * 100)
    : 0;
  const totalEvents = events.length;
  const totalMemories = memories.length;
  const agentActivity = ['nexus', 'architect', 'engineer', 'reviewer', 'researcher', 'qa'].map(role => ({
    role,
    events: events.filter(e => e.agent === role).length,
  }));

  return (
    <div className="min-h-screen p-8">
      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl mb-2" style={{ fontFamily: 'var(--font-display)' }}>
        Metrics
      </motion.h1>
      <p className="text-[var(--color-subtle)] mb-8">Quantified improvement — compound intelligence measured</p>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Tasks Complete', value: completed, color: '#34d399' },
          { label: 'Review Pass Rate', value: passRate, suffix: '%', color: '#6b62f2' },
          { label: 'Total Events', value: totalEvents, color: '#06b6d4' },
          { label: 'Memories Stored', value: totalMemories, color: '#fbbf24' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-2xl"
          >
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-2">{kpi.label}</p>
            <CountUp end={kpi.value} suffix={kpi.suffix} className="text-3xl font-light" duration={1500} />
          </motion.div>
        ))}
      </div>

      {/* Agent Activity */}
      <div className="glass p-6 rounded-2xl mb-8">
        <h2 className="text-sm font-medium text-[var(--color-dim)] uppercase tracking-wider mb-4">Agent Activity Distribution</h2>
        <div className="space-y-3">
          {agentActivity.map((agent, i) => {
            const max = Math.max(...agentActivity.map(a => a.events), 1);
            const pct = (agent.events / max) * 100;
            const colors: Record<string, string> = { nexus: '#6b62f2', architect: '#06b6d4', engineer: '#34d399', reviewer: '#fb7185', researcher: '#fbbf24', qa: '#8b5cf6' };
            return (
              <motion.div key={agent.role} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium capitalize text-[var(--color-bright)]">{agent.role}</span>
                  <span className="text-xs text-[var(--color-muted)] font-mono">{agent.events}</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--color-surface)] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: colors[agent.role] || '#6b62f2' }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Improvement indicator */}
      <div className="glass p-6 rounded-2xl">
        <h2 className="text-sm font-medium text-[var(--color-dim)] uppercase tracking-wider mb-4">Self-Improvement Status</h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.1)', border: '2px solid rgba(52,211,153,0.3)' }}>
            <span className="text-2xl font-light text-[var(--color-emerald)]">{passRate}%</span>
          </div>
          <div>
            <p className="text-sm text-[var(--color-bright)]">Review first-pass rate</p>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              {passRate >= 80 ? 'Excellent — skills are well-calibrated' :
               passRate >= 60 ? 'Good — improving with each cycle' :
               'Learning — more tasks will improve accuracy'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
