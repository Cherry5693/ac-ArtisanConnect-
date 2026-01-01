import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProductById } from '../services/productService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RouteMap from '../components/RouteMap';
import ArtisanLocationMap from '../components/ArtisanLocationMap';
import { Loader2, ArrowLeft, ArrowRight, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { haversineDistance } from '../lib/distance';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import JoinOrderDialog from '../components/JoinOrderDialog';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [buyerLocation, setBuyerLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState(null);

  const isAnyDialogOpen = isOrderDialogOpen;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Helper to validate coords
  const isValidCoords = (c) => c && typeof c.lat === 'number' && typeof c.lng === 'number' && isFinite(c.lat) && isFinite(c.lng) && Math.abs(c.lat) <= 90 && Math.abs(c.lng) <= 180;

  // Normalize coordinates and handle common mis-formats (strings, swapped lat/lng, [lng,lat] arrays)
  const normalizeCoords = (c) => {
    if (!c) return null;
    // Allow object {lat,lng} or {latitude,longitude} or array [lng,lat] or [lat,lng]
    let lat = Number(c.lat ?? c.latitude ?? (Array.isArray(c) ? c[1] : undefined));
    let lng = Number(c.lng ?? c.longitude ?? (Array.isArray(c) ? c[0] : undefined));

    const latValid = Number.isFinite(lat) && Math.abs(lat) <= 90;
    const lngValid = Number.isFinite(lng) && Math.abs(lng) <= 180;

    // If lat is invalid but lng looks like a latitude, assume swapped values and flip
    if ((!latValid || !lngValid) && Number.isFinite(lng) && Math.abs(lng) <= 90 && Number.isFinite(lat) && Math.abs(lat) <= 180) {
      // swap
      [lat, lng] = [lng, lat];
      console.warn('normalizeCoords: detected swapped lat/lng and auto-swapped', { original: c, normalized: { lat, lng } });
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

    return { lat, lng };
  }; 

  // Prefer buyer location from authenticated user's saved profile (DB). Fallback to device geolocation only if not available.
  useEffect(() => {
    setLocationLoading(true);
    setLocationError(null);

    // 1) Try user-saved address coords
    const savedCoords = user?.address?.coords;
    const normalizedSaved = normalizeCoords(savedCoords);
    if (normalizedSaved) {
      setBuyerLocation(normalizedSaved);
      setLocationLoading(false);
      return;
    }

    // 2) Optionally, if user has a profile-level location attribute
    if (user?.location) {
      const normalizedProfile = normalizeCoords(user.location);
      if (normalizedProfile) {
        setBuyerLocation(normalizedProfile);
        setLocationLoading(false);
        return;
      }
    }

    // 3) Not available in DB/profile — try device geolocation, but do not force it. Provide explicit prompt instead of auto-permission where possible.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const normalized = normalizeCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
          setBuyerLocation(normalized || { lat: position.coords.latitude, lng: position.coords.longitude });
          setLocationError(null);
          setLocationLoading(false);
        },
        (err) => {
          console.warn('Geolocation denied or failed:', err);
          setLocationError("Could not get your location. Add your address or enable location to see the route.");
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
      setLocationLoading(false);
    }
  }, [user]);

  const requestDeviceLocation = () => {
    setLocationLoading(true);
    setLocationError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const normalized = normalizeCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
          setBuyerLocation(normalized || { lat: position.coords.latitude, lng: position.coords.longitude });
          setLocationError(null);
          setLocationLoading(false);
        },
        (err) => {
          console.warn('Geolocation denied or failed:', err);
          setLocationError("Could not get your location. Add your address or enable location to see the route.");
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
      setLocationLoading(false);
    }
  };

  const { data: productData, isLoading, isError, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
  });

  const product = productData?.data;
  const initialArtisanCoords = product?.location || product?.artisan?.address?.coords;
  const [resolvedArtisanCoords, setResolvedArtisanCoords] = useState(initialArtisanCoords ? normalizeCoords(initialArtisanCoords) : null);
  const [artisanLoading, setArtisanLoading] = useState(!initialArtisanCoords && !!product?.artisan?._id);
  const [artisanError, setArtisanError] = useState(null);
  const isOwner = user?._id === product?.artisan?._id;

  // Product image gallery state
  const gallery = (product?.images && product.images.length) ? product.images : (product?.imageUrl ? [product.imageUrl] : []);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Keep index within bounds when product changes
    if (!gallery || gallery.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= gallery.length) {
      setCurrentIndex(0);
    }
  }, [product]);

  useEffect(() => {
    if (!gallery || gallery.length <= 1) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight') setCurrentIndex(i => Math.min(i + 1, gallery.length - 1));
      if (e.key === 'ArrowLeft') setCurrentIndex(i => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gallery]);

  // Compute display coords for artisan (avoid referencing undefined `artisanCoords` variable)
  const displayArtisanRaw = resolvedArtisanCoords || initialArtisanCoords;
  const displayArtisanCoords = normalizeCoords(displayArtisanRaw);

  // If both buyer and artisan coords are present but markers are far apart, try permutations
  // of lat/lng (swapped) to detect and correct swapped coordinates (common data-entry bug).
  const autoFixIfSwapped = (bCoords, aCoords) => {
    if (!bCoords || !aCoords) return { buyer: bCoords, artisan: aCoords, fixed: false };
    const b = { ...bCoords };
    const a = { ...aCoords };

    const d0 = haversineDistance([b.lat, b.lng], [a.lat, a.lng]);
    const d1 = haversineDistance([b.lng, b.lat], [a.lat, a.lng]);
    const d2 = haversineDistance([b.lat, b.lng], [a.lng, a.lat]);
    const d3 = haversineDistance([b.lng, b.lat], [a.lng, a.lat]);

    const distMap = [
      { key: 'none', dist: d0 },
      { key: 'buyerSwapped', dist: d1 },
      { key: 'artisanSwapped', dist: d2 },
      { key: 'bothSwapped', dist: d3 },
    ];
    const best = distMap.reduce((p, c) => (c.dist < p.dist ? c : p), distMap[0]);

    // Accept a swap only if it significantly reduces the distance and the resulting distance is reasonable
    if (best.key !== 'none' && best.dist < d0 / 2 && best.dist < 2000) {
      let fixedBuyer = b;
      let fixedArtisan = a;
      if (best.key === 'buyerSwapped' || best.key === 'bothSwapped') {
        fixedBuyer = { lat: b.lng, lng: b.lat };
        console.warn('Auto-swapped buyer lat/lng to match artisan (reduced distance)', { original: b, fixed: fixedBuyer, oldDist: d0, newDist: best.dist });
      }
      if (best.key === 'artisanSwapped' || best.key === 'bothSwapped') {
        fixedArtisan = { lat: a.lng, lng: a.lat };
        console.warn('Auto-swapped artisan lat/lng to match buyer (reduced distance)', { original: a, fixed: fixedArtisan, oldDist: d0, newDist: best.dist });
      }
      return { buyer: fixedBuyer, artisan: fixedArtisan, fixed: true };
    }

    return { buyer: b, artisan: a, fixed: false };
  };

  const handleChatClick = async () => {
    setChatLoading(true);
    setChatError(null);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/conversations/${product.artisan._id}/${product._id}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      navigate(`/chat/${res.data.conversationId}`);
    } catch {
      setChatError('Failed to start chat. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleOrderClick = () => {
    setSelectedProductForOrder(product);
    setIsOrderDialogOpen(true);
  };

  if (isLoading)
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  if (isError || !product)
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-destructive">Error loading product details</h2>
        <p className="text-muted-foreground">{error?.message || 'Product not found.'}</p>
        <Button onClick={() => navigate(-1)} className="mt-4 inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 transition rounded-lg px-4 py-2">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </Button>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-gray-700 hover:text-gray-900 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Details */}
          <div className="lg:col-span-2">
            <Card className="rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow bg-white border border-gray-100">
              {gallery && gallery.length ? (
                <div className="relative w-full h-80 bg-black/5 overflow-hidden">
                  <img src={gallery[currentIndex]} alt={`${product.name} - ${currentIndex + 1}`} className="w-full h-80 object-cover transition-opacity duration-300" />

                  {/* Left / Right controls */}
                  {gallery.length > 1 && (
                    <>
                      <button aria-label="Previous image" onClick={() => setCurrentIndex(i => Math.max(i - 1, 0))} disabled={currentIndex === 0} className={`absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow ${currentIndex === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <button aria-label="Next image" onClick={() => setCurrentIndex(i => Math.min(i + 1, gallery.length - 1))} disabled={currentIndex === gallery.length - 1} className={`absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow ${currentIndex === gallery.length - 1 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                        {gallery.map((g, idx) => (
                          <button key={idx} onClick={() => setCurrentIndex(idx)} aria-label={`Go to image ${idx + 1}`} className={`w-2 h-2 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/40'}`} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full h-80 bg-gray-100 flex items-center justify-center">No Image</div>
              )}
              <CardHeader className="px-6 pt-6">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-3xl font-bold">{product.name}</CardTitle>
                  <Badge variant="secondary" className="text-lg px-3 py-1">{product.category}</Badge>
                </div>
                <CardDescription className="text-gray-500 mt-2">{product.description || 'No description provided.'}</CardDescription>
              </CardHeader>
              <CardContent className="px-6 py-4 space-y-6">
                {/* Pricing & Artisan Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                    <h3 className="text-xl font-semibold mb-2">Pricing & Quantity</h3>
                    <p className="text-gray-600">Price: <span className="font-bold text-green-600 text-xl">{product.convertedCurrency ? `${product.convertedCurrency} ${product.pricePerKg.toFixed(2)}` : `₹${product.pricePerKg}`}</span> / {product.unit}</p>
                    <p className="text-gray-600">Min. Order: <span className="font-bold">{product.minOrderQty}</span> {product.unit}</p>
                    <p className="text-gray-600">Available Stock: <span className="font-bold">{product.availableQty}</span> {product.unit}</p>
                  </div>
                  {product.artisan && (
                    <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                      <h3 className="text-xl font-semibold mb-2">Artisan Information</h3>
                      <p className="text-gray-600">Artisan: <Link to={`/artisans/${product.artisan._id}`} className="text-primary underline font-bold">{product.artisan.businessName || product.artisan.name}</Link></p>
                      {product.artisan.address && (
                        <p className="text-gray-600 flex items-center"><MapPin className="w-4 h-4 mr-1" />{product.artisan.address.street}, {product.artisan.address.city}, {product.artisan.address.state} - {product.artisan.address.zipCode || product.artisan.address.zip || 'Not set'}</p>
                      )}
                      {displayArtisanCoords && <p className="text-gray-400 text-sm mt-1">(Lat: {displayArtisanCoords.lat}, Lng: {displayArtisanCoords.lng})</p>}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {user?.role !== 'artisan' && product.artisan && (
                  <div className="mt-6 flex flex-col md:flex-row gap-3">
                    <Button
                      onClick={handleChatClick}
                      isLoading={chatLoading}
                      className="w-full md:w-1/2 bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                    >
                      Chat with Artisan
                    </Button>
                    <Button onClick={handleOrderClick} className="w-full md:w-1/2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg transition-all">Order</Button>
                    {chatError && <p className="text-destructive text-sm mt-2">{chatError}</p>}
                  </div>
                )}

                {/* Reviews */}
                {product.reviews?.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Reviews ({product.reviews.length})</h3>
                    <p className="text-gray-600">Average Rating: {product.averageRating?.toFixed(1)} / 5</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Map / Route */}
          <div className="lg:col-span-1">
            <Card className="rounded-2xl shadow-xl h-full hover:shadow-2xl transition-shadow bg-white border border-gray-100">
              <CardHeader className="px-6 pt-6">
                <CardTitle>Artisan Location & Route</CardTitle>
                <CardDescription>Find your way to the artisan.</CardDescription>
              </CardHeader>
              <CardContent className="px-6 py-4 h-96 flex flex-col justify-center">
                {/* Normalize and validate artisan coords */}
                {(() => {
                  const raw = resolvedArtisanCoords || initialArtisanCoords;
                  const normalizedArtisan = normalizeCoords(raw);

                  if (artisanLoading) {
                    return (<div className="map-skeleton animate-pulse p-6 bg-white rounded-lg shadow text-center">Resolving artisan location...</div>);
                  }

                  if (!normalizedArtisan) {
                    return (
                      <div className="text-center py-8">
                        <MapPin className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                        <h3 className="font-semibold">Location Not Available</h3>
                        <p className="text-gray-400 text-sm mt-1">{isOwner ? "Add your location to show it on the map." : "This artisan has not set their location yet."}</p>
                        {isOwner && <Button asChild className="mt-4"><Link to="/artisan-profile-page">Set Location</Link></Button>}
                      </div>
                    );
                  }

                  // If artisan coordinates exist but buyer location not resolved yet
                  if (!buyerLocation && locationLoading) {
                    return (<div className="map-skeleton animate-pulse p-6 bg-white rounded-lg shadow text-center">Resolving your location...</div>);
                  }

                  if (!buyerLocation && !locationLoading) {
                    return (
                      <div className="text-center py-6">
                        <p className="mb-2">Your location is required to calculate the route.</p>
                        <div className="flex justify-center gap-3">
                          <Button onClick={requestDeviceLocation} className="bg-blue-600 text-white">Use my device location</Button>
                          <Button asChild variant="outline"><Link to="/buyer-profile">Add address</Link></Button>
                        </div>
                        {locationError && <p className="text-sm text-destructive mt-3">{locationError}</p>}
                      </div>
                    );
                  }

                  // Both coords available: render the map
                  let normalizedBuyer = normalizeCoords(buyerLocation);

                  // Attempt to auto-fix swapped coordinates by minimizing distance between points
                  try {
                    const fixResult = autoFixIfSwapped(normalizedBuyer, normalizedArtisan);
                    normalizedBuyer = fixResult.buyer;
                    // we could also update normalizedArtisan if needed; the RouteMap just needs final coords
                    if (fixResult.fixed) {
                      console.info('Coordinate auto-fix applied to product detail map', fixResult);
                    }
                  } catch (e) {
                    // keep original if anything goes wrong
                    console.warn('Auto-fix swap check failed', e);
                  }

                  return (
                    <RouteMap 
                      buyerCoords={normalizedBuyer} 
                      artisanCoords={normalizedArtisan}
                      isDialogOpen={isAnyDialogOpen}
                      userRole={user?.role}
                    />
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {selectedProductForOrder && (
        <JoinOrderDialog
          product={selectedProductForOrder}
          isOpen={isOrderDialogOpen}
          onClose={() => setIsOrderDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default ProductDetail;
