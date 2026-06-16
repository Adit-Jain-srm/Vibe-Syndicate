import { BrowserRouter } from 'react-router-dom';
import AnimatedRoutes from './AppRouter';
import Sidebar from './components/Sidebar';
import { bootTheme } from './lib/theme';

// Apply persisted theme on boot
bootTheme();

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-onyx">
        <Sidebar />
        <main className="ml-56 flex-1 min-h-screen">
          <AnimatedRoutes />
        </main>
      </div>
    </BrowserRouter>
  );
}
