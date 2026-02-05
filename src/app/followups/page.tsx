'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import Link from 'next/link';

type Drop = {
  id: number;
  homeowner_address: string;
  homeowner_name: string | null;
  homeowner_email: string | null;
  homeowner_phone: string | null;
  status: string;
  delivered_date: string | null;
  followup_email_homeowner: number;
  followup_email_realtor: number;
  followup_text_homeowner: number;
  followup_call_homeowner: number;
  realtor_first_name: string;
  realtor_last_name: string;
  realtor_email: string | null;
};

type Template = {
  id: number;
  name: string;
  type: string;
  subject: string | null;
  body: string;
};

export default function FollowUpsPage() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplate, setShowTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDrops = () => {
    setLoading(true);
    fetch('/api/drops?needs_followup=true')
      .then(r => r.json())
      .then(data => {
        setDrops(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDrops();
    fetch('/api/templates').then(r => r.json()).then(setTemplates);
  }, []);

  const markFollowup = async (id: number, field: string) => {
    await fetch(`/api/drops/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: 1 }),
    });
    fetchDrops();
  };

  return (
    <Shell>
      <div className="p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">📞 Follow-Up Tracker</h1>
          <p className="text-gray-500 mt-1">{drops.length} drops need follow-up</p>
        </div>

        {/* Templates */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">📋 Templates</h2>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setShowTemplate(showTemplate?.id === t.id ? null : t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  showTemplate?.id === t.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
          {showTemplate && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              {showTemplate.subject && <p className="font-medium text-gray-900 mb-2">Subject: {showTemplate.subject}</p>}
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{showTemplate.body}</pre>
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-center text-gray-400 p-8">Loading...</p>
        ) : drops.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-4">✅</p>
            <p className="text-xl font-bold text-gray-900">All followed up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {drops.map((drop) => (
              <div key={drop.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                  <div>
                    <Link href={`/drops/${drop.id}`} className="font-bold text-gray-900 hover:text-orange-500">
                      {drop.homeowner_address}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">
                      Realtor: {drop.realtor_first_name} {drop.realtor_last_name}
                      {drop.realtor_email && ` (${drop.realtor_email})`}
                    </p>
                    {drop.homeowner_name && <p className="text-sm text-gray-500">Homeowner: {drop.homeowner_name}</p>}
                    <p className="text-xs text-gray-400 mt-1">Delivered: {drop.delivered_date || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <FollowupBtn
                    label="📧 Email Homeowner"
                    done={!!drop.followup_email_homeowner}
                    onClick={() => markFollowup(drop.id, 'followup_email_homeowner')}
                  />
                  <FollowupBtn
                    label="📧 Email Realtor"
                    done={!!drop.followup_email_realtor}
                    onClick={() => markFollowup(drop.id, 'followup_email_realtor')}
                  />
                  <FollowupBtn
                    label="💬 Text Homeowner"
                    done={!!drop.followup_text_homeowner}
                    onClick={() => markFollowup(drop.id, 'followup_text_homeowner')}
                  />
                  <FollowupBtn
                    label="📞 Call Homeowner"
                    done={!!drop.followup_call_homeowner}
                    onClick={() => markFollowup(drop.id, 'followup_call_homeowner')}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}

function FollowupBtn({ label, done, onClick }: { label: string; done: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={done}
      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
        done
          ? 'bg-green-100 text-green-700 border border-green-200'
          : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
      }`}
    >
      {done ? '✅ ' : ''}{label}
    </button>
  );
}
