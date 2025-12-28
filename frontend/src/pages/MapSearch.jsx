import { useState, useEffect } from 'react';
import { getArtisanLocations } from '../services/productService'; // Changed import
import { useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet'; // Removed useMap

// This component renders a Leaflet Map, fetches all artisan locations from our API,
// and shows markers on the map.

const MapSearch = () => {
  const [userPos, setUserPos] = useState(null);
  const [artisans, setArtisans] = useState([]);
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // try to get browser location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(p);
      }, () => {
        // fallback location center
        const p = { lat: 20.5937, lng: 78.9629 };
        setUserPos(p);
      });
    } else {
      const p = { lat: 20.5937, lng: 78.9629 };
      setUserPos(p);
    }
    fetchArtisanData(); // Fetch all artisan locations once
  }, []);

  const fetchArtisanData = async () => {
    try {
      const res = await getArtisanLocations(); // Call the new API
      const list = res.data || []; // Response is directly an array of artisans
      setArtisans(list);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-3/4" style={{ height: '100%' }}>
        {userPos && (
          <MapContainer center={userPos} zoom={10} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {artisans.map(artisan => {
              const coords = artisan.address?.coords;
              if (!coords) return null;
              return (
                <Marker key={artisan._id} position={[coords.lat, coords.lng]} eventHandlers={{
                  click: () => {
                    setSelected(artisan);
                  },
                }}>
                  <Tooltip>{artisan.artisanName}</Tooltip>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>
      <aside className="w-1/4 p-4 overflow-auto">
        <h2 className="text-lg font-bold">Artisans</h2>
        {artisans.length === 0 && <p>No artisans found.</p>}
        {artisans.map(artisan => (
          <div key={artisan._id} className={`p-2 border ${selected && selected._id === artisan._id ? 'bg-slate-100' : ''}`} onClick={() => setSelected(artisan)}>
            <h3 className="font-medium">{artisan.artisanName}</h3>
            <p className="text-sm">{artisan.address?.street}, {artisan.address?.city}</p>
          </div>
        ))}
      </aside>
    </div>
  );
};

export default MapSearch;