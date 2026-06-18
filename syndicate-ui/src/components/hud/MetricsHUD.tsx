import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { api } from '../../lib/api';
import type { TaskMetric } from '../../lib/api';
import CountUp from '../effects/CountUp';

export default function MetricsHUD() {
  const [metrics, setMetrics] = useState<TaskMetric[]>([]);

  useEffect(() => {
    api.getTaskMetrics().then(setMetrics).catch(() => {});
  }, []);

  const completed = metrics.length;
  const passRate = completed > 0 ? Math.round((metrics.filter(m => m.first_pass_rate).length / completed) * 100) : 0;
  const avgIter = completed > 0 ? +(metrics.reduce((s, m) => s + m.iteration_count, 0) / completed).toFixed(1) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="fixed top-8 left-1/2 -translate-x-1/2 z-30"
    >
      {/* Floating metrics cards */}
      <div className="flex gap-4">
        {[
          { label: 'Tasks', value: completed, color: '#34d399' },
          { label: 'Pass Rate', value: passRate, suffix: '%', color: '#6366f1' },
          { label: 'Avg Iters', value: avgIter, color: '#06b6d4' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="px-6 py-4 rounded-2xl bg-[rgba(8,9,12,0.78)] backdrop-blur-2xl border border-white/[0.06]"
          >
            <p className="text-[9px] uppercase tracking-widest text-[#6b7280] mb-1">{kpi.label}</p>
            <CountUp end={kpi.value} suffix={kpi.suffix} className="text-2xl font-light" style={{ color: kpi.color }} duration={1200} />
          </motion.div>
        ))}
      </div>

      {/* Review trend */}
      {metrics.length > 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 px-6 py-4 rounded-2xl bg-[rgba(8,9,12,0.78)] backdrop-blur-2xl border border-white/[0.06]"
        >
          <p className="text-[9px] uppercase tracking-widest text-[#6b7280] mb-3">Score Trend</p>
          <div className="flex items-end gap-[2px] h-12">
            {metrics.slice(-15).map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(m.review_score * 100, 8)}%` }}
                transition={{ delay: 0.6 + i * 0.03, duration: 0.4 }}
                className="flex-1 rounded-t-sm min-w-[4px]"
                style={{ background: m.first_pass_rate ? '#34d399' : '#fbbf24' }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
