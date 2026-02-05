import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const realtor = await db.execute({
    sql: 'SELECT * FROM realtors WHERE id = ?',
    args: [parseInt(id)],
  });

  if (realtor.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const drops = await db.execute({
    sql: 'SELECT * FROM box_drops WHERE realtor_id = ? ORDER BY created_at DESC',
    args: [parseInt(id)],
  });

  return NextResponse.json({ ...realtor.rows[0], drops: drops.rows });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  for (const field of ['first_name', 'last_name', 'email', 'phone', 'company']) {
    if (body[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(body[field]);
    }
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(parseInt(id));

  await db.execute({
    sql: `UPDATE realtors SET ${fields.join(', ')} WHERE id = ?`,
    args: values,
  });

  return NextResponse.json({ success: true });
}
