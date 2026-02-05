import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const result = await db.execute('SELECT * FROM follow_up_templates ORDER BY name ASC');
  return NextResponse.json(result.rows);
}
