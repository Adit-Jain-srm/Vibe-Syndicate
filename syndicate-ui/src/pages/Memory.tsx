import { useEffect, useState } from 'react';
import { api, Memory } from '../lib/api';

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    api.getMemories().then(setMemories).catch(() => {});
  }, []);

  const handleStore = async () => {
    if (!newContent.trim()) return;
    await api.storeMemory(newContent, 'project');
    setNewContent('');
    api.getMemories().then(setMemories);
  };

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] p-8">
      <h1 className="text-2xl font-medium tracking-tight mb-6">Memory & Evolution</h1>

      {/* Store memory */}
      <div className="rounded-xl border border-[#23252a] bg-[#0f1011] p-6 mb-6">
        <h2 className="text-sm font-medium text-[#8a8f98] uppercase tracking-wide mb-3">Store Learning</h2>
        <div className="flex gap-3">
          <input
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStore()}
            placeholder="Record a convention, learning, or decision..."
            className="flex-1 bg-[#161718] border border-[#23252a] rounded-lg px-4 py-2 text-sm text-[#f7f8f8] placeholder-[#62666d] focus:outline-none focus:border-[#5e6ad2]"
          />
          <button onClick={handleStore} className="px-4 py-2 bg-[#5e6ad2] text-white text-sm rounded-lg hover:opacity-90">Store</button>
        </div>
      </div>

      {/* Memory list */}
      <div className="space-y-3">
        {memories.map((mem, i) => (
          <div key={mem.id || i} className="rounded-xl border border-[#23252a] bg-[#0f1011] p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#5e6ad2]/20 text-[#5e6ad2]">{mem.category}</span>
              <span className="text-[10px] text-[#62666d]">{mem.agent}</span>
            </div>
            <p className="text-sm text-[#f7f8f8]">{mem.content}</p>
            <p className="text-[10px] text-[#62666d] mt-2">{new Date(mem.created_at).toLocaleString()}</p>
          </div>
        ))}
        {memories.length === 0 && (
          <p className="text-[#62666d] text-sm">No memories stored yet. Complete tasks or store learnings above.</p>
        )}
      </div>
    </div>
  );
}
