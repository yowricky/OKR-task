import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addMonths, subMonths, endOfMonth, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, X, Edit3, Trash2, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/api/client';
import { CalendarGrid } from '@/components/shared/CalendarGrid';
import { WeekView } from '@/components/shared/WeekView';
import { DayView } from '@/components/shared/DayView';
import type { CalendarEvent } from '@app/shared';

type ViewMode = 'month' | 'week' | 'day';

// ---------------------------------------------------------------------------
// Confirm Dialog
// ---------------------------------------------------------------------------
function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  isPending,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
      <div className="bg-background rounded-xl shadow-lg border border-border w-full max-w-sm mx-4 p-6">
        <h3 className="text-base font-semibold">确认删除</h3>
        <p className="text-sm text-muted-foreground mt-2">{message}</p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="px-4 py-2 text-xs font-medium rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity">取消</button>
          <button onClick={onConfirm} disabled={isPending} className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-danger text-danger-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event Popover
// ---------------------------------------------------------------------------
function EventPopover({
  event,
  position,
  onEdit,
  onDelete,
  onClose,
}: {
  event: CalendarEvent;
  position: { x: number; y: number };
  onEdit: (e: CalendarEvent) => void;
  onDelete: (e: CalendarEvent) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-card rounded-xl shadow-xl border border-border p-4 w-64"
        style={{ left: position.x, top: position.y }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm truncate">{event.title}</h3>
          <button onClick={onClose} className="p-0.5 hover:bg-accent rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="text-xs text-muted-foreground mb-3 space-y-1">
          <div>开始: {format(parseISO(event.startTime), 'yyyy-MM-dd HH:mm')}</div>
          <div>结束: {format(parseISO(event.endTime), 'yyyy-MM-dd HH:mm')}</div>
          {event.type === 'task' && <div className="text-primary">系统任务</div>}
        </div>
        {event.type !== 'task' && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(event)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
            >
              <Edit3 className="w-3 h-3" />
              编辑
            </button>
            <button
              onClick={() => onDelete(event)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              删除
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Edit Event Form
// ---------------------------------------------------------------------------
function EditEventForm({
  event,
  onSave,
  onCancel,
  isPending,
}: {
  event: CalendarEvent;
  onSave: (title: string, startTime: string, endTime: string, isAllDay: boolean) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const toLocal = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [title, setTitle] = useState(event.title);
  const [startTime, setStartTime] = useState(toLocal(event.startTime));
  const [endTime, setEndTime] = useState(toLocal(event.endTime));
  const [isAllDay, setIsAllDay] = useState(event.isAllDay);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave(title.trim(), startTime, endTime, isAllDay);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10" onClick={onCancel}>
      <div className="bg-card rounded-xl shadow-xl border border-border p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">编辑事件</h3>
          <button onClick={onCancel} className="p-1 rounded hover:bg-accent transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">标题</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">开始</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full text-xs bg-background border border-border rounded-lg px-2 py-1.5 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">结束</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full text-xs bg-background border border-border rounded-lg px-2 py-1.5 outline-none focus:border-primary"
              />
            </div>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input type="checkbox" checked={isAllDay} onChange={e => setIsAllDay(e.target.checked)} className="rounded" />
            全天
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent">取消</button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || isPending}
              className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main CalendarPage
// ---------------------------------------------------------------------------
export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<CalendarEvent | null>(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<CalendarEvent | null>(null);
  const queryClient = useQueryClient();

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newAllDay, setNewAllDay] = useState(false);

  const monthStart = format(subMonths(currentDate, 1), 'yyyy-MM-01');
  const monthEnd = format(endOfMonth(addMonths(currentDate, 1)), 'yyyy-MM-dd');

  const rangeStart =
    viewMode === 'week'
      ? format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      : viewMode === 'day'
        ? format(currentDate, 'yyyy-MM-dd')
        : monthStart;

  const rangeEnd =
    viewMode === 'week'
      ? format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      : viewMode === 'day'
        ? format(currentDate, 'yyyy-MM-dd')
        : monthEnd;

  const { data: events = [] } = useQuery({
    queryKey: ['calendar', rangeStart, rangeEnd],
    queryFn: () => api.get<CalendarEvent[]>(`/calendar/events?start=${rangeStart}&end=${rangeEnd}`),
  });

  const createEventMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      startTime: string;
      endTime: string;
      isAllDay: boolean;
      type: string;
    }) => api.post<CalendarEvent>('/calendar/events', payload),
    onSuccess: () => {
      setNewTitle('');
      setNewStart('');
      setNewEnd('');
      setNewAllDay(false);
      setShowCreateForm(false);
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; startTime?: string; endTime?: string; isAllDay?: boolean } }) =>
      api.put<CalendarEvent>(`/calendar/events/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      setEditEvent(null);
      setPopoverEvent(null);
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/calendar/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      setDeleteConfirm(null);
      setPopoverEvent(null);
    },
  });

  const handleCreateEvent = () => {
    if (!newTitle.trim()) return;
    createEventMutation.mutate({
      title: newTitle.trim(),
      startTime: newStart || new Date().toISOString(),
      endTime: newEnd || new Date().toISOString(),
      isAllDay: newAllDay,
      type: 'event',
    });
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    if (event.type === 'task') return; // Don't allow editing system tasks
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopoverPos({ x: Math.min(rect.left, window.innerWidth - 270), y: rect.bottom + 4 });
    setPopoverEvent(event);
  };

  const handleEditEvent = (title: string, startTime: string, endTime: string, isAllDay: boolean) => {
    if (!editEvent) return;
    updateEventMutation.mutate({
      id: editEvent.id,
      data: { title, startTime: new Date(startTime).toISOString(), endTime: new Date(endTime).toISOString(), isAllDay },
    });
  };

  const handleDeleteEvent = () => {
    if (!deleteConfirm) return;
    deleteEventMutation.mutate(deleteConfirm.id);
  };

  const handlePrev = () => {
    setCurrentDate(
      viewMode === 'month' ? subMonths(currentDate, 1) :
      viewMode === 'week' ? subWeeks(currentDate, 1) :
      subDays(currentDate, 1)
    );
  };

  const handleNext = () => {
    setCurrentDate(
      viewMode === 'month' ? addMonths(currentDate, 1) :
      viewMode === 'week' ? addWeeks(currentDate, 1) :
      addDays(currentDate, 1)
    );
  };

  const handleToday = () => setCurrentDate(new Date());

  const titleText =
    viewMode === 'month'
      ? format(currentDate, 'yyyy年 M月', { locale: zhCN })
      : viewMode === 'week'
        ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'M月d日')} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'M月d日')}`
        : format(currentDate, 'yyyy年 M月d日', { locale: zhCN });

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center gap-4">
        <h1 className="text-lg font-semibold">{titleText}</h1>
        <div className="flex items-center gap-1">
          <button onClick={handlePrev} className="p-1 hover:bg-accent rounded">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={handleToday} className="px-2 py-0.5 text-sm hover:bg-accent rounded">今天</button>
          <button onClick={handleNext} className="p-1 hover:bg-accent rounded">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Create event button */}
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-1 px-3 py-1 text-xs rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          {showCreateForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showCreateForm ? '取消' : '新建事件'}
        </button>

        <div className="flex gap-2 ml-auto">
          {(['month', 'week', 'day'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                'px-3 py-1 text-xs rounded transition-colors',
                viewMode === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent text-accent-foreground hover:bg-accent/80'
              )}
            >
              {mode === 'month' ? '月' : mode === 'week' ? '周' : '日'}
            </button>
          ))}
        </div>
      </div>

      {/* Inline create form */}
      {showCreateForm && (
        <div className="px-6 py-3 border-b border-border bg-accent/30">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">标题</label>
              <input
                autoFocus
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="事件标题"
                className="text-sm bg-background border border-border rounded px-2 py-1.5 outline-none focus:border-primary w-48"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">开始</label>
              <input
                type="datetime-local"
                value={newStart}
                onChange={e => setNewStart(e.target.value)}
                className="text-xs bg-background border border-border rounded px-2 py-1.5 outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">结束</label>
              <input
                type="datetime-local"
                value={newEnd}
                onChange={e => setNewEnd(e.target.value)}
                className="text-xs bg-background border border-border rounded px-2 py-1.5 outline-none focus:border-primary"
              />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground pb-1">
              <input
                type="checkbox"
                checked={newAllDay}
                onChange={e => setNewAllDay(e.target.checked)}
                className="rounded"
              />
              全天
            </label>
            <button
              onClick={handleCreateEvent}
              disabled={!newTitle.trim() || createEventMutation.isPending}
              className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {createEventMutation.isPending ? '创建中...' : '创建'}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 p-4 overflow-auto">
        {viewMode === 'month' && (
          <CalendarGrid
            currentDate={currentDate}
            events={events}
            onDateClick={(d) => { setCurrentDate(d); setViewMode('day'); }}
            onEventClick={(event) => {
              setPopoverEvent(event);
            }}
          />
        )}
        {viewMode === 'week' && (
          <WeekView
            currentDate={currentDate}
            events={events}
            onDateClick={(d) => { setCurrentDate(d); setViewMode('day'); }}
            onEventClick={(event) => {
              setPopoverEvent(event);
            }}
          />
        )}
        {viewMode === 'day' && (
          <DayView
            currentDate={currentDate}
            events={events}
            onDateClick={(d) => { setCurrentDate(d); }}
            onEventClick={(event) => {
              setPopoverEvent(event);
            }}
          />
        )}
      </div>

      {/* Event popover */}
      {popoverEvent && !editEvent && (
        <EventPopover
          event={popoverEvent}
          position={popoverPos}
          onEdit={(e) => setEditEvent(e)}
          onDelete={(e) => setDeleteConfirm(e)}
          onClose={() => setPopoverEvent(null)}
        />
      )}

      {/* Edit event form */}
      {editEvent && (
        <EditEventForm
          event={editEvent}
          onSave={handleEditEvent}
          onCancel={() => setEditEvent(null)}
          isPending={updateEventMutation.isPending}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          message={`确定要删除事件「${deleteConfirm.title}」吗？此操作不可撤销。`}
          onConfirm={handleDeleteEvent}
          onCancel={() => setDeleteConfirm(null)}
          isPending={deleteEventMutation.isPending}
        />
      )}
    </div>
  );
}
