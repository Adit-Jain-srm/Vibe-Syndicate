import { BrowserRouter, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { useEffect, useCallback } from 'react';
import AppRouter from './AppRouter';
import Sidebar from './components/Sidebar';
import ShaderBackground from './components/3d/ShaderBackground';
import { playSound } from './lib/sounds';

function AppShell() {
  const { pathname } = useLocation();
  const isDashboard = pathname !== '/';

  const handleFirstInteraction = useCallback(() => {
    playSound('ambient');
    document.removeEventListener('click', handleFirstInteraction);
  }, []);

  useEffect(() => {
    document.addEventListener('click', handleFirstInteraction);
    return () => document.removeEventListener('click', handleFirstInteraction);
  }, [handleFirstInteraction]);

  return (
    <div className="noise">
      <ShaderBackground />
      {isDashboard && <Sidebar />}
      <main className={isDashboard ? 'ml-16' : ''}>
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
