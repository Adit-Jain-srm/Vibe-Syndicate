import { motion } from 'motion/react';
import type { TaskEvent } from '../lib/api';
import { formatRelative } from '../lib/timeago';
import AgentAvatar from './AgentAvatar';

interface TaskConversationProps {
  events: TaskEvent[];
  className?: string;
}

const AGENT_COLORS: Record<string, string> = {
  nexus: '#6366f1',
  architect: '#06b6d4',
  engineer: '#34d399',
  reviewer: '#fb7185',
  researcher: '#fbbf24',
  qa: '#8b5cf6',
  system: '#62666d',
  mcp: '#9ca3af',
  user: '#f7f8f8',
};

export default function TaskConversation({ events, className = '' }: TaskConversationProps) {
  const grouped = groupConsecutive(events);

  return (
    <div className={`space-y-4 ${className}`}>
      {grouped.map((group, gi) => {
        const agent = group[0].agent;
        const color = AGENT_COLORS[agent] || '#62666d';
        const prevAgent = gi > 0 ? grouped[gi - 1][0].agent : null;
        const showRouting = prevAgent && prevAgent !== agent && prevAgent !== 'system';

        return (
          <div key={gi}>
            {showRouting && (
              <div className="flex items-center justify-center gap-2 py-1">
                <span className="text-[9px] text-slate font-mono">
                  {prevAgent} → {agent}
                </span>
              </div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(gi * 0.05, 0.3) }}
              className="flex gap-3"
            >
              <div className="shrink-0 mt-1">
                <AgentAvatar role={agent} size={28} active />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium capitalize" style={{ color }}>{agent}</span>
                  <span className="text-[9px] text-slate font-mono">{group[0].type.replace(/_/g, ' ')}</span>
                  <span className="text-[9px] text-slate/50 ml-auto">{formatRelative(group[0].created_at || group[0].timestamp)}</span>
                </div>
                <div className="space-y-1.5">
                  {group.map((evt, ei) => (
                    <div
                      key={evt.id || ei}
                      className="rounded-lg px-3 py-2 text-sm text-mist leading-relaxed"
                      style={{ background: `${color}08`, borderLeft: `2px solid ${color}30` }}
                    >
                      {evt.content}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

function groupConsecutive(events: TaskEvent[]): TaskEvent[][] {
  const groups: TaskEvent[][] = [];
  for (const evt of events) {
    const last = groups[groups.length - 1];
    if (last && last[0].agent === evt.agent) {
      last.push(evt);
    } else {
      groups.push([evt]);
    }
  }
  return groups;
}
