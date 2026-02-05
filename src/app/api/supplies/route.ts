import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await db.execute('SELECT * FROM supply_items ORDER BY id');
  return NextResponse.json(result.rows);
}
