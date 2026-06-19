import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  GitBranch, Clock, Bot, ChevronRight, ChevronDown,
  Zap, CheckCircle, XCircle, Search, Loader2,
} from 'lucide-react';
import { api } from '../lib/api';
import type { TaskEvent } from '../lib/api';
import PageTransition from '../components/ui/PageTransition';
import GlassPanel from '../components/ui/GlassPanel';
import AnimatedCard from '../components/ui/AnimatedCard';
import StatusBadge from '../components/ui/StatusBadge';

/** Agent color mapping — matches globals.css agent color vars. */
const AGENT_COLORS: Record<string, string> = {
  nexus: '#5e6ad2',
  architect: '#02b8cc',
  engineer: '#27a644',
  reviewer: '#eb5757',
  researcher: '#e4f222',
  qa: '#8a8f98',
  system: '#62666d',
};

function getAgentColor(agent: string): string {
  return AGENT_COLORS[agent.toLowerCase()] || '#62666d';
}

/** Single trace span — expandable with content. */
function TraceSpan({
  event,
  index,
}: {
  event: TaskEvent;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = getAgentColor(event.agent);

  const iconMap: Record<string, JSX.Element> = {
    task_created: <Zap size={12} />,
    plan_created: <GitBranch size={12} />,
    code_generated: <ChevronRight size={12} />,
    review_passed: <CheckCircle size={12} />,
    review_failed: <XCircle size={12} />,
    agent_joined: <Bot size={12} />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left group"
      >
        <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-obsidian/50 transition-colors">
          {/* Timeline dot */}
          <div className="relative flex flex-col items-center">
            <div
              className="w-2.5 h-2.5 rounded-full ring-2 ring-offset-1 ring-offset-onyx"
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}
            />
            {/* Connector line */}
            <div className="w-px h-6 bg-graphite mt-1" />
          </div>

          {/* Icon */}
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ backgroundColor: `${color}18`, color }}
          >
            {iconMap[event.type] || <Clock size={12} />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-medium uppercase tracking-wide"
                style={{ color }}
              >
                {event.agent}
              </span>
              <span className="text-xs text-slate">·</span>
              <span className="text-[10px] text-slate font-mono">
                {event.type.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-sm text-fog truncate mt-0.5">
              {event.content.slice(0, 120)}
              {event.content.length > 120 && '…'}
            </p>
          </div>

          {/* Timestamp */}
          <span className="text-[10px] text-slate font-mono whitespace-nowrap">
            {(event.created_at || event.timestamp) ? new Date(event.created_at || event.timestamp).toLocaleTimeString() : '—'}
          </span>

          {/* Expand indicator */}
          <span className="text-slate group-hover:text-fog transition-colors">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="ml-[42px] mb-2"
        >
          <div className="rounded-lg bg-obsidian border border-graphite/50 p-4">
            {event.metadata?.reasoning && (
              <div className="mb-3 p-2.5 rounded-md bg-accent/5 border border-accent/10">
                <p className="text-[9px] text-accent uppercase tracking-wide mb-1 font-medium">Reasoning</p>
                <p className="text-xs text-fog/80 leading-relaxed">{String(event.metadata.reasoning)}</p>
              </div>
            )}
            <pre className="text-xs text-fog font-mono whitespace-pre-wrap break-words leading-relaxed">
              {event.content}
            </pre>
            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div className="mt-3 pt-3 border-t border-graphite/50">
                <div className="flex items-center gap-2 flex-wrap">
                  {event.metadata.model && (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                      model: {String(event.metadata.model)}
                    </span>
                  )}
                  {event.metadata.confidence != null && (
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                      Number(event.metadata.confidence) >= 0.8 ? 'bg-emerald/10 text-emerald' :
                      Number(event.metadata.confidence) >= 0.5 ? 'bg-amber/10 text-amber' : 'bg-rose/10 text-rose'
                    }`}>
                      confidence: {Math.round(Number(event.metadata.confidence) * 100)}%
                    </span>
                  )}
                  {event.metadata.source && (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-graphite/30 text-slate">
                      via {String(event.metadata.source)}
                    </span>
                  )}
                </div>
                {Object.keys(event.metadata).filter(k => !['model', 'confidence', 'reasoning', 'source'].includes(k)).length > 0 && (
                  <pre className="text-[10px] text-slate font-mono mt-2">
                    {JSON.stringify(
                      Object.fromEntries(Object.entries(event.metadata).filter(([k]) => !['model', 'confidence', 'reasoning', 'source'].includes(k))),
                      null, 2
                    )}
                  </pre>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function Traces() {
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.getRecentEvents()
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.agent.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q) ||
      e.content.toLowerCase().includes(q)
    );
  });

  return (
    <PageTransition>
      <div className="min-h-screen p-8 max-w-[1000px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-light tracking-tight text-snow">
            Traces
          </h1>
          <p className="text-sm text-slate mt-1">
            Agent activity timeline — every action, every handoff, every decision
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="mb-6"
        >
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by agent, type, or content…"
              className="w-full bg-surface-input border border-graphite rounded-lg pl-9 pr-4 py-2.5 text-sm text-snow placeholder-slate focus:outline-none focus:border-accent/60 transition-colors"
            />
          </div>
        </motion.div>

        {/* Timeline */}
        <GlassPanel className="p-6">
          {!loading && filtered.some(e => e.metadata?.source === 'simulation') && (
            <div className="flex items-center gap-2 mb-4 px-1">
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber/10 text-amber border border-amber/20 font-mono">
                demo mode
              </span>
              <span className="text-[10px] text-slate">Some events are from simulation (swarm was offline)</span>
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-slate">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading traces…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <GitBranch size={28} className="mx-auto text-graphite mb-3" />
              <p className="text-sm text-slate">
                {searchQuery
                  ? 'No traces match your filter.'
                  : 'No agent activity yet. Submit a task to see traces.'}
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {filtered.map((event, i) => (
                <TraceSpan
                  key={event.id || `${event.type}-${i}`}
                  event={event}
                  index={i}
                />
              ))}
            </div>
          )}
        </GlassPanel>
      </div>
    </PageTransition>
  );
}
