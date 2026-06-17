import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Bot, Cpu, Activity } from 'lucide-react';
import { api } from '../lib/api';
import type { Agent } from '../lib/api';
import PageTransition from '../components/ui/PageTransition';
import AnimatedCard from '../components/ui/AnimatedCard';
import GlassPanel from '../components/ui/GlassPanel';
import PulsingDot, { AGENT_COLORS_HEX } from '../components/ui/PulsingDot';
import StatusBadge from '../components/ui/StatusBadge';
import SkeletonLoader from '../components/ui/SkeletonLoader';

const ROLE_DESCRIPTIONS: Record<string, string> = {
  nexus: 'Conductor — routes tasks, tracks progress',
  architect: 'Planner — decomposes into structured subtasks',
  engineer: 'Coder — implements from subtask assignments',
  reviewer: 'Quality gate — adversarial cross-model review',
  researcher: 'Discovery — web research, prior art, tool finding',
  qa: 'Validation — testing and quality assurance',
};

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getAgents()
      .then((a) => {
        setAgents(a);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const interval = setInterval(
      () => api.getAgents().then(setAgents).catch(() => {}),
      5000,
    );
    return () => clearInterval(interval);
  }, []);

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
            <Bot size={20} className="text-accent" />
            <h1 className="text-2xl font-light tracking-tight text-snow">
              Agent Roster
            </h1>
          </div>
          <p className="text-sm text-slate mt-1">
            6 specialized agents • Band.ai coordination
          </p>
        </motion.div>

        {/* ── Agent Grid ──────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-graphite bg-charcoal p-6">
                  <SkeletonLoader variant="card" />
                </div>
              ))
            : agents.length === 0 ? (
                <div className="col-span-full">
                  <GlassPanel variant="subtle" className="p-8 text-center">
                    <Bot size={28} className="text-slate mx-auto mb-3" />
                    <p className="text-slate text-sm">
                      No agents connected. Start the swarm:{' '}
                      <code className="text-fog bg-charcoal px-2 py-0.5 rounded text-xs">python -m syndicate_agent.main</code>
                    </p>
                  </GlassPanel>
                </div>
              )
            : agents.map((agent, i) => {
                const color = AGENT_COLORS_HEX[agent.role] || '#8a8f98';
                const desc =
                  ROLE_DESCRIPTIONS[agent.role] || 'Specialist agent';
                const isActive = agent.status === 'active';

                return (
                  <AnimatedCard
                    key={agent.name}
                    glass
                    delay={0.06 * i}
                    className="p-6"
                  >
                    {/* Top row: dot + name + status */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <PulsingDot
                          color={color}
                          size="lg"
                          active={isActive}
                        />
                        <div>
                          <h3 className="text-sm font-medium text-snow">
                            {agent.name}
                          </h3>
                          <p className="text-[10px] text-slate capitalize">
                            {agent.role}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={agent.status} />
                    </div>

                    {/* Description */}
                    <p className="text-xs text-fog leading-relaxed mb-4">
                      {desc}
                    </p>

                    {/* Meta row */}
                    <div className="flex items-center gap-4 pt-3 border-t border-graphite/50">
                      <div className="flex items-center gap-1.5">
                        <Cpu size={11} className="text-slate" />
                        <span className="text-[10px] text-slate font-mono">
                          {agent.model || 'gemini-2.5-flash'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Activity size={11} className="text-slate" />
                        <span className="text-[10px] text-slate">
                          {isActive ? 'Processing' : 'Idle'}
                        </span>
                      </div>
                    </div>
                  </AnimatedCard>
                );
              })}
        </div>

        {/* ── Architecture note ───────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <GlassPanel variant="subtle" className="p-4">
            <p className="text-[11px] text-slate leading-relaxed">
              <span className="text-fog font-medium">Cross-model review:</span>{' '}
              Engineer (Gemini 2.5 Flash) → Reviewer (Azure GPT-4o).
              Different model families catch different blind spots.
            </p>
          </GlassPanel>
        </motion.div>
      </div>
    </PageTransition>
  );
}
