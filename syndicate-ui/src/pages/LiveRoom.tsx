export default function LiveRoom() {
  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] p-8">
      <h1 className="text-2xl font-medium tracking-tight mb-4">Live Room</h1>
      <p className="text-[#8a8f98] mb-6">
        Agent collaboration feed — real-time Band room messages will stream here.
      </p>

      <div className="rounded-xl border border-[#23252a] bg-[#0f1011] p-6 min-h-[400px] flex items-center justify-center">
        <p className="text-[#62666d] text-sm">Waiting for agent activity...</p>
      </div>
    </div>
  );
}
