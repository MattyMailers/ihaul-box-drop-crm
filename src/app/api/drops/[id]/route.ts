import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await db.execute({
    sql: `SELECT bd.*, r.first_name as realtor_first_name, r.last_name as realtor_last_name, 
           r.email as realtor_email, r.company as realtor_company, r.phone as realtor_phone
    FROM box_drops bd
    LEFT JOIN realtors r ON bd.realtor_id = r.id
    WHERE bd.id = ?`,
    args: [parseInt(id)],
  });

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  const allowedFields = [
    'status', 'homeowner_address', 'homeowner_name', 'homeowner_email', 'homeowner_phone',
    'listing_status', 'campaign_source', 'scheduled_date', 'delivered_date', 'delivery_notes',
    'followup_email_homeowner', 'followup_email_realtor', 'followup_text_homeowner',
    'followup_call_homeowner', 'quote_requested', 'booked', 'revenue', 'notes', 'realtor_id'
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(body[field]);
    }
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');

  // If status changed to delivered, set delivered_date
  if (body.status === 'delivered' && !body.delivered_date) {
    fields.push('delivered_date = CURRENT_DATE');
  }

  // If status changed to converted, update realtor stats
  if (body.status === 'converted') {
    const drop = await db.execute({ sql: 'SELECT realtor_id FROM box_drops WHERE id = ?', args: [parseInt(id)] });
    if (drop.rows.length > 0 && drop.rows[0].realtor_id) {
      await db.execute({
        sql: 'UPDATE realtors SET total_conversions = total_conversions + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        args: [drop.rows[0].realtor_id as number],
      });
    }
  }

  values.push(parseInt(id));
  await db.execute({
    sql: `UPDATE box_drops SET ${fields.join(', ')} WHERE id = ?`,
    args: values,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.execute({ sql: 'DELETE FROM box_drops WHERE id = ?', args: [parseInt(id)] });
  return NextResponse.json({ success: true });
}
