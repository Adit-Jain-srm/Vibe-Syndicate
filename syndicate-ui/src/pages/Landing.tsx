import { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AgentOrb from '../components/3d/AgentOrb';
import OrbConstellation from '../components/3d/OrbConstellation';
import TextScramble from '../components/effects/TextScramble';
import MagneticButton from '../components/effects/MagneticButton';
import CountUp from '../components/effects/CountUp';
import { playSound } from '../lib/sounds';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  { title: 'Multi-Agent Orchestration', desc: '6 specialized agents collaborate through Band rooms with @mention routing', icon: '\u2B21' },
  { title: 'Cross-Model Review', desc: 'Engineer writes with Gemini. Reviewer critiques with GPT-4o. Different blind spots.', icon: '\u25CE' },
  { title: 'Compound Memory', desc: 'Every task makes the system smarter. Conventions, learnings, decisions accumulate.', icon: '\u25C7' },
  { title: 'Self-Improving Skills', desc: 'Agent prompts evolve from measured outcomes. The 100th task is 10x better.', icon: '\u21BB' },
  { title: 'MCP Integration', desc: 'One tool call from Cursor starts the entire swarm. syn_task, syn_review, syn_memory.', icon: '\u26A1' },
  { title: 'Live Collaboration', desc: 'Watch agents think, hand off, and decide in real-time through the dashboard.', icon: '\u25CF' },
];

export default function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-title', { y: 60, opacity: 0, duration: 1.2, ease: 'power3.out', delay: 0.3 });
      gsap.from('.hero-subtitle', { y: 40, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.6 });
      gsap.from('.hero-cta', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.9 });

      gsap.utils.toArray<HTMLElement>('.feature-card').forEach((card, i) => {
        gsap.from(card, {
          scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none reverse' },
          y: 60,
          opacity: 0,
          duration: 0.8,
          delay: i * 0.1,
          ease: 'power2.out',
        });
      });

      gsap.from('.final-cta', {
        scrollTrigger: { trigger: '.final-cta', start: 'top 80%' },
        y: 40, opacity: 0, duration: 1, ease: 'power2.out',
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* HERO */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden gradient-wash">
        <div className="absolute inset-0 pointer-events-none">
          <OrbConstellation />
        </div>

        <div className="relative z-10 text-center px-6 max-w-3xl">
          <div className="hero-title" style={{ fontFamily: 'var(--font-display)' }}>
            <TextScramble text="Syndicate" className="text-[clamp(3rem,8vw,7rem)] leading-[0.9] tracking-tight text-white" as="h1" />
          </div>
          <p className="hero-subtitle text-xl md:text-2xl text-[var(--color-dim)] mt-6 font-light leading-relaxed">
            Compound intelligence that grows with you.<br />
            <span className="text-[var(--color-subtle)]">Six AI agents. One swarm. Every task makes it smarter.</span>
          </p>
          <div className="hero-cta mt-10 flex gap-4 justify-center">
            <MagneticButton>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { playSound('whoosh'); navigate('/app'); }}
                className="px-8 py-4 bg-[var(--color-indigo)] text-white rounded-full font-medium text-lg hover:shadow-[0_0_30px_rgba(107,98,242,0.3)] transition-shadow duration-300"
              >
                Enter the Swarm
              </motion.button>
            </MagneticButton>
            <motion.a
              whileHover={{ scale: 1.03 }}
              href="https://github.com/Adit-Jain-srm/Vibe-Syndicate"
              target="_blank"
              className="px-8 py-4 glass-pill text-[var(--color-soft)] font-medium text-lg hover:text-white transition-colors"
            >
              View Source
            </motion.a>
          </div>

          {/* Stats */}
          <div className="mt-14 flex justify-center gap-8 md:gap-12">
            {[
              { end: 6, label: 'Agents' },
              { end: 3, label: 'Model Providers' },
              { end: 5, label: 'Memory Layers' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <CountUp end={s.end} className="text-3xl font-light text-[var(--color-indigo)]" />
                <p className="text-[11px] text-[var(--color-muted)] mt-1 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--color-muted)]">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="w-px h-6 bg-[var(--color-border)]" />
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative py-32 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            How it works
          </h2>
          <p className="text-[var(--color-subtle)] mt-4 text-lg">Not a chatbot. A team.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card glass p-8 hover:glow-sm transition-all duration-500 group">
              <span className="text-2xl mb-4 block text-[var(--color-indigo)] group-hover:scale-110 transition-transform">{f.icon}</span>
              <h3 className="text-lg font-medium text-white mb-2">{f.title}</h3>
              <p className="text-sm text-[var(--color-subtle)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AGENT ROSTER */}
      <section className="relative py-24 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl tracking-tight mb-12" style={{ fontFamily: 'var(--font-display)' }}>The Swarm</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
          {['Nexus', 'Architect', 'Engineer', 'Reviewer', 'Researcher', 'QA'].map((name, i) => {
            const colors = ['#6b62f2', '#06b6d4', '#34d399', '#fb7185', '#fbbf24', '#8b5cf6'];
            return (
              <motion.div
                key={name}
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: 'spring' }}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className="w-14 h-14 rounded-full animate-pulse"
                  style={{ background: `radial-gradient(circle at 30% 30%, ${colors[i]}aa, ${colors[i]}33)`, boxShadow: `0 0 20px ${colors[i]}44` }}
                />
                <span className="text-[11px] text-[var(--color-dim)]">{name}</span>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta relative py-32 px-6 text-center gradient-wash">
        <h2 className="text-4xl md:text-6xl tracking-tight mb-6" style={{ fontFamily: 'var(--font-display)' }}>
          Ready to build with<br />compound intelligence?
        </h2>
        <MagneticButton className="inline-block">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { playSound('whoosh'); navigate('/app'); }}
            className="px-10 py-5 bg-[var(--color-indigo)] text-white rounded-full font-medium text-xl hover:shadow-[0_0_40px_rgba(107,98,242,0.35)] transition-shadow duration-300"
          >
            Enter Syndicate &rarr;
          </motion.button>
        </MagneticButton>
        <p className="text-[var(--color-muted)] mt-6 text-sm">
          Built for the <a href="https://lablab.ai/ai-hackathons/band-of-agents-hackathon" className="text-[var(--color-indigo)] hover:underline">Band of Agents Hackathon</a> by Adit Jain
        </p>
      </section>
    </div>
  );
}
