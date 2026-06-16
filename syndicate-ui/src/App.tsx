import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ClerkProvider } from '@clerk/react';
import { AnimatePresence } from 'motion/react';
import { lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import SkeletonLoader from './components/ui/SkeletonLoader';
import { bootTheme } from './lib/theme';

// Apply persisted theme on boot
bootTheme();

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

// Lazy-loaded pages
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
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

/** Layout with sidebar — used for all /app/* routes and the dashboard. */
function AppLayout() {
  return (
    <div className="flex min-h-screen bg-onyx">
      <Sidebar />
      <main className="ml-56 flex-1 min-h-screen">
        <Suspense fallback={<PageLoader />}>
          <AppRoutes />
        </Suspense>
      </main>
    </div>
  );
}

/** Authenticated app routes. */
function AppRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/app" element={<Dashboard />} />
        <Route path="/app/live" element={<LiveRoom />} />
        <Route path="/app/live/:taskId" element={<LiveRoom />} />
        <Route path="/app/agents" element={<Agents />} />
        <Route path="/app/tasks" element={<Tasks />} />
        <Route path="/app/memory" element={<MemoryPage />} />
        <Route path="/app/traces" element={<Traces />} />
        <Route path="/app/controls" element={<Controls />} />
        <Route path="/app/settings" element={<Settings />} />
        {/* Legacy routes — keep working for backwards compat */}
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
    </AnimatePresence>
  );
}

function AppInner() {
  const location = useLocation();

  // Full-screen pages (no sidebar): landing, login, signup
  const isFullScreen =
    location.pathname === '/landing' ||
    location.pathname === '/login' ||
    location.pathname === '/signup';

  if (isFullScreen) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </Suspense>
    );
  }

  return <AppLayout />;
}

export default function App() {
  const app = (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );

  // Wrap with ClerkProvider if key is available
  if (CLERK_KEY) {
    return (
      <ClerkProvider publishableKey={CLERK_KEY}>
        {app}
      </ClerkProvider>
    );
  }

  return app;
}
