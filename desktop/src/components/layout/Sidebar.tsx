import { NavLink, useNavigate } from 'react-router-dom';
import { CalendarDays, CheckSquare, Target, AlertTriangle, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

const navItems = [
  { to: '/tasks/myday', icon: CheckSquare, label: '任务' },
  { to: '/calendar', icon: CalendarDays, label: '日历' },
  { to: '/okr', icon: Target, label: 'OKR' },
  { to: '/risk', icon: AlertTriangle, label: '风险' },
];

export function Sidebar() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="w-14 bg-muted border-r border-border flex flex-col items-center py-3 gap-2">
      <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm mb-4">
        T
      </div>
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          title={label}
          className={({ isActive }) =>
            `w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
            }`
          }
        >
          <Icon className="w-5 h-5" />
        </NavLink>
      ))}
      <div className="flex-1" />
      <NavLink
        to="/admin"
        title="设置"
        className={({ isActive }) =>
          `w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
            isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
          }`
        }
      >
        <Settings className="w-5 h-5" />
      </NavLink>
      <button
        onClick={handleLogout}
        title="退出登录"
        className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </aside>
  );
}
