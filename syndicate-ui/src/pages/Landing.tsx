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
    gsap.to(countRef.current, {
      value: 100,
      duration: 2.5,
      ease: 'power2.out',
      onUpdate: () => setCount(Math.floor(countRef.current.value)),
      onComplete: () => {
        setTimeout(() => setLoading(false), 400);
      },
    });
  }, []);

  return (
    <div className="relative z-10">
      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
          >
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/40 mb-4">
              Loading
            </p>
            <div className="flex gap-1 mb-6">
              <span className="w-1 h-1 rounded-full bg-white/30 animate-pulse" />
              <span className="w-1 h-1 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="w-1 h-1 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest">Completed</p>
            <p className="text-5xl font-light text-white mt-2 tabular-nums">{count}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content (after loading) */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          {/* Hero section */}
          <section className="min-h-[100dvh] flex flex-col items-center justify-center relative">
            <motion.h1
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-[12vw] md:text-[8vw] font-light text-white tracking-[-0.06em] leading-none"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Syndicate
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-sm md:text-base text-white/50 mt-4 tracking-[0.01em]"
            >
              Compound intelligence that grows with you
            </motion.p>
          </section>

          {/* Scroll sections */}
          <section className="min-h-[100dvh] flex items-center px-8 md:px-20">
            <div className="max-w-md">
              <h2 className="text-3xl md:text-4xl font-light text-white tracking-[-0.04em] leading-tight">
                Unlock collective intelligence.
              </h2>
              <p className="text-sm text-white/40 mt-4 leading-relaxed tracking-[0.01em]">
                Stop managing fragmented tools. Start building with a team of AI agents that collaborate, learn, and improve with every task.
              </p>
            </div>
          </section>

          <section className="min-h-[100dvh] flex items-center justify-end px-8 md:px-20">
            <div className="max-w-md text-right">
              <h2 className="text-3xl md:text-4xl font-light text-white tracking-[-0.04em] leading-tight">
                Six agents. One mind.
              </h2>
              <p className="text-sm text-white/40 mt-4 leading-relaxed tracking-[0.01em]">
                Nexus conducts. Architect plans. Engineer builds. Reviewer challenges. Researcher discovers. QA validates. All through Band rooms.
              </p>
            </div>
          </section>

          <section className="min-h-[100dvh] flex items-center px-8 md:px-20">
            <div className="max-w-md">
              <h2 className="text-3xl md:text-4xl font-light text-white tracking-[-0.04em] leading-tight">
                Memory that compounds.
              </h2>
              <p className="text-sm text-white/40 mt-4 leading-relaxed tracking-[0.01em]">
                Every task teaches the system. Conventions persist. Patterns emerge. The 100th task executes 10x better than the first.
              </p>
            </div>
          </section>

          <section className="min-h-[100dvh] flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-3xl md:text-5xl font-light text-white tracking-[-0.04em] leading-tight">
                Enter the swarm.
              </h2>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/app')}
                className="mt-8 px-8 py-3 rounded-full border border-white/10 text-sm text-white/80 hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
                style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                Request Access
              </motion.button>
            </div>
          </section>
        </motion.div>
      )}
    </div>
  );
}
