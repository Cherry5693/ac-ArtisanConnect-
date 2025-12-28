import { useQuery } from '@tanstack/react-query';
import { getOrderTracking, getOrderSummary } from '../services/orderService';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Loader2, CheckCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import RoutingMachine from './RoutingMachine';

const OrderTrackingDialog = ({ orderId, isOpen, onClose }) => {
  // const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // Get API key
  const { data: trackingData, isLoading, isError } = useQuery({
    queryKey: ['orderTracking', orderId],
    queryFn: () => getOrderTracking(orderId),
    enabled: !!orderId && isOpen,
  });
  const trackingInfo = trackingData?.data;
  const { data: summaryData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['orderSummary', orderId],
    queryFn: () => getOrderSummary(orderId),
    enabled: !!orderId && isOpen,
  });

  const orderSummary = summaryData?.data;
  const [mapError, setMapError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // fallback to saved user address coords if available
          try {
            const saved = JSON.parse(localStorage.getItem('user'));
            const coords = saved?.address?.coords;
            if (coords && coords.lat && coords.lng) {
              setUserLocation({ lat: coords.lat, lng: coords.lng });
            } else {
              setMapError('Unable to determine your location');
            }
          } catch (e) {
            setMapError('Unable to determine your location');
          }
        }
      );
    } else {
      setMapError('Geolocation not available');
    }
  }, [isOpen]);

  const artisanLocation = orderSummary?.artisanLocation;
  const center = artisanLocation || userLocation;
  // Map is considered ready when we have orderSummary and at least one of userLocation or artisanLocation
  const isMapDataAvailable = !!orderSummary && (!!userLocation || !!artisanLocation);

  const handleRouteFound = (summary) => {
    setRouteSummary(summary);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="bg-gradient-to-bl from-cyan-50 via-white to-green-50 rounded-2xl shadow-2xl border p-6 max-w-2xl mx-auto">
    <DialogHeader>
      <DialogTitle className="text-xl sm:text-2xl font-bold text-cyan-700">Track Order #{orderId?.substring(0, 8)}</DialogTitle>
      <DialogDescription className="text-gray-700">Status updates for your group order.</DialogDescription>
    </DialogHeader>
    {(isLoading || isLoadingSummary || !isMapDataAvailable) ? (
      <div className="flex flex-col items-center gap-4 py-8">
        <Loader2 className="animate-spin text-cyan-600 w-8 h-8" />
        <span className="text-cyan-600 font-semibold">Loading map and tracking details...</span>
      </div>
    ) : isError ? (
      <span className="text-red-600 bg-red-50 font-semibold rounded p-3">Could not fetch tracking details.</span>
    ) : trackingInfo ? (
      <div className="space-y-6">
        {mapError ? (
          <span className="block text-orange-700 bg-orange-50 rounded-lg p-2 font-medium">{mapError}</span>
        ) : !artisanLocation ? (
          <span className="block text-red-700 bg-red-50 rounded-lg p-2 font-medium">Artisan location not available for tracking. Please contact the artisan.</span>
        ) : !userLocation ? (
          <span className="block text-yellow-800 bg-yellow-50 rounded-lg p-2 font-medium">Your location is not available. Please enable geolocation or set an address in profile.</span>
        ) : (center && typeof center.lat === 'number' && typeof center.lng === 'number') ? (
          <div className="bg-white/80 rounded-xl shadow-lg p-2 mb-3">
            {/* Map area with glassmorphic backdrop */}
            <MapContainer center={center} zoom={14} className="rounded-xl shadow w-full h-60" style={{ minHeight: '240px' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <RoutingMachine start={[userLocation.lat, userLocation.lng]} end={[artisanLocation.lat, artisanLocation.lng]} onRouteFound={handleRouteFound} />
              <Marker position={userLocation}>
                <Tooltip direction="top">Your Location</Tooltip>
              </Marker>
              <Marker position={artisanLocation}>
                <Tooltip direction="top">Artisan</Tooltip>
              </Marker>
            </MapContainer>
            {routeSummary && (
              <div className="flex gap-4 mt-4 items-center justify-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 font-medium shadow">
                  Distance: {(routeSummary.totalDistance / 1000).toFixed(2)} km
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium shadow">
                  Estimated: {Math.round(routeSummary.totalTime / 60)} minutes
                </span>
              </div>
            )}
          </div>
        ) : (
          <span className="text-orange-700 bg-orange-50 rounded-lg p-2 font-medium">
            Map data not fully available. Ensure both your location and artisan location are set.
          </span>
        )}
        <div className="pt-1 pb-2">
          <ol className="relative border-l border-cyan-300 ml-2">
            {trackingInfo.events.map((event, index) => (
              <li key={index} className="mb-7 ml-5">
                {event.status.includes('Confirmed') ? (
                  <span className="absolute -left-4 flex items-center justify-center w-7 h-7 bg-green-100 border-2 border-green-400 rounded-full shadow"><CheckCircle className="w-5 h-5 text-green-600" /></span>
                ) : (
                  <span className="absolute -left-4 flex items-center justify-center w-7 h-7 bg-gray-100 border-2 border-cyan-400 rounded-full shadow"><Clock className="w-5 h-5 text-cyan-700" /></span>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="font-bold text-cyan-700">{event.status}</span>
                  <span className="text-xs sm:ml-3 text-gray-600">{new Date(event.timestamp).toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    ) : (
      <span className="text-gray-600 italic">No tracking information available.</span>
    )}
  </DialogContent>
</Dialog>

  );
};

export default OrderTrackingDialog;
