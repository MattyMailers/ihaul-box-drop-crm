import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/automation
 * 
 * Returns recent automation events.
 * Query params: limit, offset, classification, date_from, date_to
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');
    const classification = searchParams.get('classification');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Ensure table exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS automation_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        email TEXT,
        classification TEXT,
        details TEXT,
        action_taken TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    let query = 'SELECT * FROM automation_log WHERE 1=1';
    const args: (string | number)[] = [];

    if (classification) {
      query += ' AND classification = ?';
      args.push(classification);
    }
    if (dateFrom) {
      query += ' AND created_at >= ?';
      args.push(dateFrom);
    }
    if (dateTo) {
      query += ' AND created_at <= ?';
      args.push(dateTo + ' 23:59:59');
    }

    // Get total count
    const countResult = await db.execute({
      sql: query.replace('SELECT *', 'SELECT COUNT(*) as count'),
      args,
    });
    const total = countResult.rows[0].count as number;

    // Get paginated results
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    args.push(limit, offset);

    const result = await db.execute({ sql: query, args });

    // Get classification breakdown
    const stats = await db.execute(`
      SELECT classification, COUNT(*) as count 
      FROM automation_log 
      GROUP BY classification 
      ORDER BY count DESC
    `);

    return NextResponse.json({
      events: result.rows,
      total,
      limit,
      offset,
      stats: stats.rows,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
