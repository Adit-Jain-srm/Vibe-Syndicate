import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Send, Activity, Zap, CheckCircle, Brain, Bot } from 'lucide-react';
import { api } from '../lib/api';
import type { Agent, Task, Memory } from '../lib/api';
import { playWhoosh } from '../lib/sounds';
import PageTransition from '../components/ui/PageTransition';
import AnimatedCard from '../components/ui/AnimatedCard';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import StatusBadge from '../components/ui/StatusBadge';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import GlassPanel from '../components/ui/GlassPanel';

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getAgents().catch(() => []),
      api.getTasks().catch(() => []),
      api.getMemories().catch(() => []),
    ]).then(([a, t, m]) => {
      setAgents(a);
      setTasks(t);
      setMemories(m);
      setLoading(false);
    });
  }, []);

  const handleSubmitTask = async () => {
    if (!taskInput.trim() || submitting) return;
    setSubmitting(true);
    playWhoosh();
    try {
      const newTask = await api.createTask(taskInput);
      setTaskInput('');
      // Navigate to Live Room to watch agents work
      if (newTask?.id) {
        window.location.href = `/live/${newTask.id}`;
      } else {
        const t = await api.getTasks().catch(() => []);
        setTasks(t);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const activeAgents = agents.filter((a) => a.status === 'active').length;
  const completeTasks = tasks.filter((t) => t.status === 'complete').length;

  return (
    <PageTransition>
      <div className="min-h-screen p-8 max-w-[1200px]">
        {/* ── Header ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mb-8"
        >
          <h1 className="text-3xl font-light tracking-tight text-snow">
            Dashboard
          </h1>
          <p className="text-sm text-slate mt-1">
            Multi-agent swarm overview
          </p>
        </motion.div>

        {/* ── Stats Row ──────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-graphite bg-charcoal p-6">
                <SkeletonLoader variant="stat" />
              </div>
            ))
          ) : (
            <>
              <AnimatedCard glass delay={0} className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-accent" />
                  <p className="text-fog text-xs uppercase tracking-wide font-medium">
                    Active Agents
                  </p>
                </div>
                <p className="text-3xl font-light text-snow">
                  <AnimatedCounter value={activeAgents} />
                  <span className="text-lg text-slate">/{agents.length}</span>
                </p>
              </AnimatedCard>

              <AnimatedCard glass delay={0.06} className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-cyan" />
                  <p className="text-fog text-xs uppercase tracking-wide font-medium">
                    Tasks
                  </p>
                </div>
                <p className="text-3xl font-light text-snow">
                  <AnimatedCounter value={tasks.length} />
                </p>
              </AnimatedCard>

              <AnimatedCard glass delay={0.12} className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald" />
                  <p className="text-fog text-xs uppercase tracking-wide font-medium">
                    Complete
                  </p>
                </div>
                <p className="text-3xl font-light text-snow">
                  <AnimatedCounter value={completeTasks} />
                </p>
              </AnimatedCard>

              <AnimatedCard glass delay={0.18} className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-acid-lime" />
                  <p className="text-fog text-xs uppercase tracking-wide font-medium">
                    Memories
                  </p>
                </div>
                <p className="text-3xl font-light text-snow">
                  <AnimatedCounter value={memories.length} />
                </p>
              </AnimatedCard>
            </>
          )}
        </div>

        {/* ── Task Input ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <GlassPanel className="p-6 mb-8">
            <h2 className="text-sm font-medium text-fog uppercase tracking-wide mb-4">
              Send a Task to the Swarm
            </h2>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitTask()}
                  placeholder="Describe what to build…"
                  className="w-full bg-surface-input border border-graphite rounded-lg px-4 py-3 text-snow placeholder-slate focus:outline-none focus:border-accent/60 focus:shadow-[0_0_0_3px_rgba(94,106,210,0.12)] transition-all duration-200 text-sm"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmitTask}
                disabled={submitting || !taskInput.trim()}
                className="px-6 py-3 bg-accent text-white rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={14} />
                {submitting ? 'Sending…' : 'Submit'}
              </motion.button>
            </div>
          </GlassPanel>
        </motion.div>

        {/* ── Recent Tasks ───────────────────────── */}
        {tasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <GlassPanel className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-fog uppercase tracking-wide">
                  Recent Tasks
                </h2>
                <Activity size={14} className="text-slate" />
              </div>
              <div className="space-y-2">
                {tasks.slice(0, 6).map((task, i) => (
                  <AnimatedCard
                    key={task.id}
                    delay={0.05 * i}
                    className="p-4 flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-snow truncate">
                        {task.description}
                      </p>
                      <p className="text-[10px] text-slate font-mono mt-1">
                        {task.id}
                      </p>
                    </div>
                    <StatusBadge status={task.status} />
                  </AnimatedCard>
                ))}
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
