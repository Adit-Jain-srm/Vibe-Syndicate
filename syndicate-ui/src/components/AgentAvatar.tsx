interface AgentAvatarProps {
  role: string;
  size?: number;
  active?: boolean;
}

const AGENT_CONFIGS: Record<string, { color: string; shape: string; glow: string }> = {
  nexus: { color: '#6b62f2', shape: 'M12 2L22 12L12 22L2 12Z', glow: 'rgba(107,98,242,0.4)' },
  architect: { color: '#06b6d4', shape: 'M12 2L20 7V17L12 22L4 17V7Z', glow: 'rgba(6,182,212,0.4)' },
  engineer: { color: '#34d399', shape: 'M4 4H20V20H4Z', glow: 'rgba(52,211,153,0.4)' },
  reviewer: { color: '#fb7185', shape: 'M12 2L15 9H22L16 14L18 21L12 17L6 21L8 14L2 9H9Z', glow: 'rgba(251,113,133,0.4)' },
  researcher: { color: '#fbbf24', shape: 'M12 2A10 10 0 1 0 12 22A10 10 0 1 0 12 2Z', glow: 'rgba(251,191,36,0.4)' },
  qa: { color: '#8b5cf6', shape: 'M12 2L16 6L22 6L18 12L22 18L16 18L12 22L8 18L2 18L6 12L2 6L8 6Z', glow: 'rgba(139,92,246,0.4)' },
};

export default function AgentAvatar({ role, size = 40, active = false }: AgentAvatarProps) {
  const config = AGENT_CONFIGS[role] || AGENT_CONFIGS.nexus;

  return (
    <div
      className={`relative rounded-full flex items-center justify-center transition-all duration-500 ${active ? 'animate-pulse' : ''}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 35%, ${config.color}cc, ${config.color}44)`,
        boxShadow: active ? `0 0 24px ${config.glow}, 0 0 48px ${config.glow}` : `0 0 12px ${config.glow}`,
      }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
        <path d={config.shape} fill={config.color} opacity={0.9} />
      </svg>
      {active && (
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: config.color, opacity: 0.15 }}
        />
      )}
    </div>
  );
}
