import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getArtisanProfile } from '../services/productService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { updateArtisanCoords } from '../services/productService';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';

// Basic haversine distance in kilometers
function haversineDistance([lat1, lon1], [lat2, lon2]) {
  function toRad(x) { return x * Math.PI / 180; }
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const ArtisanProfile = () => {
  const { id } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['artisanProfile', id],
    queryFn: () => getArtisanProfile(id),
    enabled: !!id,
  });
  // compute some values that the effect and UI will use; safe when data is undefined
  const { artisan, products, averageRating } = data?.data || { artisan: null, products: [], averageRating: 0 };

  // Buyer location: prefer logged-in user's saved address coords; fall back to artisan's coords as placeholder
  let buyerCoords = null;
  try {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    buyerCoords = savedUser?.address?.coords ? [savedUser.address.coords.lat, savedUser.address.coords.lng] : null;
  } catch (e) { buyerCoords = null; }

  const artisanCoords = artisan?.address?.coords ? [artisan.address.coords.lat, artisan.address.coords.lng] : null;
  const center = artisanCoords || buyerCoords || [20.5937, 78.9629]; // default to India center if nothing
  const distanceKm = (buyerCoords && artisanCoords) ? haversineDistance(buyerCoords, artisanCoords) : null;

  const queryClient = useQueryClient();

  const [geoError, setGeoError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleUseMyLocation = () => {
    setGeoError(null);
    setSaveError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation not available');
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      try {
        setSaving(true);
        await updateArtisanCoords(id, coords);
        await queryClient.invalidateQueries(['artisanProfile', id]);
      } catch (err) {
        setSaveError(err.response?.data?.msg || err.message || 'Failed to save coordinates');
      } finally {
        setSaving(false);
      }
    }, (err) => {
      setGeoError(err.message || 'Failed to get location');
    });
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (isError || !data) return <div className="text-center p-8 text-destructive">Unable to load artisan profile.</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card className="mb-6">
        <CardHeader>
                    <CardTitle>{artisan.artisanName}</CardTitle>
          <CardDescription>{artisan.role}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{artisan.address?.street}, {artisan.address?.city}, {artisan.address?.state} - {artisan.address?.zipCode}</p>
          <p className="mt-2">Average Product Rating: <strong>{averageRating ? averageRating.toFixed(2) : 'N/A'}</strong></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>All products listed by this artisan.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Map section */}
          <div className="mb-6 h-64">
          <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {buyerCoords && (
                <Marker position={buyerCoords}>
                  <Tooltip>Your location</Tooltip>
                </Marker>
              )}
              {artisanCoords && (
                <Marker position={artisanCoords}>
                  <Tooltip>{artisan.businessName || artisan.name}</Tooltip>
                </Marker>
              )}
              {buyerCoords && artisanCoords && (
                <Polyline positions={[buyerCoords, artisanCoords]} color="blue" />
              )}
            </MapContainer>
            {distanceKm !== null && <p className="text-sm mt-2">Distance from you: <strong>{distanceKm.toFixed(2)} km</strong></p>}
            <div className="mt-2 flex items-center gap-2">
              <button type="button" className="btn btn-sm" onClick={handleUseMyLocation} disabled={saving}>
                {saving ? 'Saving...' : 'Use my location'}
              </button>
              {saveError && <span className="text-destructive">{saveError}</span>}
              {geoError && <span className="text-destructive">{geoError}</span>}
            </div>
          </div>
          {products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(p => (
                  <TableRow key={p._id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>₹{p.pricePerKg}/{p.unit}</TableCell>
                    <TableCell>{p.category}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No products listed by this artisan.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ArtisanProfile;