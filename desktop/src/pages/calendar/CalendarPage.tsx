import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addMonths, subMonths, endOfMonth, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
