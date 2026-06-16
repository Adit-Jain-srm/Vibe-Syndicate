import { cn } from '../../lib/cn';

interface PulsingDotProps {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

/**
 * Agent status dot with infinite breathing animation.
 * Color-coded per agent role. Inactive dots are muted and static.
 */
export default function PulsingDot({
  color = 'var(--color-accent)',
  size = 'md',
  active = true,
  className,
}: PulsingDotProps) {
  return (
    <span className={cn('relative inline-flex', className)}>
      {/* Pulse ring (active only) */}
      {active && (
        <span
          className="absolute inset-0 rounded-full animate-[pulse-ring_2.4s_ease-out_infinite]"
          style={{ backgroundColor: color, opacity: 0.3 }}
        />
      )}
      {/* Core dot */}
      <span
        className={cn(
          'rounded-full shrink-0',
          SIZE_MAP[size],
          active && 'dot-breathing',
        )}
        style={{
          backgroundColor: color,
          opacity: active ? 1 : 0.35,
        }}
      />
    </span>
  );
}

/** Pre-defined agent colors for convenience */
export const AGENT_COLORS: Record<string, string> = {
  nexus: 'var(--color-agent-nexus)',
  architect: 'var(--color-agent-architect)',
  engineer: 'var(--color-agent-engineer)',
  reviewer: 'var(--color-agent-reviewer)',
  researcher: 'var(--color-agent-researcher)',
  qa: 'var(--color-agent-qa)',
  system: 'var(--color-slate)',
  mcp: 'var(--color-mist)',
  user: 'var(--color-snow)',
};

/** Raw hex colors for inline styles where CSS vars don't work */
export const AGENT_COLORS_HEX: Record<string, string> = {
  nexus: '#5e6ad2',
  architect: '#02b8cc',
  engineer: '#27a644',
  reviewer: '#eb5757',
  researcher: '#e4f222',
  qa: '#8a8f98',
  system: '#62666d',
  mcp: '#d0d6e0',
  user: '#f7f8f8',
};
