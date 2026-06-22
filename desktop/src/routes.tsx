import { Routes, Route, Navigate } from 'react-router-dom';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tasks/myday" replace />} />
    </Routes>
  );
}
