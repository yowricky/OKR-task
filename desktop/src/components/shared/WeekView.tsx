import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isToday, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@app/shared';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 - 20:00

export function WeekView({ currentDate, events, onDateClick }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  const getEventsForDay = (day: Date) =>
    events.filter(e => isSameDay(parseISO(e.startTime), day));

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
    const height = Math.max(((clampedEnd - clampedStart) / totalMinutes) * 100, 2);
    return { top: `${top}%`, height: `${height}%` };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border sticky top-0 bg-background z-10">
        <div className="text-xs text-muted-foreground text-center py-2" />
        {days.map((day, i) => (
          <div
            key={day.toISOString()}
            className={cn(
              'text-center py-2 border-l border-border',
              isToday(day) && 'bg-primary/10'
            )}
          >
            <div className="text-xs text-muted-foreground">{weekDays[i]}</div>
            <button
              onClick={() => onDateClick(day)}
              className={cn(
                'text-sm font-semibold w-7 h-7 rounded-full inline-flex items-center justify-center',
                isToday(day) && 'bg-primary text-primary-foreground'
              )}
            >
              {format(day, 'd')}
            </button>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
          {HOURS.map((hour) => (
            <div key={hour} className="contents">
              <div className="text-right pr-2 text-xs text-muted-foreground py-0 relative border-t border-border">
                <span className="-mt-2 block">{format(new Date(2024, 0, 1, hour), 'HH:mm')}</span>
              </div>
              {days.map((day) => (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className={cn(
                    'border-t border-border border-l border-border min-h-[60px] relative',
                    isToday(day) && 'bg-primary/5'
                  )}
                />
              ))}
            </div>
          ))}

          {/* Events overlay */}
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            return dayEvents.map((event) => {
              const pos = eventPosition(event);
              return (
                <div
                  key={event.id}
                  className={cn(
                    'absolute left-0 right-0 mx-0.5 px-1.5 py-0.5 rounded text-xs overflow-hidden cursor-pointer border',
                    event.type === 'task'
                      ? 'bg-primary/10 border-primary/20 text-primary'
                      : 'bg-success/10 border-success/20 text-success'
                  )}
                  style={{
                    ...pos,
                    gridColumn: `${days.indexOf(day) + 2} / ${days.indexOf(day) + 3}`,
                  }}
                  title={event.title}
                >
                  <div className="font-medium truncate">{event.title}</div>
                  <div className="truncate opacity-70">
                    {format(parseISO(event.startTime), 'HH:mm')} - {format(parseISO(event.endTime), 'HH:mm')}
                  </div>
                </div>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
}
