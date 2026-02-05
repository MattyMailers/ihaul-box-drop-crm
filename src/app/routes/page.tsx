'use client';

import { useEffect, useState, useCallback } from 'react';
import Shell from '@/components/Shell';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';

type Drop = {
  id: number;
  homeowner_address: string;
  homeowner_name: string | null;
  homeowner_phone: string | null;
  status: string;
  scheduled_date: string | null;
  requested_date: string;
  delivery_notes: string | null;
  notes: string | null;
  realtor_first_name: string;
  realtor_last_name: string;
  realtor_phone: string | null;
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

function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${monday.toLocaleDateString('en-US', opts)} – ${sunday.toLocaleDateString('en-US', opts)}, ${sunday.getFullYear()}`;
}

export default function RoutesPage() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState<Date>(getMonday(new Date()));
  const [startLocation, setStartLocation] = useState('iHaul iMove, Colorado Springs, CO');
  const [endLocation, setEndLocation] = useState('iHaul iMove, Colorado Springs, CO');
  const [optimizing, setOptimizing] = useState(false);

  const fetchDrops = useCallback(() => {
    setLoading(true);
    const start = formatDate(weekStart);
    const end = formatDate(addDays(weekStart, 6));
    // Fetch pending drops for the selected week
    fetch(`/api/drops/weekly?start=${start}&end=${end}`)
      .then(r => r.json())
      .then((allDrops: Drop[]) => {
        // Filter to only pending statuses (not yet delivered)
        const pending = allDrops.filter(d => 
          ['requested', 'kit_prepped', 'out_for_delivery'].includes(d.status)
        );
        setDrops(pending);
        setLoading(false);
      });
  }, [weekStart]);

  useEffect(() => { fetchDrops(); }, [fetchDrops]);

  const prevWeek = () => setWeekStart(prev => addDays(prev, -7));
  const nextWeek = () => setWeekStart(prev => addDays(prev, 7));
  const goToday = () => setWeekStart(getMonday(new Date()));

  const markDelivered = async (id: number) => {
    await fetch(`/api/drops/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'delivered' }),
    });
    fetchDrops();
  };

  const markOutForDelivery = async (id: number) => {
    await fetch(`/api/drops/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'out_for_delivery' }),
    });
    fetchDrops();
  };

  const openGoogleMapsRoute = () => {
    if (drops.length === 0) return;
    const allStops = [
      encodeURIComponent(startLocation),
      ...drops.map(d => encodeURIComponent(d.homeowner_address)),
      encodeURIComponent(endLocation),
    ];
    const url = `https://www.google.com/maps/dir/${allStops.join('/')}/`;
    window.open(url, '_blank');
  };

  const optimizeRoute = async () => {
    if (drops.length === 0) return;
    setOptimizing(true);
    try {
      const res = await fetch('/api/routes/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: drops.map(d => d.homeowner_address),
          startAddress: startLocation,
          endAddress: endLocation,
        }),
      });
      const data = await res.json();
      if (data.mapsUrl) {
        window.open(data.mapsUrl, '_blank');
      }
    } catch (err) {
      console.error('Route optimization failed:', err);
    } finally {
      setOptimizing(false);
    }
  };

  const exportCSV = () => {
    if (drops.length === 0) return;
    const headers = ['Stop #', 'Address', 'Realtor Name', 'Realtor Phone', 'Homeowner Name', 'Notes'];
    const rows = drops.map((d, i) => [
      i + 1,
      `"${(d.homeowner_address || '').replace(/"/g, '""')}"`,
      `"${d.realtor_first_name} ${d.realtor_last_name || ''}".trim()`,
      `"${d.realtor_phone || ''}"`,
      `"${(d.homeowner_name || '').replace(/"/g, '""')}"`,
      `"${(d.notes || d.delivery_notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const weekLabel = formatDate(weekStart);
    link.setAttribute('download', `route-${weekLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Shell>
      <div className="p-4 md:p-8">
        {/* Header with week selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">🚚 Weekly Route</h1>
            <p className="text-gray-500 mt-1">Driver: Stew • {formatWeekLabel(weekStart)}</p>
          </div>
          <div className="flex items-center gap-2">
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

        {/* Route start/end location */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 no-print">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Start Location</label>
              <input
                type="text"
                value={startLocation}
                onChange={e => setStartLocation(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                placeholder="Starting address"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">End Location</label>
              <input
                type="text"
                value={endLocation}
                onChange={e => setEndLocation(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                placeholder="Ending address"
              />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-6 no-print">
          <button
            onClick={openGoogleMapsRoute}
            disabled={drops.length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
          >
            🗺️ Open Route in Google Maps
          </button>
          <button
            onClick={optimizeRoute}
            disabled={drops.length === 0 || optimizing}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
          >
            {optimizing ? '⏳ Optimizing...' : '🧭 Optimize Route'}
          </button>
          <button
            onClick={exportCSV}
            disabled={drops.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
          >
            📥 Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            🖨️ Print
          </button>
        </div>

        {/* Stops count */}
        <p className="text-sm text-gray-500 mb-4">{drops.length} stops pending</p>

        {loading ? (
          <p className="text-center text-gray-400 p-8">Loading route...</p>
        ) : drops.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-4">🎉</p>
            <p className="text-xl font-bold text-gray-900">All caught up!</p>
            <p className="text-gray-500 mt-1">No pending deliveries for this week.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {drops.map((drop, i) => (
              <div key={drop.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-orange-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Link href={`/drops/${drop.id}`} className="font-bold text-gray-900 text-lg hover:text-orange-600 transition-colors">
                          {drop.homeowner_address}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                          {drop.realtor_first_name} {drop.realtor_last_name} • {drop.realtor_company}
                        </p>
                        {drop.realtor_phone && <p className="text-sm text-gray-500">📱 Realtor: {drop.realtor_phone}</p>}
                        {drop.homeowner_name && <p className="text-sm text-gray-500">Homeowner: {drop.homeowner_name}</p>}
                        {drop.homeowner_phone && <p className="text-sm text-gray-500">📱 {drop.homeowner_phone}</p>}
                        {drop.notes && <p className="text-sm text-gray-400 mt-1 italic">{drop.notes}</p>}
                      </div>
                      <div className="mt-3 sm:mt-0 flex items-center gap-2">
                        <StatusBadge status={drop.status} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 no-print">
                      {(drop.status === 'requested' || drop.status === 'kit_prepped') && (
                        <button onClick={() => markOutForDelivery(drop.id)} className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                          🚚 Out for Delivery
                        </button>
                      )}
                      {(drop.status === 'out_for_delivery' || drop.status === 'requested' || drop.status === 'kit_prepped') && (
                        <button onClick={() => markDelivered(drop.id)} className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                          ✅ Mark Delivered
                        </button>
                      )}
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(drop.homeowner_address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                      >
                        📍 Navigate
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
