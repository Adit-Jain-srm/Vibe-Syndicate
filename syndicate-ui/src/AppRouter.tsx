import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const Landing = lazy(() => import('./pages/Landing'));
const LiveRoom = lazy(() => import('./pages/LiveRoom'));
const Agents = lazy(() => import('./pages/Agents'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Memory = lazy(() => import('./pages/Memory'));
const Pipeline = lazy(() => import('./pages/Pipeline'));

const DashboardHUD = lazy(() => import('./components/hud/DashboardHUD'));
const MetricsHUD = lazy(() => import('./components/hud/MetricsHUD'));
const ApprovalsHUD = lazy(() => import('./components/hud/ApprovalsHUD'));

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-[#6366f1] border-t-transparent animate-spin" />
    </div>
  );
}

export default function AppRouter() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<DashboardHUD />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/live" element={<LiveRoom />} />
        <Route path="/live/:taskId" element={<LiveRoom />} />
        <Route path="/metrics" element={<MetricsHUD />} />
        <Route path="/memory" element={<Memory />} />
        <Route path="/approvals" element={<ApprovalsHUD />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/tasks" element={<Tasks />} />
      </Routes>
    </Suspense>
  );
}
