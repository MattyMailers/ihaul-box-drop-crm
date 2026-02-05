import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get('start');
  const weekEnd = searchParams.get('end');

  if (!weekStart || !weekEnd) {
    return NextResponse.json({ error: 'start and end params required' }, { status: 400 });
  }

  const result = await db.execute({
    sql: `
      SELECT bd.*, r.first_name as realtor_first_name, r.last_name as realtor_last_name, 
             r.email as realtor_email, r.phone as realtor_phone, r.company as realtor_company
      FROM box_drops bd
      LEFT JOIN realtors r ON bd.realtor_id = r.id
      WHERE (bd.scheduled_date BETWEEN ? AND ?) 
         OR (bd.scheduled_date IS NULL AND bd.requested_date BETWEEN ? AND ?)
      ORDER BY COALESCE(bd.scheduled_date, bd.requested_date) ASC
    `,
    args: [weekStart, weekEnd, weekStart, weekEnd],
  });

  return NextResponse.json(result.rows);
}
