import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { MyDayPage } from './pages/tasks/MyDayPage';
import { TaskDetailPage } from './pages/tasks/TaskDetailPage';
import { CalendarPage } from './pages/calendar/CalendarPage';
import { OKRDashboardPage } from './pages/okr/OKRDashboardPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/tasks/myday" replace />} />
        <Route path="tasks/myday" element={<MyDayPage />} />
        <Route path="tasks/:id" element={<TaskDetailPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="okr" element={<OKRDashboardPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
