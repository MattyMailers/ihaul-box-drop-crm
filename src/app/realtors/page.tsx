'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';

type Realtor = {
  id: number;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  total_drops: number;
  total_conversions: number;
};

export default function RealtorsPage() {
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/realtors').then(r => r.json()).then(data => {
      setRealtors(data);
      setLoading(false);
    });
  }, []);

  return (
    <Shell>
      <div className="p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">🏠 Realtor Relationships</h1>
          <p className="text-gray-500 mt-1">{realtors.length} active realtors</p>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 p-8">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {realtors.map((r) => {
              const convRate = r.total_drops > 0 ? Math.round((r.total_conversions / r.total_drops) * 100) : 0;
              return (
                <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{r.first_name} {r.last_name}</h3>
                      <p className="text-sm text-gray-500">{r.company}</p>
                    </div>
                    <div className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-bold">
                      {r.total_drops} drops
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    {r.email && (
                      <p className="text-gray-600">
                        📧 <a href={`mailto:${r.email}`} className="text-blue-600 hover:underline">{r.email}</a>
                      </p>
                    )}
                    {r.phone && <p className="text-gray-600">📱 {r.phone}</p>}
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Conversions</span>
                        <span className="font-bold text-gray-900">{r.total_conversions}/{r.total_drops}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all"
                          style={{ width: `${convRate}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{convRate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Shell>
  );
}
