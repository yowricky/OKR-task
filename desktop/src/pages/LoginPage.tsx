import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

export function LoginPage() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login({ account, password });
      navigate('/tasks/myday');
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-80 space-y-5">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-lg mx-auto mb-3">T</div>
          <h1 className="text-xl font-semibold">任务管理</h1>
          <p className="text-sm text-muted-foreground mt-1">密码登录</p>
        </div>

        {error && (
          <div className="bg-danger/10 text-danger text-sm p-3 rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="账号"
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  );
}
