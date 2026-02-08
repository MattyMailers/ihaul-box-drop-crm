import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Trim the API key to remove any trailing whitespace/newlines from env vars
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim() || null;
  
  if (!apiKey) {
    return NextResponse.json({ apiKey: null });
  }
  
  return NextResponse.json({ apiKey });
}
