import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/api/client';

export function LoginPage() {
  const [tab, setTab] = useState<'wework' | 'password'>('wework');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [state, setState] = useState('');
  const login = useAuthStore((s) => s.login);
  const weworkLogin = useAuthStore((s) => s.weworkLogin);
  const navigate = useNavigate();

  useEffect(() => {
    if (tab === 'wework') {
      api.get<{ qrUrl: string; state: string }>('/auth/wework/qr-url').then((res) => {
        setQrUrl(res.qrUrl);
        setState(res.state);
      }).catch(() => setError('获取扫码链接失败'));
    }
  }, [tab]);

  // Poll for callback — simulate with an iframe or manual code entry for MVP
  // In production, the Tauri webview would intercept the redirect URL
  useEffect(() => {
    if (!state) return;
    // For MVP, provide a manual code input fallback
  }, [state]);

  async function handlePasswordSubmit(e: React.FormEvent) {
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
      <div className="w-96 space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto mb-4">
            T
          </div>
          <h1 className="text-2xl font-semibold">任务管理</h1>
          <p className="text-sm text-muted-foreground mt-1">企业微信扫码登录</p>
        </div>

        {error && (
          <div className="bg-danger/10 text-danger text-sm p-3 rounded-lg">{error}</div>
        )}

        <div className="flex border-b border-border">
          <button
            onClick={() => setTab('wework')}
            className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'wework' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
          >
            企微扫码
          </button>
          <button
            onClick={() => setTab('password')}
            className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'password' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
          >
            密码登录
          </button>
        </div>

        {tab === 'wework' ? (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-8 flex items-center justify-center">
              {qrUrl ? (
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`} alt="扫码登录" className="w-52 h-52" />
              ) : (
                <div className="w-52 h-52 bg-accent animate-pulse rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                  加载中...
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              使用企业微信扫描二维码登录<br />扫码后浏览器将自动跳转完成认证
            </p>
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
        )}
      </div>
    </div>
  );
}
