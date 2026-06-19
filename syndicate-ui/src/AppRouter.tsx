import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Pipeline = lazy(() => import('./pages/Pipeline'));
const LiveRoom = lazy(() => import('./pages/LiveRoom'));
const Agents = lazy(() => import('./pages/Agents'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Memory = lazy(() => import('./pages/Memory'));
const Metrics = lazy(() => import('./pages/Metrics'));
const Approvals = lazy(() => import('./pages/Approvals'));

function Loading() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );
}

export default function AppRouter() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<Dashboard />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/live" element={<LiveRoom />} />
        <Route path="/live/:taskId" element={<LiveRoom />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/memory" element={<Memory />} />
        <Route path="/metrics" element={<Metrics />} />
        <Route path="/approvals" element={<Approvals />} />
      </Routes>
    </Suspense>
  );
}
