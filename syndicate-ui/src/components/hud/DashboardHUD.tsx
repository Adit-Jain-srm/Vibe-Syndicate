import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { api } from '../../lib/api';
import { playSound } from '../../lib/sounds';
import { useConstellationStore } from '../../stores/constellation';
import type { Task } from '../../lib/api';

export default function DashboardHUD() {
  const [taskInput, setTaskInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastTaskId, setLastTaskId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const agents = useConstellationStore(s => s.agents);

  useEffect(() => {
    api.getTasks().then(setTasks).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!taskInput.trim() || submitting) return;
    setSubmitting(true);
    try {
      const task = await api.createTask(taskInput);
      setLastTaskId(task.id);
      setTaskInput('');
      playSound('success');
      const updated = await api.getTasks();
      setTasks(updated);
    } catch {
      playSound('error');
    } finally {
      setSubmitting(false);
    }
  };

  const activeCount = agents.filter(a => a.status === 'active').length;

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="fixed right-6 top-1/2 -translate-y-1/2 z-30 w-[420px] max-h-[80vh] overflow-y-auto"
    >
      {/* Panel */}
      <div className="rounded-3xl bg-[rgba(8,9,12,0.78)] backdrop-blur-2xl border border-white/[0.06] p-8 shadow-[0_0_60px_rgba(99,102,241,0.05)]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse" />
          <span className="text-[11px] text-[#9ca3af] uppercase tracking-widest font-medium">
            {activeCount > 0 ? `${activeCount} agent${activeCount > 1 ? 's' : ''} active` : 'Swarm idle'}
          </span>
        </div>

        {/* Task Input */}
        <h2 className="text-xl font-light text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          What shall we build?
        </h2>
        <div className="flex flex-col gap-3">
          <textarea
            value={taskInput}
            onChange={e => setTaskInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder="Describe your task..."
            rows={3}
            className="w-full bg-[rgba(22,23,25,0.8)] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-[#4a4f58] focus:outline-none focus:border-[#6366f1]/50 transition-all resize-none"
          />
          <motion.button
            whileHover={{ scale: submitting ? 1 : 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={submitting || !taskInput.trim()}
            className="w-full py-3 bg-[#6366f1] text-white text-sm rounded-xl font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#818cf8] transition-colors"
          >
            {submitting ? 'Sending...' : 'Send to Swarm'}
          </motion.button>
        </div>

        {lastTaskId && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" />
            <span className="text-[11px] text-[#34d399]">Task launched</span>
          </motion.div>
        )}

        {/* Recent Tasks */}
        {tasks.length > 0 && (
          <div className="mt-8">
            <h3 className="text-[10px] uppercase tracking-widest text-[#6b7280] mb-3">Recent</h3>
            <div className="space-y-2">
              {tasks.slice(0, 4).map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                >
                  <span className="text-xs text-[#d1d5db] truncate max-w-[250px]">{task.description}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono ${
                    task.status === 'complete' ? 'bg-[#34d399]/10 text-[#34d399]' :
                    task.status === 'pending' ? 'bg-[#6366f1]/10 text-[#6366f1]' :
                    'bg-white/5 text-[#6b7280]'
                  }`}>{task.status}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
