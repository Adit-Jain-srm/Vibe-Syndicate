import { BrowserRouter, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import AppRouter from './AppRouter';
import Sidebar from './components/Sidebar';
import ParticleField from './components/3d/ParticleField';

function AppShell() {
  const { pathname } = useLocation();
  const isDashboard = pathname !== '/';

  return (
    <div className="noise">
      <ParticleField />
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
