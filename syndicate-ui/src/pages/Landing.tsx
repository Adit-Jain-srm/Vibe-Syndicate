import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const AGENTS = [
  { role: 'Nexus', desc: 'Conductor - routes tasks, tracks progress', color: '#963CBD' },
  { role: 'Architect', desc: 'Planner - decomposes into subtasks', color: '#C5299B' },
  { role: 'Engineer', desc: 'Coder - implements from assignments', color: '#FF6F61' },
  { role: 'Reviewer', desc: 'Quality gate - adversarial cross-model review', color: '#FEAE51' },
  { role: 'Researcher', desc: 'Discovery - web research, tool finding', color: '#963CBD' },
  { role: 'QA', desc: 'Validation - testing and verification', color: '#C5299B' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh]">
      {/* Hero */}
      <section className="min-h-[100dvh] flex flex-col justify-center px-6 md:px-20 max-w-5xl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-light text-white tracking-tight leading-tight"
        >
          Multi-agent developer orchestration
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-white/50 text-base md:text-lg mt-4 max-w-xl leading-relaxed"
        >
          Six AI agents collaborate through Band rooms to plan, code, review, and deploy. Memory compounds across sessions. The 100th task is 10x better than the first.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex gap-3"
        >
          <button
            onClick={() => navigate('/app')}
            className="px-6 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors cursor-pointer"
          >
            Open Dashboard
          </button>
          <a
            href="https://github.com/Adit-Jain-srm/Vibe-Syndicate"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 border border-white/20 text-white/70 text-sm rounded-lg hover:border-white/40 hover:text-white transition-colors"
          >
            GitHub
          </a>
        </motion.div>
      </section>

      {/* Agents */}
      <section className="px-6 md:px-20 py-20 max-w-5xl">
        <h2 className="text-xl font-medium text-white mb-8">The Swarm</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENTS.map((agent, i) => (
            <motion.div
              key={agent.role}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-lg border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ background: agent.color }} />
                <span className="text-sm font-medium text-white">{agent.role}</span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed">{agent.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 md:px-20 py-20 max-w-5xl">
        <h2 className="text-xl font-medium text-white mb-8">How it works</h2>
        <div className="space-y-6">
          {[
            { step: 'Submit', desc: 'Send a task from the dashboard or via MCP from your IDE' },
            { step: 'Orchestrate', desc: 'Nexus routes to Architect, who plans. Engineer codes. Reviewer checks with a different model.' },
            { step: 'Learn', desc: 'After completion, metrics are computed, skills evolve, memory persists for next time.' },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-4"
            >
              <span className="text-white/20 text-sm font-mono mt-0.5">{i + 1}</span>
              <div>
                <h3 className="text-sm font-medium text-white">{item.step}</h3>
                <p className="text-xs text-white/40 mt-1 leading-relaxed max-w-lg">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-20 py-20 max-w-5xl">
        <button
          onClick={() => navigate('/app')}
          className="px-6 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors cursor-pointer"
        >
          Enter Dashboard
        </button>
      </section>
    </div>
  );
}
