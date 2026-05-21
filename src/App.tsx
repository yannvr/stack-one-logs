import { Navigate, Route, Routes } from 'react-router-dom';
import { TooltipProvider } from '~/components/primitives/Tooltip';
import { LogsPage } from './pages/Logs';

export function App() {
  return (
    <TooltipProvider delayDuration={120} skipDelayDuration={80}>
      <Routes>
        <Route path="/" element={<Navigate to="/logs" replace />} />
        <Route path="/logs" element={<LogsPage />} />
      </Routes>
    </TooltipProvider>
  );
}
