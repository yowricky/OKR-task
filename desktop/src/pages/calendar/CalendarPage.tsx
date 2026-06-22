import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addMonths, subMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/api/client';
import { CalendarGrid } from '@/components/shared/CalendarGrid';
import type { CalendarEvent } from '@app/shared';

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthStart = format(subMonths(currentDate, 1), 'yyyy-MM-01');
  const monthEnd = format(addMonths(currentDate, 1), 'yyyy-MM-t');

  const { data: events = [] } = useQuery({
    queryKey: ['calendar', monthStart, monthEnd],
    queryFn: () => api.get<CalendarEvent[]>(`/calendar/events?start=${monthStart}&end=${monthEnd}`),
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center gap-4">
        <h1 className="text-lg font-semibold">
          {format(currentDate, 'yyyy年 M月', { locale: zhCN })}
        </h1>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-accent rounded">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-2 py-0.5 text-sm hover:bg-accent rounded">今天</button>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-accent rounded">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2 ml-auto">
          {['月', '周', '日'].map(v => (
            <button key={v} className="px-3 py-1 text-xs rounded bg-accent text-accent-foreground">{v}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 p-4">
        <CalendarGrid currentDate={currentDate} events={events} onDateClick={(d) => console.log(d)} />
      </div>
    </div>
  );
}
