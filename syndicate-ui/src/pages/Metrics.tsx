import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, Zap, Clock, Users } from 'lucide-react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { TaskMetric } from '../lib/api';
import CountUp from '../components/effects/CountUp';
import PageTransition from '../components/ui/PageTransition';
import GlassPanel from '../components/ui/GlassPanel';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import SkeletonLoader from '../components/ui/SkeletonLoader';

const AGENT_COLORS: Record<string, string> = {
  nexus: '#6b62f2',
  architect: '#06b6d4',
  engineer: '#34d399',
  reviewer: '#fb7185',
  researcher: '#fbbf24',
  qa: '#8b5cf6',
};

export default function Metrics() {
  const [taskMetrics, setTaskMetrics] = useState<TaskMetric[]>([]);
  const [events, setEvents] = useState<{ type: string; agent: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getTaskMetrics(),
      supabase.from('events').select('type,agent').then(({ data }) => data || []),
    ]).then(([metrics, evts]) => {
      setTaskMetrics(metrics);
      setEvents(evts);
      setLoading(false);
    }).catch(() => setLoading(false));

    const ch = supabase.channel('metrics-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'task_metrics' }, () => {
        api.getTaskMetrics().then(setTaskMetrics);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const completed = taskMetrics.length;
  const passRate = completed > 0 ? Math.round((taskMetrics.filter(m => m.first_pass_rate).length / completed) * 100) : 0;
  const avgIter = completed > 0 ? +(taskMetrics.reduce((s, m) => s + m.iteration_count, 0) / completed).toFixed(1) : 0;
  const avgTime = completed > 0 ? Math.round(taskMetrics.reduce((s, m) => s + m.time_to_complete_seconds, 0) / completed) : 0;
  const agentAct = ['nexus', 'architect', 'engineer', 'reviewer', 'researcher', 'qa'].map(r => ({
    role: r, count: events.filter(e => e.agent === r).length,
  }));

  const rollingPassRate = (windowSize: number): number[] => {
    if (taskMetrics.length < windowSize) return [];
    const rates: number[] = [];
    for (let i = windowSize - 1; i < taskMetrics.length; i++) {
      const window = taskMetrics.slice(i - windowSize + 1, i + 1);
      const passes = window.filter(m => m.first_pass_rate).length;
      rates.push(Math.round((passes / windowSize) * 100));
    }
    return rates;
  };

  const improvementData = rollingPassRate(3);

  return (
    <PageTransition>
      <div className="min-h-screen p-8 max-w-[1200px]">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3">
            <BarChart3 size={20} className="text-accent" />
            <h1 className="text-2xl font-light tracking-tight text-snow">Metrics</h1>
          </div>
          <p className="text-sm text-slate mt-1">Quantified improvement — compound intelligence measured</p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonLoader key={i} variant="card" />)}
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { l: 'Tasks Complete', v: completed, icon: Zap, c: '#34d399' },
                { l: 'First-Pass Rate', v: passRate, s: '%', icon: TrendingUp, c: '#6b62f2' },
                { l: 'Avg Iterations', v: avgIter, icon: BarChart3, c: '#06b6d4' },
                { l: 'Avg Time (s)', v: avgTime, icon: Clock, c: '#fbbf24' },
              ].map((k, i) => (
                <motion.div key={k.l} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}>
                  <GlassPanel className="p-6">
                    <div className="flex items-center gap-1.5 mb-2">
                      <k.icon size={11} style={{ color: k.c }} />
                      <p className="text-[10px] uppercase tracking-wider text-slate">{k.l}</p>
                    </div>
                    <CountUp end={k.v} suffix={k.s} className="text-3xl font-light" style={{ color: k.c }} duration={1500} />
                  </GlassPanel>
                </motion.div>
              ))}
            </div>

            {/* Improvement Trend (Rolling Pass Rate) */}
            {improvementData.length > 1 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <GlassPanel className="p-6 mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={14} className="text-emerald" />
                    <h2 className="text-sm font-medium text-fog uppercase tracking-wider">Self-Improvement Trend</h2>
                    <span className="text-[9px] text-slate ml-auto">Rolling 3-task first-pass rate</span>
                  </div>
                  <div className="flex items-end gap-1 h-24">
                    {improvementData.map((rate, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(rate, 5)}%` }}
                        transition={{ delay: 0.4 + i * 0.04, duration: 0.5 }}
                        className="flex-1 rounded-t-sm min-w-[6px]"
                        style={{ background: rate >= 70 ? '#34d399' : rate >= 50 ? '#fbbf24' : '#fb7185' }}
                        title={`${rate}%`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[9px] text-slate">Session Start</span>
                    <span className="text-[9px] text-slate">Now ({improvementData[improvementData.length - 1]}%)</span>
                  </div>
                </GlassPanel>
              </motion.div>
            )}

            {/* Review Score Trend */}
            {taskMetrics.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <GlassPanel className="p-6 mb-8">
                  <h2 className="text-sm font-medium text-fog uppercase tracking-wider mb-4">Review Score Per Task</h2>
                  <div className="flex items-end gap-1 h-32">
                    {taskMetrics.slice(-20).map((m, i) => (
                      <motion.div
                        key={m.id}
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(m.review_score * 100, 5)}%` }}
                        transition={{ delay: 0.5 + i * 0.04, duration: 0.5 }}
                        className="flex-1 rounded-t-sm min-w-[8px] cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ background: m.first_pass_rate ? '#34d399' : '#fbbf24' }}
                        title={`Score: ${(m.review_score * 100).toFixed(0)}% | ${m.first_pass_rate ? 'First pass' : 'Needed iterations'}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[9px] text-slate">Oldest</span>
                    <div className="flex gap-3">
                      <span className="text-[9px] text-emerald flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald" />First pass</span>
                      <span className="text-[9px] text-yellow flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow" />Iterated</span>
                    </div>
                    <span className="text-[9px] text-slate">Latest</span>
                  </div>
                </GlassPanel>
              </motion.div>
            )}

            {/* Agent Activity */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <GlassPanel className="p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={14} className="text-accent" />
                  <h2 className="text-sm font-medium text-fog uppercase tracking-wider">Agent Activity</h2>
                </div>
                <div className="space-y-3">
                  {agentAct.map((a, i) => {
                    const max = Math.max(...agentAct.map(x => x.count), 1);
                    return (
                      <motion.div key={a.role} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 + i * 0.06 }}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-medium capitalize text-fog">{a.role}</span>
                          <span className="text-xs text-slate font-mono"><AnimatedCounter value={a.count} /></span>
                        </div>
                        <div className="h-2 rounded-full bg-charcoal overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(a.count / max) * 100}%` }}
                            transition={{ delay: 0.7 + i * 0.08, duration: 0.6 }}
                            className="h-full rounded-full"
                            style={{ background: AGENT_COLORS[a.role] }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </GlassPanel>
            </motion.div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
