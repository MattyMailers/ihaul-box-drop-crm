import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/routes/optimize
 * 
 * Accepts: { addresses: string[], startAddress?: string, endAddress?: string }
 * 
 * For now: generates a Google Maps URL with all stops.
 * When GOOGLE_MAPS_API_KEY is added: calls Google Routes API for optimal waypoint order.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { addresses, startAddress, endAddress } = body;

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json({ error: 'addresses array is required' }, { status: 400 });
    }

    const start = startAddress || 'iHaul iMove, Colorado Springs, CO';
    const end = endAddress || start;

    const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (googleMapsApiKey) {
      // TODO: When Maps API key is available, use Google Routes API for optimization
      // POST https://routes.googleapis.com/directions/v2:computeRoutes
      // with optimizeWaypointOrder: true
      
      // For now, still fall through to the simple URL generation
    }

    // Generate Google Maps directions URL
    // Format: https://www.google.com/maps/dir/start/waypoint1/waypoint2/.../end/
    const allStops = [start, ...addresses, end];
    const encodedStops = allStops.map(a => encodeURIComponent(a));
    const mapsUrl = `https://www.google.com/maps/dir/${encodedStops.join('/')}/`;

    // Also generate a shorter URL with the data parameter format
    const waypointParam = addresses.map(a => encodeURIComponent(a)).join('|');
    const mapsApiUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(start)}&destination=${encodeURIComponent(end)}&waypoints=${waypointParam}`;

    return NextResponse.json({
      success: true,
      optimized: false, // Will be true when Routes API is used
      mapsUrl,
      mapsApiUrl,
      stops: allStops,
      stopCount: allStops.length,
      note: googleMapsApiKey 
        ? 'Routes API optimization available but not yet implemented'
        : 'Add GOOGLE_MAPS_API_KEY env var to enable route optimization',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
