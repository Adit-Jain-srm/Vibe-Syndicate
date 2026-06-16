import { motion } from 'motion/react';
import { type ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Page-level enter/exit animation wrapper.
 * Wrap each page component with this for smooth route transitions.
 */
export default function PageTransition({
  children,
  className,
}: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        duration: 0.25,
        ease: [0.25, 0.46, 0.45, 0.94], // ease-out-quad
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
