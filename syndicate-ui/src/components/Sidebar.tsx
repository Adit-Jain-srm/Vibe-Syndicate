import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';

const NAV = [
  { path: '/app', label: 'Dashboard', icon: '◈' },
  { path: '/live', label: 'Live', icon: '◉' },
  { path: '/agents', label: 'Agents', icon: '⬡' },
  { path: '/tasks', label: 'Tasks', icon: '▣' },
  { path: '/memory', label: 'Memory', icon: '◇' },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-full w-16 hover:w-56 glass border-r border-white/5 flex flex-col py-8 px-2 z-50 transition-all duration-300 overflow-hidden group">
      {/* Logo */}
      <div className="px-3 mb-12 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white text-sm font-bold shrink-0">
          S
        </div>
        <span className="text-sm font-medium text-[var(--color-snow)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          Syndicate
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-2">
        {NAV.map(item => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                active
                  ? 'bg-[rgba(99,102,241,0.1)] text-[var(--color-accent)]'
                  : 'text-[var(--color-slate)] hover:text-[var(--color-snow)] hover:bg-white/5'
              }`}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                {item.label}
              </span>
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute left-0 w-0.5 h-5 bg-[var(--color-accent)] rounded-r"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Status indicator */}
      <div className="px-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--color-emerald)] animate-pulse shrink-0" />
          <span className="text-[10px] text-[var(--color-slate)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            6 agents online
          </span>
        </div>
      </div>
    </aside>
  );
}
