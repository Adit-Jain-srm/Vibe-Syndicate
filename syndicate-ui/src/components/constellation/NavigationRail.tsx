import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../lib/theme';
import { useConstellationStore } from '../../stores/constellation';

const PRIMARY_NAV = [
  { path: '/app', label: 'Core', color: '#6366f1' },
  { path: '/pipeline', label: 'Pipeline', color: '#06b6d4' },
  { path: '/live', label: 'Live', color: '#34d399' },
  { path: '/tasks', label: 'Tasks', color: '#a78bfa' },
  { path: '/approvals', label: 'Approvals', color: '#fb7185' },
  { path: '/metrics', label: 'Metrics', color: '#fbbf24' },
];

const SECONDARY_NAV = [
  { path: '/memory', label: 'Memory', color: '#8b5cf6' },
  { path: '/agents', label: 'Agents', color: '#9ca3af' },
  { path: '/traces', label: 'Traces', color: '#60a5fa' },
  { path: '/controls', label: 'Controls', color: '#f97316' },
  { path: '/docs', label: 'Docs', color: '#d1d5db' },
];

export default function NavigationRail() {
  const { pathname } = useLocation();
  const [theme, setTheme] = useTheme();
  const pendingApprovals = useConstellationStore(s => s.pendingApprovals);

  if (pathname === '/') return null;

  return (
    <>
      {/* Desktop: vertical left rail */}
      <nav className="fixed left-3 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-2">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center text-white text-xs font-bold mb-3"
        >
          S
        </motion.div>

        {/* Primary nav */}
        {PRIMARY_NAV.map((item, i) => {
          const isActive = pathname === item.path;
          const showBadge = item.path === '/approvals' && pendingApprovals > 0;
          return (
            <motion.div
              key={item.path}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.35 + i * 0.04, type: 'spring', stiffness: 300 }}
            >
              <Link
                to={item.path}
                className="group relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300"
                style={{
                  background: isActive ? `${item.color}25` : 'transparent',
                  boxShadow: isActive ? `0 0 12px ${item.color}30` : 'none',
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    background: isActive ? item.color : '#4a4f58',
                    boxShadow: isActive ? `0 0 8px ${item.color}` : 'none',
                    transform: isActive ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
                {showBadge && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose text-[8px] text-white flex items-center justify-center font-bold">
                    {pendingApprovals > 9 ? '9+' : pendingApprovals}
                  </span>
                )}
                <span className="absolute left-12 px-2 py-1 rounded-md text-[10px] nav-tooltip opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.label}
                </span>
              </Link>
            </motion.div>
          );
        })}

        {/* Separator */}
        <div className="w-4 h-px bg-white/10 my-1" />

        {/* Secondary nav */}
        {SECONDARY_NAV.map((item, i) => {
          const isActive = pathname === item.path;
          return (
            <motion.div
              key={item.path}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.04, type: 'spring', stiffness: 300 }}
            >
              <Link
                to={item.path}
                className="group relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300"
                style={{
                  background: isActive ? `${item.color}20` : 'transparent',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    background: isActive ? item.color : '#3a3f48',
                    transform: isActive ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
                <span className="absolute left-11 px-2 py-1 rounded-md text-[10px] nav-tooltip opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.label}
                </span>
              </Link>
            </motion.div>
          );
        })}

        {/* Theme toggle */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.9 }}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          className="mt-2 w-7 h-7 flex items-center justify-center rounded-full text-slate hover:text-snow transition-colors duration-300"
        >
          {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
        </motion.button>
      </nav>

      {/* Mobile: bottom horizontal with labels */}
      <nav className="nav-rail-mobile fixed bottom-3 left-1/2 -translate-x-1/2 z-40 flex md:hidden items-center gap-1 px-3 py-2 rounded-2xl bg-[rgba(8,9,12,0.85)] backdrop-blur-xl border border-white/5">
        {PRIMARY_NAV.slice(0, 5).map(item => {
          const isActive = pathname === item.path;
          const showBadge = item.path === '/approvals' && pendingApprovals > 0;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-12 h-10 rounded-xl transition-all"
              style={{ background: isActive ? `${item.color}15` : 'transparent' }}
            >
              <span
                className="w-2 h-2 rounded-full mb-0.5"
                style={{ background: isActive ? item.color : '#4a4f58' }}
              />
              <span
                className="text-[8px] leading-none"
                style={{ color: isActive ? item.color : '#62666d' }}
              >
                {item.label}
              </span>
              {showBadge && (
                <span className="absolute top-0.5 right-1 w-2.5 h-2.5 rounded-full bg-rose" />
              )}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex flex-col items-center justify-center w-10 h-10 rounded-xl text-slate hover:text-snow transition-colors"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </nav>
    </>
  );
}
