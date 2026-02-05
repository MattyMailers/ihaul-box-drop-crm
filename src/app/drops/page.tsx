'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';

type Drop = {
  id: number;
  homeowner_address: string;
  homeowner_name: string | null;
  status: string;
  requested_date: string;
  scheduled_date: string | null;
  listing_status: string | null;
  realtor_first_name: string;
  realtor_last_name: string;
  realtor_company: string;
};

const statuses = ['all', 'requested', 'kit_prepped', 'out_for_delivery', 'delivered', 'followed_up', 'converted', 'cancelled'];

export default function DropsPage() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = filter === 'all' ? '/api/drops' : `/api/drops?status=${filter}`;
    fetch(url).then(r => r.json()).then(data => {
      setDrops(data);
      setLoading(false);
    });
  }, [filter]);

  return (
    <Shell>
      <div className="p-4 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Box Drops</h1>
            <p className="text-gray-500 mt-1">{drops.length} total</p>
          </div>
          <Link href="/drops/new" className="mt-3 sm:mt-0 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-center">
            ➕ New Box Drop
          </Link>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === s ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Drops list */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <p className="p-8 text-center text-gray-400">Loading...</p>
          ) : drops.length === 0 ? (
            <p className="p-8 text-center text-gray-400">No drops found</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Address</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Realtor</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Listing</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Requested</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {drops.map((drop) => (
                      <tr key={drop.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/drops/${drop.id}`}>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{drop.homeowner_address}</p>
                          {drop.homeowner_name && <p className="text-sm text-gray-500">{drop.homeowner_name}</p>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {drop.realtor_first_name} {drop.realtor_last_name}
                          <br /><span className="text-gray-400">{drop.realtor_company}</span>
                        </td>
                        <td className="px-6 py-4"><StatusBadge status={drop.status} /></td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {drop.listing_status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{drop.requested_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-50">
                {drops.map((drop) => (
                  <Link key={drop.id} href={`/drops/${drop.id}`} className="block p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{drop.homeowner_address}</p>
                        <p className="text-xs text-gray-500 mt-1">{drop.realtor_first_name} {drop.realtor_last_name} • {drop.realtor_company}</p>
                      </div>
                      <StatusBadge status={drop.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}
