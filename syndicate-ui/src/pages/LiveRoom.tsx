import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, Wifi, WifiOff } from 'lucide-react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { TaskEvent } from '../lib/api';
import { playSound } from '../lib/sounds';
import PageTransition from '../components/ui/PageTransition';
import GlassPanel from '../components/ui/GlassPanel';
import PulsingDot, { AGENT_COLORS_HEX } from '../components/ui/PulsingDot';

export default function LiveRoom() {
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [taskId, setTaskId] = useState('');
  const [connected, setConnected] = useState(false);
  const [showAll, setShowAll] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);

  // Load recent events on mount (show all mode)
  useEffect(() => {
    if (showAll) {
      api.getRecentEvents().then((evts) => {
        setEvents(evts.reverse());
      }).catch(() => {});
    }
  }, [showAll]);

  // Realtime subscription
  useEffect(() => {
    const filter = taskId.trim() && !showAll
      ? { filter: `task_id=eq.${taskId.trim()}` }
      : {};

    const channel = supabase
      .channel(`events-live-${taskId || 'all'}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'events',
        ...filter,
      }, (payload) => {
        const newEvent = payload.new as TaskEvent;
        setEvents(prev => [...prev, newEvent]);
        playSound('ping');
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(channel); };
  }, [taskId, showAll]);

  // Auto-scroll
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTo({
        top: feedRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [events]);

  const handleConnect = () => {
    if (taskId.trim()) {
      setShowAll(false);
      setEvents([]);
      api.getEvents(taskId.trim()).then(setEvents).catch(() => {});
    }
  };

  const handleShowAll = () => {
    setShowAll(true);
    setTaskId('');
  };

  return (
    <PageTransition>
      <div className="min-h-screen p-8 max-w-[1200px]">
        {/* ── Header ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3">
            <Radio size={20} className="text-accent" />
            <h1 className="text-2xl font-light tracking-tight text-snow">
              Live Room
            </h1>
          </div>
          <p className="text-sm text-slate mt-1">
            Watch agents collaborate in real-time
          </p>
        </motion.div>

        {/* ── Connection Panel ────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <GlassPanel className="p-5 mb-6">
            <div className="flex gap-3 items-center">
              <input
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                placeholder="Enter task ID to filter… (leave empty for all)"
                className="flex-1 bg-surface-input border border-graphite rounded-lg px-4 py-2.5 text-sm text-snow placeholder-slate focus:outline-none focus:border-accent/60 transition-all font-mono"
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleConnect}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  connected
                    ? 'bg-emerald/15 text-emerald border border-emerald/30'
                    : 'bg-accent text-white hover:bg-accent/90'
                }`}
              >
                {connected ? (
                  <>
                    <Wifi size={14} />
                    Live
                  </>
                ) : (
                  <>
                    <WifiOff size={14} />
                    Connect
                  </>
                )}
              </motion.button>
              {!showAll && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleShowAll}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate border border-graphite hover:border-accent/40 transition-all"
                >
                  Show All
                </motion.button>
              )}
            </div>
          </GlassPanel>
        </motion.div>

        {/* ── Agent Legend ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-4 mb-4 px-1"
        >
          {Object.entries(AGENT_COLORS_HEX)
            .filter(([name]) => !['system', 'mcp', 'user'].includes(name))
            .map(([name, color]) => (
              <div key={name} className="flex items-center gap-1.5 text-[11px] text-fog">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="capitalize">{name}</span>
              </div>
            ))}
        </motion.div>

        {/* ── Event Feed ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <GlassPanel className="p-4 min-h-[500px] max-h-[calc(100vh-320px)] overflow-hidden flex flex-col">
            <div
              ref={feedRef}
              className="flex-1 overflow-y-auto space-y-1 pr-1"
            >
              {events.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-20">
                  <Radio
                    size={32}
                    className={`mb-3 ${
                      connected ? 'text-emerald dot-breathing-subtle' : 'text-slate'
                    }`}
                  />
                  <p className="text-slate text-sm text-center">
                    {connected
                      ? 'Waiting for agent activity…'
                      : showAll
                        ? 'No events yet. Submit a task from the Dashboard.'
                        : 'Enter a task ID and connect to watch agents collaborate.'}
                  </p>
                </div>
              )}

              <AnimatePresence mode="popLayout">
                {events.map((evt, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                    }}
                    className="flex gap-3 p-3 rounded-lg hover:bg-obsidian/50 transition-colors"
                  >
                    <PulsingDot
                      color={AGENT_COLORS_HEX[evt.agent] || '#8a8f98'}
                      size="sm"
                      active={true}
                      className="mt-1.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-xs font-medium capitalize"
                          style={{
                            color:
                              AGENT_COLORS_HEX[evt.agent] || '#8a8f98',
                          }}
                        >
                          {evt.agent}
                        </span>
                        <span className="text-[10px] text-slate font-mono">
                          {evt.type}
                        </span>
                      </div>
                      <p className="text-sm text-mist leading-relaxed break-words">
                        {evt.content}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* ── Event count ──────────────────────── */}
            {events.length > 0 && (
              <div className="border-t border-graphite/50 pt-3 mt-2 flex items-center justify-between text-[11px] text-slate">
                <span>{events.length} events</span>
                <span className="font-mono">
                  {showAll ? 'all tasks' : `task: ${taskId.slice(0, 8)}…`}
                </span>
              </div>
            )}
          </GlassPanel>
        </motion.div>
      </div>
    </PageTransition>
  );
}
