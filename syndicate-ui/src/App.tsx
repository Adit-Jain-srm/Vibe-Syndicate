import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/react';
import AppRouter from './AppRouter';
import Sidebar from './components/Sidebar';
import ParticleField from './components/3d/ParticleField';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

function AppShell() {
  return (
    <div className="noise">
      <ParticleField />
      <div className="flex">
        <Sidebar />
        <main className="ml-16 flex-1 min-h-screen">
          <AppRouter />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const app = (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );

  if (CLERK_KEY) {
    return (
      <ClerkProvider publishableKey={CLERK_KEY}>
        {app}
      </ClerkProvider>
    );
  }

  return app;
}
