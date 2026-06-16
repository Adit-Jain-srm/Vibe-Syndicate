export default function Agents() {
  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] p-8">
      <h1 className="text-2xl font-medium tracking-tight mb-4">Agent Roster</h1>
      <p className="text-[#8a8f98] mb-6">
        Swarm agents, their roles, models, and current status.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {['Nexus', 'Architect', 'Engineer', 'Reviewer', 'Researcher', 'QA'].map((name) => (
          <div key={name} className="rounded-xl border border-[#23252a] bg-[#0f1011] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#62666d]" />
              <span className="font-medium text-[#f7f8f8]">{name}</span>
            </div>
            <p className="text-[#62666d] text-sm">Idle — not yet registered</p>
          </div>
        ))}
      </div>
    </div>
  );
}
