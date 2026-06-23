import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Plus } from 'lucide-react';
import type { Task, Priority } from '@app/shared';

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

export function CreateTaskDialog() {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: { title: string; priority: Priority; dueDate?: string }) =>
      api.post<Task>('/tasks', payload),
    onSuccess: () => {
      setTitle('');
      setPriority('medium');
      setDueDate('');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) return;
    createMutation.mutate({
      title: title.trim(),
      priority,
      ...(dueDate ? { dueDate } : {}),
    });
  };

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
    <div className="bg-accent rounded-lg p-3 space-y-2">
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && title.trim()) handleSubmit();
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="任务标题"
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      <div className="flex items-center gap-2">
        <select
          value={priority}
          onChange={e => setPriority(e.target.value as Priority)}
          className="text-xs bg-background border border-border rounded px-2 py-1 outline-none focus:border-primary"
        >
          {PRIORITY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              优先级: {opt.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className="text-xs bg-background border border-border rounded px-2 py-1 outline-none focus:border-primary"
        />
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || createMutation.isPending}
          className="ml-auto text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {createMutation.isPending ? '创建中...' : '创建'}
        </button>
      </div>
    </div>
  );
}
