import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'subtle' | 'elevated';
}

/**
 * Dimension-inspired glassmorphic container.
 * Uses backdrop-blur + translucent bg + hairline border.
 */
export default function GlassPanel({
  children,
  className,
  variant = 'default',
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        'rounded-xl',
        variant === 'default' && 'glass-surface',
        variant === 'subtle' &&
          'bg-charcoal/60 backdrop-blur-sm border border-graphite/40',
        variant === 'elevated' &&
          'glass-card',
        className,
      )}
    >
      {children}
    </div>
  );
}
