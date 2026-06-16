import { cn } from '../../lib/cn';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_STYLES: Record<string, { dot: string; bg: string; text: string }> = {
  active:      { dot: 'bg-emerald',  bg: 'bg-emerald/15',  text: 'text-emerald' },
  idle:        { dot: 'bg-slate',    bg: 'bg-slate/15',    text: 'text-slate' },
  thinking:    { dot: 'bg-accent',   bg: 'bg-accent/15',   text: 'text-accent' },
  error:       { dot: 'bg-crimson',  bg: 'bg-crimson/15',  text: 'text-crimson' },
  pending:     { dot: 'bg-accent',   bg: 'bg-accent/15',   text: 'text-accent' },
  planning:    { dot: 'bg-cyan',     bg: 'bg-cyan/15',     text: 'text-cyan' },
  in_progress: { dot: 'bg-amber',    bg: 'bg-amber/15',    text: 'text-amber' },
  reviewing:   { dot: 'bg-crimson',  bg: 'bg-crimson/15',  text: 'text-crimson' },
  complete:    { dot: 'bg-emerald',  bg: 'bg-emerald/15',  text: 'text-emerald' },
  failed:      { dot: 'bg-crimson',  bg: 'bg-crimson/15',  text: 'text-crimson' },
};

/**
 * Linear-style inline status pill with colored dot + label.
 */
export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.idle;
  const label = status.replace(/_/g, ' ');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide',
        style.bg,
        style.text,
        className,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', style.dot)} />
      {label}
    </span>
  );
}
