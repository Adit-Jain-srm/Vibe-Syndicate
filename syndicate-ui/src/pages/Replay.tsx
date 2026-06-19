import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Play, Pause, SkipForward, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import type { Task, TaskEvent } from '../lib/api';
import { formatRelative } from '../lib/timeago';
import AgentAvatar from '../components/AgentAvatar';
import PageTransition from '../components/ui/PageTransition';
import GlassPanel from '../components/ui/GlassPanel';

const STAGES = ['task_created', 'plan_created', 'code_generated', 'review_passed', 'task_complete'];

export default function Replay() {
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!taskId) return;
    Promise.all([api.getTask(taskId), api.getEvents(taskId)])
      .then(([t, e]) => { setTask(t); setEvents(e); })
      .catch(() => {});
  }, [taskId]);

  useEffect(() => {
    if (playing && currentIdx < events.length - 1) {
      timerRef.current = setInterval(() => {
        setCurrentIdx(prev => {
          if (prev >= events.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500 / speed);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, speed, events.length, currentIdx]);

  const visibleEvents = events.slice(0, currentIdx + 1);
  const currentStage = visibleEvents.reduce((stage, e) => {
    const idx = STAGES.indexOf(e.type);
    return idx > stage ? idx : stage;
  }, 0);
  const progress = events.length > 1 ? (currentIdx / (events.length - 1)) * 100 : 0;

  return (
    <PageTransition>
      <div className="min-h-screen p-8 max-w-[900px]">
        <Link to={`/tasks/${taskId}`} className="inline-flex items-center gap-1.5 text-xs text-slate hover:text-fog transition-colors mb-6">
          <ArrowLeft size={12} /> Back to task
        </Link>

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-xl font-light text-snow">Replay</h1>
          {task && <p className="text-sm text-slate mt-1 truncate">{task.description}</p>}
        </motion.div>

        {/* Stage indicators */}
        <div className="flex items-center gap-2 mb-6">
          {STAGES.map((stage, i) => (
            <div key={stage} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full transition-all duration-500 ${i <= currentStage ? 'bg-accent scale-110' : 'bg-graphite'}`} />
              <span className={`text-[10px] ${i <= currentStage ? 'text-fog' : 'text-slate'}`}>{stage.replace(/_/g, ' ')}</span>
              {i < STAGES.length - 1 && <span className="text-graphite text-[8px]">→</span>}
            </div>
          ))}
        </div>

        {/* Event feed */}
        <GlassPanel className="p-6 mb-6 max-h-[400px] overflow-y-auto">
          {visibleEvents.map((evt, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-3 p-2 rounded-lg"
            >
              <AgentAvatar role={evt.agent} size={20} active={i === currentIdx} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-fog capitalize">{evt.agent}</span>
                  <span className="text-[9px] text-slate font-mono">{evt.type.replace(/_/g, ' ')}</span>
                  <span className="text-[9px] text-slate/50 ml-auto">{formatRelative(evt.created_at || evt.timestamp)}</span>
                </div>
                <p className="text-sm text-mist mt-0.5 leading-relaxed">{evt.content}</p>
              </div>
            </motion.div>
          ))}
        </GlassPanel>

        {/* Controls */}
        <GlassPanel className="p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPlaying(!playing)}
              className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent hover:bg-accent/20 transition-colors"
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              onClick={() => setCurrentIdx(Math.min(currentIdx + 1, events.length - 1))}
              className="w-8 h-8 rounded-full bg-graphite/30 flex items-center justify-center text-slate hover:text-fog transition-colors"
            >
              <SkipForward size={14} />
            </button>

            {/* Progress bar */}
            <div className="flex-1 h-1.5 bg-graphite rounded-full overflow-hidden cursor-pointer"
              onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                setCurrentIdx(Math.round(pct * (events.length - 1)));
              }}
            >
              <motion.div
                className="h-full bg-accent rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <span className="text-[10px] text-slate font-mono w-12 text-right">
              {currentIdx + 1}/{events.length}
            </span>

            {/* Speed control */}
            <div className="flex items-center gap-1">
              {[1, 2, 4].map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-0.5 text-[9px] rounded ${speed === s ? 'bg-accent/20 text-accent' : 'text-slate hover:text-fog'}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </GlassPanel>
      </div>
    </PageTransition>
  );
}
