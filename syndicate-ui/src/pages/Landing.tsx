/**
 * Landing page — the marketing surface that sells the product.
 *
 * Design: Linear + Dimension inspired. Dark mode. One accent color.
 * Glassmorphism. Pill shapes. Whisper-weight display type.
 *
 * ADR-008: "The dashboard IS the product. Every surface animated,
 * every interaction micro-designed, every loading state graceful."
 */

import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Brain, GitBranch, Shield, Zap, Eye,
  ArrowRight, Radio, Layers, Sparkles,
} from 'lucide-react';
import { Logo } from '../components/Logo';

function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay, ease: [0.25, 1, 0.5, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const FEATURES = [
  {
    icon: Bot,
    title: 'Multi-Agent Swarm',
    description:
      '6 specialized agents collaborate through Band rooms — Nexus coordinates, Architect plans, Engineer codes, Reviewer catches bugs.',
    color: '#5e6ad2',
  },
  {
    icon: Eye,
    title: 'Visible Collaboration',
    description:
      'Watch agents work in real-time. See handoffs, decisions, and conversations — the collaboration IS the product.',
    color: '#02b8cc',
  },
  {
    icon: Shield,
    title: 'Adversarial Review',
    description:
      'Engineer uses Gemini. Reviewer uses GPT-4o. Different model families catch different blind spots.',
    color: '#eb5757',
  },
  {
    icon: Brain,
    title: 'Compound Intelligence',
    description:
      'Memory persists. Skills evolve. The 100th task is executed 10× better than the 1st. Your AI team gets smarter over time.',
    color: '#e4f222',
  },
  {
    icon: Layers,
    title: 'Dynamic Topology',
    description:
      'Simple fix = 3 agents. Full feature = 6 agents. The swarm breathes — spawning and scaling based on task complexity.',
    color: '#27a644',
  },
  {
    icon: Sparkles,
    title: 'Self-Improvement',
    description:
      'SkillOpt loop: record outcomes → analyze patterns → propose prompt deltas → apply → evaluate. Every cycle makes the next one better.',
    color: '#f5a623',
  },
];

const AGENTS = [
  { name: 'Nexus', role: 'Coordinator', model: 'gemini-2.5-flash', color: '#5e6ad2' },
  { name: 'Architect', role: 'Planner', model: 'gemini-2.5-flash', color: '#02b8cc' },
  { name: 'Engineer', role: 'Implementer', model: 'gemini-2.5-flash', color: '#27a644' },
  { name: 'Reviewer', role: 'Quality Gate', model: 'gpt-4o (Azure)', color: '#eb5757' },
  { name: 'Researcher', role: 'Investigator', model: 'gemini-2.5-flash', color: '#e4f222' },
  { name: 'QA', role: 'Validator', model: 'gemini-2.5-flash', color: '#8a8f98' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-onyx text-snow overflow-x-hidden">
      {/* ── Nav ────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 bg-onyx/80 backdrop-blur-xl border-b border-graphite/30"
      >
        <Logo size={40} />
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm text-fog hover:text-snow transition-colors"
          >
            Sign in
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/signup')}
            className="px-5 py-2 bg-accent text-white rounded-full text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Get Started
          </motion.button>
        </div>
      </motion.nav>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 flex flex-col items-center text-center">
        {/* Ambient glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(94,106,210,0.08) 0%, transparent 70%)',
          }}
        />

        <FadeUp>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-xs text-accent font-medium mb-8">
            <Radio size={12} className="animate-pulse" />
            Multi-agent swarm • Band.ai
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <h1 className="text-5xl md:text-7xl font-light tracking-tight leading-[1.1] max-w-4xl">
            AI that works like a{' '}
            <span className="text-accent">growing engineering team</span>
          </h1>
        </FadeUp>

        <FadeUp delay={0.2}>
          <p className="text-lg text-fog max-w-2xl mt-6 leading-relaxed">
            Syndicate is a self-improving multi-agent swarm where specialized AI
            agents plan, code, review, and test your software — learning from
            every cycle. Context compounds across sessions, projects, and
            workflows.
          </p>
        </FadeUp>

        <FadeUp delay={0.3} className="flex gap-3 mt-10">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/signup')}
            className="px-8 py-3.5 bg-accent text-white rounded-full text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            Start Building
            <ArrowRight size={14} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/')}
            className="px-8 py-3.5 border border-graphite text-fog rounded-full text-sm font-medium hover:border-accent/30 hover:text-snow transition-all"
          >
            View Dashboard
          </motion.button>
        </FadeUp>
      </section>

      {/* ── Problem → Solution ─────────────────────────── */}
      <section className="py-20 px-6 border-t border-graphite/30">
        <div className="max-w-5xl mx-auto">
          <FadeUp>
            <div className="text-center mb-16">
              <p className="text-[10px] text-slate uppercase tracking-[0.2em] mb-3">
                The Problem
              </p>
              <h2 className="text-3xl font-light tracking-tight">
                AI coding tools are{' '}
                <span className="text-crimson">stateless</span>
              </h2>
              <p className="text-fog mt-4 max-w-2xl mx-auto">
                Every session starts from zero. Planning, coding, and reviewing
                are fragmented across different tools. There's no visible
                collaboration — just a black box that returns code.
              </p>
            </div>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="text-center">
              <p className="text-[10px] text-accent uppercase tracking-[0.2em] mb-3">
                The Solution
              </p>
              <h2 className="text-3xl font-light tracking-tight">
                A visible, learning{' '}
                <span className="text-accent">agent team</span>
              </h2>
              <p className="text-fog mt-4 max-w-2xl mx-auto">
                Specialized AI agents collaborate through Band rooms with real
                handoffs, adversarial cross-model review, and memory that
                compounds across every task.
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Features Grid ──────────────────────────────── */}
      <section className="py-20 px-6 border-t border-graphite/30">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-[10px] text-slate uppercase tracking-[0.2em] mb-3">
              Capabilities
            </p>
            <h2 className="text-3xl font-light tracking-tight">
              How the swarm works
            </h2>
          </FadeUp>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <FadeUp key={f.title} delay={i * 0.06}>
                <motion.div
                  whileHover={{ y: -3, borderColor: `${f.color}30` }}
                  className="p-6 rounded-xl border border-graphite/50 bg-charcoal/30 hover:bg-charcoal/60 transition-all duration-300 h-full"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                    style={{
                      backgroundColor: `${f.color}12`,
                      color: f.color,
                    }}
                  >
                    <f.icon size={18} />
                  </div>
                  <h3 className="text-sm font-medium text-snow mb-2">
                    {f.title}
                  </h3>
                  <p className="text-xs text-slate leading-relaxed">
                    {f.description}
                  </p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agent Roster ───────────────────────────────── */}
      <section className="py-20 px-6 border-t border-graphite/30">
        <div className="max-w-4xl mx-auto">
          <FadeUp className="text-center mb-12">
            <p className="text-[10px] text-slate uppercase tracking-[0.2em] mb-3">
              The Team
            </p>
            <h2 className="text-3xl font-light tracking-tight">
              Meet your agent swarm
            </h2>
            <p className="text-fog mt-3 text-sm">
              6 specialized agents, each running the best model for their
              cognitive task
            </p>
          </FadeUp>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AGENTS.map((agent, i) => (
              <FadeUp key={agent.name} delay={i * 0.06}>
                <div className="p-4 rounded-xl border border-graphite/50 bg-charcoal/20 text-center">
                  <div
                    className="w-3 h-3 rounded-full mx-auto mb-3"
                    style={{
                      backgroundColor: agent.color,
                      boxShadow: `0 0 12px ${agent.color}40`,
                    }}
                  />
                  <p className="text-sm font-medium text-snow">{agent.name}</p>
                  <p className="text-[10px] text-slate mt-0.5">{agent.role}</p>
                  <p className="text-[9px] text-slate/60 font-mono mt-1">
                    {agent.model}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Task Lifecycle ─────────────────────────────── */}
      <section className="py-20 px-6 border-t border-graphite/30">
        <div className="max-w-4xl mx-auto">
          <FadeUp className="text-center mb-12">
            <p className="text-[10px] text-slate uppercase tracking-[0.2em] mb-3">
              Workflow
            </p>
            <h2 className="text-3xl font-light tracking-tight">
              From task to deployment in one command
            </h2>
          </FadeUp>

          <div className="space-y-3">
            {[
              { step: '01', label: 'Intake', description: 'User describes what to build', color: '#5e6ad2' },
              { step: '02', label: 'Research', description: 'Researcher scans codebase for patterns and prior art', color: '#e4f222' },
              { step: '03', label: 'Plan', description: 'Architect decomposes into subtasks with acceptance criteria', color: '#02b8cc' },
              { step: '04', label: 'Implement', description: 'Engineer(s) code in parallel with isolated contexts', color: '#27a644' },
              { step: '05', label: 'Review', description: 'Reviewer (different model) adversarially reviews', color: '#eb5757' },
              { step: '06', label: 'Validate', description: 'QA runs tests and checks for regressions', color: '#8a8f98' },
              { step: '07', label: 'Learn', description: 'Extract patterns → update memory → refine skills', color: '#f5a623' },
            ].map((item, i) => (
              <FadeUp key={item.step} delay={i * 0.04}>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-graphite/30 bg-charcoal/10 hover:bg-charcoal/30 transition-colors">
                  <span
                    className="text-xs font-mono font-medium w-8 text-center"
                    style={{ color: item.color }}
                  >
                    {item.step}
                  </span>
                  <div className="w-px h-6 bg-graphite/50" />
                  <div>
                    <p className="text-sm font-medium text-snow">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-graphite/30">
        <FadeUp className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-light tracking-tight mb-4">
            Ready to build with compound intelligence?
          </h2>
          <p className="text-fog text-sm mb-8">
            This is session 1. By session 100, Syndicate knows your codebase
            better than you do.
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/signup')}
            className="px-10 py-4 bg-accent text-white rounded-full text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Get Started — Free
          </motion.button>
        </FadeUp>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-graphite/30 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>Syndicate · Compound intelligence for developers</span>
          </div>
          <p className="text-[10px] text-slate/50">
            Built by Adit Jain · Band.ai Hackathon 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
