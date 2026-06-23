import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addMonths, subMonths, endOfMonth, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/api/client';
import { CalendarGrid } from '@/components/shared/CalendarGrid';
import { WeekView } from '@/components/shared/WeekView';
import { DayView } from '@/components/shared/DayView';
import type { CalendarEvent } from '@app/shared';

type ViewMode = 'month' | 'week' | 'day';

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [showCreateForm, setShowCreateForm] = useState(false);
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
          <CalendarGrid currentDate={currentDate} events={events} onDateClick={(d) => { setCurrentDate(d); setViewMode('day'); }} />
        )}
        {viewMode === 'week' && (
          <WeekView currentDate={currentDate} events={events} onDateClick={(d) => { setCurrentDate(d); setViewMode('day'); }} />
        )}
        {viewMode === 'day' && (
          <DayView currentDate={currentDate} events={events} onDateClick={(d) => { setCurrentDate(d); }} />
        )}
      </div>
    </div>
  );
}
