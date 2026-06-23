import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from './stores/auth';
import { AppLayout } from './components/layout/AppLayout';
import { MyDayPage } from './pages/tasks/MyDayPage';
import { TaskDetailPage } from './pages/tasks/TaskDetailPage';
import { CalendarPage } from './pages/calendar/CalendarPage';
import { OKRDashboardPage } from './pages/okr/OKRDashboardPage';
import { OrgPage } from './pages/admin/OrgPage';

// Auto-login guard
function AutoLogin({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);
  const [state, setState] = useState<'loading' | 'error' | 'done'>(
    isAuthenticated ? 'done' : 'loading'
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) { setState('done'); return; }
    login({ account: 'admin', password: 'admin123' })
      .then(() => setState('done'))
      .catch((err: Error) => { setError(err.message); setState('error'); });
  }, []);

  if (state === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground text-sm">正在登录...</p>
    </div>
  );
  if (state === 'error') return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-danger">登录失败: {error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">重试</button>
      </div>
    </div>
  );
  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AutoLogin><AppLayout /></AutoLogin>}>
        <Route index element={<Navigate to="/tasks/myday" replace />} />
        <Route path="tasks/myday" element={<MyDayPage />} />
        <Route path="tasks/:id" element={<TaskDetailPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="okr" element={<OKRDashboardPage />} />
        <Route path="admin" element={<OrgPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
