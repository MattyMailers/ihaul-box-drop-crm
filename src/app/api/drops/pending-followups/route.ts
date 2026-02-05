import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/drops/pending-followups
 * 
 * Returns drops that need follow-up:
 * - Delivered but not yet followed up (email or text to homeowner/realtor)
 * - Or drops that were delivered more than 2 days ago with no follow-up
 */
export async function GET() {
  try {
    const result = await db.execute({
      sql: `
        SELECT bd.*, 
               r.first_name as realtor_first_name, 
               r.last_name as realtor_last_name,
               r.email as realtor_email, 
               r.phone as realtor_phone,
               r.company as realtor_company
        FROM box_drops bd
        LEFT JOIN realtors r ON bd.realtor_id = r.id
        WHERE bd.status = 'delivered'
          AND (
            bd.followup_email_homeowner = 0
            OR bd.followup_email_realtor = 0
            OR bd.followup_text_homeowner = 0
            OR bd.followup_call_homeowner = 0
          )
        ORDER BY bd.delivered_date ASC
      `,
      args: [],
    });

    return NextResponse.json({
      count: result.rows.length,
      drops: result.rows,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
