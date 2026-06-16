import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { lazy, Suspense } from 'react';
import SkeletonLoader from './components/ui/SkeletonLoader';

// Lazy-loaded routes (from Manthan's production pattern)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LiveRoom = lazy(() => import('./pages/LiveRoom'));
const Agents = lazy(() => import('./pages/Agents'));
const Tasks = lazy(() => import('./pages/Tasks'));
const MemoryPage = lazy(() => import('./pages/Memory'));
const Traces = lazy(() => import('./pages/Traces'));
const Controls = lazy(() => import('./pages/Controls'));
const Settings = lazy(() => import('./pages/Settings'));

function PageLoader() {
  return (
    <div className="min-h-screen p-8 max-w-[1200px]">
      <div className="space-y-6">
        <SkeletonLoader variant="text" />
        <SkeletonLoader variant="stat" />
        <SkeletonLoader variant="stat" />
      </div>
    </div>
  );
}

export default function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/live" element={<LiveRoom />} />
          <Route path="/live/:taskId" element={<LiveRoom />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/memory" element={<MemoryPage />} />
          <Route path="/traces" element={<Traces />} />
          <Route path="/controls" element={<Controls />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}
