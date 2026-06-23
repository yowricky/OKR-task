import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';
import type { RiskItem, RiskLevel } from '@app/shared';

const LEVEL_STYLES: Record<RiskLevel, { label: string; color: string }> = {
  high: { label: '高', color: 'text-danger border-danger/30 bg-danger/10' },
  medium: { label: '中', color: 'text-warning border-warning/30 bg-warning/10' },
  low: { label: '低', color: 'text-muted-foreground border-border bg-accent/50' },
};

const LEVEL_OPTIONS: { value: RiskLevel; label: string }[] = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

export function RiskPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [newTaskId, setNewTaskId] = useState('');
  const [newLevel, setNewLevel] = useState<RiskLevel>('medium');
  const [newDescription, setNewDescription] = useState('');

  // Fetch open risks
  const { data: risks = [], isLoading } = useQuery({
    queryKey: ['risks'],
    queryFn: () => api.get<RiskItem[]>('/risks?status=open'),
  });

  // Resolve mutation
  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/risks/${id}`, { status: 'resolved' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['risks'] }),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (payload: { taskId: string; level: RiskLevel; description: string }) =>
      api.post<RiskItem>('/risks', payload),
    onSuccess: () => {
      setNewTaskId('');
      setNewLevel('medium');
      setNewDescription('');
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ['risks'] });
    },
  });

  const handleCreate = () => {
    if (!newTaskId.trim() || !newDescription.trim()) return;
    createMutation.mutate({
      taskId: newTaskId.trim(),
      level: newLevel,
      description: newDescription.trim(),
    });
  };

  const riskList = Array.isArray(risks) ? (risks as RiskItem[]) : [];

  return (
    <div className="flex flex-col h-full">
      {/* 顶部标题 */}
      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">风险管理</h1>
          <p className="text-sm text-muted-foreground mt-1">跟踪和解决项目风险</p>
        </div>
        {isAdminOrManager && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {showCreate ? '取消' : '新建风险'}
          </button>
        )}
      </div>

      {/* 新建风险表单 */}
      {showCreate && (
        <div className="px-6 py-4 border-b border-border bg-accent/30 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">任务ID</label>
              <input
                type="text"
                value={newTaskId}
                onChange={e => setNewTaskId(e.target.value)}
                placeholder="输入任务ID"
                className="text-sm bg-background border border-border rounded px-2 py-1.5 outline-none focus:border-primary w-48"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">风险等级</label>
              <select
                value={newLevel}
                onChange={e => setNewLevel(e.target.value as RiskLevel)}
                className="text-sm bg-background border border-border rounded px-2 py-1.5 outline-none focus:border-primary"
              >
                {LEVEL_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">描述</label>
            <textarea
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="风险描述"
              rows={2}
              className="text-sm bg-background border border-border rounded px-2 py-1.5 outline-none focus:border-primary resize-none"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={!newTaskId.trim() || !newDescription.trim() || createMutation.isPending}
            className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {createMutation.isPending ? '创建中...' : '创建'}
          </button>
        </div>
      )}

      {/* 风险列表 */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">加载中...</p>
        ) : riskList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">暂无风险</p>
            <p className="text-sm">所有风险已解决或尚未记录</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left font-medium px-3 py-2">任务ID</th>
                <th className="text-left font-medium px-3 py-2">风险等级</th>
                <th className="text-left font-medium px-3 py-2">描述</th>
                <th className="text-left font-medium px-3 py-2">状态</th>
                <th className="text-right font-medium px-3 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {riskList.map((risk: RiskItem) => {
                const levelStyle = LEVEL_STYLES[risk.level];
                return (
                  <tr key={risk.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="px-3 py-3 font-mono text-xs">{risk.taskId}</td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          'inline-flex px-2 py-0.5 text-xs font-medium rounded-full border',
                          levelStyle.color
                        )}
                      >
                        {levelStyle.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground max-w-xs truncate">
                      {risk.description}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/30">
                        开放
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => resolveMutation.mutate(risk.id)}
                        disabled={resolveMutation.isPending}
                        className="text-xs px-2 py-1 rounded bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-50"
                      >
                        标记解决
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
