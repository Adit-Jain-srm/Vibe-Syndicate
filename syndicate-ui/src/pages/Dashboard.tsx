import { useEffect, useState } from 'react';
import { api, Agent, Task } from '../lib/api';

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskInput, setTaskInput] = useState('');

  useEffect(() => {
    api.getAgents().then(setAgents).catch(() => {});
    api.getTasks().then(setTasks).catch(() => {});
  }, []);

  const handleSubmitTask = async () => {
    if (!taskInput.trim()) return;
    await api.createTask(taskInput);
    setTaskInput('');
    api.getTasks().then(setTasks);
  };

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] p-8">
      <h1 className="text-4xl font-light tracking-tight mb-2">Syndicate</h1>
      <p className="text-[#62666d] text-sm mb-8">compound intelligence for developers</p>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-xl border border-[#23252a] bg-[#0f1011] p-6 transition-all hover:border-[#5e6ad2]/30">
          <p className="text-[#8a8f98] text-xs uppercase tracking-wide mb-1">Active Agents</p>
          <p className="text-3xl font-light">{agents.filter(a => a.status === 'active').length}/{agents.length}</p>
        </div>
        <div className="rounded-xl border border-[#23252a] bg-[#0f1011] p-6 transition-all hover:border-[#5e6ad2]/30">
          <p className="text-[#8a8f98] text-xs uppercase tracking-wide mb-1">Tasks</p>
          <p className="text-3xl font-light">{tasks.length}</p>
        </div>
        <div className="rounded-xl border border-[#23252a] bg-[#0f1011] p-6 transition-all hover:border-[#5e6ad2]/30">
          <p className="text-[#8a8f98] text-xs uppercase tracking-wide mb-1">Complete</p>
          <p className="text-3xl font-light">{tasks.filter(t => t.status === 'complete').length}</p>
        </div>
      </div>

      {/* Task Input */}
      <div className="rounded-xl border border-[#23252a] bg-[#0f1011] p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">Send a Task</h2>
        <div className="flex gap-3">
          <input
            value={taskInput}
            onChange={e => setTaskInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmitTask()}
            placeholder="Describe what to build..."
            className="flex-1 bg-[#161718] border border-[#23252a] rounded-lg px-4 py-3 text-[#f7f8f8] placeholder-[#62666d] focus:outline-none focus:border-[#5e6ad2] transition-colors"
          />
          <button
            onClick={handleSubmitTask}
            className="px-6 py-3 bg-[#5e6ad2] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Submit
          </button>
        </div>
      </div>

      {/* Recent Tasks */}
      {tasks.length > 0 && (
        <div className="rounded-xl border border-[#23252a] bg-[#0f1011] p-6">
          <h2 className="text-lg font-medium mb-4">Recent Tasks</h2>
          <div className="space-y-3">
            {tasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-[#161718] border border-[#23252a]">
                <div>
                  <p className="text-sm text-[#f7f8f8]">{task.description}</p>
                  <p className="text-xs text-[#62666d] mt-1">{task.id}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  task.status === 'complete' ? 'bg-[#27a644]/20 text-[#27a644]' :
                  task.status === 'pending' ? 'bg-[#5e6ad2]/20 text-[#5e6ad2]' :
                  'bg-[#8a8f98]/20 text-[#8a8f98]'
                }`}>{task.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
