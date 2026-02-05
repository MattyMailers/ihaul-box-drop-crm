import { createClient } from '@libsql/client';

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export type Realtor = {
  id: number;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  total_drops: number;
  total_conversions: number;
  created_at: string;
  updated_at: string;
};

export type BoxDrop = {
  id: number;
  realtor_id: number;
  homeowner_address: string;
  homeowner_name: string | null;
  homeowner_email: string | null;
  homeowner_phone: string | null;
  listing_status: 'new_listing' | 'pending' | 'other' | null;
  campaign_source: string | null;
  status: 'requested' | 'kit_prepped' | 'out_for_delivery' | 'delivered' | 'followed_up' | 'converted' | 'cancelled';
  requested_date: string;
  scheduled_date: string | null;
  delivered_date: string | null;
  delivery_notes: string | null;
  followup_email_homeowner: number;
  followup_email_realtor: number;
  followup_text_homeowner: number;
  followup_call_homeowner: number;
  quote_requested: number;
  booked: number;
  revenue: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  realtor_first_name?: string;
  realtor_last_name?: string;
  realtor_email?: string;
  realtor_company?: string;
};

export type WeeklyRoute = {
  id: number;
  week_date: string;
  route_order: string | null;
  driver: string;
  status: 'planned' | 'in_progress' | 'completed';
  notes: string | null;
  created_at: string;
};

export type FollowUpTemplate = {
  id: number;
  name: string;
  type: 'email_homeowner' | 'email_realtor' | 'text_homeowner' | 'text_realtor' | 'voicemail';
  subject: string | null;
  body: string;
  created_at: string;
};
