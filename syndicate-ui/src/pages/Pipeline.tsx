import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Clock, Zap } from 'lucide-react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Task, TaskEvent } from '../lib/api';
import AgentAvatar from '../components/AgentAvatar';
import { playSound } from '../lib/sounds';
import PageTransition from '../components/ui/PageTransition';
import GlassPanel from '../components/ui/GlassPanel';
import SkeletonLoader from '../components/ui/SkeletonLoader';

const STAGES = [
  { id: 'task_created', label: 'Input', agent: 'system', color: '#6b62f2' },
  { id: 'plan_created', label: 'Plan', agent: 'architect', color: '#06b6d4' },
  { id: 'code_generated', label: 'Code', agent: 'engineer', color: '#34d399' },
  { id: 'review_passed', label: 'Review', agent: 'reviewer', color: '#fb7185' },
  { id: 'task_complete', label: 'Output', agent: 'nexus', color: '#6b62f2' },
];

export default function Pipeline() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTasks().then(t => { setTasks(t); setLoading(false); }).catch(() => setLoading(false));
    const ch = supabase.channel('pipeline-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        api.getTasks().then(setTasks);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (selectedTask) {
      api.getEvents(selectedTask).then(setEvents).catch(() => {});
      const ch = supabase.channel(`pipeline-events-${selectedTask}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events', filter: `task_id=eq.${selectedTask}` }, (p) => {
          setEvents(prev => [...prev, p.new as TaskEvent]);
          playSound('ping');
        }).subscribe();
      return () => { supabase.removeChannel(ch); };
    }
  }, [selectedTask]);

  const getStageEvent = (stageId: string) => events.find(e => e.type === stageId);
  const getStageStatus = (stageId: string) => getStageEvent(stageId) ? 'complete' : 'pending';

  const getTimeBetweenStages = (fromIdx: number, toIdx: number): string => {
    const fromEvent = getStageEvent(STAGES[fromIdx]?.id);
    const toEvent = getStageEvent(STAGES[toIdx]?.id);
    const fromTime = fromEvent?.timestamp || fromEvent?.created_at;
    const toTime = toEvent?.timestamp || toEvent?.created_at;
    if (!fromTime || !toTime) return '';
    try {
      const diff = (new Date(toTime).getTime() - new Date(fromTime).getTime()) / 1000;
      return diff < 60 ? `${Math.round(diff)}s` : `${Math.round(diff / 60)}m`;
    } catch { return ''; }
  };

  return (
    <PageTransition>
      <div className="min-h-screen p-8 max-w-[1200px]">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3">
            <Zap size={20} className="text-accent" />
            <h1 className="text-2xl font-light tracking-tight text-snow">Pipeline</h1>
          </div>
          <p className="text-sm text-slate mt-1">Signal processing view — watch tasks flow through agent stages</p>
        </motion.div>

        {/* Task selector */}
        {loading ? (
          <SkeletonLoader variant="text" />
        ) : (
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {tasks.slice(0, 12).map(task => (
              <motion.button
                key={task.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setSelectedTask(task.id); setEvents([]); setExpandedStage(null); }}
                className={`px-4 py-2 text-xs whitespace-nowrap rounded-full border transition-all ${
                  selectedTask === task.id
                    ? 'border-accent/60 bg-accent/10 text-snow'
                    : 'border-graphite/50 text-slate hover:text-fog hover:border-graphite'
                }`}
              >
                {task.description.slice(0, 30)}{task.description.length > 30 ? '...' : ''}
              </motion.button>
            ))}
          </div>
        )}

        {/* Pipeline visualization */}
        {selectedTask && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <GlassPanel className="p-8 mb-6">
              {/* Stages */}
              <div className="flex items-center justify-between relative">
                <div className="absolute top-7 left-[7%] right-[7%] h-px bg-graphite/60 z-0" />

                {STAGES.map((stage, i) => {
                  const status = getStageStatus(stage.id);
                  const event = getStageEvent(stage.id);
                  const isExpanded = expandedStage === stage.id;
                  const timeDelta = i > 0 ? getTimeBetweenStages(i - 1, i) : '';

                  return (
                    <motion.div
                      key={stage.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.12, type: 'spring', stiffness: 300 }}
                      className="relative z-10 flex flex-col items-center cursor-pointer group"
                      onClick={() => event && setExpandedStage(isExpanded ? null : stage.id)}
                    >
                      {timeDelta && (
                        <span className="absolute -top-5 text-[9px] text-slate font-mono flex items-center gap-0.5">
                          <Clock size={8} />{timeDelta}
                        </span>
                      )}
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${
                        status === 'complete' ? 'ring-2 ring-offset-2 ring-offset-transparent' : ''
                      } ${isExpanded ? 'scale-110' : 'group-hover:scale-105'}`} style={{
                        background: status === 'complete' ? `${stage.color}18` : 'var(--color-surface, #1a1a1a)',
                        border: `2px solid ${status === 'complete' ? stage.color : 'var(--color-graphite, #333)'}`,
                        ringColor: status === 'complete' ? stage.color : undefined,
                      }}>
                        <AgentAvatar role={stage.agent} size={28} active={status === 'complete'} />
                      </div>
                      <span className="mt-3 text-xs font-medium transition-colors" style={{ color: status === 'complete' ? stage.color : 'var(--color-slate, #888)' }}>
                        {stage.label}
                      </span>
                      {event && (
                        <ChevronDown size={10} className={`mt-1 text-slate transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Expanded stage content */}
              <AnimatePresence>
                {expandedStage && (() => {
                  const event = getStageEvent(expandedStage);
                  const stage = STAGES.find(s => s.id === expandedStage);
                  if (!event || !stage) return null;
                  return (
                    <motion.div
                      key={expandedStage}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-6 p-5 rounded-xl border border-graphite/50 bg-charcoal/40">
                        <div className="flex items-center gap-2 mb-3">
                          <AgentAvatar role={stage.agent} size={20} active />
                          <span className="text-xs font-medium text-fog capitalize">{stage.agent}</span>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full" style={{ background: `${stage.color}15`, color: stage.color }}>
                            {stage.label}
                          </span>
                          {event.metadata?.model && (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                              {String(event.metadata.model)}
                            </span>
                          )}
                          {event.metadata?.confidence != null && (
                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                              Number(event.metadata.confidence) >= 0.8 ? 'bg-emerald/10 text-emerald' :
                              Number(event.metadata.confidence) >= 0.5 ? 'bg-amber/10 text-amber' :
                              'bg-rose/10 text-rose'
                            }`}>
                              {Math.round(Number(event.metadata.confidence) * 100)}% confident
                            </span>
                          )}
                          {(event.timestamp || event.created_at) && (
                            <span className="text-[9px] text-slate font-mono ml-auto">{new Date(event.timestamp || event.created_at || '').toLocaleTimeString()}</span>
                          )}
                        </div>
                        {event.metadata?.reasoning && (
                          <div className="mb-3 p-3 rounded-lg bg-accent/5 border border-accent/10">
                            <p className="text-[10px] text-accent uppercase tracking-wide mb-1 font-medium">Reasoning</p>
                            <p className="text-xs text-fog/80 leading-relaxed">{String(event.metadata.reasoning)}</p>
                          </div>
                        )}
                        <pre className="text-xs text-fog/90 whitespace-pre-wrap leading-relaxed font-mono bg-onyx/50 p-4 rounded-lg max-h-[300px] overflow-y-auto">
                          {event.content}
                        </pre>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </GlassPanel>

            {/* Event log */}
            <GlassPanel className="p-6">
              <h2 className="text-sm font-medium text-fog uppercase tracking-wide mb-4">Event Timeline</h2>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-xs text-slate text-center py-4">Waiting for events...</p>
                ) : events.map((evt, i) => (
                  <motion.div
                    key={evt.id || i}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex gap-3 items-start p-3 rounded-xl bg-charcoal/30 border border-graphite/30 hover:border-graphite/60 transition-colors"
                  >
                    <AgentAvatar role={evt.agent} size={22} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-fog capitalize">{evt.agent}</span>
                        <span className="text-[9px] text-slate font-mono">{evt.type.replace(/_/g, ' ')}</span>
                        {(evt.timestamp || evt.created_at) && <span className="text-[9px] text-slate/60 font-mono ml-auto">{new Date(evt.timestamp || evt.created_at || '').toLocaleTimeString()}</span>}
                      </div>
                      <p className="text-xs text-slate mt-0.5 line-clamp-2">{evt.content}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {!selectedTask && !loading && tasks.length > 0 && (
          <GlassPanel variant="subtle" className="p-12 text-center">
            <Zap size={24} className="text-slate mx-auto mb-3" />
            <p className="text-sm text-fog">Select a task above to see its pipeline</p>
          </GlassPanel>
        )}
        {!loading && tasks.length === 0 && (
          <GlassPanel variant="subtle" className="p-12 text-center">
            <Zap size={24} className="text-slate mx-auto mb-3" />
            <p className="text-sm text-fog">No tasks yet</p>
            <p className="text-xs text-slate mt-2">Submit one from the Dashboard to see the signal flow</p>
          </GlassPanel>
        )}
      </div>
    </PageTransition>
  );
}
