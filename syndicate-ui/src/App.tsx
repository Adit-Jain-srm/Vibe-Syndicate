import AppRouter from './AppRouter';
import Sidebar from './components/Sidebar';

export default function App() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-56 flex-1 min-h-screen">
        <AppRouter />
      </main>
    </div>
  );
}
