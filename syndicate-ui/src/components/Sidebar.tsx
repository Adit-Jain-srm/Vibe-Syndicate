import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../lib/theme';

const NAV = [
  { path: '/app', label: 'Dashboard', icon: '◈' },
  { path: '/pipeline', label: 'Pipeline', icon: '▸' },
  { path: '/live', label: 'Live', icon: '◉' },
  { path: '/agents', label: 'Agents', icon: '⬡' },
  { path: '/tasks', label: 'Tasks', icon: '▣' },
  { path: '/metrics', label: 'Metrics', icon: '◔' },
  { path: '/memory', label: 'Memory', icon: '◇' },
  { path: '/approvals', label: 'Approvals', icon: '⊙' },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const [theme, setTheme] = useTheme();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 h-full w-16 hover:w-56 glass border-r border-white/5 flex-col py-8 px-2 z-50 transition-all duration-300 overflow-hidden group hidden md:flex">
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
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer: theme toggle + status */}
        <div className="px-3 space-y-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[var(--color-slate)] hover:text-[var(--color-snow)] hover:bg-white/5 transition-all"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={14} className="shrink-0" /> : <Moon size={14} className="shrink-0" />}
            <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </span>
          </motion.button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-emerald)] animate-pulse shrink-0" />
            <span className="text-[10px] text-[var(--color-slate)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              6 agents online
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass border-t border-white/5">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV.slice(0, 5).map(item => {
            const active = pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs transition-all ${
                  active ? 'text-[var(--color-accent)]' : 'text-[var(--color-slate)]'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="text-[9px]">{item.label}</span>
                {active && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -bottom-1 w-4 h-0.5 bg-[var(--color-accent)] rounded-full"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
