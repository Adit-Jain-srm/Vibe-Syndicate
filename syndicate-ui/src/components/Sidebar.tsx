import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Radio,
  Bot,
  ListTodo,
  Brain,
  GitBranch,
  Sliders,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react';
import PulsingDot from './ui/PulsingDot';
import { useSoundStore } from '../lib/sounds';

const NAV_MAIN = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/live', label: 'Live Room', icon: Radio },
  { path: '/agents', label: 'Agents', icon: Bot },
  { path: '/tasks', label: 'Tasks', icon: ListTodo },
  { path: '/memory', label: 'Memory', icon: Brain },
  { path: '/traces', label: 'Traces', icon: GitBranch },
];

const NAV_SYSTEM = [
  { path: '/controls', label: 'Controls', icon: Sliders },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { muted, toggle } = useSoundStore();

  return (
    <aside className="fixed left-0 top-0 h-full w-56 glass-surface flex flex-col py-6 px-3 z-40">
      {/* ── Brand ────────────────────────────── */}
      <div className="px-3 mb-8">
        <div className="flex items-center gap-2">
          <PulsingDot color="#5e6ad2" size="sm" active />
          <h1 className="text-lg font-medium text-snow tracking-tight">
            Syndicate
          </h1>
        </div>
        <p className="text-[10px] text-slate mt-1 tracking-widest uppercase">
          compound intelligence
        </p>
      </div>

      {/* ── Navigation ───────────────────────── */}
      <nav className="flex-1 space-y-0.5">
        {NAV_MAIN.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
            >
              {/* Animated active indicator (layoutId) */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-accent/10 border border-accent/20"
                  transition={{
                    type: 'spring',
                    stiffness: 350,
                    damping: 30,
                  }}
                />
              )}

              <Icon
                size={16}
                className={`relative z-10 transition-colors duration-200 ${
                  isActive ? 'text-accent' : 'text-fog'
                }`}
              />
              <span
                className={`relative z-10 transition-colors duration-200 ${
                  isActive
                    ? 'text-accent font-medium'
                    : 'text-fog hover:text-snow'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Section divider */}
        <div className="!my-3 mx-3 h-px bg-graphite/50" />

        <p className="text-[9px] text-slate uppercase tracking-widest px-3 mb-1">
          System
        </p>

        {NAV_SYSTEM.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-accent/10 border border-accent/20"
                  transition={{
                    type: 'spring',
                    stiffness: 350,
                    damping: 30,
                  }}
                />
              )}
              <Icon
                size={14}
                className={`relative z-10 transition-colors duration-200 ${
                  isActive ? 'text-accent' : 'text-slate'
                }`}
              />
              <span
                className={`relative z-10 text-xs transition-colors duration-200 ${
                  isActive ? 'text-accent font-medium' : 'text-slate hover:text-fog'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ───────────────────────────── */}
      <div className="px-3 space-y-3">
        {/* Sound toggle */}
        <button
          onClick={toggle}
          className="flex items-center gap-2 text-slate hover:text-snow transition-colors text-xs w-full"
          title={muted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          <span>{muted ? 'Sounds off' : 'Sounds on'}</span>
        </button>

        {/* Status */}
        <div className="flex items-center gap-2 text-[10px] text-slate">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald dot-breathing-subtle" />
          <span>6 agents • Band.ai</span>
        </div>
      </div>
    </aside>
  );
}
