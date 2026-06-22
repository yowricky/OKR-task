import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { cn } from '@/lib/utils';

interface OKRItem {
  id: string;
  title: string;
  periodLabel: string;
  keyResults: Array<{
    id: string;
    title: string;
    progress: number;
    targetValue: number;
    currentValue: number;
    unit: string;
    taskCount: number;
    taskProgress: number;
  }>;
}

export function OKRDashboardPage() {
  const { data: objectives = [], isLoading } = useQuery({
    queryKey: ['okr', 'dashboard'],
    queryFn: () => api.get<OKRItem[]>('/okr/dashboard'),
  });

  function getProgressColor(p: number) {
    if (p >= 70) return 'bg-success';
    if (p >= 40) return 'bg-warning';
    return 'bg-danger';
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold">OKR 看板</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">加载中...</p>
        ) : objectives.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">暂无 OKR 数据</p>
            <p className="text-sm">联系管理员创建组织目标</p>
          </div>
        ) : (
          objectives.map(obj => (
            <div key={obj.id} className="bg-accent/30 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{obj.periodLabel}</span>
                <h2 className="font-semibold">O: {obj.title}</h2>
              </div>
              <div className="space-y-3">
                {obj.keyResults.map(kr => (
                  <div key={kr.id} className="bg-background rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{kr.title}</span>
                      <span className="text-sm font-mono">{kr.progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', getProgressColor(kr.progress))} style={{ width: `${kr.progress}%` }} />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>{kr.currentValue} / {kr.targetValue} {kr.unit}</span>
                      <span>{kr.taskCount} 个关联任务 · 任务完成率 {kr.taskProgress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
