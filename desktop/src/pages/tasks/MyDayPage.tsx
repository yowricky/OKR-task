import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { TaskCard } from '@/components/shared/TaskCard';
import { CreateTaskDialog } from '@/components/shared/CreateTaskDialog';
import type { Task } from '@app/shared';

export function MyDayPage() {
  const queryClient = useQueryClient();

  // 获取所有任务（去掉list参数，后端list过滤可能有问题）
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const result = await api.get<{ items: Task[]; total: number }>('/tasks');
      return (result?.items ?? []) as Task[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (task: Task) =>
      api.put(`/tasks/${task.id}`, {
        status: task.status === 'completed' || task.status === 'accepted' ? 'pending' : 'completed',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const pendingTasks = Array.isArray(tasks) ? tasks.filter((t: Task) => t.status !== 'completed' && t.status !== 'accepted') : [];
  const completedTasks = Array.isArray(tasks) ? tasks.filter((t: Task) => t.status === 'completed' || t.status === 'accepted') : [];

  return (
    <div className="flex flex-col h-full">
      {/* 顶部标题 */}
      <div className="px-6 py-5 border-b border-border">
        <h1 className="text-2xl font-bold">任务管理</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4">
        <div className="bg-accent/50 rounded-xl p-4">
          <div className="text-2xl font-bold">{pendingTasks.length}</div>
          <div className="text-xs text-muted-foreground mt-1">待处理</div>
        </div>
        <div className="bg-success/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-success">{completedTasks.length}</div>
          <div className="text-xs text-muted-foreground mt-1">已完成</div>
        </div>
        <div className="bg-primary/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-primary">{Array.isArray(tasks) ? tasks.length : 0}</div>
          <div className="text-xs text-muted-foreground mt-1">全部任务</div>
        </div>
      </div>

      {/* 新建任务 */}
      <div className="px-6 pb-3">
        <CreateTaskDialog />
      </div>

      {/* 任务列表 */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-1">
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">加载中...</p>
        ) : pendingTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">暂无任务</p>
            <p className="text-sm">点击上方"添加任务"创建第一个任务</p>
          </div>
        ) : (
          <>
            {pendingTasks.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-medium text-muted-foreground uppercase px-3 py-1">未完成</div>
                {pendingTasks.map((task: Task) => (
                  <TaskCard key={task.id} task={task} onToggle={() => toggleMutation.mutate(task)} />
                ))}
              </div>
            )}
            {completedTasks.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase px-3 py-1">已完成</div>
                {completedTasks.map((task: Task) => (
                  <TaskCard key={task.id} task={task} onToggle={() => toggleMutation.mutate(task)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
