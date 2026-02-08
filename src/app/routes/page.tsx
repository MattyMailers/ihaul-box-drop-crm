'use client';

import { useEffect, useState, useCallback } from 'react';
import Shell from '@/components/Shell';
import StatusBadge from '@/components/StatusBadge';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import RouteMapPreview from '@/components/RouteMapPreview';
import Link from 'next/link';

type Drop = {
  id: number;
  homeowner_address: string;
  homeowner_name: string | null;
  homeowner_phone: string | null;
  status: string;
  scheduled_date: string | null;
  requested_date: string;
  delivery_notes: string | null;
  notes: string | null;
  realtor_first_name: string;
  realtor_last_name: string;
  realtor_phone: string | null;
  realtor_company: string;
};

type OptimizationResult = {
  success: boolean;
  optimized: boolean;
  mapsUrl: string;
  mapsApiUrl?: string;
  originalOrder: string[];
  optimizedOrder: string[];
  encodedPolyline?: string | null;
  metrics?: {
    totalDistanceMiles: string;
    totalDurationMinutes: number;
    drivingMinutes?: number;
    stopTimeMinutes?: number;
    stopCount?: number;
  };
};

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${monday.toLocaleDateString('en-US', opts)} – ${sunday.toLocaleDateString('en-US', opts)}, ${sunday.getFullYear()}`;
}

// Detect iOS for appropriate URL scheme
function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// Toast notification component
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-slide-in-bottom">
      <div className="bg-green-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">✅</span>
          <span className="font-medium">{message}</span>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white ml-2">✕</button>
      </div>
      <style jsx>{`
        @keyframes slide-in-bottom {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-in-bottom { animation: slide-in-bottom 0.3s ease-out; }
      `}</style>
    </div>
  );
}

// iHaul brand colors
const IHUL_NAVY = '#1e3a5f';
const IHUL_GOLD = '#C5A059';

// Navigation modal for current stop
function NavigationModal({ 
  drop,
  stopNumber,
  totalStops,
  onNavigateGoogle,
  onNavigateApple,
  onNextStop,
  onMarkDelivered,
  onClose,
  isLastStop,
}: { 
  drop: Drop;
  stopNumber: number;
  totalStops: number;
  onNavigateGoogle: () => void;
  onNavigateApple: () => void;
  onNextStop: () => void;
  onMarkDelivered: () => void;
  onClose: () => void;
  isLastStop: boolean;
}) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with progress - iHaul Navy */}
        <div className="text-white p-4" style={{ backgroundColor: IHUL_NAVY }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium opacity-80">Stop {stopNumber} of {totalStops}</span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-sm"
            >
              ✕
            </button>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-white/30 rounded-full h-2">
            <div 
              className="rounded-full h-2 transition-all duration-300"
              style={{ width: `${(stopNumber / totalStops) * 100}%`, backgroundColor: IHUL_GOLD }}
            />
          </div>
        </div>

        {/* Stop details */}
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{drop.homeowner_address}</h3>
          <p className="text-sm text-gray-500">
            {drop.realtor_first_name} {drop.realtor_last_name} • {drop.realtor_company}
          </p>
          {drop.homeowner_name && (
            <p className="text-sm text-gray-500 mt-1">Homeowner: {drop.homeowner_name}</p>
          )}
          {drop.homeowner_phone && (
            <a href={`tel:${drop.homeowner_phone}`} className="text-sm text-blue-600 mt-1 block">
              📱 {drop.homeowner_phone}
            </a>
          )}
          {drop.notes && (
            <p className="text-sm text-gray-400 mt-2 italic bg-gray-50 p-2 rounded-lg">{drop.notes}</p>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onNavigateGoogle}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-lg">🗺️</span>
              <span>Google Maps</span>
            </button>
            <button
              onClick={onNavigateApple}
              className="bg-gray-800 hover:bg-gray-900 active:bg-black text-white font-semibold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-lg">🍎</span>
              <span>Apple Maps</span>
            </button>
          </div>

          <button
            onClick={onMarkDelivered}
            className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            ✅ Mark Delivered
          </button>

          {!isLastStop && (
            <button
              onClick={onNextStop}
              className="w-full text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 hover:opacity-90 active:opacity-80"
              style={{ backgroundColor: IHUL_NAVY }}
            >
              ➡️ Skip to Next Stop
            </button>
          )}

          {isLastStop && (
            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
            >
              🏁 Finish Route
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}

// Success overlay component
function OptimizationSuccessModal({ 
  result, 
  onClose, 
  onStartNavigation,
}: { 
  result: OptimizationResult; 
  onClose: () => void;
  onStartNavigation: () => void;
}) {
  const { metrics, optimized } = result;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-gray-900">
            {optimized ? 'Route Optimized!' : 'Route Ready'}
          </h2>
          {metrics && (
            <div className="mt-4 rounded-2xl p-4" style={{ backgroundColor: `${IHUL_NAVY}10` }}>
              <div className="flex justify-center gap-8">
                <div>
                  <p className="text-3xl font-bold" style={{ color: IHUL_NAVY }}>{metrics.totalDistanceMiles}</p>
                  <p className="text-sm text-gray-500">miles</p>
                </div>
                <div>
                  <p className="text-3xl font-bold" style={{ color: IHUL_NAVY }}>~{metrics.totalDurationMinutes}</p>
                  <p className="text-sm text-gray-500">minutes total</p>
                </div>
              </div>
              {metrics.drivingMinutes && metrics.stopTimeMinutes && (
                <p className="text-xs text-gray-500 mt-3 text-center">
                  ({metrics.drivingMinutes} min driving + {metrics.stopTimeMinutes} min for {metrics.stopCount} {metrics.stopCount === 1 ? 'stop' : 'stops'} @ 5 min each)
                </p>
              )}
              {metrics.totalDurationMinutes && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  🏁 Leave now to finish by {new Date(Date.now() + metrics.totalDurationMinutes * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              )}
            </div>
          )}
          {optimized && (
            <p className="text-gray-500 mt-4 text-sm">
              Stops have been reordered for the most efficient route.
            </p>
          )}
        </div>
        
        <div className="space-y-3">
          <button
            onClick={onStartNavigation}
            className="w-full text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 hover:opacity-90"
            style={{ backgroundColor: IHUL_NAVY }}
          >
            🚀 Start Navigation
          </button>
          
          <button
            onClick={onClose}
            className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}

export default function RoutesPage() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState<Date>(getMonday(new Date()));
  const [startLocation, setStartLocation] = useState('iHaul iMove, Colorado Springs, CO');
  const [endLocation, setEndLocation] = useState('iHaul iMove, Colorado Springs, CO');
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimizedOrder, setIsOptimizedOrder] = useState(false);
  
  // Sequential navigation state
  const [currentStopIndex, setCurrentStopIndex] = useState(-1);
  const [showMapPreview, setShowMapPreview] = useState(false);
  const [showNavModal, setShowNavModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchDrops = useCallback(() => {
    setLoading(true);
    setIsOptimizedOrder(false);
    setCurrentStopIndex(-1);
    const start = formatDate(weekStart);
    const end = formatDate(addDays(weekStart, 6));
    // Fetch pending drops for the selected week
    fetch(`/api/drops/weekly?start=${start}&end=${end}`)
      .then(r => r.json())
      .then((allDrops: Drop[]) => {
        // Filter to only pending statuses (not yet delivered)
        const pending = allDrops.filter(d => 
          ['requested', 'kit_prepped', 'out_for_delivery'].includes(d.status)
        );
        setDrops(pending);
        setLoading(false);
      });
  }, [weekStart]);

  useEffect(() => { fetchDrops(); }, [fetchDrops]);

  const prevWeek = () => setWeekStart(prev => addDays(prev, -7));
  const nextWeek = () => setWeekStart(prev => addDays(prev, 7));
  const goToday = () => setWeekStart(getMonday(new Date()));

  const markDelivered = async (id: number) => {
    await fetch(`/api/drops/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'delivered' }),
    });
    setToast('Drop marked as delivered!');
    fetchDrops();
  };

  const markOutForDelivery = async (id: number) => {
    await fetch(`/api/drops/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'out_for_delivery' }),
    });
    fetchDrops();
  };

  // Build Google Maps URL for a single address
  const getGoogleMapsUrl = (address: string): string => {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  };

  // Build Apple Maps URL for a single address
  const getAppleMapsUrl = (address: string): string => {
    return `maps://maps.apple.com/?daddr=${encodeURIComponent(address)}&dirflg=d`;
  };

  // Navigate to address with Google Maps
  const navigateWithGoogle = (address: string) => {
    const url = getGoogleMapsUrl(address);
    if (isIOS()) {
      // Try Google Maps app first, fall back to browser
      const appUrl = `comgooglemaps://?daddr=${encodeURIComponent(address)}&directionsmode=driving`;
      window.location.href = appUrl;
      setTimeout(() => {
        window.open(url, '_blank');
      }, 1000);
    } else {
      window.open(url, '_blank');
    }
  };

  // Navigate to address with Apple Maps
  const navigateWithApple = (address: string) => {
    const url = getAppleMapsUrl(address);
    window.location.href = url;
  };

  // Start navigation - show first stop
  const startNavigation = () => {
    if (drops.length === 0) return;
    setShowMapPreview(false);
    setOptimizationResult(null);
    setCurrentStopIndex(0);
    setShowNavModal(true);
  };

  // Go to next stop
  const nextStop = () => {
    if (currentStopIndex < drops.length - 1) {
      setCurrentStopIndex(currentStopIndex + 1);
    } else {
      setShowNavModal(false);
      setCurrentStopIndex(-1);
      setToast('🏁 Route completed!');
    }
  };

  // Handle delivered from nav modal
  const handleNavModalDelivered = async () => {
    const drop = drops[currentStopIndex];
    await markDelivered(drop.id);
    // Auto-advance to next stop
    if (currentStopIndex < drops.length - 1) {
      setCurrentStopIndex(currentStopIndex + 1);
    } else {
      setShowNavModal(false);
      setCurrentStopIndex(-1);
      setToast('🏁 Route completed! All stops delivered.');
    }
  };

  // Show map preview
  const openMapPreview = () => {
    setShowMapPreview(true);
  };

  const optimizeRoute = async () => {
    if (drops.length === 0) return;
    setOptimizing(true);
    try {
      const res = await fetch('/api/routes/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: drops.map(d => d.homeowner_address),
          startAddress: startLocation,
          endAddress: endLocation,
        }),
      });
      const data: OptimizationResult = await res.json();
      
      if (data.success) {
        // Reorder drops based on optimized order
        if (data.optimized && data.optimizedOrder) {
          const addressToDropMap = new Map(drops.map(d => [d.homeowner_address, d]));
          const reorderedDrops = data.optimizedOrder
            .map(addr => addressToDropMap.get(addr))
            .filter((d): d is Drop => d !== undefined);
          
          if (reorderedDrops.length === drops.length) {
            setDrops(reorderedDrops);
            setIsOptimizedOrder(true);
          }
        }
        
        // Show success modal
        setOptimizationResult(data);
      }
    } catch (err) {
      console.error('Route optimization failed:', err);
    } finally {
      setOptimizing(false);
    }
  };

  const exportCSV = () => {
    if (drops.length === 0) return;
    const headers = ['Stop #', 'Address', 'Realtor Name', 'Realtor Phone', 'Homeowner Name', 'Notes'];
    const rows = drops.map((d, i) => [
      i + 1,
      `"${(d.homeowner_address || '').replace(/"/g, '""')}"`,
      `"${d.realtor_first_name} ${d.realtor_last_name || ''}".trim()`,
      `"${d.realtor_phone || ''}"`,
      `"${(d.homeowner_name || '').replace(/"/g, '""')}"`,
      `"${(d.notes || d.delivery_notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const weekLabel = formatDate(weekStart);
    link.setAttribute('download', `route-${weekLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentDrop = currentStopIndex >= 0 ? drops[currentStopIndex] : null;

  return (
    <Shell>
      <div className="p-4 md:p-8">
        {/* Toast notification */}
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}

        {/* Success Modal */}
        {optimizationResult && (
          <OptimizationSuccessModal
            result={optimizationResult}
            onClose={() => setOptimizationResult(null)}
            onStartNavigation={startNavigation}
          />
        )}

        {/* Map Preview Modal */}
        <RouteMapPreview
          stops={drops.map(d => d.homeowner_address)}
          startLocation={startLocation}
          endLocation={endLocation}
          currentStopIndex={currentStopIndex}
          isOpen={showMapPreview}
          onClose={() => setShowMapPreview(false)}
          onStartNavigation={startNavigation}
          encodedPolyline={optimizationResult?.encodedPolyline}
          metrics={optimizationResult?.metrics}
        />

        {/* Navigation Modal */}
        {showNavModal && currentDrop && (
          <NavigationModal
            drop={currentDrop}
            stopNumber={currentStopIndex + 1}
            totalStops={drops.length}
            onNavigateGoogle={() => navigateWithGoogle(currentDrop.homeowner_address)}
            onNavigateApple={() => navigateWithApple(currentDrop.homeowner_address)}
            onNextStop={nextStop}
            onMarkDelivered={handleNavModalDelivered}
            onClose={() => {
              setShowNavModal(false);
              setCurrentStopIndex(-1);
            }}
            isLastStop={currentStopIndex === drops.length - 1}
          />
        )}

        {/* Header with week selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">🚚 Weekly Route</h1>
            <p className="text-gray-500 mt-1">Driver: Stew • {formatWeekLabel(weekStart)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevWeek} className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm">
              ← Prev
            </button>
            <button onClick={goToday} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm">
              This Week
            </button>
            <button onClick={nextWeek} className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm">
              Next →
            </button>
          </div>
        </div>

        {/* Route start/end location */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 no-print">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Start Location</label>
              <AddressAutocomplete
                value={startLocation}
                onChange={setStartLocation}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                placeholder="Starting address"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">End Location</label>
              <AddressAutocomplete
                value={endLocation}
                onChange={setEndLocation}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                placeholder="Ending address"
              />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-6 no-print">
          {/* Primary mobile action - Map Preview */}
          <button
            onClick={openMapPreview}
            disabled={drops.length === 0}
            className="disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 hover:opacity-90"
            style={{ backgroundColor: drops.length === 0 ? undefined : IHUL_NAVY }}
          >
            🗺️ View Route Map
          </button>
          <button
            onClick={optimizeRoute}
            disabled={drops.length === 0 || optimizing}
            className="disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 hover:opacity-90"
            style={{ backgroundColor: drops.length === 0 || optimizing ? undefined : IHUL_NAVY }}
          >
            {optimizing ? '⏳ Optimizing...' : '🧭 Optimize Route'}
          </button>
          <button
            onClick={exportCSV}
            disabled={drops.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
          >
            📥 Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            🖨️ Print
          </button>
        </div>

        {/* Stops count with optimization badge */}
        <div className="flex items-center gap-3 mb-4">
          <p className="text-sm text-gray-500">{drops.length} stops pending</p>
          {isOptimizedOrder && (
            <span 
              className="text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1"
              style={{ backgroundColor: `${IHUL_GOLD}30`, color: '#8B7355' }}
            >
              ✅ Optimized Order
            </span>
          )}
          {currentStopIndex >= 0 && (
            <span 
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: `${IHUL_NAVY}15`, color: IHUL_NAVY }}
            >
              In Progress: Stop {currentStopIndex + 1} of {drops.length}
            </span>
          )}
        </div>

        {loading ? (
          <p className="text-center text-gray-400 p-8">Loading route...</p>
        ) : drops.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-4">🎉</p>
            <p className="text-xl font-bold text-gray-900">All caught up!</p>
            <p className="text-gray-500 mt-1">No pending deliveries for this week.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {drops.map((drop, i) => {
              const isCurrentStop = currentStopIndex === i;
              const isPastStop = currentStopIndex > i && currentStopIndex >= 0;
              
              return (
                <div 
                  key={drop.id} 
                  className={`bg-white rounded-2xl shadow-sm border transition-all ${
                    isCurrentStop 
                      ? 'border-blue-400 ring-2 ring-blue-100' 
                      : isPastStop 
                        ? 'border-gray-200 opacity-60' 
                        : 'border-gray-100'
                  } p-4 md:p-6`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`${
                      isCurrentStop 
                        ? 'bg-blue-500 animate-pulse' 
                        : isOptimizedOrder 
                          ? 'bg-green-500' 
                          : 'bg-orange-500'
                    } text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 transition-colors`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Link href={`/drops/${drop.id}`} className="font-bold text-gray-900 text-lg hover:text-orange-600 transition-colors">
                              {drop.homeowner_address}
                            </Link>
                            {isCurrentStop && (
                              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {drop.realtor_first_name} {drop.realtor_last_name} • {drop.realtor_company}
                          </p>
                          {drop.realtor_phone && <p className="text-sm text-gray-500">📱 Realtor: {drop.realtor_phone}</p>}
                          {drop.homeowner_name && <p className="text-sm text-gray-500">Homeowner: {drop.homeowner_name}</p>}
                          {drop.homeowner_phone && <p className="text-sm text-gray-500">📱 {drop.homeowner_phone}</p>}
                          {drop.notes && <p className="text-sm text-gray-400 mt-1 italic">{drop.notes}</p>}
                        </div>
                        <div className="mt-3 sm:mt-0 flex items-center gap-2">
                          <StatusBadge status={drop.status} />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4 no-print">
                        {(drop.status === 'requested' || drop.status === 'kit_prepped') && (
                          <button 
                            onClick={() => markOutForDelivery(drop.id)} 
                            className="text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors hover:opacity-90"
                            style={{ backgroundColor: IHUL_NAVY }}
                          >
                            🚚 Out for Delivery
                          </button>
                        )}
                        {(drop.status === 'out_for_delivery' || drop.status === 'requested' || drop.status === 'kit_prepped') && (
                          <button onClick={() => markDelivered(drop.id)} className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                            ✅ Delivered
                          </button>
                        )}
                        {/* Google Maps button */}
                        <button
                          onClick={() => navigateWithGoogle(drop.homeowner_address)}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-1"
                        >
                          🗺️ Google
                        </button>
                        {/* Apple Maps button */}
                        <button
                          onClick={() => navigateWithApple(drop.homeowner_address)}
                          className="bg-gray-700 hover:bg-gray-800 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-1"
                        >
                          🍎 Apple
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating "Continue Route" button when in progress */}
        {currentStopIndex >= 0 && !showNavModal && (
          <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-40 no-print">
            <button
              onClick={() => setShowNavModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              🧭 Continue Route (Stop {currentStopIndex + 1}/{drops.length})
            </button>
          </div>
        )}

        {/* Start Route button when not in progress */}
        {drops.length > 0 && currentStopIndex < 0 && (
          <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-40 no-print">
            <button
              onClick={startNavigation}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              🚀 Start Route ({drops.length} stops)
            </button>
          </div>
        )}
      </div>
    </Shell>
  );
}
