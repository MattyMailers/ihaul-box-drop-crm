import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const result = await db.execute('SELECT * FROM realtors ORDER BY first_name ASC');
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { first_name, last_name, email, phone, company } = body;

  const result = await db.execute({
    sql: `INSERT INTO realtors (first_name, last_name, email, phone, company) VALUES (?, ?, ?, ?, ?)`,
    args: [first_name, last_name || null, email || null, phone || null, company || null],
  });

  return NextResponse.json({ id: Number(result.lastInsertRowid), success: true });
}
