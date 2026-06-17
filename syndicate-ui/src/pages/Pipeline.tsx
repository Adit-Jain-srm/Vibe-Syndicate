import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Task, TaskEvent } from '../lib/api';
import AgentAvatar from '../components/AgentAvatar';
import { playSound } from '../lib/sounds';

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

  useEffect(() => {
    api.getTasks().then(setTasks).catch(() => {});
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

  const getStageStatus = (stageId: string) => {
    return events.some(e => e.type === stageId) ? 'complete' : 'pending';
  };

  return (
    <div className="min-h-screen p-8">
      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl mb-2" style={{ fontFamily: 'var(--font-display)' }}>
        Pipeline
      </motion.h1>
      <p className="text-[var(--color-subtle)] mb-8">Signal processing view — watch tasks flow through agent stages</p>

      {/* Task selector */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tasks.slice(0, 10).map(task => (
          <button
            key={task.id}
            onClick={() => { setSelectedTask(task.id); setEvents([]); }}
            className={`glass-pill px-4 py-2 text-xs whitespace-nowrap transition-all ${selectedTask === task.id ? 'border-[var(--color-indigo)] text-white' : 'text-[var(--color-dim)]'}`}
          >
            {task.description.slice(0, 30)}...
          </button>
        ))}
      </div>

      {/* Pipeline visualization */}
      {selectedTask && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-2xl">
          {/* Stages */}
          <div className="flex items-center justify-between relative">
            {/* Connection line */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-[var(--color-border)] -translate-y-1/2 z-0" />

            {STAGES.map((stage, i) => {
              const status = getStageStatus(stage.id);
              const event = events.find(e => e.type === stage.id);
              return (
                <motion.div
                  key={stage.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.15, type: 'spring' }}
                  className="relative z-10 flex flex-col items-center"
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${
                    status === 'complete' ? 'glow-sm' : ''
                  }`} style={{
                    background: status === 'complete' ? `${stage.color}22` : 'var(--color-surface)',
                    border: `2px solid ${status === 'complete' ? stage.color : 'var(--color-border)'}`,
                  }}>
                    <AgentAvatar role={stage.agent} size={28} active={status === 'complete'} />
                  </div>
                  <span className="mt-3 text-xs font-medium" style={{ color: status === 'complete' ? stage.color : 'var(--color-muted)' }}>
                    {stage.label}
                  </span>
                  {event && (
                    <span className="mt-1 text-[9px] text-[var(--color-subtle)] max-w-[100px] text-center line-clamp-2">
                      {event.content.slice(0, 60)}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Event log */}
          <div className="mt-8 space-y-2 max-h-[300px] overflow-y-auto">
            {events.map((evt, i) => (
              <motion.div
                key={i}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3 items-start p-3 rounded-xl bg-[var(--color-deep)] border border-[var(--color-border)]/50"
              >
                <AgentAvatar role={evt.agent} size={24} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--color-bright)]">{evt.agent}</span>
                    <span className="text-[9px] text-[var(--color-muted)] font-mono">{evt.type}</span>
                  </div>
                  <p className="text-xs text-[var(--color-dim)] mt-0.5 line-clamp-2">{evt.content}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {!selectedTask && tasks.length > 0 && (
        <div className="glass p-12 rounded-2xl text-center">
          <p className="text-[var(--color-subtle)]">Select a task above to see its pipeline</p>
        </div>
      )}
      {tasks.length === 0 && (
        <div className="glass p-12 rounded-2xl text-center">
          <p className="text-[var(--color-subtle)]">No tasks yet. Submit one from the Dashboard.</p>
        </div>
      )}
    </div>
  );
}
