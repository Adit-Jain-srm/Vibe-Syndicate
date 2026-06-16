import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LiveRoom from './pages/LiveRoom';
import Agents from './pages/Agents';
import Tasks from './pages/Tasks';
import MemoryPage from './pages/Memory';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/live" element={<LiveRoom />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/memory" element={<MemoryPage />} />
      </Routes>
    </BrowserRouter>
  );
}
