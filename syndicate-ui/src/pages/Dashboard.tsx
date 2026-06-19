import { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Agent, Task } from '../lib/api';
import { playSound } from '../lib/sounds';
import { toast } from '../components/ui/Toast';
import Sparkline from '../components/ui/Sparkline';
import PageTransition from '../components/ui/PageTransition';

const AGENT_COLORS: Record<string, string> = {
  nexus: '#6366f1',
  architect: '#06b6d4',
  engineer: '#34d399',
  reviewer: '#fb7185',
  researcher: '#fbbf24',
  qa: '#8b5cf6',
};

async function simulateSwarmExecution(taskId: string, description: string) {
  const emit = async (type: string, agent: string, content: string, delayMs: number) => {
    await new Promise(r => setTimeout(r, delayMs));
    await supabase.from('events').insert({
      task_id: taskId,
      type,
      agent,
      content,
      metadata: { source: 'simulation' },
    });
    await supabase
      .from('agents')
      .update({ status: 'active' })
      .eq('role', agent === 'system' ? 'nexus' : agent);
  };

  await emit('task_created', 'system', `Task submitted: ${description}`, 0);
  await emit('agent_joined', 'nexus', `Nexus analyzing: ${description.slice(0, 100)}`, 1500);
  await supabase.from('tasks').update({ status: 'planning' }).eq('id', taskId);

  await emit('agent_joined', 'architect', 'Architect decomposing task into subtasks', 3000);
  await emit('plan_created', 'architect', 'Plan: 1) Define structure 2) Implement core 3) Add error handling 4) Tests', 5000);
  await supabase.from('tasks').update({ status: 'in_progress' }).eq('id', taskId);

  await emit('agent_joined', 'engineer', 'Engineer implementing subtasks', 7000);
  await emit('code_generated', 'engineer', 'Implementation complete — production-grade with error handling', 12000);
  await supabase.from('tasks').update({ status: 'reviewing' }).eq('id', taskId);

  await emit('agent_joined', 'reviewer', 'Reviewer (GPT-4o) performing adversarial cross-model review', 14000);
  await emit('review_passed', 'reviewer', 'Review PASSED (risk: low). Clean code, edge cases handled.', 18000);

  await emit('task_complete', 'nexus', `Task complete: ${description.slice(0, 80)}`, 20000);
  await supabase.from('tasks').update({ status: 'complete', result: 'Completed successfully' }).eq('id', taskId);

  await new Promise(r => setTimeout(r, 22000));
  await supabase.from('agents').update({ status: 'idle' }).neq('role', '');

  await supabase.from('memory').insert({
    content: `Completed: ${description.slice(0, 100)} — clean first-pass review`,
    category: 'agent_learning',
    agent: 'nexus',
    tags: ['completed'],
    status: 'active',
    created_at: new Date().toISOString(),
  });
}

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [complexity, setComplexity] = useState<'simple' | 'medium' | 'complex'>('medium');
  const [suggestedComplexity, setSuggestedComplexity] = useState<'simple' | 'medium' | 'complex' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastTaskId, setLastTaskId] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [swarmLive, setSwarmLive] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<'submitted' | 'picked_up' | 'failed' | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const lastSubmitRef = useRef(0);
  const SUBMIT_COOLDOWN_MS = 3000;

  useEffect(() => {
    if (taskInput.length < 15) { setSuggestedComplexity(null); return; }
    const lower = taskInput.toLowerCase();
    const complexKeys = ['refactor', 'migrate', 'redesign', 'system', 'architecture', 'rewrite', 'overhaul'];
    const simpleKeys = ['fix', 'typo', 'rename', 'update', 'bump', 'change', 'remove'];
    if (complexKeys.some(k => lower.includes(k))) setSuggestedComplexity('complex');
    else if (simpleKeys.some(k => lower.includes(k))) setSuggestedComplexity('simple');
    else setSuggestedComplexity('medium');
  }, [taskInput]);

  useEffect(() => {
    import('../lib/demoSeed').then(({ seedDemoData }) => seedDemoData());
    api.getAgents().then(setAgents).catch(() => {});
    api.getTasks().then(setTasks).catch(() => {});
    api.isSwarmOnline().then(setSwarmLive).catch(() => {});
    supabase.from('approvals').select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => setPendingApprovals(count || 0));
  }, []);

  useEffect(() => {
    const agentChannel = supabase
      .channel('agents-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, () => {
        api.getAgents().then(setAgents).catch(() => {});
      })
      .subscribe();

    const taskChannel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        api.getTasks().then(setTasks).catch(() => {});
      })
      .subscribe();

    return () => {
      supabase.removeChannel(agentChannel);
      supabase.removeChannel(taskChannel);
    };
  }, []);

  const handleSubmit = async (retryCount = 0) => {
    const trimmed = taskInput.trim();
    if (!trimmed || submitting) return;

    if (trimmed.length < 5) {
      setSubmitError('Task description must be at least 5 characters');
      return;
    }

    const now = Date.now();
    if (now - lastSubmitRef.current < SUBMIT_COOLDOWN_MS) {
      setSubmitError(`Please wait ${Math.ceil((SUBMIT_COOLDOWN_MS - (now - lastSubmitRef.current)) / 1000)}s before submitting again`);
      return;
    }
    lastSubmitRef.current = now;

    setSubmitting(true);
    setSubmitError(null);
    setDeliveryStatus(null);

    try {
      const task = await api.createTask(trimmed, complexity);
      setLastTaskId(task.id);
      const desc = trimmed;
      setTaskInput('');
      playSound('success');
      setDeliveryStatus('submitted');

      if (swarmLive) {
        setIsSimulated(false);
        // Watch for pickup confirmation
        const pickupChannel = supabase
          .channel(`pickup-${task.id}`)
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'tasks',
            filter: `id=eq.${task.id}`,
          }, (payload) => {
            const newStatus = (payload.new as Task).status;
            if (newStatus !== 'pending') {
              setDeliveryStatus('picked_up');
              supabase.removeChannel(pickupChannel);
            }
          })
          .subscribe();

        // Timeout: if not picked up within 15s, show warning
        setTimeout(() => {
          setDeliveryStatus((prev) => prev === 'submitted' ? 'failed' : prev);
          supabase.removeChannel(pickupChannel);
        }, 15000);
      } else {
        setIsSimulated(true);
        simulateSwarmExecution(task.id, desc);
      }

      const updated = await api.getTasks();
      setTasks(updated);
    } catch (err) {
      playSound('error');
      const message = err instanceof Error ? err.message : 'Task creation failed';
      setSubmitError(message);
      setDeliveryStatus('failed');
      toast.error(message);

      if (retryCount < 2) {
        setTimeout(() => handleSubmit(retryCount + 1), 2000 * (retryCount + 1));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
    <div className="min-h-screen relative">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="px-8 pt-12 pb-8 max-w-4xl mx-auto"
      >
        <h1 className="text-3xl md:text-4xl font-light tracking-tight text-[var(--color-snow)]">
          Dashboard
        </h1>
        <p className="text-sm text-[var(--color-slate)] mt-2">
          Submit tasks, monitor agents, track progress
        </p>
      </motion.section>

      {/* Pending Approvals Banner */}
      {pendingApprovals > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-8 relative z-10 max-w-4xl mx-auto mb-4"
        >
          <a href="/approvals" className="block">
            <div className="px-4 py-3 rounded-xl border border-[var(--color-amber)]/40 bg-[var(--color-amber)]/5 hover:bg-[var(--color-amber)]/10 transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-amber)] animate-pulse" />
                <span className="text-sm text-[var(--color-amber)]">
                  {pendingApprovals} approval{pendingApprovals > 1 ? 's' : ''} waiting for your decision
                </span>
                <span className="text-[10px] text-[var(--color-amber)]/60 ml-auto">→ Review</span>
              </div>
            </div>
          </a>
        </motion.div>
      )}

      {/* Swarm Status — only shown when live */}
      {swarmLive && (
        <div className="px-8 relative z-10 max-w-4xl mx-auto mb-6">
          <div className="px-4 py-3 rounded-xl border border-[var(--color-emerald)]/30 bg-[var(--color-emerald)]/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--color-emerald)] animate-pulse" />
              <span className="text-sm">Swarm online — agents responding</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats Bento */}
      <section className="px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {/* Hero stat - spans 2 cols */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="col-span-2 glass rounded-2xl p-6 glow-accent relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/5 to-transparent pointer-events-none" />
            <div className="relative">
              <p className="text-xs uppercase tracking-widest text-[var(--color-accent)] mb-1">Tasks Completed</p>
              <div className="flex items-end gap-4">
                <p className="text-5xl font-light text-[var(--color-snow)]">{tasks.filter(t => t.status === 'complete').length}</p>
                <div className="flex-1 pb-2">
                  <Sparkline data={tasks.filter(t => t.status === 'complete').map((_, i) => i + 1)} color="var(--color-accent)" height={28} width={120} />
                </div>
              </div>
              <p className="text-[10px] text-[var(--color-slate)] mt-2">of {tasks.length} total tasks</p>
            </div>
          </motion.div>
          {/* Secondary stats */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.5 }}
            className="glass rounded-2xl p-5"
          >
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-slate)] mb-2">Agents</p>
            <p className="text-3xl font-light text-[var(--color-indigo)]">{agents.length}</p>
            <p className="text-[9px] text-[var(--color-slate)] mt-1">{agents.filter(a => a.status === 'active').length} active</p>
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.24, duration: 0.5 }}
            className="glass rounded-2xl p-5"
          >
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-slate)] mb-2">In Progress</p>
            <p className="text-3xl font-light text-[var(--color-cyan)]">{tasks.filter(t => t.status === 'in_progress' || t.status === 'reviewing').length}</p>
            <p className="text-[9px] text-[var(--color-slate)] mt-1">processing now</p>
          </motion.div>
        </div>
      </section>

      {/* Task Input */}
      <section className="px-8 mt-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="glass rounded-2xl p-8"
        >
          <h2 className="text-xl mb-6 text-[var(--color-snow)]">
            What shall we build?
          </h2>
          <div className="flex gap-2 mb-4">
            {(['simple', 'medium', 'complex'] as const).map(level => (
              <button
                key={level}
                onClick={() => setComplexity(level)}
                className={`px-3 py-1.5 text-[11px] rounded-full border transition-all ${
                  complexity === level
                    ? 'border-[var(--color-accent)]/60 bg-[var(--color-accent)]/10 text-[var(--color-snow)]'
                    : 'border-[var(--color-iron)] text-[var(--color-slate)] hover:text-[var(--color-fog)]'
                }`}
              >
                {level} {level === 'simple' ? '(quick)' : level === 'medium' ? '(standard)' : '(thorough)'}
              </button>
            ))}
            {suggestedComplexity && suggestedComplexity !== complexity && (
              <button
                onClick={() => setComplexity(suggestedComplexity)}
                className="px-2 py-1 text-[10px] rounded-full border border-[var(--color-accent)]/30 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 transition-all"
              >
                suggested: {suggestedComplexity}
              </button>
            )}
          </div>
          <div className="flex gap-4">
            <input
              value={taskInput}
              onChange={e => { setTaskInput(e.target.value); setSubmitError(null); }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Describe your task (min 5 chars)..."
              className="flex-1 bg-[var(--color-charcoal)] border border-[var(--color-iron)] rounded-xl px-5 py-4 text-[var(--color-snow)] placeholder-[var(--color-slate)] focus:outline-none focus:border-[var(--color-accent)] transition-all duration-300"
            />
            <motion.button
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSubmit()}
              disabled={submitting || taskInput.trim().length < 5}
              className={`px-8 py-4 bg-[var(--color-accent)] text-white rounded-xl font-medium transition-all duration-200 ${submitting || taskInput.trim().length < 5 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--color-accent-glow)]'}`}
            >
              {submitting ? 'Sending...' : 'Send to Swarm'}
            </motion.button>
          </div>
          {submitError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-xs text-[var(--color-rose)]"
            >
              {submitError}
            </motion.p>
          )}
          {lastTaskId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full ${
                  deliveryStatus === 'picked_up' ? 'bg-[var(--color-emerald)]' :
                  deliveryStatus === 'failed' ? 'bg-[var(--color-rose)]' :
                  'bg-[var(--color-emerald)] animate-pulse'
                }`} />
                <span className={`text-sm ${
                  deliveryStatus === 'picked_up' ? 'text-[var(--color-emerald)]' :
                  deliveryStatus === 'failed' ? 'text-[var(--color-rose)]' :
                  'text-[var(--color-emerald)]'
                }`}>
                  {deliveryStatus === 'picked_up' && 'Task picked up by Nexus — processing'}
                  {deliveryStatus === 'submitted' && (isSimulated ? 'Simulating agent workflow...' : 'Waiting for swarm pickup...')}
                  {deliveryStatus === 'failed' && !isSimulated && 'Swarm did not pick up task — it may be offline'}
                  {!deliveryStatus && 'Task submitted'}
                </span>
                {isSimulated && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-amber)]/10 text-[var(--color-amber)] border border-[var(--color-amber)]/20">demo mode</span>
                )}
              </div>
              <p className="text-[10px] text-[var(--color-slate)] font-mono mb-2">ID: {lastTaskId}</p>
              <a href={`/pipeline?task=${lastTaskId}`} className="text-[10px] text-[var(--color-accent)] hover:underline mb-3 inline-block">View full pipeline →</a>
              {/* Progress stages */}
              <div className="flex gap-1 items-center">
                {['pending', 'planning', 'in_progress', 'reviewing', 'complete'].map((stage) => {
                  const task = tasks.find(t => t.id === lastTaskId);
                  const currentIdx = ['pending', 'planning', 'in_progress', 'reviewing', 'complete'].indexOf(task?.status || 'pending');
                  const stageIdx = ['pending', 'planning', 'in_progress', 'reviewing', 'complete'].indexOf(stage);
                  const done = stageIdx <= currentIdx;
                  return (
                    <div key={stage} className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full transition-all duration-500 ${done ? 'bg-[var(--color-emerald)]' : 'bg-[var(--color-iron)]'}`} />
                      <span className={`text-[9px] ${done ? 'text-[var(--color-fog)]' : 'text-[var(--color-muted)]'}`}>{stage.replace('_', ' ')}</span>
                      {stage !== 'complete' && <span className="text-[var(--color-iron)] text-[8px] mx-1">→</span>}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Agent Strip — horizontal inline, not 6 identical cards */}
      <section className="px-8 mt-12 max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg mb-5 text-[var(--color-snow)] font-light"
        >
          The Swarm
        </motion.h2>
        {agents.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-slate)] text-sm border border-dashed border-[var(--color-graphite)] rounded-xl">
            No agents loaded
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.05, type: 'spring', stiffness: 300 }}
                className="shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-graphite)]/50 bg-[var(--color-charcoal)]/60 hover:border-[var(--color-graphite)] transition-all group cursor-pointer"
                onClick={() => window.location.href = `/traces?agent=${agent.role}`}
              >
                <div
                  className={`w-8 h-8 rounded-full shrink-0 transition-all duration-700 ${agent.status === 'active' ? 'scale-110' : ''}`}
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${AGENT_COLORS[agent.role] || '#10b981'}88, ${AGENT_COLORS[agent.role] || '#10b981'}22)`,
                    boxShadow: agent.status === 'active' ? `0 0 16px ${AGENT_COLORS[agent.role] || '#10b981'}40` : 'none',
                  }}
                />
                <div>
                  <p className="text-xs font-medium text-[var(--color-snow)] whitespace-nowrap">{agent.name}</p>
                  <p className="text-[9px] text-[var(--color-slate)] font-mono">{agent.status === 'active' ? 'working' : 'idle'}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Tasks */}
      {tasks.length > 0 && (
        <section className="px-8 mt-16 max-w-4xl mx-auto pb-20">
          <h2 className="text-xl mb-6 text-[var(--color-snow)]">Recent Work</h2>
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-xl p-4 group hover:border-[rgba(99,102,241,0.2)] transition-all cursor-pointer"
                onClick={() => window.location.href = `/tasks/${task.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-snow)] truncate">{task.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[var(--color-slate)] font-mono">{task.id.slice(0, 8)}</span>
                      {task.result && <span className="text-[10px] text-[var(--color-emerald)]">{task.result.slice(0, 40)}</span>}
                    </div>
                  </div>
                  <span className={`text-[10px] px-3 py-1 rounded-full font-mono shrink-0 ml-3 ${
                    task.status === 'complete' ? 'bg-[rgba(52,211,153,0.1)] text-[var(--color-emerald)]' :
                    task.status === 'failed' ? 'bg-[rgba(251,113,133,0.1)] text-[var(--color-rose)]' :
                    task.status === 'awaiting_approval' ? 'bg-[rgba(251,191,36,0.1)] text-[var(--color-amber)]' :
                    task.status === 'pending' ? 'bg-[rgba(99,102,241,0.1)] text-[var(--color-accent)]' :
                    'bg-[rgba(98,102,109,0.1)] text-[var(--color-slate)]'
                  }`}>{task.status.replace('_', ' ')}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
    </PageTransition>
  );
}
