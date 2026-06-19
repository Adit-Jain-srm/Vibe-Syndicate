import { motion } from 'motion/react';

interface TypingIndicatorProps {
  agentName: string;
  color: string;
}

export default function TypingIndicator({ agentName, color }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="flex items-center gap-2.5 px-4 py-2.5"
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-xs capitalize" style={{ color }}>{agentName}</span>
      <span className="flex items-center gap-0.5">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-slate"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </span>
      <span className="text-[10px] text-slate ml-1">thinking…</span>
    </motion.div>
  );
}
