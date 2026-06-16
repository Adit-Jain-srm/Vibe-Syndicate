import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Plus, Clock, Tag } from 'lucide-react';
import { api } from '../lib/api';
import type { Memory } from '../lib/api';
import { DEMO_MEMORIES } from '../lib/demoData';
import { playSound } from '../lib/sounds';
import PageTransition from '../components/ui/PageTransition';
import GlassPanel from '../components/ui/GlassPanel';
import AnimatedCard from '../components/ui/AnimatedCard';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import SkeletonLoader from '../components/ui/SkeletonLoader';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  protocol_state: { bg: 'bg-cyan/15', text: 'text-cyan', dot: 'bg-cyan' },
  project: { bg: 'bg-accent/15', text: 'text-accent', dot: 'bg-accent' },
  agent_learning: { bg: 'bg-emerald/15', text: 'text-emerald', dot: 'bg-emerald' },
  skill_evolution: { bg: 'bg-acid-lime/15', text: 'text-acid-lime', dot: 'bg-acid-lime' },
};

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>(DEMO_MEMORIES);
  const [newContent, setNewContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('project');
  const [loading, setLoading] = useState(true);
  const [storing, setStoring] = useState(false);

  useEffect(() => {
    api
      .getMemories()
      .then((m) => {
        setMemories(m);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleStore = async () => {
    if (!newContent.trim() || storing) return;
    setStoring(true);
    try {
      await api.storeMemory(newContent, selectedCategory);
      playSound('success');
      setNewContent('');
      const m = await api.getMemories().catch(() => []);
      setMemories(m);
    } finally {
      setStoring(false);
    }
  };

  // Count by category
  const categoryCounts = memories.reduce(
    (acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const categories = ['project', 'agent_learning', 'protocol_state', 'skill_evolution'];

  return (
    <PageTransition>
      <div className="min-h-screen p-8 max-w-[1200px]">
        {/* ── Header ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <Brain size={20} className="text-accent" />
            <h1 className="text-2xl font-light tracking-tight text-snow">
              Memory & Evolution
            </h1>
          </div>
          <p className="text-sm text-slate mt-1">
            Compound intelligence — every interaction teaches the system
          </p>
        </motion.div>

        {/* ── Stats Row ──────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {categories.map((cat, i) => {
            const style = CATEGORY_COLORS[cat] || CATEGORY_COLORS.project;
            const count = categoryCounts[cat] || 0;
            const label = cat.replace(/_/g, ' ');

            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i }}
                className={`rounded-xl border border-graphite/50 bg-charcoal/60 p-4`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  <span className="text-[10px] text-fog uppercase tracking-wide">
                    {label}
                  </span>
                </div>
                <p className={`text-2xl font-light ${style.text}`}>
                  <AnimatedCounter value={count} />
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* ── Store Input ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassPanel className="p-6 mb-8">
            <h2 className="text-sm font-medium text-fog uppercase tracking-wide mb-4">
              Store Learning
            </h2>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((cat) => {
                const style = CATEGORY_COLORS[cat] || CATEGORY_COLORS.project;
                const isSelected = selectedCategory === cat;
                const label = cat.replace(/_/g, ' ');

                return (
                  <motion.button
                    key={cat}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${
                      isSelected
                        ? `${style.bg} ${style.text} border-current/20`
                        : 'border-graphite text-slate hover:text-fog'
                    }`}
                  >
                    {label}
                  </motion.button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <input
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStore()}
                placeholder="Record a convention, learning, or decision…"
                className="flex-1 bg-surface-input border border-graphite rounded-lg px-4 py-2.5 text-sm text-snow placeholder-slate focus:outline-none focus:border-accent/60 transition-all"
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleStore}
                disabled={storing || !newContent.trim()}
                className="px-5 py-2.5 bg-accent text-white text-sm rounded-lg font-medium flex items-center gap-1.5 hover:bg-accent/90 transition-colors disabled:opacity-40"
              >
                <Plus size={14} />
                {storing ? 'Storing…' : 'Store'}
              </motion.button>
            </div>
          </GlassPanel>
        </motion.div>

        {/* ── Memory Timeline ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonLoader key={i} variant="card" />
              ))}
            </div>
          ) : memories.length === 0 ? (
            <GlassPanel variant="subtle" className="p-8 text-center">
              <Brain size={28} className="text-slate mx-auto mb-3" />
              <p className="text-slate text-sm">
                No memories stored yet. Complete tasks or store learnings above.
              </p>
            </GlassPanel>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-4 bottom-4 w-px bg-graphite/60" />

              <AnimatePresence mode="popLayout">
                {memories.map((mem, i) => {
                  const style =
                    CATEGORY_COLORS[mem.category] || CATEGORY_COLORS.project;

                  return (
                    <motion.div
                      key={mem.id || i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        delay: 0.04 * Math.min(i, 10),
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                      }}
                      className="flex gap-4 mb-3 relative"
                    >
                      {/* Timeline dot */}
                      <div className="relative z-10 mt-4 shrink-0">
                        <span
                          className={`block w-[10px] h-[10px] rounded-full ring-2 ring-onyx ${style.dot}`}
                        />
                      </div>

                      {/* Card */}
                      <AnimatedCard className="flex-1 p-4" delay={0}>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}
                          >
                            <Tag size={9} />
                            {mem.category.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-slate">
                            {mem.agent}
                          </span>
                        </div>
                        <p className="text-sm text-snow leading-relaxed">
                          {mem.content}
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <Clock size={9} className="text-slate" />
                          <span className="text-[10px] text-slate">
                            {new Date(mem.created_at).toLocaleString()}
                          </span>
                        </div>
                      </AnimatedCard>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
