import { BrowserRouter, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { useEffect, lazy, Suspense } from 'react';
import AppRouter from './AppRouter';
import NavigationRail from './components/constellation/NavigationRail';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastContainer } from './components/ui/Toast';
import CommandPalette from './components/CommandPalette';
import { useConstellationStore } from './stores/constellation';

const AgentGraph = lazy(() => import('./components/constellation/AgentGraph'));

function AppShell() {
  const { pathname } = useLocation();
  const initSubs = useConstellationStore(s => s.initRealtimeSubscriptions);

  useEffect(() => {
    const cleanup = initSubs();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLanding = pathname === '/';

  return (
    <div className="min-h-[100dvh] bg-void text-snow page-atmo">
      <Suspense fallback={null}>
        <AgentGraph />
      </Suspense>

      {!isLanding && <NavigationRail />}

      <main className={!isLanding ? 'md:ml-14' : ''}>
        <AnimatePresence mode="wait">
          <AppRouter key={pathname} />
        </AnimatePresence>
      </main>

      <ToastContainer />
      <CommandPalette />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
