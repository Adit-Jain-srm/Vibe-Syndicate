import { motion, useReducedMotion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const AGENTS = [
  { role: 'Nexus', desc: 'Conductor - orchestrates the swarm', color: '#6366f1', size: 'lg' },
  { role: 'Architect', desc: 'Decomposes tasks into plans', color: '#06b6d4', size: 'sm' },
  { role: 'Engineer', desc: 'Implements from assignments', color: '#10b981', size: 'sm' },
  { role: 'Reviewer', desc: 'Cross-model adversarial review', color: '#f43f5e', size: 'md' },
  { role: 'Researcher', desc: 'Discovers tools and context', color: '#f59e0b', size: 'sm' },
  { role: 'QA', desc: 'Validates and verifies', color: '#8b5cf6', size: 'sm' },
];

export default function Landing() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  return (
    <div className="min-h-[100dvh] relative">
      {/* Atmospheric gradient */}
      <div className="fixed inset-0 pointer-events-none atmo-hero" />

      {/* Hero - asymmetric split */}
      <section className="min-h-[100dvh] grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] items-center px-6 md:px-16 lg:px-24 max-w-[1400px] mx-auto gap-12">
        <div className="pt-20 lg:pt-0">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
            <span className="text-[11px] text-[var(--color-accent)] font-medium tracking-wide">6 agents live on Band.ai</span>
          </motion.div>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[clamp(2.5rem,5vw,4rem)] font-light text-[var(--color-snow)] tracking-[-0.03em] leading-[1.1]"
          >
            Compound intelligence
            <br />
            <span className="text-[var(--color-fog)]">for developers</span>
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[var(--color-slate)] text-base mt-5 max-w-md leading-relaxed"
          >
            A self-improving multi-agent swarm that plans, codes, and reviews. Memory persists. Skills evolve. The 100th task is 10x better than the first.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-8 flex gap-3"
          >
            <button
              onClick={() => navigate('/app')}
              className="px-6 py-2.5 bg-[var(--color-accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-accent-glow)] transition-colors"
            >
              Open Dashboard
            </button>
            <a
              href="https://github.com/Adit-Jain-srm/Vibe-Syndicate"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 border border-[var(--color-graphite)] text-[var(--color-fog)] text-sm rounded-lg hover:border-[var(--color-accent)]/40 hover:text-[var(--color-snow)] transition-colors"
            >
              GitHub
            </a>
          </motion.div>
        </div>

        {/* Right: Agent constellation visualization */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative hidden lg:flex items-center justify-center h-[420px]"
        >
          {/* Orbital rings */}
          <div className="absolute w-[320px] h-[320px] rounded-full border border-[var(--color-graphite)]/30" />
          <div className="absolute w-[220px] h-[220px] rounded-full border border-[var(--color-graphite)]/20" />

          {/* Central nexus */}
          <motion.div
            animate={reduce ? {} : { scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'radial-gradient(circle, #6366f1 0%, #6366f140 70%)', boxShadow: '0 0 40px #6366f130' }}
          >
            <span className="text-white text-xs font-medium">N</span>
          </motion.div>

          {/* Orbiting agents */}
          {AGENTS.slice(1).map((agent, i) => {
            const angle = (i * 72 - 90) * (Math.PI / 180);
            const radius = i % 2 === 0 ? 130 : 100;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            return (
              <motion.div
                key={agent.role}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="absolute w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  left: `calc(50% + ${x}px - 18px)`,
                  top: `calc(50% + ${y}px - 18px)`,
                  background: `radial-gradient(circle, ${agent.color} 0%, ${agent.color}30 80%)`,
                  boxShadow: `0 0 20px ${agent.color}20`,
                }}
              >
                <span className="text-white text-[9px] font-medium">{agent.role[0]}</span>
              </motion.div>
            );
          })}

          {/* Connection lines (SVG) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 420 420">
            {AGENTS.slice(1).map((agent, i) => {
              const angle = (i * 72 - 90) * (Math.PI / 180);
              const radius = i % 2 === 0 ? 130 : 100;
              const x = 210 + Math.cos(angle) * radius;
              const y = 210 + Math.sin(angle) * radius;
              return (
                <line key={i} x1="210" y1="210" x2={x} y2={y} stroke={agent.color} strokeWidth="0.5" strokeOpacity="0.3" />
              );
            })}
          </svg>
        </motion.div>
      </section>

      {/* Trust bar */}
      <section className="px-6 md:px-16 lg:px-24 py-12 max-w-[1400px] mx-auto border-t border-[var(--color-graphite)]/30">
        <div className="flex items-center gap-8 flex-wrap opacity-50">
          <span className="text-[10px] text-[var(--color-slate)] uppercase tracking-widest">Built with</span>
          {['Band.ai', 'Gemini', 'GPT-4o', 'Supabase', 'React 19'].map(tech => (
            <span key={tech} className="text-xs text-[var(--color-fog)] font-medium">{tech}</span>
          ))}
        </div>
      </section>

      {/* Features - asymmetric editorial blocks */}
      <section className="px-6 md:px-16 lg:px-24 py-24 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[0.4fr_0.6fr] gap-16 items-start">
          <div className="lg:sticky lg:top-24">
            <motion.h2
              initial={reduce ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-2xl font-light text-[var(--color-snow)] tracking-tight"
            >
              How it works
            </motion.h2>
            <p className="text-sm text-[var(--color-slate)] mt-3 leading-relaxed max-w-sm">
              Submit a task. Watch 6 agents collaborate in real-time. Memory persists so the next task is smarter.
            </p>
          </div>
          <div className="space-y-8">
            {[
              { title: 'Submit', body: 'Send a task from the dashboard or IDE via MCP. Nexus analyzes complexity and recruits the right agents.' },
              { title: 'Orchestrate', body: 'Architect plans. Engineer implements with Gemini. Reviewer checks with GPT-4o. Different model families catch different blind spots.' },
              { title: 'Learn', body: 'Metrics computed. Patterns extracted. Agent prompts evolve. Semantic memory persists for next time.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border-l-2 border-[var(--color-accent)]/30 pl-6"
              >
                <h3 className="text-sm font-medium text-[var(--color-snow)] mb-1">{item.title}</h3>
                <p className="text-sm text-[var(--color-slate)] leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Agents - featured layout (Nexus large, others smaller) */}
      <section className="px-6 md:px-16 lg:px-24 py-24 max-w-[1400px] mx-auto">
        <motion.h2
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-2xl font-light text-[var(--color-snow)] tracking-tight mb-10"
        >
          The Swarm
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Nexus - featured */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 lg:col-span-1 lg:row-span-2 p-6 rounded-xl border border-[#6366f1]/20 bg-[#6366f1]/[0.03]"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'radial-gradient(#6366f1, #6366f140)' }}>
                <span className="text-white text-xs font-bold">N</span>
              </div>
              <span className="text-sm font-medium text-[var(--color-snow)]">Nexus</span>
            </div>
            <p className="text-xs text-[var(--color-slate)] leading-relaxed">The conductor. Routes tasks, discovers peers, tracks state across the entire lifecycle. Every task flows through Nexus.</p>
          </motion.div>

          {/* Other agents */}
          {AGENTS.slice(1).map((agent, i) => (
            <motion.div
              key={agent.role}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 + i * 0.04 }}
              className="p-4 rounded-xl border border-[var(--color-graphite)]/50 bg-[var(--color-charcoal)]/40 hover:border-[var(--color-graphite)] transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ background: agent.color }} />
                <span className="text-sm font-medium text-[var(--color-snow)]">{agent.role}</span>
              </div>
              <p className="text-xs text-[var(--color-slate)] leading-relaxed">{agent.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Before vs After - clean comparison */}
      <section className="px-6 md:px-16 lg:px-24 py-24 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--color-graphite)]/30 rounded-xl overflow-hidden">
          <div className="p-8 bg-[var(--color-deep)]">
            <p className="text-xs text-[var(--color-rose)] font-medium uppercase tracking-wide mb-6">Without Syndicate</p>
            <div className="space-y-4">
              {[
                'Every session starts from zero',
                'Planning and coding disconnected',
                'Same mistakes repeated',
                'No visibility into decisions',
                'Manual context re-gathering',
              ].map((item, i) => (
                <motion.div key={i} initial={reduce ? false : { opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3">
                  <span className="w-1 h-1 rounded-full bg-[var(--color-rose)]/60 shrink-0" />
                  <span className="text-sm text-[var(--color-fog)]">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="p-8 bg-[var(--color-deep)]">
            <p className="text-xs text-[var(--color-accent)] font-medium uppercase tracking-wide mb-6">With Syndicate</p>
            <div className="space-y-4">
              {[
                'Intelligence compounds across sessions',
                '6 agents coordinate end-to-end',
                'Patterns learned, never repeated',
                'Full visibility into every decision',
                'Semantic memory retrieves context',
              ].map((item, i) => (
                <motion.div key={i} initial={reduce ? false : { opacity: 0, x: 8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3">
                  <span className="w-1 h-1 rounded-full bg-[var(--color-accent)] shrink-0" />
                  <span className="text-sm text-[var(--color-snow)]">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-16 lg:px-24 py-24 max-w-[1400px] mx-auto text-center">
        <motion.h2
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl font-light text-[var(--color-snow)] mb-4"
        >
          Start building with compound intelligence
        </motion.h2>
        <motion.p
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-sm text-[var(--color-slate)] mb-8"
        >
          Submit your first task. Watch agents collaborate. See the system learn.
        </motion.p>
        <button
          onClick={() => navigate('/app')}
          className="px-8 py-3 bg-[var(--color-accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-accent-glow)] transition-colors"
        >
          Enter Dashboard
        </button>
      </section>
    </div>
  );
}
