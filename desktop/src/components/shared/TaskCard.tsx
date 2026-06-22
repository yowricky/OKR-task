import { Calendar, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@app/shared';
import { Link } from 'react-router-dom';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
}

export function TaskCard({ task, onToggle }: TaskCardProps) {
  const isCompleted = task.status === 'completed' || task.status === 'accepted';

  return (
    <div className={cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-lg bg-accent/50 hover:bg-accent transition-colors group',
      isCompleted && 'opacity-50'
    )}>
      <button
        onClick={() => onToggle(task.id)}
        className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
          isCompleted ? 'bg-success border-success text-success-foreground' : 'border-muted-foreground/40 hover:border-primary'
        )}
      >
        {isCompleted && <span className="text-xs">✓</span>}
      </button>

      <Link to={`/tasks/${task.id}`} className="flex-1 min-w-0">
        <p className={cn('text-sm truncate', isCompleted && 'line-through')}>{task.title}</p>
        {task.dueDate && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3" />
            {new Date(task.dueDate).toLocaleDateString('zh-CN')}
          </p>
        )}
      </Link>

      {task.priority === 'high' && <Star className="w-4 h-4 text-warning flex-shrink-0" />}
    </div>
  );
}
