import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, Zap, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Task, TaskEvent } from '../lib/api';
import { formatRelative } from '../lib/timeago';
import AgentAvatar from '../components/AgentAvatar';
import CopyButton from '../components/ui/CopyButton';
import PageTransition from '../components/ui/PageTransition';
import GlassPanel from '../components/ui/GlassPanel';
import StatusBadge from '../components/ui/StatusBadge';
import SkeletonLoader from '../components/ui/SkeletonLoader';

const STATUS_ICONS: Record<string, JSX.Element> = {
  complete: <CheckCircle size={16} className="text-emerald" />,
  failed: <XCircle size={16} className="text-rose" />,
  awaiting_approval: <AlertTriangle size={16} className="text-amber" />,
};

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.getTask(id), api.getEvents(id)])
      .then(([t, e]) => { setTask(t); setEvents(e); })
      .catch(() => {})
      .finally(() => setLoading(false));

    const ch = supabase.channel(`task-detail-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `id=eq.${id}` }, () => {
        api.getTask(id).then(setTask).catch(() => {});
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events', filter: `task_id=eq.${id}` }, (p) => {
        setEvents(prev => [...prev, p.new as TaskEvent]);
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const handleExport = () => {
    if (!task) return;
    const lines = [
      `# Task: ${task.description}`,
      ``,
      `**ID:** ${task.id}`,
      `**Status:** ${task.status}`,
      `**Created:** ${task.created_at}`,
      task.result ? `**Result:** ${task.result}` : '',
      ``,
      `## Event Timeline`,
      ``,
      ...events.map(e => `- **[${formatRelative(e.created_at || e.timestamp)}]** ${e.agent} (${e.type}): ${e.content}`),
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-${task.id.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen p-8 max-w-[900px]">
          <SkeletonLoader variant="card" />
        </div>
      </PageTransition>
    );
  }

  if (!task) {
    return (
      <PageTransition>
        <div className="min-h-screen p-8 max-w-[900px]">
          <GlassPanel variant="subtle" className="p-12 text-center">
            <p className="text-slate">Task not found</p>
            <Link to="/tasks" className="text-accent text-sm mt-2 inline-block">Back to tasks</Link>
          </GlassPanel>
        </div>
      </PageTransition>
    );
  }

  const agents = [...new Set(events.map(e => e.agent).filter(a => a !== 'system'))];

  return (
    <PageTransition>
      <div className="min-h-screen p-8 max-w-[900px]">
        {/* Back link */}
        <Link to="/tasks" className="inline-flex items-center gap-1.5 text-xs text-slate hover:text-fog transition-colors mb-6">
          <ArrowLeft size={12} /> Back to tasks
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {STATUS_ICONS[task.status] || <Zap size={16} className="text-accent" />}
                <StatusBadge status={task.status} />
                <span className="text-[10px] text-slate font-mono">{formatRelative(task.created_at)}</span>
              </div>
              <h1 className="text-xl font-light text-snow leading-relaxed">{task.description}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-slate font-mono">{task.id.slice(0, 8)}</span>
                <CopyButton text={task.id} label="task ID" />
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleExport}
              className="px-3 py-1.5 text-xs text-slate border border-graphite rounded-lg hover:text-fog hover:border-accent/40 transition-all shrink-0"
            >
              Export
            </motion.button>
          </div>
        </motion.div>

        {/* Agents involved */}
        {agents.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center gap-2 mb-6">
            <span className="text-[10px] text-slate uppercase tracking-wide">Agents:</span>
            {agents.map(a => (
              <div key={a} className="flex items-center gap-1">
                <AgentAvatar role={a} size={16} active />
                <span className="text-[10px] text-fog capitalize">{a}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Result */}
        {task.result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <GlassPanel className="p-5 mb-6">
              <p className="text-[10px] text-emerald uppercase tracking-wide mb-2 font-medium">Result</p>
              <p className="text-sm text-snow leading-relaxed">{task.result}</p>
            </GlassPanel>
          </motion.div>
        )}

        {/* Event Timeline */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassPanel className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-medium text-fog uppercase tracking-wide">Timeline</h2>
              <span className="text-[10px] text-slate">{events.length} events</span>
            </div>

            {events.length === 0 ? (
              <p className="text-sm text-slate text-center py-8">No events yet — waiting for agent activity</p>
            ) : (
              <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-graphite/60" />
                <div className="space-y-1">
                  {events.map((evt, i) => (
                    <motion.div
                      key={evt.id || i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.5) }}
                      className="flex gap-3 p-3 rounded-lg hover:bg-obsidian/30 transition-colors relative"
                    >
                      <div className="relative z-10 mt-1 shrink-0">
                        <AgentAvatar role={evt.agent} size={22} active />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-fog capitalize">{evt.agent}</span>
                          <span className="text-[9px] text-slate font-mono">{evt.type.replace(/_/g, ' ')}</span>
                          {evt.metadata?.model && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-mono">
                              {String(evt.metadata.model)}
                            </span>
                          )}
                          <span className="text-[9px] text-slate/60 ml-auto font-mono">{formatRelative(evt.created_at || evt.timestamp)}</span>
                        </div>
                        <p className="text-sm text-mist leading-relaxed whitespace-pre-wrap">{evt.content}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </GlassPanel>
        </motion.div>

        {/* Pipeline link */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4 text-center">
          <Link to={`/pipeline?task=${id}`} className="text-xs text-accent hover:underline">
            View in Pipeline →
          </Link>
        </motion.div>
      </div>
    </PageTransition>
  );
}
