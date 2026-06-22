import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { TaskCard } from '@/components/shared/TaskCard';
import { CreateTaskDialog } from '@/components/shared/CreateTaskDialog';
import type { Task, PaginatedResponse } from '@app/shared';

export function MyDayPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['tasks', 'myday'],
    queryFn: () => api.get<PaginatedResponse<Task>>('/tasks?list=myday'),
  });

  const toggleMutation = useMutation({
    mutationFn: (task: Task) =>
      api.put(`/tasks/${task.id}`, {
        status: task.status === 'completed' ? 'in_progress' : 'completed',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const tasks = data?.items ?? [];

  return (
    <div className="flex h-full">
      <div className="w-64 border-r border-border p-3">
        <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">清单</div>
        <div className="space-y-0.5 mt-2">
          {['我的一天', '重要', '已计划日程', '任务'].map(label => (
            <div key={label} className="px-3 py-1.5 rounded-md text-sm hover:bg-accent cursor-pointer">{label}</div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <h1 className="text-lg font-semibold">我的一天</h1>
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">加载中...</p>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">今天没有任务</p>
          ) : (
            tasks.map(task => (
              <TaskCard key={task.id} task={task} onToggle={() => toggleMutation.mutate(task)} />
            ))
          )}
          <CreateTaskDialog />
        </div>
      </div>
    </div>
  );
}
