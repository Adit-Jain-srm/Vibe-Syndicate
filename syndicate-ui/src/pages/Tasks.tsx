import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ListTodo, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import type { Task } from '../lib/api';
import PageTransition from '../components/ui/PageTransition';
import GlassPanel from '../components/ui/GlassPanel';
import AnimatedCard from '../components/ui/AnimatedCard';
import StatusBadge from '../components/ui/StatusBadge';
import SkeletonLoader from '../components/ui/SkeletonLoader';

const STAGES = [
  { key: 'pending', label: 'Pending', color: '#5e6ad2' },
  { key: 'planning', label: 'Planning', color: '#02b8cc' },
  { key: 'in_progress', label: 'In Progress', color: '#f5a623' },
  { key: 'reviewing', label: 'Reviewing', color: '#eb5757' },
  { key: 'complete', label: 'Complete', color: '#27a644' },
];

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getTasks()
      .then((t) => {
        setTasks(t);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const interval = setInterval(
      () => api.getTasks().then(setTasks).catch(() => {}),
      5000,
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen p-8">
        {/* ── Header ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <ListTodo size={20} className="text-accent" />
            <h1 className="text-2xl font-light tracking-tight text-snow">
              Task Pipeline
            </h1>
          </div>
          <p className="text-sm text-slate mt-1">
            Tasks flow through 5 stages — pending → planning → in progress →
            reviewing → complete
          </p>
        </motion.div>

        {/* ── Stage progress indicator ────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 mb-6 px-1"
        >
          {STAGES.map((stage, i) => (
            <div key={stage.key} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="text-[11px] text-fog">{stage.label}</span>
              </div>
              {i < STAGES.length - 1 && (
                <ArrowRight size={10} className="text-iron" />
              )}
            </div>
          ))}
        </motion.div>

        {/* ── Kanban Columns ──────────────────────── */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage, colIndex) => {
            const stageTasks = tasks.filter((t) => t.status === stage.key);

            return (
              <motion.div
                key={stage.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.08 * colIndex,
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
                className="min-w-[260px] flex-shrink-0"
              >
                <GlassPanel className="p-4 h-full">
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <h3 className="text-xs font-medium text-fog uppercase tracking-wide">
                        {stage.label}
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate tabular-nums">
                      {stageTasks.length}
                    </span>
                  </div>

                  {/* Task cards */}
                  <div className="space-y-2">
                    {loading ? (
                      <SkeletonLoader variant="card" />
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {stageTasks.map((task, i) => (
                          <AnimatedCard
                            key={task.id}
                            delay={0.04 * i}
                            className="p-3"
                          >
                            {/* Accent bar */}
                            <div
                              className="w-0.5 h-full absolute left-0 top-0 rounded-l-xl"
                              style={{ backgroundColor: stage.color }}
                            />
                            <p className="text-sm text-snow line-clamp-2 pl-2">
                              {task.description}
                            </p>
                            <p className="text-[10px] text-slate font-mono mt-2 pl-2">
                              {task.id}
                            </p>
                          </AnimatedCard>
                        ))}
                      </AnimatePresence>
                    )}

                    {!loading && stageTasks.length === 0 && (
                      <div className="flex items-center justify-center py-8">
                        <span className="text-slate text-xs">—</span>
                      </div>
                    )}
                  </div>
                </GlassPanel>
              </motion.div>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}
