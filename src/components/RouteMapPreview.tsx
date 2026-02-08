'use client';

import { useEffect, useState } from 'react';

// iHaul brand colors
const IHUL_NAVY = '#1e3a5f';
const IHUL_GOLD = '#C5A059';

// Full address for accurate geocoding
const IHUAL_GEOCODING_ADDRESS = '3110 Boychuk Ave #470g, Colorado Springs, CO 80910';

interface RouteMapPreviewProps {
  stops: string[];
  startLocation: string;
  endLocation: string;
  currentStopIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onStartNavigation: () => void;
  encodedPolyline?: string | null;
  metrics?: {
    totalDurationMinutes?: number;
    drivingMinutes?: number;
    stopTimeMinutes?: number;
    stopCount?: number;
    totalDistanceMiles?: string;
  } | null;
}

export default function RouteMapPreview({
  stops,
  startLocation,
  endLocation,
  currentStopIndex = -1,
  isOpen,
  onClose,
  onStartNavigation,
  encodedPolyline,
  metrics,
}: RouteMapPreviewProps) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);

  useEffect(() => {
    fetch('/api/config/maps-key')
      .then(r => r.json())
      .then(data => {
        setApiKey(data.apiKey);
        if (!data.apiKey) {
          setMapError(true);
        }
      })
      .catch(() => setMapError(true));
  }, []);

  if (!isOpen) return null;

  // Helper to get geocoding address (use full address for iHaul locations)
  const getGeocodingAddress = (displayAddr: string): string => {
    if (displayAddr.toLowerCase().includes('ihaul') && displayAddr.toLowerCase().includes('colorado springs')) {
      return IHUAL_GEOCODING_ADDRESS;
    }
    return displayAddr;
  };

  // Build the Google Maps Static API URL with markers
  const buildStaticMapUrl = () => {
    if (!apiKey) return null;
    
    // Debug: log polyline status
    console.log('[RouteMapPreview] encodedPolyline:', encodedPolyline ? `${encodedPolyline.substring(0, 50)}...` : 'null/undefined');

    const markers: string[] = [];
    
    // Start marker (green, labeled S) - use full geocoding address
    const startGeoAddr = getGeocodingAddress(startLocation);
    markers.push(`color:green|label:S|${encodeURIComponent(startGeoAddr)}`);
    
    // Stop markers (numbered)
    stops.forEach((stop, index) => {
      const color = currentStopIndex === index ? 'blue' : 'red';
      markers.push(`color:${color}|label:${index + 1}|${encodeURIComponent(stop)}`);
    });
    
    // End marker (gold/yellow, labeled E) - only if different from start
    const endGeoAddr = getGeocodingAddress(endLocation);
    if (endLocation !== startLocation) {
      markers.push(`color:0xC5A059|label:E|${encodeURIComponent(endGeoAddr)}`);
    }

    const markersParam = markers.map(m => `markers=${m}`).join('&');
    
    // Path connecting all points - use encoded polyline if available for actual driving route
    let pathParam: string;
    if (encodedPolyline) {
      // Use the encoded polyline from Routes API for actual driving route
      pathParam = `path=color:0x1e3a5f|weight:4|enc:${encodedPolyline}`;
    } else {
      // Fallback to straight lines between geocoded addresses
      const allPoints = [startGeoAddr, ...stops, endGeoAddr];
      const pathPoints = allPoints.map(p => encodeURIComponent(p)).join('|');
      pathParam = `path=color:0x1e3a5f|weight:4|${pathPoints}`;
    }

    return `https://maps.googleapis.com/maps/api/staticmap?size=640x400&scale=2&maptype=roadmap&${markersParam}&${pathParam}&key=${apiKey}`;
  };

  const staticMapUrl = buildStaticMapUrl();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header - iHaul Navy theme */}
        <div className="text-white p-4" style={{ background: `linear-gradient(to right, ${IHUL_NAVY}, ${IHUL_NAVY})` }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Route Preview</h2>
              <p className="text-white/80 text-sm">{stops.length} stops</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Time and distance estimate */}
          {metrics && metrics.totalDurationMinutes && (
            <div className="mt-3 space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <div className="flex items-center gap-1.5">
                  <span>⏱️</span>
                  <span className="font-semibold">Est. {metrics.totalDurationMinutes} min</span>
                  <span className="text-white/70">
                    ({metrics.drivingMinutes} min driving + {metrics.stopTimeMinutes} min for {metrics.stopCount} {metrics.stopCount === 1 ? 'stop' : 'stops'})
                  </span>
                </div>
                {metrics.totalDistanceMiles && (
                  <div className="flex items-center gap-1.5">
                    <span>📍</span>
                    <span>{metrics.totalDistanceMiles} mi</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-white/60">
                🏁 Leave now to finish by {new Date(Date.now() + metrics.totalDurationMinutes * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="relative bg-gray-100" style={{ height: '280px' }}>
          {!apiKey && !mapError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse text-gray-400">Loading map...</div>
            </div>
          ) : mapError || !staticMapUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-gray-50">
              <span className="text-4xl mb-2">🗺️</span>
              <p className="text-sm font-medium">Map preview unavailable</p>
              <p className="text-xs text-gray-400 mt-1">Maps Static API may need to be enabled</p>
            </div>
          ) : (
            <>
              {mapLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="animate-pulse text-gray-400">Loading map...</div>
                </div>
              )}
              <img 
                src={staticMapUrl} 
                alt="Route map preview"
                className={`w-full h-full object-cover ${mapLoading ? 'invisible' : 'visible'}`}
                onLoad={() => setMapLoading(false)}
                onError={() => {
                  setMapError(true);
                  setMapLoading(false);
                }}
              />
            </>
          )}
        </div>

        {/* Stop list preview */}
        <div className="max-h-48 overflow-y-auto p-4 border-t border-gray-100">
          <div className="space-y-2">
            {/* Start */}
            <div className="flex items-center gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold shrink-0">S</span>
              <span className="text-gray-600 truncate">{startLocation}</span>
            </div>
            
            {/* Stops */}
            {stops.map((stop, index) => (
              <div 
                key={index} 
                className={`flex items-center gap-3 text-sm ${currentStopIndex === index ? '-mx-2 px-2 py-1 rounded-lg' : ''}`}
                style={currentStopIndex === index ? { backgroundColor: `${IHUL_NAVY}10` } : {}}
              >
                <span 
                  className="w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: currentStopIndex === index ? IHUL_NAVY : '#f97316' }}
                >
                  {index + 1}
                </span>
                <span className="text-gray-700 truncate">{stop}</span>
                {currentStopIndex === index && (
                  <span 
                    className="text-xs text-white px-2 py-0.5 rounded-full ml-auto shrink-0"
                    style={{ backgroundColor: IHUL_NAVY }}
                  >
                    Current
                  </span>
                )}
              </div>
            ))}
            
            {/* End */}
            {endLocation !== startLocation && (
              <div className="flex items-center gap-3 text-sm">
                <span 
                  className="w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: IHUL_GOLD }}
                >
                  E
                </span>
                <span className="text-gray-600 truncate">{endLocation}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions - iHaul Navy button */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onStartNavigation}
            className="w-full text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-lg hover:opacity-90 active:opacity-80"
            style={{ backgroundColor: IHUL_NAVY }}
          >
            🚀 Start Navigation
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
