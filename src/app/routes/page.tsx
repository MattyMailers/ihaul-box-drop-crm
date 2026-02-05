'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import StatusBadge from '@/components/StatusBadge';

type Drop = {
  id: number;
  homeowner_address: string;
  homeowner_name: string | null;
  homeowner_phone: string | null;
  status: string;
  scheduled_date: string | null;
  delivery_notes: string | null;
  notes: string | null;
  realtor_first_name: string;
  realtor_last_name: string;
  realtor_company: string;
};

export default function RoutesPage() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrops = () => {
    setLoading(true);
    fetch('/api/drops?status=requested')
      .then(r => r.json())
      .then(requested => {
        fetch('/api/drops?status=kit_prepped')
          .then(r => r.json())
          .then(prepped => {
            fetch('/api/drops?status=out_for_delivery')
              .then(r => r.json())
              .then(outForDelivery => {
                setDrops([...requested, ...prepped, ...outForDelivery]);
                setLoading(false);
              });
          });
      });
  };

  useEffect(() => { fetchDrops(); }, []);

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

  return (
    <Shell>
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">🚚 Weekly Route</h1>
            <p className="text-gray-500 mt-1">Driver: Stew • {drops.length} stops pending</p>
          </div>
          <button onClick={() => window.print()} className="no-print bg-gray-900 hover:bg-gray-800 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors">
            🖨️ Print
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 p-8">Loading route...</p>
        ) : drops.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-4">🎉</p>
            <p className="text-xl font-bold text-gray-900">All caught up!</p>
            <p className="text-gray-500 mt-1">No pending deliveries right now.</p>
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
                        <p className="font-bold text-gray-900 text-lg">{drop.homeowner_address}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {drop.realtor_first_name} {drop.realtor_last_name} • {drop.realtor_company}
                        </p>
                        {drop.homeowner_name && <p className="text-sm text-gray-500">Homeowner: {drop.homeowner_name}</p>}
                        {drop.homeowner_phone && <p className="text-sm text-gray-500">📱 {drop.homeowner_phone}</p>}
                        {drop.notes && <p className="text-sm text-gray-400 mt-1 italic">{drop.notes}</p>}
                      </div>
                      <div className="mt-3 sm:mt-0 flex items-center gap-2">
                        <StatusBadge status={drop.status} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 no-print">
                      {drop.status === 'requested' && (
                        <button onClick={() => markOutForDelivery(drop.id)} className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                          🚚 Out for Delivery
                        </button>
                      )}
                      {drop.status === 'kit_prepped' && (
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
