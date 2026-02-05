'use client';

import { useEffect, useState, useCallback } from 'react';
import Shell from '@/components/Shell';

type AutomationEvent = {
  id: number;
  event_type: string;
  email: string;
  classification: string;
  details: string;
  action_taken: string;
  created_at: string;
};

type ClassificationStat = {
  classification: string;
  count: number;
};

const CLASSIFICATION_COLORS: Record<string, string> = {
  BOXES: 'bg-green-100 text-green-800',
  QUOTE_REQUEST: 'bg-orange-100 text-orange-800',
  OPT_OUT: 'bg-red-100 text-red-800',
  NOT_INTERESTED: 'bg-gray-100 text-gray-800',
  OTHER: 'bg-blue-100 text-blue-800',
  CLASSIFICATION_FAILED: 'bg-yellow-100 text-yellow-800',
};

const CLASSIFICATION_ICONS: Record<string, string> = {
  BOXES: '📦',
  QUOTE_REQUEST: '🔥',
  OPT_OUT: '❌',
  NOT_INTERESTED: '👋',
  OTHER: '❓',
  CLASSIFICATION_FAILED: '⚠️',
};

export default function AutomationPage() {
  const [events, setEvents] = useState<AutomationEvent[]>([]);
  const [stats, setStats] = useState<ClassificationStat[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchEvents = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('limit', '50');
    if (filter) params.set('classification', filter);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);

    fetch(`/api/automation?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        setEvents(data.events || []);
        setStats(data.stats || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter, dateFrom, dateTo]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  return (
    <Shell>
      <div className="p-4 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">🤖 Automation Log</h1>
            <p className="text-gray-500 mt-1">
              Webhook events, AI classifications, and automated actions
            </p>
          </div>
          <button
            onClick={fetchEvents}
            className="mt-2 sm:mt-0 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          <div
            className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer transition-all ${!filter ? 'ring-2 ring-orange-500' : ''}`}
            onClick={() => setFilter('')}
          >
            <p className="text-2xl font-bold text-gray-900">{total}</p>
            <p className="text-xs text-gray-500">All Events</p>
          </div>
          {stats.map(s => (
            <div
              key={s.classification}
              className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer transition-all ${filter === s.classification ? 'ring-2 ring-orange-500' : ''}`}
              onClick={() => setFilter(filter === s.classification ? '' : s.classification)}
            >
              <p className="text-2xl font-bold text-gray-900">
                {CLASSIFICATION_ICONS[s.classification] || '📊'} {s.count}
              </p>
              <p className="text-xs text-gray-500">{s.classification}</p>
            </div>
          ))}
        </div>

        {/* Date filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            placeholder="From date"
          />
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            placeholder="To date"
          />
          {(dateFrom || dateTo || filter) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setFilter(''); }}
              className="text-sm text-gray-500 hover:text-gray-800 px-3 py-2"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Events list */}
        {loading ? (
          <p className="text-center text-gray-400 p-8">Loading events...</p>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-4">🤖</p>
            <p className="text-xl font-bold text-gray-900">No automation events yet</p>
            <p className="text-gray-500 mt-1">
              Events will appear here when the webhook service processes replies.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(event => (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {CLASSIFICATION_ICONS[event.classification] || '📊'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${CLASSIFICATION_COLORS[event.classification] || 'bg-gray-100 text-gray-800'}`}>
                          {event.classification}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {event.email}
                        </span>
                      </div>
                      {event.details && (
                        <p className="text-sm text-gray-600 mt-1">{event.details}</p>
                      )}
                      {event.action_taken && (
                        <p className="text-xs text-gray-400 mt-1">
                          Action: {event.action_taken}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                    {new Date(event.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
