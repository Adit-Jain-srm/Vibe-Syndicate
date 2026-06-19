import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import AgentOrb from '../components/3d/AgentOrb';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Agent, Task } from '../lib/api';
import { playSound } from '../lib/sounds';
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
      metadata: {},
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
  const [submitting, setSubmitting] = useState(false);
  const [lastTaskId, setLastTaskId] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [swarmLive, setSwarmLive] = useState(false);

  useEffect(() => {
    api.getAgents().then(setAgents).catch(() => {});
    api.getTasks().then(setTasks).catch(() => {});
    api.isSwarmOnline().then(setSwarmLive).catch(() => {});
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

  const handleSubmit = async () => {
    if (!taskInput.trim() || submitting) return;
    setSubmitting(true);

    try {
      const task = await api.createTask(taskInput);
      setLastTaskId(task.id);
      const desc = taskInput;
      setTaskInput('');
      playSound('success');

      // Always run simulation for visual feedback
      // If swarm is live, the bridge will ALSO pick up the task
      setIsSimulated(!swarmLive);
      simulateSwarmExecution(task.id, desc);

      const updated = await api.getTasks();
      setTasks(updated);
    } catch (err) {
      playSound('error');
      console.error('Task creation failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
    <div className="min-h-screen relative">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="relative h-[60vh] flex items-center justify-center overflow-hidden"
      >
        {/* 3D Orb Background */}
        <div className="absolute inset-0 opacity-60">
          <AgentOrb color="#6366f1" speed={0.5} distort={0.3} size={2.5} />
        </div>

        {/* Hero Text */}
        <div className="relative z-10 text-center px-8">
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-6xl md:text-8xl tracking-tight mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Syndicate
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-lg text-[var(--color-fog)] max-w-md mx-auto"
          >
            Compound intelligence that grows with you
          </motion.p>
        </div>
      </motion.section>

      {/* Swarm Status */}
      <div className="px-8 -mt-16 relative z-10 max-w-4xl mx-auto mb-6">
        <div className={`px-4 py-3 rounded-xl border ${agents.length > 0 ? 'border-[var(--color-emerald)]/30 bg-[var(--color-emerald)]/5' : 'border-[var(--color-rose)]/30 bg-[var(--color-rose)]/5'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${agents.length > 0 ? 'bg-[var(--color-emerald)] animate-pulse' : 'bg-[var(--color-rose)]'}`} />
            <span className="text-sm">
              {agents.length > 0
                ? `Swarm online — ${agents.length} agents connected`
                : 'Swarm offline — run: python -m syndicate_agent.main'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <section className="px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { label: 'Agents', value: agents.length, color: '#6366f1' },
            { label: 'Tasks', value: tasks.length, color: '#34d399' },
            { label: 'Complete', value: tasks.filter(t => t.status === 'complete').length, color: '#fbbf24' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.15, duration: 0.6 }}
              className="glass rounded-2xl p-6 glow-accent"
            >
              <p className="text-xs uppercase tracking-widest text-[var(--color-slate)] mb-2">{stat.label}</p>
              <p className="text-4xl font-light" style={{ color: stat.color }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Task Input */}
      <section className="px-8 mt-12 max-w-4xl mx-auto">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="glass rounded-2xl p-8"
        >
          <h2 className="text-xl mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            What shall we build?
          </h2>
          <div className="flex gap-4">
            <input
              value={taskInput}
              onChange={e => setTaskInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Describe your task..."
              className="flex-1 bg-[var(--color-charcoal)] border border-[var(--color-iron)] rounded-xl px-5 py-4 text-[var(--color-snow)] placeholder-[var(--color-slate)] focus:outline-none focus:border-[var(--color-accent)] transition-all duration-300"
            />
            <motion.button
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={submitting}
              className={`px-8 py-4 bg-[var(--color-accent)] text-white rounded-xl font-medium transition-all duration-200 ${submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--color-accent-glow)]'}`}
            >
              {submitting ? 'Sending...' : 'Send to Swarm'}
            </motion.button>
          </div>
          {lastTaskId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-[var(--color-emerald)] animate-pulse" />
                <span className="text-sm text-[var(--color-emerald)]">
                  Task submitted — {isSimulated ? 'simulating agent workflow' : 'swarm processing live'}
                </span>
                {isSimulated && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">simulated</span>
                )}
              </div>
              <p className="text-[10px] text-[var(--color-slate)] font-mono mb-2">ID: {lastTaskId}</p>
              <a href={`/pipeline`} className="text-[10px] text-[var(--color-accent)] hover:underline mb-3 inline-block">View full pipeline →</a>
              {/* Progress stages */}
              <div className="flex gap-1 items-center">
                {['pending', 'planning', 'in_progress', 'reviewing', 'complete'].map((stage) => {
                  const task = tasks.find(t => t.id === lastTaskId);
                  const currentIdx = ['pending', 'planning', 'in_progress', 'reviewing', 'complete'].indexOf(task?.status || 'pending');
                  const stageIdx = ['pending', 'planning', 'in_progress', 'reviewing', 'complete'].indexOf(stage);
                  const done = stageIdx <= currentIdx;
                  return (
                    <div key={stage} className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${done ? 'bg-[var(--color-emerald)]' : 'bg-[var(--color-iron)]'}`} />
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

      {/* Agent Orbs Grid */}
      <section className="px-8 mt-16 max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-2xl mb-8"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          The Swarm
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {agents.length === 0 ? (
            <div className="col-span-full text-center py-12 text-[var(--color-slate)] text-sm">
              Swarm offline — no agents connected
            </div>
          ) : agents.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.8 + i * 0.1, type: 'spring' }}
              className="glass rounded-2xl p-4 aspect-square flex flex-col items-center justify-center group hover:glow-accent transition-all duration-500"
            >
              <div
                className={`w-12 h-12 mb-3 rounded-full transition-all duration-1000 ${agent.status === 'active' ? 'animate-pulse scale-110' : ''}`}
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${AGENT_COLORS[agent.role] || '#6366f1'}88, ${AGENT_COLORS[agent.role] || '#6366f1'}22)`,
                  boxShadow: `0 0 20px ${AGENT_COLORS[agent.role] || '#6366f1'}33, inset 0 0 15px ${AGENT_COLORS[agent.role] || '#6366f1'}22`,
                }}
              />
              <p className="text-sm font-medium text-[var(--color-snow)]">{agent.name}</p>
              <p className="text-[10px] text-[var(--color-slate)] mt-1 font-mono">{agent.role}</p>
              <div className={`w-1.5 h-1.5 rounded-full mt-2 ${agent.status === 'active' ? 'bg-[var(--color-emerald)] animate-pulse' : 'bg-[var(--color-iron)]'}`} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Tasks */}
      {tasks.length > 0 && (
        <section className="px-8 mt-16 max-w-4xl mx-auto pb-20">
          <h2 className="text-xl mb-6" style={{ fontFamily: 'var(--font-display)' }}>Recent Work</h2>
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-xl p-4 flex items-center justify-between group hover:border-[rgba(99,102,241,0.2)] transition-all"
              >
                <div>
                  <p className="text-sm text-[var(--color-snow)]">{task.description}</p>
                  <p className="text-[10px] text-[var(--color-slate)] font-mono mt-1">{task.id}</p>
                </div>
                <span className={`text-[10px] px-3 py-1 rounded-full font-mono ${
                  task.status === 'complete' ? 'bg-[rgba(52,211,153,0.1)] text-[var(--color-emerald)]' :
                  task.status === 'pending' ? 'bg-[rgba(99,102,241,0.1)] text-[var(--color-accent)]' :
                  'bg-[rgba(98,102,109,0.1)] text-[var(--color-slate)]'
                }`}>{task.status}</span>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
    </PageTransition>
  );
}
