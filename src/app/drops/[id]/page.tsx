'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import StatusBadge from '@/components/StatusBadge';
import type { BoxDrop } from '@/lib/db';

const statusFlow = ['requested', 'kit_prepped', 'out_for_delivery', 'delivered', 'followed_up', 'converted'];

export default function DropDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [drop, setDrop] = useState<BoxDrop | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchDrop = () => {
    fetch(`/api/drops/${id}`).then(r => r.json()).then(setDrop);
  };

  useEffect(() => { fetchDrop(); }, [id]);

  const updateField = async (field: string, value: string | number | boolean | null) => {
    setSaving(true);
    await fetch(`/api/drops/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    fetchDrop();
    setSaving(false);
  };

  const advanceStatus = () => {
    if (!drop) return;
    const currentIdx = statusFlow.indexOf(drop.status);
    if (currentIdx < statusFlow.length - 1) {
      updateField('status', statusFlow[currentIdx + 1]);
    }
  };

  if (!drop) return <Shell><div className="p-8 text-center text-gray-400">Loading...</div></Shell>;

  const currentStatusIdx = statusFlow.indexOf(drop.status);

  return (
    <Shell>
      <div className="p-4 md:p-8 max-w-3xl">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 mb-4 text-sm">
          ← Back
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{drop.homeowner_address}</h1>
            <p className="text-gray-500 mt-1">
              {drop.realtor_first_name} {drop.realtor_last_name} • {drop.realtor_company}
            </p>
          </div>
          <div className="mt-2 sm:mt-0 flex items-center gap-2">
            <StatusBadge status={drop.status} />
            {saving && <span className="text-xs text-orange-500">Saving...</span>}
          </div>
        </div>

        {/* Status Pipeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">Pipeline</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {statusFlow.map((s, i) => (
              <button
                key={s}
                onClick={() => updateField('status', s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  i <= currentStatusIdx
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
          {currentStatusIdx < statusFlow.length - 1 && (
            <button onClick={advanceStatus} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors">
              Advance to: {statusFlow[currentStatusIdx + 1].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} →
            </button>
          )}
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">📍 Listing Details</h2>
            <div className="space-y-3 text-sm">
              <DetailRow label="Address" value={drop.homeowner_address} />
              <DetailRow label="Homeowner" value={drop.homeowner_name} />
              <DetailRow label="Email" value={drop.homeowner_email} />
              <DetailRow label="Phone" value={drop.homeowner_phone} />
              <DetailRow label="Listing Status" value={drop.listing_status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
              <DetailRow label="Campaign" value={drop.campaign_source} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">🏠 Realtor</h2>
            <div className="space-y-3 text-sm">
              <DetailRow label="Name" value={`${drop.realtor_first_name || ''} ${drop.realtor_last_name || ''}`.trim()} />
              <DetailRow label="Email" value={drop.realtor_email} />
              <DetailRow label="Company" value={drop.realtor_company} />
            </div>
          </div>
        </div>

        {/* Dates & Reschedule */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">📅 Dates</h2>
          <div className="grid grid-cols-3 gap-4 text-sm mb-4">
            <DetailRow label="Requested" value={drop.requested_date} />
            <div>
              <p className="text-gray-400 text-xs">Scheduled</p>
              <input
                type="date"
                defaultValue={drop.scheduled_date || ''}
                onChange={(e) => updateField('scheduled_date', e.target.value || null)}
                className="mt-1 w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none text-gray-900 text-sm"
              />
            </div>
            <DetailRow label="Delivered" value={drop.delivered_date} />
          </div>
          {drop.status !== 'delivered' && drop.status !== 'converted' && (
            <p className="text-xs text-gray-400">💡 Change the scheduled date to reschedule this drop</p>
          )}
        </div>

        {/* Follow-ups */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">📞 Follow-Ups</h2>
          <div className="grid grid-cols-2 gap-3">
            <ToggleButton label="Email Homeowner" active={!!drop.followup_email_homeowner} onClick={() => updateField('followup_email_homeowner', drop.followup_email_homeowner ? 0 : 1)} />
            <ToggleButton label="Email Realtor" active={!!drop.followup_email_realtor} onClick={() => updateField('followup_email_realtor', drop.followup_email_realtor ? 0 : 1)} />
            <ToggleButton label="Text Homeowner" active={!!drop.followup_text_homeowner} onClick={() => updateField('followup_text_homeowner', drop.followup_text_homeowner ? 0 : 1)} />
            <ToggleButton label="Call Homeowner" active={!!drop.followup_call_homeowner} onClick={() => updateField('followup_call_homeowner', drop.followup_call_homeowner ? 0 : 1)} />
          </div>
        </div>

        {/* Conversion */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">💰 Conversion</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <ToggleButton label="Quote Requested" active={!!drop.quote_requested} onClick={() => updateField('quote_requested', drop.quote_requested ? 0 : 1)} />
            <ToggleButton label="Booked" active={!!drop.booked} onClick={() => updateField('booked', drop.booked ? 0 : 1)} />
          </div>
          {drop.booked ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Revenue ($)</label>
              <input
                type="number"
                defaultValue={drop.revenue || ''}
                onBlur={(e) => updateField('revenue', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none text-gray-900"
                placeholder="0.00"
              />
            </div>
          ) : null}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">📝 Notes</h2>
          <textarea
            defaultValue={drop.notes || ''}
            onBlur={(e) => updateField('notes', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none text-gray-900"
            rows={4}
            placeholder="Add notes..."
          />
        </div>

        {/* Delete */}
        <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
          <h2 className="text-sm font-bold text-red-500 uppercase mb-2">⚠️ Danger Zone</h2>
          <p className="text-sm text-red-600 mb-4">Permanently delete this box drop. This cannot be undone.</p>
          <button
            onClick={async () => {
              if (confirm('Are you sure you want to delete this box drop?')) {
                await fetch(`/api/drops/${id}`, { method: 'DELETE' });
                router.push('/drops');
              }
            }}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            🗑️ Delete Box Drop
          </button>
        </div>
      </div>
    </Shell>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  const displayValue = value && value !== 'Unknown' && value !== '-' ? value : null;
  return (
    <div>
      <p className="text-gray-400 text-xs">{label}</p>
      {displayValue ? (
        <p className="text-gray-900 font-medium">{displayValue}</p>
      ) : (
        <p className="text-gray-300 italic text-sm">Not provided</p>
      )}
    </div>
  );
}

function ToggleButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
      }`}
    >
      <span>{active ? '✅' : '⬜'}</span>
      {label}
    </button>
  );
}
