import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/webhook/health
 * Health check endpoint for the webhook service and monitoring.
 */
export async function GET() {
  let dbStatus = 'unknown';
  let dropCount = 0;
  let realtorCount = 0;

  try {
    const drops = await db.execute('SELECT COUNT(*) as count FROM box_drops');
    const realtors = await db.execute('SELECT COUNT(*) as count FROM realtors');
    dropCount = drops.rows[0].count as number;
    realtorCount = realtors.rows[0].count as number;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error';
  }

  return NextResponse.json({
    status: 'ok',
    service: 'box-drop-crm',
    database: dbStatus,
    counts: {
      drops: dropCount,
      realtors: realtorCount,
    },
    timestamp: new Date().toISOString(),
  });
}
