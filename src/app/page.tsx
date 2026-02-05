'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';

type Stats = {
  totalDrops: number;
  thisWeek: number;
  pendingFollowups: number;
  conversionRate: number;
  totalConverted: number;
  totalRevenue: number;
  realtorCount: number;
};

type Drop = {
  id: number;
  homeowner_address: string;
  status: string;
  requested_date: string;
  realtor_first_name: string;
  realtor_last_name: string;
  realtor_company: string;
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentDrops, setRecentDrops] = useState<Drop[]>([]);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats);
    fetch('/api/drops').then(r => r.json()).then((drops: Drop[]) => setRecentDrops(drops.slice(0, 5)));
  }, []);

  return (
    <Shell>
      <div className="p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Box Drop Overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Drops" value={stats?.totalDrops ?? '-'} icon="📦" color="orange" />
          <StatCard label="This Week" value={stats?.thisWeek ?? '-'} icon="📅" color="blue" />
          <StatCard label="Pending Follow-Ups" value={stats?.pendingFollowups ?? '-'} icon="📞" color="red" />
          <StatCard label="Conversion Rate" value={stats ? `${stats.conversionRate}%` : '-'} icon="🎯" color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <StatCard label="Converted" value={stats?.totalConverted ?? '-'} icon="✅" color="green" />
          <StatCard label="Revenue" value={stats ? `$${Number(stats.totalRevenue).toLocaleString()}` : '-'} icon="💰" color="orange" />
          <StatCard label="Active Realtors" value={stats?.realtorCount ?? '-'} icon="🏠" color="purple" />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link href="/drops/new" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors">
            ➕ New Box Drop
          </Link>
          <Link href="/routes" className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors">
            🚚 Today&apos;s Route
          </Link>
          <Link href="/followups" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors">
            📞 Follow-Ups
          </Link>
        </div>

        {/* Recent Drops */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Recent Box Drops</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentDrops.map((drop) => (
              <Link key={drop.id} href={`/drops/${drop.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{drop.homeowner_address}</p>
                  <p className="text-sm text-gray-500">
                    {drop.realtor_first_name} {drop.realtor_last_name} • {drop.realtor_company}
                  </p>
                </div>
                <StatusBadge status={drop.status} />
              </Link>
            ))}
            {recentDrops.length === 0 && (
              <p className="p-4 text-gray-400 text-center">No drops yet</p>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  const colorMap: Record<string, string> = {
    orange: 'from-orange-500 to-orange-600',
    blue: 'from-blue-500 to-blue-600',
    red: 'from-red-500 to-red-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colorMap[color]}`} />
      </div>
      <p className="text-2xl md:text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs md:text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}
