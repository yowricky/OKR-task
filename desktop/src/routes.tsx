import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from './api/client';
import { useAuthStore } from './stores/auth';
import { AppLayout } from './components/layout/AppLayout';
import { MyDayPage } from './pages/tasks/MyDayPage';
import { TaskDetailPage } from './pages/tasks/TaskDetailPage';
import { CalendarPage } from './pages/calendar/CalendarPage';
import { OKRDashboardPage } from './pages/okr/OKRDashboardPage';

// Debug auto-login component
function AutoLogin({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(!isAuthenticated);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(false);
      return;
    }
    // Auto-login for dev convenience
    login({ account: 'admin', password: 'admin123' })
      .then(() => setLoading(false))
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-lg mx-auto">T</div>
          <p className="text-muted-foreground text-sm">正在登录...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-danger text-sm">登录失败: {error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">重试</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <AutoLogin>
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          </AutoLogin>
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
