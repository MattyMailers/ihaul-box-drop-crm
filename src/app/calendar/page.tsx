'use client';

import { useEffect, useState, useCallback } from 'react';
import Shell from '@/components/Shell';
import Link from 'next/link';

type Drop = {
  id: number;
  homeowner_address: string;
  homeowner_name: string | null;
  status: string;
  requested_date: string;
  scheduled_date: string | null;
  realtor_first_name: string;
  realtor_last_name: string;
  realtor_company: string;
};

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDayLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${monday.toLocaleDateString('en-US', opts)} – ${sunday.toLocaleDateString('en-US', opts)}, ${sunday.getFullYear()}`;
}

const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  requested: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800' },
  kit_prepped: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800' },
  out_for_delivery: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-800' },
  delivered: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800' },
  followed_up: { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-800' },
  converted: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800' },
  cancelled: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-500' },
};

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState<Date>(getMonday(new Date()));
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrops = useCallback(() => {
    setLoading(true);
    const start = formatDate(weekStart);
    const end = formatDate(addDays(weekStart, 6));
    fetch(`/api/drops/weekly?start=${start}&end=${end}`)
      .then(r => r.json())
      .then(data => {
        setDrops(data);
        setLoading(false);
      });
  }, [weekStart]);

  useEffect(() => { fetchDrops(); }, [fetchDrops]);

  const prevWeek = () => setWeekStart(prev => addDays(prev, -7));
  const nextWeek = () => setWeekStart(prev => addDays(prev, 7));
  const goToday = () => setWeekStart(getMonday(new Date()));

  const dayColumns = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getDropsForDay = (day: Date) => {
    const dayStr = formatDate(day);
    return drops.filter(d => {
      const dropDate = d.scheduled_date || d.requested_date;
      return dropDate === dayStr;
    });
  };

  const today = formatDate(new Date());

  return (
    <Shell>
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">📅 Weekly Calendar</h1>
            <p className="text-gray-500 mt-1">{formatWeekLabel(weekStart)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevWeek} className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors">
              ← Prev
            </button>
            <button onClick={goToday} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors">
              Today
            </button>
            <button onClick={nextWeek} className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors">
              Next →
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-4">
          <LegendDot color="bg-yellow-400" label="Requested" />
          <LegendDot color="bg-blue-400" label="Prepped" />
          <LegendDot color="bg-purple-400" label="Out for Delivery" />
          <LegendDot color="bg-green-400" label="Delivered" />
          <LegendDot color="bg-orange-400" label="Converted" />
        </div>

        {loading ? (
          <p className="text-center text-gray-400 p-8">Loading calendar...</p>
        ) : (
          <>
            {/* Desktop: horizontal week grid */}
            <div className="hidden md:grid grid-cols-7 gap-3">
              {dayColumns.map((day) => {
                const dayStr = formatDate(day);
                const dayDrops = getDropsForDay(day);
                const isToday = dayStr === today;
                return (
                  <div key={dayStr} className={`bg-white rounded-2xl shadow-sm border ${isToday ? 'border-orange-400 ring-2 ring-orange-200' : 'border-gray-100'} overflow-hidden`}>
                    <div className={`p-3 text-center font-bold text-sm ${isToday ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-700'}`}>
                      {formatDayLabel(day)}
                    </div>
                    <div className="p-2 min-h-[120px] space-y-2">
                      {dayDrops.length === 0 && (
                        <p className="text-gray-300 text-xs text-center pt-4">No drops</p>
                      )}
                      {dayDrops.map((drop) => {
                        const sc = statusColors[drop.status] || statusColors.requested;
                        return (
                          <Link key={drop.id} href={`/drops/${drop.id}`} className={`block p-2 rounded-lg border ${sc.bg} ${sc.border} ${sc.text} text-xs hover:shadow-md transition-shadow`}>
                            <p className="font-semibold truncate">{drop.homeowner_address.split(',')[0]}</p>
                            <p className="truncate opacity-75">{drop.realtor_first_name} {drop.realtor_last_name?.[0] || ''}</p>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile: vertical stack */}
            <div className="md:hidden space-y-3">
              {dayColumns.map((day) => {
                const dayStr = formatDate(day);
                const dayDrops = getDropsForDay(day);
                const isToday = dayStr === today;
                return (
                  <div key={dayStr} className={`bg-white rounded-2xl shadow-sm border ${isToday ? 'border-orange-400 ring-2 ring-orange-200' : 'border-gray-100'} overflow-hidden`}>
                    <div className={`px-4 py-3 font-bold text-sm flex justify-between items-center ${isToday ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-700'}`}>
                      <span>{formatDayLabel(day)}</span>
                      {dayDrops.length > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${isToday ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                          {dayDrops.length}
                        </span>
                      )}
                    </div>
                    {dayDrops.length > 0 && (
                      <div className="p-3 space-y-2">
                        {dayDrops.map((drop) => {
                          const sc = statusColors[drop.status] || statusColors.requested;
                          return (
                            <Link key={drop.id} href={`/drops/${drop.id}`} className={`flex items-center justify-between p-3 rounded-xl border ${sc.bg} ${sc.border} ${sc.text} hover:shadow-md transition-shadow`}>
                              <div>
                                <p className="font-semibold text-sm">{drop.homeowner_address.split(',')[0]}</p>
                                <p className="text-xs opacity-75">{drop.realtor_first_name} {drop.realtor_last_name}</p>
                              </div>
                              <span className="text-xs font-medium">{drop.status.replace(/_/g, ' ')}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <p className="text-sm text-gray-500">
                <span className="font-bold text-gray-900">{drops.length}</span> drops scheduled this week
              </p>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-600">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      {label}
    </div>
  );
}
