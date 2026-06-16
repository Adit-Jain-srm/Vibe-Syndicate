import { Link, useLocation } from 'react-router-dom';

const NAV = [
  { path: '/', label: 'Dashboard', icon: '◆' },
  { path: '/live', label: 'Live Room', icon: '●' },
  { path: '/agents', label: 'Agents', icon: '◎' },
  { path: '/tasks', label: 'Tasks', icon: '▬' },
  { path: '/memory', label: 'Memory', icon: '◇' },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-[#0f1011] border-r border-[#23252a] flex flex-col py-6 px-3 z-40">
      <div className="px-3 mb-8">
        <h1 className="text-lg font-medium text-[#f7f8f8] tracking-tight">Syndicate</h1>
        <p className="text-[10px] text-[#62666d] mt-0.5">compound intelligence</p>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === item.path
                ? 'bg-[#5e6ad2]/10 text-[#5e6ad2] font-medium'
                : 'text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-[#161718]'
            }`}
          >
            <span className="text-xs">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="px-3 text-[10px] text-[#62666d]">
        <p>6 agents registered</p>
        <p>Band.ai connected</p>
      </div>
    </aside>
  );
}
