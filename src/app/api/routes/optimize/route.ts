import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Full address for accurate geocoding when iHaul is specified
const IHUAL_GEOCODING_ADDRESS = '3110 Boychuk Ave #470g, Colorado Springs, CO 80910';

interface RouteWaypoint {
  address: string;
}

interface RoutesApiResponse {
  routes?: Array<{
    optimizedIntermediateWaypointIndex?: number[];
    distanceMeters?: number;
    duration?: string;
    polyline?: {
      encodedPolyline?: string;
    };
    legs?: Array<{
      distanceMeters?: number;
      duration?: string;
    }>;
  }>;
  error?: {
    message: string;
    code: number;
  };
}

// Helper to get full geocoding address for iHaul locations
function getGeocodingAddress(displayAddr: string): string {
  if (displayAddr.toLowerCase().includes('ihaul') && displayAddr.toLowerCase().includes('colorado springs')) {
    return IHUAL_GEOCODING_ADDRESS;
  }
  return displayAddr;
}

/**
 * POST /api/routes/optimize
 * 
 * Accepts: { addresses: string[], startAddress?: string, endAddress?: string }
 * 
 * Uses Google Routes API for optimal waypoint ordering when API key is available.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { addresses, startAddress, endAddress } = body;

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json({ error: 'addresses array is required' }, { status: 400 });
    }

    const displayStart = startAddress || 'iHaul iMove, Colorado Springs, CO';
    const displayEnd = endAddress || displayStart;
    
    // Use full geocoding addresses for API calls
    const start = getGeocodingAddress(displayStart);
    const end = getGeocodingAddress(displayEnd);

    const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (googleMapsApiKey && addresses.length > 1) {
      // Use Google Routes API for optimization
      try {
        const intermediates: RouteWaypoint[] = addresses.map(addr => ({
          address: addr
        }));

        const routesResponse = await fetch(
          'https://routes.googleapis.com/directions/v2:computeRoutes',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': googleMapsApiKey,
              'X-Goog-FieldMask': 'routes.optimizedIntermediateWaypointIndex,routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration',
            },
            body: JSON.stringify({
              origin: { address: start },
              destination: { address: end },
              intermediates,
              optimizeWaypointOrder: true,
              travelMode: 'DRIVE',
              routingPreference: 'TRAFFIC_AWARE',
            }),
          }
        );

        const routesData: RoutesApiResponse = await routesResponse.json();

        if (routesData.error) {
          throw new Error(routesData.error.message);
        }

        if (routesData.routes && routesData.routes.length > 0) {
          const route = routesData.routes[0];
          const optimizedOrder = route.optimizedIntermediateWaypointIndex || [];
          
          // Reorder addresses based on optimized indices
          const optimizedAddresses = optimizedOrder.map(idx => addresses[idx]);
          const allStops = [start, ...optimizedAddresses, end];
          
          // Generate Google Maps URL with optimized order
          const encodedStops = allStops.map(a => encodeURIComponent(a));
          const mapsUrl = `https://www.google.com/maps/dir/${encodedStops.join('/')}/`;
          
          const waypointParam = optimizedAddresses.map(a => encodeURIComponent(a)).join('|');
          const mapsApiUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(start)}&destination=${encodeURIComponent(end)}&waypoints=${waypointParam}`;

          // Calculate total distance and duration
          const totalDistanceMeters = route.distanceMeters || 0;
          const totalDistanceMiles = (totalDistanceMeters / 1609.344).toFixed(1);
          const durationSeconds = route.duration ? parseInt(route.duration.replace('s', '')) : 0;
          const drivingMinutes = Math.round(durationSeconds / 60);
          
          // Add 5 minutes per stop for drop-off time
          const stopCount = optimizedAddresses.length;
          const stopTimeMinutes = stopCount * 5;
          const totalMinutes = drivingMinutes + stopTimeMinutes;

          // Get the encoded polyline for map display
          const encodedPolyline = route.polyline?.encodedPolyline || null;

          return NextResponse.json({
            success: true,
            optimized: true,
            mapsUrl,
            mapsApiUrl,
            stops: allStops,
            stopCount: allStops.length,
            originalOrder: addresses,
            optimizedOrder: optimizedAddresses,
            encodedPolyline,
            metrics: {
              totalDistanceMiles,
              totalDurationMinutes: totalMinutes,
              drivingMinutes,
              stopTimeMinutes,
              stopCount,
              legs: route.legs?.map(leg => ({
                distanceMiles: ((leg.distanceMeters || 0) / 1609.344).toFixed(1),
                durationMinutes: Math.round((parseInt(leg.duration?.replace('s', '') || '0')) / 60),
              })),
            },
          });
        }
      } catch (apiError) {
        console.error('Google Routes API error:', apiError);
        // Fall through to simple URL generation
      }
    }

    // Fallback: Generate Google Maps directions URL without optimization
    const allStops = [start, ...addresses, end];
    const encodedStops = allStops.map(a => encodeURIComponent(a));
    const mapsUrl = `https://www.google.com/maps/dir/${encodedStops.join('/')}/`;

    const waypointParam = addresses.map(a => encodeURIComponent(a)).join('|');
    const mapsApiUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(start)}&destination=${encodeURIComponent(end)}&waypoints=${waypointParam}`;

    return NextResponse.json({
      success: true,
      optimized: false,
      mapsUrl,
      mapsApiUrl,
      stops: allStops,
      stopCount: allStops.length,
      note: googleMapsApiKey 
        ? 'Single stop - optimization not needed'
        : 'Add GOOGLE_MAPS_API_KEY env var to enable route optimization',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
