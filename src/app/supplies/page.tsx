'use client';

import { useEffect, useState, useCallback } from 'react';
import Shell from '@/components/Shell';

type SupplyItem = {
  id: number;
  name: string;
  qty_per_kit: number;
  unit_cost: number;
};

type Drop = {
  id: number;
  status: string;
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

function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${monday.toLocaleDateString('en-US', opts)} – ${sunday.toLocaleDateString('en-US', opts)}, ${sunday.getFullYear()}`;
}

const COST_PER_KIT = 25;

export default function SuppliesPage() {
  const [weekStart, setWeekStart] = useState<Date>(getMonday(new Date()));
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [dropCount, setDropCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const fetchData = useCallback(() => {
    setLoading(true);
    const start = formatDate(weekStart);
    const end = formatDate(addDays(weekStart, 6));

    Promise.all([
      fetch('/api/supplies').then(r => r.json()),
      fetch(`/api/drops/weekly?start=${start}&end=${end}`).then(r => r.json()),
    ]).then(([supplyData, weekDrops]) => {
      setSupplies(supplyData);
      // Count non-cancelled drops
      const activeDrops = (weekDrops as Drop[]).filter((d: Drop) => d.status !== 'cancelled');
      setDropCount(activeDrops.length);
      setLoading(false);
    });
  }, [weekStart]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Load checked state from localStorage
  useEffect(() => {
    const key = `supply-checklist-${formatDate(weekStart)}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try { setChecked(JSON.parse(saved)); } catch { /* ignore */ }
    } else {
      setChecked({});
    }
  }, [weekStart]);

  const toggleCheck = (id: number) => {
    setChecked(prev => {
      const next = { ...prev, [id]: !prev[id] };
      const key = `supply-checklist-${formatDate(weekStart)}`;
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };

  const prevWeek = () => setWeekStart(prev => addDays(prev, -7));
  const nextWeek = () => setWeekStart(prev => addDays(prev, 7));
  const goToday = () => setWeekStart(getMonday(new Date()));

  const totalCost = dropCount * COST_PER_KIT;
  const allChecked = supplies.length > 0 && supplies.every(s => checked[s.id]);
  const checkedCount = supplies.filter(s => checked[s.id]).length;

  return (
    <Shell>
      <div className="p-4 md:p-8 max-w-3xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">📋 Supply Checklist</h1>
            <p className="text-gray-500 mt-1">{formatWeekLabel(weekStart)}</p>
          </div>
          <div className="flex items-center gap-2 no-print">
            <button onClick={prevWeek} className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm">
              ← Prev
            </button>
            <button onClick={goToday} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm">
              This Week
            </button>
            <button onClick={nextWeek} className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm">
              Next →
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 p-8">Loading...</p>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
                <p className="text-3xl font-bold text-orange-500">{dropCount}</p>
                <p className="text-xs text-gray-500 mt-1">Kits Needed</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
                <p className="text-3xl font-bold text-gray-900">${totalCost.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Est. Cost</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
                <p className="text-3xl font-bold text-blue-500">{checkedCount}/{supplies.length}</p>
                <p className="text-xs text-gray-500 mt-1">Items Packed</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
                <p className="text-3xl">{allChecked ? '✅' : '⏳'}</p>
                <p className="text-xs text-gray-500 mt-1">{allChecked ? 'Ready to Go!' : 'In Progress'}</p>
              </div>
            </div>

            {dropCount === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <p className="text-4xl mb-4">📭</p>
                <p className="text-xl font-bold text-gray-900">No drops this week</p>
                <p className="text-gray-500 mt-1">Nothing to pack yet.</p>
              </div>
            ) : (
              <>
                {/* Checklist Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                  <div className="p-4 md:p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Supply Items</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {dropCount} kits × per-item qty = total needed
                    </p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {supplies.map((item) => {
                      const totalNeeded = item.qty_per_kit * dropCount;
                      const itemCost = item.unit_cost * totalNeeded;
                      const isChecked = !!checked[item.id];
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleCheck(item.id)}
                          className={`flex items-center gap-4 p-4 md:px-6 cursor-pointer transition-colors ${
                            isChecked ? 'bg-green-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                          }`}>
                            {isChecked && (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${isChecked ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {item.qty_per_kit} per kit × {dropCount} kits
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-lg font-bold ${isChecked ? 'text-green-600' : 'text-gray-900'}`}>
                              {totalNeeded}
                            </p>
                            <p className="text-xs text-gray-400">${itemCost.toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Totals row */}
                  <div className="p-4 md:px-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">Total Estimated Cost</p>
                      <p className="text-xs text-gray-500">${COST_PER_KIT} per kit × {dropCount} kits</p>
                    </div>
                    <p className="text-2xl font-bold text-orange-500">${totalCost.toLocaleString()}</p>
                  </div>
                </div>

                {/* Print button */}
                <div className="flex gap-3 no-print">
                  <button
                    onClick={() => window.print()}
                    className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
                  >
                    🖨️ Print Checklist
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* Print header (hidden on screen) */}
        <div className="hidden print:block print-header mb-4">
          <h1 className="text-2xl font-bold">📋 iHaul iMove - Supply Checklist</h1>
          <p className="text-gray-600">{formatWeekLabel(weekStart)} • {dropCount} kits needed • Est. ${totalCost}</p>
          <p className="text-xs text-gray-400 mt-1">Printed: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </Shell>
  );
}
