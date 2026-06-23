import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus, Priority, UpdateTaskInput } from '@app/shared';
import {
  ArrowLeft,
  Save,
  Trash2,
  Clock,
  Calendar,
  Loader2,
  AlertCircle,
  FileX,
  Edit3,
  Check,
  X,
  Star,
} from 'lucide-react';

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
  accepted: '已验收',
};

const PRIORITY_LABELS: Record<Priority, { label: string; color: string }> = {
  high: { label: '高', color: 'text-danger border-danger/30 bg-danger/10' },
  medium: { label: '中', color: 'text-warning border-warning/30 bg-warning/10' },
  low: { label: '低', color: 'text-muted-foreground border-border bg-accent/50' },
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // --- Fetch task ---
  const {
    data: task,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.get<Task>(`/tasks/${id}`),
    enabled: !!id,
    retry: 1,
  });

  // --- Save mutation ---
  const saveMutation = useMutation({
    mutationFn: (updates: UpdateTaskInput) => api.put<Task>(`/tasks/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsEditing(false);
    },
  });

  // --- Delete mutation ---
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      navigate('/tasks/myday', { replace: true });
    },
  });

  // --- Status update mutation ---
  const statusMutation = useMutation({
    mutationFn: (newStatus: TaskStatus) => api.put<Task>(`/tasks/${id}`, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // --- Enter edit mode ---
  function enterEdit() {
    if (!task) return;
    setEditTitle(task.title);
    setEditDescription(task.description);
    setIsEditing(true);
  }

  // --- Save edits ---
  function handleSave() {
    if (!editTitle.trim()) return;
    saveMutation.mutate({ title: editTitle.trim(), description: editDescription.trim() });
  }

  // --- Cancel editing ---
  function cancelEdit() {
    setIsEditing(false);
    setEditTitle('');
    setEditDescription('');
  }

  // --- Delete ---
  function handleDelete() {
    deleteMutation.mutate();
  }

  // ==============================
  //  Loading state
  // ==============================
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm">加载中...</p>
      </div>
    );
  }

  // ==============================
  //  Error state
  // ==============================
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
        <AlertCircle className="w-10 h-10 text-danger" />
        <div className="text-center">
          <p className="text-sm font-medium text-danger">加载失败</p>
          <p className="text-xs text-muted-foreground mt-1">
            {error instanceof Error ? error.message : '未知错误'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['tasks', id] })}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            重试
          </button>
          <button
            onClick={() => navigate('/tasks/myday')}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  // ==============================
  //  Not-found state
  // ==============================
  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
        <FileX className="w-10 h-10 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">任务不存在</p>
          <p className="text-xs text-muted-foreground mt-1">该任务可能已被删除或链接无效</p>
        </div>
        <button
          onClick={() => navigate('/tasks/myday')}
          className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          返回列表
        </button>
      </div>
    );
  }

  const priorityStyle = PRIORITY_LABELS[task.priority];

  // ==============================
  //  Main content
  // ==============================
  return (
    <div className="flex flex-col h-full">
      {/* --- Header bar --- */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
        <button
          onClick={() => navigate('/tasks/myday')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!editTitle.trim() || saveMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                保存
              </button>
            </>
          ) : (
            <>
              <button
                onClick={enterEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
              >
                <Edit3 className="w-3.5 h-3.5" />
                编辑
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                删除
              </button>
            </>
          )}
        </div>
      </div>

      {/* --- Body --- */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Title */}
        <div>
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="任务标题"
              className="w-full text-xl font-semibold bg-transparent border-b border-border pb-1 outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
              autoFocus
            />
          ) : (
            <h1
              className="text-xl font-semibold cursor-pointer hover:text-primary transition-colors"
              onClick={enterEdit}
            >
              {task.title}
            </h1>
          )}
        </div>

        {/* Meta row: status + priority */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">状态</span>
            <select
              value={task.status}
              onChange={(e) => statusMutation.mutate(e.target.value as TaskStatus)}
              disabled={statusMutation.isPending}
              className="text-xs font-medium rounded-lg border border-border bg-background px-2.5 py-1 outline-none focus:border-primary transition-colors disabled:opacity-50"
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {statusMutation.isPending && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Priority badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">优先级</span>
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border',
                priorityStyle.color
              )}
            >
              {task.priority === 'high' && <Star className="w-3 h-3" />}
              {PRIORITY_LABELS[task.priority].label}
            </span>
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">描述</span>
            {!isEditing && !task.description && (
              <button
                onClick={enterEdit}
                className="text-xs text-primary hover:underline"
              >
                添加描述
              </button>
            )}
          </div>
          {isEditing ? (
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="添加描述..."
              rows={4}
              className="w-full text-sm bg-accent/50 rounded-lg border border-border px-3 py-2 outline-none focus:border-primary focus:bg-background transition-colors resize-none placeholder:text-muted-foreground/50"
            />
          ) : (
            <p
              className={cn(
                'text-sm leading-relaxed cursor-pointer rounded-lg p-3 hover:bg-accent/30 transition-colors',
                task.description ? 'text-foreground' : 'text-muted-foreground italic'
              )}
              onClick={enterEdit}
            >
              {task.description || '暂无描述，点击添加'}
            </p>
          )}
        </div>

        {/* Due date */}
        <div>
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
            <Calendar className="w-3.5 h-3.5" />
            截止日期
          </span>
          <p className="text-sm">{formatDateShort(task.dueDate)}</p>
        </div>

        {/* Timestamps */}
        <div className="border-t border-border pt-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            创建时间: {formatDate(task.createdAt)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            更新时间: {formatDate(task.updatedAt)}
          </div>
        </div>
      </div>

      {/* --- Delete confirmation dialog --- */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-xl shadow-lg border border-border w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold">确认删除</h3>
            <p className="text-sm text-muted-foreground mt-2">
              确定要删除任务「{task.title}」吗？此操作不可撤销。
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-danger text-danger-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
