import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { playSound } from '../lib/sounds';

export default function Landing() {
  const navigate = useNavigate();
  const [entering, setEntering] = useState(false);

  const handleEnter = useCallback(() => {
    setEntering(true);
    playSound('success');
    setTimeout(() => navigate('/app'), 1200);
  }, [navigate]);

  return (
    <AnimatePresence>
      {!entering && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-20 flex flex-col items-center justify-center"
          style={{ pointerEvents: entering ? 'none' : 'auto' }}
        >
          {/* Title */}
          <motion.h1
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-[10vw] md:text-[8vw] font-normal tracking-[-0.04em] text-white leading-none"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Syndicate
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="text-base md:text-lg text-[#9ca3af] mt-4 max-w-md text-center font-light"
          >
            Compound intelligence that grows with you
          </motion.p>

          {/* Agent count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
            className="mt-8 flex items-center gap-3"
          >
            {['#6366f1', '#06b6d4', '#34d399', '#fb7185', '#fbbf24', '#8b5cf6'].map((color, i) => (
              <motion.div
                key={color}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 2.4 + i * 0.1, type: 'spring', stiffness: 300 }}
                className="w-2 h-2 rounded-full"
                style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
              />
            ))}
            <span className="text-[11px] text-[#6b7280] ml-2">6 agents online</span>
          </motion.div>

          {/* Enter CTA */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 3, duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEnter}
            className="mt-12 px-8 py-3 rounded-full bg-white/[0.06] border border-white/[0.1] text-sm text-white backdrop-blur-sm hover:bg-white/[0.1] hover:border-white/[0.2] transition-all cursor-pointer"
          >
            Enter the Swarm
          </motion.button>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 4, duration: 1 }}
            className="absolute bottom-8 text-[10px] text-[#4a4f58] tracking-widest uppercase"
          >
            The constellation is live
          </motion.div>
        </motion.div>
      )}

      {/* Entering transition — zoom effect */}
      {entering && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0, scale: 2 }}
          transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-20 flex items-center justify-center pointer-events-none"
        >
          <div className="w-32 h-32 rounded-full bg-[#6366f1]/20 blur-3xl" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
