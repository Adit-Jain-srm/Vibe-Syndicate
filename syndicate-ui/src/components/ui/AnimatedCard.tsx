import { motion, type HTMLMotionProps } from 'motion/react';
import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  glass?: boolean;
  delay?: number;
  className?: string;
}

/**
 * Motion-wrapped card with entry animation, hover lift, and press scale.
 * Use `glass` prop for the glassmorphic variant with backdrop-blur.
 */
export default function AnimatedCard({
  children,
  glass = false,
  delay = 0,
  className,
  ...props
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        delay,
      }}
      whileHover={{
        scale: 1.015,
        transition: { type: 'spring', stiffness: 400, damping: 25 },
      }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'rounded-xl transition-colors duration-300',
        glass
          ? 'glass-card'
          : 'border border-graphite bg-charcoal hover-glow',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
