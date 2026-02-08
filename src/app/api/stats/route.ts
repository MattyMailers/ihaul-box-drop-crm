import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Get Monday of current week (matching routes page behavior)
function getWeekBoundaries(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
}

export async function GET() {
  const { start, end } = getWeekBoundaries();
  
  const [totalDrops, thisWeek, pendingFollowups, converted, totalDelivered, realtorCount] = await Promise.all([
    db.execute('SELECT COUNT(*) as count FROM box_drops WHERE status != \'cancelled\''),
    // Count drops where scheduled_date (or requested_date if no scheduled_date) falls within current week
    db.execute({
      sql: `SELECT COUNT(*) as count FROM box_drops 
            WHERE status != 'cancelled'
            AND (
              (scheduled_date IS NOT NULL AND scheduled_date != '' AND scheduled_date BETWEEN ? AND ?)
              OR ((scheduled_date IS NULL OR scheduled_date = '') AND requested_date BETWEEN ? AND ?)
            )`,
      args: [start, end, start, end],
    }),
    db.execute(`SELECT COUNT(*) as count FROM box_drops WHERE status = 'delivered' AND (followup_email_homeowner = 0 OR followup_email_realtor = 0)`),
    db.execute(`SELECT COUNT(*) as count FROM box_drops WHERE status = 'converted'`),
    db.execute(`SELECT COUNT(*) as count FROM box_drops WHERE status IN ('delivered', 'followed_up', 'converted')`),
    db.execute('SELECT COUNT(*) as count FROM realtors'),
  ]);

  const totalDel = (totalDelivered.rows[0].count as number) || 0;
  const totalConv = (converted.rows[0].count as number) || 0;
  const conversionRate = totalDel > 0 ? Math.round((totalConv / totalDel) * 100) : 0;

  const totalRevenue = await db.execute('SELECT COALESCE(SUM(revenue), 0) as total FROM box_drops WHERE booked = 1');

  return NextResponse.json({
    totalDrops: totalDrops.rows[0].count,
    thisWeek: thisWeek.rows[0].count,
    pendingFollowups: pendingFollowups.rows[0].count,
    conversionRate,
    totalConverted: totalConv,
    totalRevenue: totalRevenue.rows[0].total,
    realtorCount: realtorCount.rows[0].count,
  });
}
