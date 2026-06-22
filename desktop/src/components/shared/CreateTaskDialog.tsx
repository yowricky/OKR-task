import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Plus } from 'lucide-react';
import type { Task } from '@app/shared';

export function CreateTaskDialog() {
  const [title, setTitle] = useState('');
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: { title: string }) => api.post<Task>('/tasks', payload),
    onSuccess: () => {
      setTitle('');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent w-full"
      >
        <Plus className="w-4 h-4" /> 添加任务
      </button>
    );
  }

  return (
    <div className="bg-accent rounded-lg p-3">
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && title.trim()) createMutation.mutate({ title: title.trim() });
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="任务标题"
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
