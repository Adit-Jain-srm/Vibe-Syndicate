import { useEffect, useState } from 'react';
import { api, Task } from '../lib/api';

const STAGES = ['pending', 'planning', 'in_progress', 'reviewing', 'complete'];

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    api.getTasks().then(setTasks).catch(() => {});
    const interval = setInterval(() => api.getTasks().then(setTasks).catch(() => {}), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] p-8">
      <h1 className="text-2xl font-medium tracking-tight mb-6">Task Pipeline</h1>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const stageTasks = tasks.filter(t => t.status === stage);
          return (
            <div key={stage} className="min-w-[260px] rounded-xl border border-[#23252a] bg-[#0f1011] p-4">
              <h3 className="text-xs font-medium text-[#8a8f98] uppercase tracking-wide mb-4">{stage.replace('_', ' ')}</h3>
              <div className="space-y-2">
                {stageTasks.map(task => (
                  <div key={task.id} className="p-3 rounded-lg bg-[#161718] border border-[#23252a] text-sm">
                    <p className="text-[#f7f8f8] line-clamp-2">{task.description}</p>
                    <p className="text-[10px] text-[#62666d] mt-1 font-mono">{task.id}</p>
                  </div>
                ))}
                {stageTasks.length === 0 && (
                  <p className="text-[#62666d] text-xs text-center py-4">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
