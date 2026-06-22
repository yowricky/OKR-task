import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Task } from '@app/shared';

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: task, isLoading } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.get<Task>(`/tasks/${id}`),
    enabled: !!id,
  });

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">加载中...</div>;
  if (!task) return <div className="p-6 text-sm text-muted-foreground">任务不存在</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">{task.title}</h1>
      <p className="text-sm text-muted-foreground mt-2">{task.description || '暂无描述'}</p>
    </div>
  );
}
