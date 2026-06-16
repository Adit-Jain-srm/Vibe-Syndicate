import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import Dashboard from './pages/Dashboard';
import LiveRoom from './pages/LiveRoom';
import Agents from './pages/Agents';
import Tasks from './pages/Tasks';
import MemoryPage from './pages/Memory';

export default function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/live" element={<LiveRoom />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/memory" element={<MemoryPage />} />
      </Routes>
    </AnimatePresence>
  );
}
