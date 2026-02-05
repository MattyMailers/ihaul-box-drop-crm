import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const realtor_id = searchParams.get('realtor_id');
  const needs_followup = searchParams.get('needs_followup');

  let query = `
    SELECT bd.*, r.first_name as realtor_first_name, r.last_name as realtor_last_name, 
           r.email as realtor_email, r.company as realtor_company
    FROM box_drops bd
    LEFT JOIN realtors r ON bd.realtor_id = r.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (status) {
    query += ` AND bd.status = ?`;
    params.push(status);
  }
  if (realtor_id) {
    query += ` AND bd.realtor_id = ?`;
    params.push(parseInt(realtor_id));
  }
  if (needs_followup === 'true') {
    query += ` AND bd.status = 'delivered' AND (bd.followup_email_homeowner = 0 OR bd.followup_email_realtor = 0)`;
  }

  query += ` ORDER BY bd.created_at DESC`;

  const result = await db.execute({ sql: query, args: params });
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    realtor_id, homeowner_address, homeowner_name, homeowner_email, homeowner_phone,
    listing_status, campaign_source, status, scheduled_date, notes
  } = body;

  const result = await db.execute({
    sql: `INSERT INTO box_drops (realtor_id, homeowner_address, homeowner_name, homeowner_email, homeowner_phone, listing_status, campaign_source, status, scheduled_date, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [realtor_id, homeowner_address, homeowner_name || null, homeowner_email || null, homeowner_phone || null, listing_status || 'new_listing', campaign_source || null, status || 'requested', scheduled_date || null, notes || null],
  });

  // Update realtor total_drops
  if (realtor_id) {
    await db.execute({
      sql: `UPDATE realtors SET total_drops = total_drops + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [realtor_id],
    });
  }

  return NextResponse.json({ id: Number(result.lastInsertRowid), success: true });
}
