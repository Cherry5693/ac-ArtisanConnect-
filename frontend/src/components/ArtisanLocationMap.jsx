import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default icon issue with Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom red icon for artisan
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapUpdater = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [map, center]);

  return null;
};

const ArtisanLocationMap = ({ artisanCoords, isDialogOpen }) => {
  if (!artisanCoords) {
    return <p>Loading artisan location...</p>;
  }

  const position = [artisanCoords.lat, artisanCoords.lng];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4">
  {(!artisanCoords)
    ? <div className="text-center py-8 text-green-600 font-semibold">Loading artisan location...</div>
    : (
      <MapContainer center={position} zoom={14} className="rounded-xl shadow-lg" style={{ height: '350px', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapUpdater center={position} />
        <Marker position={position} icon={redIcon}>
          <Popup>
            <span className="text-green-700 font-bold">Artisan Location</span>
          </Popup>
        </Marker>
      </MapContainer>
    )
  }
</div>
  );
};

export default ArtisanLocationMap;