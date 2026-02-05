import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/drops/auto
 * 
 * Automated endpoint for the webhook service to create box drops.
 * Finds or creates the realtor, then creates the box_drop record.
 * 
 * Accepts: {
 *   realtorName, realtorEmail, realtorCompany,
 *   address, listingStatus, campaignSource,
 *   homeownerName, homeownerEmail,
 *   phone, schedulingNote, notes
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      realtorName, realtorEmail, realtorCompany,
      address, listingStatus, campaignSource,
      homeownerName, homeownerEmail,
      phone, schedulingNote, notes,
    } = body;

    if (!realtorEmail && !realtorName) {
      return NextResponse.json(
        { error: 'At least realtorEmail or realtorName is required' },
        { status: 400 }
      );
    }

    // Split realtor name if needed
    let firstName = '';
    let lastName = '';
    if (realtorName) {
      const parts = realtorName.split(' ');
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }

    // Find or create realtor
    let realtorId: number;

    if (realtorEmail) {
      const existing = await db.execute({
        sql: 'SELECT id FROM realtors WHERE email = ?',
        args: [realtorEmail],
      });

      if (existing.rows.length > 0) {
        realtorId = existing.rows[0].id as number;

        // Update any new info
        const updates: string[] = [];
        const args: (string | number)[] = [];

        if (phone) { updates.push('phone = COALESCE(phone, ?)'); args.push(phone); }
        if (realtorCompany) { updates.push('company = COALESCE(company, ?)'); args.push(realtorCompany); }
        if (lastName) { updates.push('last_name = COALESCE(last_name, ?)'); args.push(lastName); }

        if (updates.length > 0) {
          updates.push('updated_at = CURRENT_TIMESTAMP');
          args.push(realtorId);
          await db.execute({
            sql: `UPDATE realtors SET ${updates.join(', ')} WHERE id = ?`,
            args,
          });
        }
      } else {
        const result = await db.execute({
          sql: 'INSERT INTO realtors (first_name, last_name, email, phone, company) VALUES (?, ?, ?, ?, ?)',
          args: [firstName || 'Unknown', lastName || null, realtorEmail, phone || null, realtorCompany || null],
        });
        realtorId = Number(result.lastInsertRowid);
      }
    } else {
      const result = await db.execute({
        sql: 'INSERT INTO realtors (first_name, last_name, phone, company) VALUES (?, ?, ?, ?)',
        args: [firstName || 'Unknown', lastName || null, phone || null, realtorCompany || null],
      });
      realtorId = Number(result.lastInsertRowid);
    }

    // Build notes
    const dropNotes = [
      notes || '',
      schedulingNote ? `Scheduling: ${schedulingNote}` : '',
      'Auto-created from email reply.',
    ].filter(Boolean).join('\n');

    // Create box drop
    const dropResult = await db.execute({
      sql: `INSERT INTO box_drops (
        realtor_id, homeowner_address, homeowner_name, homeowner_email,
        listing_status, campaign_source, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, 'requested', ?)`,
      args: [
        realtorId,
        address || 'Address pending',
        homeownerName || null,
        homeownerEmail || null,
        listingStatus || 'new_listing',
        campaignSource || 'instantly_webhook',
        dropNotes,
      ],
    });

    const dropId = Number(dropResult.lastInsertRowid);

    // Update realtor total_drops
    await db.execute({
      sql: 'UPDATE realtors SET total_drops = total_drops + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [realtorId],
    });

    return NextResponse.json({
      success: true,
      dropId,
      realtorId,
      message: `Box drop #${dropId} created for realtor #${realtorId}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Auto drop creation error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
