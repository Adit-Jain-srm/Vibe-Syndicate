export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] p-8">
      <h1 className="text-4xl font-light tracking-tight mb-2">Syndicate</h1>
      <p className="text-[#62666d] text-sm mb-8">compound intelligence for developers</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="rounded-xl border border-[#23252a] bg-[#0f1011] p-6">
          <p className="text-[#8a8f98] text-xs uppercase tracking-wide mb-1">Active Agents</p>
          <p className="text-3xl font-light text-[#f7f8f8]">0</p>
        </div>
        <div className="rounded-xl border border-[#23252a] bg-[#0f1011] p-6">
          <p className="text-[#8a8f98] text-xs uppercase tracking-wide mb-1">Tasks Completed</p>
          <p className="text-3xl font-light text-[#f7f8f8]">0</p>
        </div>
        <div className="rounded-xl border border-[#23252a] bg-[#0f1011] p-6">
          <p className="text-[#8a8f98] text-xs uppercase tracking-wide mb-1">Learnings Stored</p>
          <p className="text-3xl font-light text-[#f7f8f8]">0</p>
        </div>
      </div>

      <div className="rounded-xl border border-[#23252a] bg-[#0f1011] p-8">
        <h2 className="text-lg font-medium text-[#f7f8f8] mb-4">Getting Started</h2>
        <p className="text-[#8a8f98] leading-relaxed">
          Register your agents on Band, configure your environment, and send your first task.
          The swarm will plan, code, review, and learn — growing smarter with every cycle.
        </p>
      </div>
    </div>
  );
}
