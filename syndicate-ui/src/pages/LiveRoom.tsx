import { useEffect, useState, useRef } from 'react';

interface StreamEvent {
  type: string;
  agent: string;
  content: string;
  timestamp: string;
}

export default function LiveRoom() {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [taskId, setTaskId] = useState('');
  const [connected, setConnected] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const connect = (tid: string) => {
    if (!tid) return;
    const source = new EventSource(`/api/events/${tid}/stream`);
    source.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'connected') {
        setConnected(true);
      } else {
        setEvents(prev => [...prev, data]);
      }
    };
    source.onerror = () => setConnected(false);
  };

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events]);

  const AGENT_COLORS: Record<string, string> = {
    nexus: '#5e6ad2', architect: '#02b8cc', engineer: '#27a644',
    reviewer: '#eb5757', researcher: '#e4f222', qa: '#8a8f98', system: '#62666d', mcp: '#d0d6e0',
  };

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] p-8">
      <h1 className="text-2xl font-medium tracking-tight mb-4">Live Room</h1>

      <div className="flex gap-3 mb-6">
        <input
          value={taskId}
          onChange={e => setTaskId(e.target.value)}
          placeholder="Enter task ID to watch..."
          className="flex-1 bg-[#161718] border border-[#23252a] rounded-lg px-4 py-2 text-sm text-[#f7f8f8] placeholder-[#62666d] focus:outline-none focus:border-[#5e6ad2]"
        />
        <button onClick={() => connect(taskId)} className="px-4 py-2 bg-[#5e6ad2] text-white text-sm rounded-lg hover:opacity-90">
          {connected ? '● Connected' : 'Connect'}
        </button>
      </div>

      <div ref={feedRef} className="rounded-xl border border-[#23252a] bg-[#0f1011] p-4 min-h-[400px] max-h-[600px] overflow-y-auto space-y-2">
        {events.length === 0 && (
          <p className="text-[#62666d] text-sm text-center py-16">
            {connected ? 'Waiting for agent activity...' : 'Enter a task ID and connect to watch agents collaborate in real-time.'}
          </p>
        )}
        {events.map((evt, i) => (
          <div key={i} className="flex gap-3 p-2 rounded-lg hover:bg-[#161718] transition-colors">
            <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: AGENT_COLORS[evt.agent] || '#8a8f98' }} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: AGENT_COLORS[evt.agent] || '#8a8f98' }}>{evt.agent}</span>
                <span className="text-[10px] text-[#62666d]">{evt.type}</span>
              </div>
              <p className="text-sm text-[#d0d6e0] mt-0.5 break-words">{evt.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
