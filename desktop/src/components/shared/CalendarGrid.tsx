import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@app/shared';

interface CalendarGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
}

export function CalendarGrid({ currentDate, events, onDateClick }: CalendarGridProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getEventsForDay = (date: Date) =>
    events.filter(e => isSameDay(new Date(e.startTime), date));

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="grid grid-cols-7 gap-px bg-border">
      {weekDays.map(d => (
        <div key={d} className="bg-background text-xs text-muted-foreground text-center py-2 font-medium">{d}</div>
      ))}
      {days.map(day => {
        const dayEvents = getEventsForDay(day);
        const hasTask = dayEvents.some(e => e.type === 'task');
        const hasEvent = dayEvents.some(e => e.type === 'event');

        return (
          <button
            key={day.toISOString()}
            onClick={() => onDateClick(day)}
            className={cn(
              'bg-background p-1.5 min-h-[80px] text-left hover:bg-accent/50 transition-colors',
              !isSameMonth(day, currentDate) && 'opacity-30',
              isToday(day) && 'bg-primary/5'
            )}
          >
            <span className={cn('text-xs px-1', isToday(day) && 'bg-primary text-primary-foreground rounded-full w-5 h-5 inline-flex items-center justify-center')}>
              {format(day, 'd')}
            </span>
            <div className="flex gap-0.5 mt-1">
              {hasTask && <div className="h-1 flex-1 rounded bg-primary" />}
              {hasEvent && <div className="h-1 flex-1 rounded bg-success" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
