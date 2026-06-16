/**
 * Syndicate Logo — a pulsing accent-colored dot with optional wordmark.
 * Used in the AuthShell's video panel and potentially the landing page.
 */

import { motion } from 'motion/react';

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export function Logo({ size = 48, showWordmark = true, className = '' }: LogoProps) {
  const dotSize = Math.max(size * 0.18, 8);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Pulsing accent dot */}
      <motion.div
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(94,106,210,0.4)',
            '0 0 0 12px rgba(94,106,210,0)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          backgroundColor: '#5e6ad2',
        }}
      />

      {showWordmark && (
        <span
          className="font-medium tracking-tight text-white"
          style={{ fontSize: size * 0.28 }}
        >
          Syndicate
        </span>
      )}
    </div>
  );
}
