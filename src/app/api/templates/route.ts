import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await db.execute('SELECT * FROM follow_up_templates ORDER BY name ASC');
  return NextResponse.json(result.rows);
}
