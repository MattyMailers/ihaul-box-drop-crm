import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const [totalDrops, thisWeek, pendingFollowups, converted, totalDelivered, realtorCount] = await Promise.all([
    db.execute('SELECT COUNT(*) as count FROM box_drops WHERE status != \'cancelled\''),
    db.execute(`SELECT COUNT(*) as count FROM box_drops WHERE requested_date >= date('now', '-7 days')`),
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
