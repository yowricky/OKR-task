import { format, isSameDay, isToday, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@app/shared';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 - 20:00

export function DayView({ currentDate, events, onDateClick, onEventClick }: DayViewProps) {
  const dayEvents = events.filter(e => isSameDay(parseISO(e.startTime), currentDate));
  const allDayEvents = dayEvents.filter(e => e.isAllDay);
  const timedEvents = dayEvents.filter(e => !e.isAllDay);

  const eventPosition = (event: CalendarEvent) => {
    const start = parseISO(event.startTime);
    const end = parseISO(event.endTime);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const dayStart = 8 * 60;
    const dayEnd = 20 * 60;
    const clampedStart = Math.max(startMinutes, dayStart);
    const clampedEnd = Math.min(endMinutes, dayEnd);
    const totalMinutes = dayEnd - dayStart;
    const top = ((clampedStart - dayStart) / totalMinutes) * 100;
    const height = Math.max(((clampedEnd - clampedStart) / totalMinutes) * 100, 1.5);
    return { top: `${top}%`, height: `${height}%` };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border sticky top-0 bg-background z-10 pb-3">
        <div className="text-center">
          <div className="text-xs text-muted-foreground">
            {format(currentDate, 'eeee', { locale: zhCN })}
          </div>
          <button
            onClick={() => onDateClick(currentDate)}
            className={cn(
              'text-2xl font-semibold w-10 h-10 rounded-full inline-flex items-center justify-center',
              isToday(currentDate) && 'bg-primary text-primary-foreground'
            )}
          >
            {format(currentDate, 'd')}
          </button>
        </div>

        {/* All-day events */}
        {allDayEvents.length > 0 && (
          <div className="mt-2 px-4 space-y-1">
            {allDayEvents.map(event => (
              <div
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className={cn(
                  'px-2 py-1 rounded text-xs font-medium cursor-pointer',
                  event.type === 'task'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-success/10 text-success border border-success/20'
                )}
              >
                {event.title}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Time slots */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          {HOURS.map((hour) => (
            <div key={hour} className="flex border-t border-border min-h-[60px]">
              <div className="w-16 shrink-0 text-right pr-2 text-xs text-muted-foreground pt-0">
                <span className="-mt-2 block">{format(new Date(2024, 0, 1, hour), 'HH:mm')}</span>
              </div>
              <div className="flex-1 border-l border-border relative" />
            </div>
          ))}

          {/* Event blocks */}
          {timedEvents.map((event) => {
            const pos = eventPosition(event);
            return (
              <div
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className={cn(
                  'absolute left-[68px] right-2 px-2 py-1 rounded text-xs overflow-hidden cursor-pointer border',
                  event.type === 'task'
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'bg-success/10 border-success/20 text-success'
                )}
                style={pos}
                title={event.title}
              >
                <div className="font-medium truncate">{event.title}</div>
                <div className="truncate opacity-70">
                  {format(parseISO(event.startTime), 'HH:mm')} - {format(parseISO(event.endTime), 'HH:mm')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
