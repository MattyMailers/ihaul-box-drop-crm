'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import AddressAutocomplete from '@/components/AddressAutocomplete';

type Realtor = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
};

export default function NewDropPage() {
  const router = useRouter();
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewRealtor, setShowNewRealtor] = useState(false);
  const [duplicateError, setDuplicateError] = useState<{id: number; scheduled_date: string; created_at: string} | null>(null);

  const [form, setForm] = useState({
    realtor_id: '',
    homeowner_address: '',
    homeowner_name: '',
    homeowner_email: '',
    homeowner_phone: '',
    listing_status: 'new_listing',
    campaign_source: '',
    scheduled_date: '',
    notes: '',
  });

  const [newRealtor, setNewRealtor] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
  });

  useEffect(() => {
    fetch('/api/realtors').then(r => r.json()).then(setRealtors);
  }, []);

  const handleSubmit = async (e: React.FormEvent, allowDuplicate = false) => {
    e.preventDefault();
    setLoading(true);
    setDuplicateError(null);

    let realtorId = form.realtor_id;

    // Create new realtor if needed
    if (showNewRealtor) {
      const res = await fetch('/api/realtors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRealtor),
      });
      const data = await res.json();
      realtorId = String(data.id);
    }

    const url = allowDuplicate ? '/api/drops?allow_duplicate=true' : '/api/drops';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, realtor_id: parseInt(realtorId) }),
    });

    const data = await res.json();

    if (res.status === 409 && data.error === 'duplicate_address') {
      setDuplicateError(data.existing);
      setLoading(false);
      return;
    }

    router.push('/drops');
  };

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none text-gray-900";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <Shell>
      <div className="p-4 md:p-8 max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">New Box Drop</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Realtor Selection */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🏠 Realtor</h2>
            {!showNewRealtor ? (
              <>
                <select
                  value={form.realtor_id}
                  onChange={(e) => setForm({ ...form, realtor_id: e.target.value })}
                  className={inputClass}
                  required
                >
                  <option value="">Select a realtor...</option>
                  {realtors.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.first_name} {r.last_name} - {r.company}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowNewRealtor(true)} className="mt-2 text-orange-500 text-sm font-medium hover:text-orange-600">
                  + Add New Realtor
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>First Name *</label>
                    <input value={newRealtor.first_name} onChange={(e) => setNewRealtor({ ...newRealtor, first_name: e.target.value })} className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <input value={newRealtor.last_name} onChange={(e) => setNewRealtor({ ...newRealtor, last_name: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" value={newRealtor.email} onChange={(e) => setNewRealtor({ ...newRealtor, email: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input value={newRealtor.phone} onChange={(e) => setNewRealtor({ ...newRealtor, phone: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Company</label>
                  <input value={newRealtor.company} onChange={(e) => setNewRealtor({ ...newRealtor, company: e.target.value })} className={inputClass} />
                </div>
                <button type="button" onClick={() => setShowNewRealtor(false)} className="text-gray-500 text-sm hover:text-gray-700">
                  ← Select existing realtor
                </button>
              </div>
            )}
          </div>

          {/* Homeowner Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📍 Homeowner / Listing</h2>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Address *</label>
                <AddressAutocomplete
                  value={form.homeowner_address}
                  onChange={(value) => setForm({ ...form, homeowner_address: value })}
                  className={inputClass}
                  required
                  placeholder="123 Main St, Colorado Springs CO"
                />
              </div>
              <div>
                <label className={labelClass}>Homeowner Name</label>
                <input value={form.homeowner_name} onChange={(e) => setForm({ ...form, homeowner_name: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" value={form.homeowner_email} onChange={(e) => setForm({ ...form, homeowner_email: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input value={form.homeowner_phone} onChange={(e) => setForm({ ...form, homeowner_phone: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Listing Status</label>
                  <select value={form.listing_status} onChange={(e) => setForm({ ...form, listing_status: e.target.value })} className={inputClass}>
                    <option value="new_listing">New Listing</option>
                    <option value="pending">Pending</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Campaign Source</label>
                  <input value={form.campaign_source} onChange={(e) => setForm({ ...form, campaign_source: e.target.value })} className={inputClass} placeholder="e.g. email_campaign_feb" />
                </div>
              </div>
            </div>
          </div>

          {/* Schedule & Notes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📅 Schedule</h2>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Scheduled Delivery Date</label>
                <input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} rows={3} placeholder="Any special instructions..." />
              </div>
            </div>
          </div>

          {duplicateError && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800 font-medium mb-2">⚠️ Duplicate Address Detected</p>
              <p className="text-amber-700 text-sm mb-3">
                A box drop already exists for this address (Drop #{duplicateError.id}, 
                {duplicateError.scheduled_date ? ` scheduled ${duplicateError.scheduled_date}` : ` created ${duplicateError.created_at}`}).
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push(`/drops/${duplicateError.id}`)}
                  className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm font-medium hover:bg-amber-200"
                >
                  View Existing Drop
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600"
                >
                  Create Anyway
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : '📦 Create Box Drop'}
          </button>
        </form>
      </div>
    </Shell>
  );
}
