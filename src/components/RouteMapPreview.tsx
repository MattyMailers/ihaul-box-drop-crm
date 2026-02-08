'use client';

import { useEffect, useState } from 'react';

interface RouteMapPreviewProps {
  stops: string[];
  startLocation: string;
  endLocation: string;
  currentStopIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onStartNavigation: () => void;
}

export default function RouteMapPreview({
  stops,
  startLocation,
  endLocation,
  currentStopIndex = -1,
  isOpen,
  onClose,
  onStartNavigation,
}: RouteMapPreviewProps) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    fetch('/api/config/maps-key')
      .then(r => r.json())
      .then(data => setApiKey(data.apiKey))
      .catch(() => setMapError(true));
  }, []);

  if (!isOpen) return null;

  // Build the Google Maps Static API URL with markers
  const buildStaticMapUrl = () => {
    if (!apiKey) return null;

    const markers: string[] = [];
    
    // Start marker (green, labeled S)
    markers.push(`color:green|label:S|${encodeURIComponent(startLocation)}`);
    
    // Stop markers (numbered)
    stops.forEach((stop, index) => {
      const color = currentStopIndex === index ? 'blue' : 'red';
      markers.push(`color:${color}|label:${index + 1}|${encodeURIComponent(stop)}`);
    });
    
    // End marker (purple, labeled E) - only if different from start
    if (endLocation !== startLocation) {
      markers.push(`color:purple|label:E|${encodeURIComponent(endLocation)}`);
    }

    const markersParam = markers.map(m => `markers=${m}`).join('&');
    
    // Path connecting all points
    const allPoints = [startLocation, ...stops, endLocation];
    const pathPoints = allPoints.map(p => encodeURIComponent(p)).join('|');
    const pathParam = `path=color:0x4285F4|weight:3|${pathPoints}`;

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
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
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
        </div>

        {/* Map */}
        <div className="relative bg-gray-100" style={{ height: '280px' }}>
          {!apiKey && !mapError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse text-gray-400">Loading map...</div>
            </div>
          ) : mapError || !staticMapUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <span className="text-4xl mb-2">🗺️</span>
              <p className="text-sm">Map preview unavailable</p>
            </div>
          ) : (
            <img 
              src={staticMapUrl} 
              alt="Route map preview"
              className="w-full h-full object-cover"
              onError={() => setMapError(true)}
            />
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
                className={`flex items-center gap-3 text-sm ${currentStopIndex === index ? 'bg-blue-50 -mx-2 px-2 py-1 rounded-lg' : ''}`}
              >
                <span className={`w-6 h-6 rounded-full ${currentStopIndex === index ? 'bg-blue-500' : 'bg-orange-500'} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                  {index + 1}
                </span>
                <span className="text-gray-700 truncate">{stop}</span>
                {currentStopIndex === index && (
                  <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full ml-auto shrink-0">Current</span>
                )}
              </div>
            ))}
            
            {/* End */}
            {endLocation !== startLocation && (
              <div className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold shrink-0">E</span>
                <span className="text-gray-600 truncate">{endLocation}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onStartNavigation}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-lg"
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
