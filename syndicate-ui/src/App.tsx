import { BrowserRouter, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { useEffect, useCallback } from 'react';
import AppRouter from './AppRouter';
import NavigationRail from './components/constellation/NavigationRail';
import { playSound } from './lib/sounds';
import { useConstellationStore } from './stores/constellation';

function AppShell() {
  const { pathname } = useLocation();
  const initSubs = useConstellationStore(s => s.initRealtimeSubscriptions);

  const handleFirstInteraction = useCallback(() => {
    playSound('ambient');
    document.removeEventListener('click', handleFirstInteraction);
  }, []);

  useEffect(() => {
    document.addEventListener('click', handleFirstInteraction);
    return () => document.removeEventListener('click', handleFirstInteraction);
  }, [handleFirstInteraction]);

  useEffect(() => {
    const cleanup = initSubs();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLanding = pathname === '/';

  return (
    <div className="min-h-[100dvh] bg-void text-snow">
      {!isLanding && <NavigationRail />}

      <main className={!isLanding ? 'md:ml-14' : ''}>
        <AnimatePresence mode="wait">
          <AppRouter key={pathname} />
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
