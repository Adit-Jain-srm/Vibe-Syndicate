import { cn } from '../../lib/cn';

interface SkeletonProps {
  variant?: 'line' | 'card' | 'avatar' | 'stat' | 'text';
  className?: string;
  lines?: number;
}

/**
 * Shimmer skeleton loader — never blank space, always graceful loading.
 * ADR-008: "Skeleton → shimmer → content. Every async operation has a graceful loading state."
 */
export default function SkeletonLoader({
  variant = 'line',
  className,
  lines = 1,
}: SkeletonProps) {
  if (variant === 'avatar') {
    return (
      <div className={cn('w-10 h-10 rounded-full skeleton', className)} />
    );
  }

  if (variant === 'text') {
    return (
      <div className={cn('flex gap-2', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-8 rounded-full" style={{ width: `${60 + Math.random() * 40}px` }} />
        ))}
      </div>
    );
  }

  if (variant === 'stat') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-8 w-16 rounded" />
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'rounded-xl border border-graphite/50 bg-charcoal p-5 space-y-3',
          className,
        )}
      >
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    );
  }

  // line variant
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-3 rounded"
          style={{ width: `${70 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  );
}
