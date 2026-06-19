import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../lib/theme';

const NAV_ITEMS = [
  { path: '/app', label: 'Core', color: '#6366f1' },
  { path: '/pipeline', label: 'Pipeline', color: '#06b6d4' },
  { path: '/live', label: 'Live', color: '#34d399' },
  { path: '/metrics', label: 'Metrics', color: '#fbbf24' },
  { path: '/memory', label: 'Memory', color: '#8b5cf6' },
  { path: '/approvals', label: 'Approvals', color: '#fb7185' },
  { path: '/agents', label: 'Agents', color: '#9ca3af' },
  { path: '/docs', label: 'Docs', color: '#d1d5db' },
];

export default function NavigationRail() {
  const { pathname } = useLocation();
  const [theme, setTheme] = useTheme();

  if (pathname === '/') return null;

  return (
    <>
      {/* Desktop: vertical left rail */}
      <nav className="fixed left-3 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-3">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="w-8 h-8 rounded-full bg-[#6366f1] flex items-center justify-center text-white text-xs font-bold mb-4"
        >
          S
        </motion.div>

        {NAV_ITEMS.map((item, i) => {
          const isActive = pathname === item.path;
          return (
            <motion.div
              key={item.path}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.05, type: 'spring', stiffness: 300 }}
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
                {/* Tooltip */}
                <span className="absolute left-12 px-2 py-1 rounded-md text-[10px] text-white bg-[#1a1a1a] border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
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
          className="mt-4 w-7 h-7 flex items-center justify-center rounded-full text-[#4a4f58] hover:text-white transition-colors"
        >
          {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
        </motion.button>
      </nav>

      {/* Mobile: bottom horizontal */}
      <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 flex md:hidden items-center gap-2 px-4 py-2 rounded-full bg-[rgba(8,9,12,0.8)] backdrop-blur-xl border border-white/5">
        {NAV_ITEMS.slice(0, 5).map(item => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-all"
              style={{ background: isActive ? `${item.color}25` : 'transparent' }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: isActive ? item.color : '#4a4f58' }}
              />
            </Link>
          );
        })}
      </nav>
    </>
  );
}
