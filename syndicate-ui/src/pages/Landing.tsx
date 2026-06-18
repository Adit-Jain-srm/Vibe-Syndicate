import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';

export default function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const countRef = useRef({ value: 0 });

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    gsap.to(countRef.current, {
      value: 100,
      duration: 3,
      ease: 'power2.out',
      onUpdate: () => setCount(Math.floor(countRef.current.value)),
      onComplete: () => {
        setTimeout(() => {
          setLoading(false);
          document.body.style.overflow = '';
        }, 600);
      },
    });

    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
      {/* Loading screen - scroll locked, matches Dala exactly */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 flex flex-col items-center justify-center"
            style={{ zIndex: 100, background: '#000' }}
          >
            {/* Tagline */}
            <p className="text-white/50 text-sm md:text-base tracking-wide text-center mb-16">
              Your swarm has the answer.
              <br />
              Ask Syndicate to build it.
            </p>

            {/* Loading indicator bottom-left */}
            <div className="fixed bottom-8 left-8">
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-1">Loading</p>
              <div className="flex gap-1 mb-3">
                <span className="w-[3px] h-[3px] bg-white/40 animate-pulse" />
                <span className="w-[3px] h-[3px] bg-white/40 animate-pulse" style={{ animationDelay: '0.15s' }} />
                <span className="w-[3px] h-[3px] bg-white/40 animate-pulse" style={{ animationDelay: '0.3s' }} />
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1">Completed</p>
              <p className="text-4xl font-light text-white tabular-nums tracking-tight">{count}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main scrollable content - ALL backgrounds transparent */}
      {!loading && (
        <div>
          {/* Hero */}
          <section className="min-h-[100dvh] flex flex-col items-center justify-center px-6">
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-[14vw] md:text-[9vw] font-light text-white tracking-[-0.06em] leading-[0.9]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Syndicate
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-white/40 text-sm md:text-base mt-6 tracking-wide"
            >
              Compound intelligence that grows with you.
            </motion.p>
          </section>

          {/* Section 2 - left aligned */}
          <section className="min-h-[100dvh] flex items-center px-8 md:px-20">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8 }}
              className="max-w-lg"
            >
              <h2 className="text-2xl md:text-4xl font-light text-white tracking-[-0.04em] leading-tight">
                Unlock collective intelligence.
              </h2>
              <p className="text-white/35 text-sm mt-5 leading-relaxed max-w-[50ch]">
                Stop managing fragmented tools. Start building with a team of AI agents that collaborate, learn, and improve with every task.
              </p>
            </motion.div>
          </section>

          {/* Section 3 - right aligned */}
          <section className="min-h-[100dvh] flex items-center justify-end px-8 md:px-20">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8 }}
              className="max-w-lg text-right"
            >
              <h2 className="text-2xl md:text-4xl font-light text-white tracking-[-0.04em] leading-tight">
                Six agents. One mind.
              </h2>
              <p className="text-white/35 text-sm mt-5 leading-relaxed max-w-[50ch] ml-auto">
                Nexus conducts. Architect plans. Engineer builds. Reviewer challenges. Researcher discovers. QA validates.
              </p>
            </motion.div>
          </section>

          {/* Section 4 - left aligned */}
          <section className="min-h-[100dvh] flex items-center px-8 md:px-20">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8 }}
              className="max-w-lg"
            >
              <h2 className="text-2xl md:text-4xl font-light text-white tracking-[-0.04em] leading-tight">
                Memory that compounds.
              </h2>
              <p className="text-white/35 text-sm mt-5 leading-relaxed max-w-[50ch]">
                Every task teaches the system. Conventions persist. Patterns emerge. The 100th task executes 10x better than the first.
              </p>
            </motion.div>
          </section>

          {/* Section 5 - CTA centered */}
          <section className="min-h-[100dvh] flex flex-col items-center justify-center px-6">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h2 className="text-3xl md:text-5xl font-light text-white tracking-[-0.04em]">
                Enter the swarm.
              </h2>
              <button
                onClick={() => navigate('/app')}
                className="mt-10 px-8 py-3 text-sm text-white/70 border border-white/10 rounded-full hover:text-white hover:border-white/25 hover:bg-white/[0.03] transition-all duration-300 cursor-pointer"
                style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                Request Access
              </button>
            </motion.div>
          </section>
        </div>
      )}
    </>
  );
}
