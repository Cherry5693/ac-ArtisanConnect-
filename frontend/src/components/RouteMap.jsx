import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { haversineDistance } from '../lib/distance';

// Fix for default icon issue with Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom icons for buyer (green) and artisan (red)
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// NEW: Custom blue icon for current artisan when viewing another artisan's product
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapUpdater = ({ buyerCoords, artisanCoords }) => {
  const map = useMap();

  useEffect(() => {
    // Validate numeric coordinates before calling map.fitBounds
    if (!buyerCoords || !artisanCoords) return;
    const vals = [buyerCoords.lat, buyerCoords.lng, artisanCoords.lat, artisanCoords.lng];
    if (!vals.every(v => typeof v === 'number' && isFinite(v))) return;

    const bounds = L.latLngBounds([buyerCoords.lat, buyerCoords.lng], [artisanCoords.lat, artisanCoords.lng]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, buyerCoords, artisanCoords]);

  return null;
};

import RoutingMachine from './RoutingMachine';

const RouteMap = ({ buyerCoords, artisanCoords, isDialogOpen, userRole }) => {
  // Validate coords early and ensure ranges are correct
  const isCoordsValid = buyerCoords && artisanCoords &&
    [buyerCoords.lat, buyerCoords.lng, artisanCoords.lat, artisanCoords.lng].every(v => typeof v === 'number' && isFinite(v)) &&
    Math.abs(buyerCoords.lat) <= 90 && Math.abs(artisanCoords.lat) <= 90 && Math.abs(buyerCoords.lng) <= 180 && Math.abs(artisanCoords.lng) <= 180;

  const [routeInfo, setRouteInfo] = useState(null); // { distance: meters, duration: seconds }

  // detect same location (within 10 meters tolerance)
  const isSameLocation = useMemo(() => {
    if (!isCoordsValid) return false;
    const d = haversineDistance([buyerCoords.lat, buyerCoords.lng], [artisanCoords.lat, artisanCoords.lng]);
    return d < 0.01; // <10 meters (km)
  }, [buyerCoords, artisanCoords, isCoordsValid]);

  const position = useMemo(() => (isCoordsValid ? [
    [buyerCoords.lat, buyerCoords.lng],
    [artisanCoords.lat, artisanCoords.lng]
  ] : null), [buyerCoords, artisanCoords, isCoordsValid]);

  // reset routeInfo when coords change
  const [isRouting, setIsRouting] = useState(false);
  const [routeError, setRouteError] = useState(null);

  useEffect(() => {
    setRouteInfo(null);
    setRouteError(null);
    setIsRouting(false);
    if (isSameLocation) {
      setRouteInfo({ distance: 0, duration: 0 });
    }
  }, [buyerCoords, artisanCoords, isSameLocation]);

  const handleRouteStart = (active) => {
    setIsRouting(active);
    if (active) setRouteError(null);
  };

  const handleRouteError = (err) => {
    setIsRouting(false);
    setRouteError(err?.message || 'Route unavailable');
    // keep fallback displayed
  };

  // Fallback distance (haversine in km) used until OSRM returns
  const fallbackDistance = useMemo(() => {
    if (!isCoordsValid) return null;
    try {
      return haversineDistance([buyerCoords.lat, buyerCoords.lng], [artisanCoords.lat, artisanCoords.lng]);
    } catch (e) {
      return null;
    }
  }, [buyerCoords, artisanCoords, isCoordsValid]);

  // Render placeholder while coords not available
  if (!isCoordsValid) return <div className="map-skeleton p-6 bg-white rounded-lg shadow text-center">Map is loading or coordinates unavailable.</div>;

  // Prefer routeInfo (OSRM), otherwise fallbackDistance (already in km)
  const distanceKm = routeInfo?.distance !== undefined ? (routeInfo.distance / 1000).toFixed(1) : (fallbackDistance ? fallbackDistance.toFixed(1) : '—');
  const durationMin = routeInfo?.duration !== undefined ? Math.round(routeInfo.duration / 60) : null;

  return (
    <div className="map-container relative">
      <MapContainer 
        center={[buyerCoords.lat, buyerCoords.lng]} 
        zoom={13} 
        style={{ height: '400px', width: '100%' }} 
        scrollWheelZoom={false}
        className={isDialogOpen ? 'pointer-events-none' : ''}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapUpdater buyerCoords={buyerCoords} artisanCoords={artisanCoords} />

        <Marker position={[buyerCoords.lat, buyerCoords.lng]} icon={userRole === 'artisan' ? blueIcon : greenIcon}>
          <Popup>{userRole === 'artisan' ? 'Your Location' : 'Your Location'}</Popup>
        </Marker>
        <Marker position={[artisanCoords.lat, artisanCoords.lng]} icon={redIcon}>
          <Popup>Artisan Location</Popup>
        </Marker>

        {/* RoutingMachine handles route fetch/draw and caching via OSRM. Don't call if same location. */}
        {!isSameLocation && (
          <RoutingMachine
            start={[buyerCoords.lat, buyerCoords.lng]}
            end={[artisanCoords.lat, artisanCoords.lng]}
            onRouteFound={(summary) => { setRouteInfo(summary); setIsRouting(false); }}
            onRouteStart={handleRouteStart}
            onRouteError={handleRouteError}
          />
        )}
      </MapContainer>

      {isRouting && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 rounded-lg p-3 shadow-md flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-sm">Routing...</span>
        </div>
      )}

      {routeError && (
        <div className="mt-2 text-center text-sm text-destructive">{routeError}. Showing straight-line distance.</div>
      )}

      <div className="mt-2 text-center">
        <span className="font-medium">Distance: </span>
        <span>{distanceKm} km</span>
        {durationMin !== null && (
          <span className="ml-2 text-sm text-gray-600">• {durationMin} min</span>
        )}
      </div>
    </div>
  );
};

export default RouteMap;