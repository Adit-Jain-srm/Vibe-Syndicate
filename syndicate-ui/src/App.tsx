import { BrowserRouter, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { useEffect, useCallback } from 'react';
import AppRouter from './AppRouter';
import ConstellationScene from './components/constellation/ConstellationScene';
import NavigationRail from './components/constellation/NavigationRail';
import { playSound } from './lib/sounds';
import { useConstellationStore } from './stores/constellation';

function AppShell() {
  const { pathname } = useLocation();
  const initSubs = useConstellationStore(s => s.initRealtimeSubscriptions);
  const setCameraTarget = useConstellationStore(s => s.setCameraTarget);

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

  useEffect(() => {
    setCameraTarget(pathname);
  }, [pathname, setCameraTarget]);

  return (
    <div className="noise">
      {/* Persistent 3D constellation — never unmounts */}
      <ConstellationScene />

      {/* Navigation rail (hidden on landing) */}
      <NavigationRail />

      {/* HUD overlay content — route-specific panels */}
      <main className="relative z-10">
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
