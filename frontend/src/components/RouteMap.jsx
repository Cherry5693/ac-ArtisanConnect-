import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
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
    if (buyerCoords && artisanCoords) {
      const bounds = L.latLngBounds([buyerCoords.lat, buyerCoords.lng], [artisanCoords.lat, artisanCoords.lng]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, buyerCoords, artisanCoords]);

  return null;
};

const RouteMap = ({ buyerCoords, artisanCoords, isDialogOpen, userRole }) => {
  if (!buyerCoords || !artisanCoords) {
    return <p>Loading map...</p>;
  }

  const position = [
    [buyerCoords.lat, buyerCoords.lng],
    [artisanCoords.lat, artisanCoords.lng]
  ];

  const distance = haversineDistance(
    [buyerCoords.lat, buyerCoords.lng],
    [artisanCoords.lat, artisanCoords.lng]
  ).toFixed(1);

  return (
    <div className="map-container">
      <MapContainer 
        center={[buyerCoords.lat, buyerCoords.lng]} 
        zoom={13} 
        style={{ height: '400px', width: '100%' }} 
        scrollWheelZoom={false}
        className={isDialogOpen ? 'pointer-events-none' : ''} // Apply class conditionally
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapUpdater buyerCoords={buyerCoords} artisanCoords={artisanCoords} />
        <Marker position={[buyerCoords.lat, buyerCoords.lng]} icon={userRole === 'artisan' ? blueIcon : greenIcon}> {/* Conditional icon */}
          <Popup>{userRole === 'artisan' ? 'Your Location' : 'Your Location'}</Popup>
        </Marker>
        <Marker position={[artisanCoords.lat, artisanCoords.lng]} icon={redIcon}>
          <Popup>Artisan Location</Popup>
        </Marker>
        <Polyline positions={position} color="blue" />
      </MapContainer>
      <p className="text-center mt-2">Distance: {distance} km</p>
    </div>
  );
};

export default RouteMap;