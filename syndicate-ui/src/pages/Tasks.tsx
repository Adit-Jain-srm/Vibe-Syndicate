export default function Tasks() {
  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] p-8">
      <h1 className="text-2xl font-medium tracking-tight mb-4">Task Pipeline</h1>
      <p className="text-[#8a8f98] mb-6">
        Task lifecycle: planning → coding → reviewing → complete.
      </p>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {['Planning', 'In Progress', 'Reviewing', 'Complete'].map((stage) => (
          <div key={stage} className="min-w-[280px] rounded-xl border border-[#23252a] bg-[#0f1011] p-4">
            <h3 className="text-sm font-medium text-[#8a8f98] uppercase tracking-wide mb-4">{stage}</h3>
            <div className="text-[#62666d] text-sm text-center py-8">No tasks</div>
          </div>
        ))}
      </div>
    </div>
  );
}
