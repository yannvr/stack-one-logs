import { Navigate, Route, Routes } from 'react-router-dom';
import { LogsPage } from './pages/Logs';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/logs" replace />} />
      <Route path="/logs" element={<LogsPage />} />
    </Routes>
  );
}
