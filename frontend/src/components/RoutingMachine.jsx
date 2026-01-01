import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// Simple cache to avoid repeated OSRM calls for same coordinates
const routeCache = new Map();

// Try to hydrate cache from localStorage for faster revisits
try {
  const raw = localStorage.getItem('osrmRouteCache_v1');
  if (raw) {
    const parsed = JSON.parse(raw);
    Object.keys(parsed).forEach(k => routeCache.set(k, parsed[k]));
  }
} catch (e) {
  // ignore
}

const isValidCoord = (c) => typeof c === 'number' && isFinite(c) && Math.abs(c) <= 180;

const buildCacheKey = (start, end) => `${start[0]},${start[1]}_${end[0]},${end[1]}`;

const RoutingMachine = ({ start, end, onRouteFound, onRouteStart, onRouteError }) => {
  const map = useMap();
  const routeLayerRef = useRef(null);
  const prevKeyRef = useRef(null);

  useEffect(() => {
    if (!map) return;
    // validate coords
    if (!start || !end) return;
    const [sLat, sLng] = start;
    const [eLat, eLng] = end;
    if (![sLat, sLng, eLat, eLng].every(v => isValidCoord(v))) return;

    const key = buildCacheKey(start, end);

    // If same as previous, skip
    if (prevKeyRef.current === key) return;
    prevKeyRef.current = key;

    // If cached, use cached route
    if (routeCache.has(key)) {
      const cached = routeCache.get(key);
      // remove existing layer
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }
      const poly = L.polyline(cached.coords, { color: 'blue', weight: 5, opacity: 0.8 }).addTo(map);
      routeLayerRef.current = poly;
      map.fitBounds(poly.getBounds(), { padding: [50, 50] });
      if (onRouteFound) onRouteFound({ distance: cached.distance, duration: cached.duration });
      return;
    }

    // Not cached: fetch from OSRM
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${sLng},${sLat};${eLng},${eLat}?overview=full&geometries=geojson&alternatives=false&annotations=true`;

    let cancelled = false;

    // notify start
    if (onRouteStart) onRouteStart(true);

    fetch(osrmUrl)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        if (!data || data.code !== 'Ok' || !data.routes || !data.routes.length) {
          throw new Error('No route found');
        }
        const route = data.routes[0];
        const coords = route.geometry.coordinates.map(c => [c[1], c[0]]); // to [lat,lng]
        const distance = route.distance; // meters
        const duration = route.duration; // seconds

        // cache it
        routeCache.set(key, { coords, distance, duration });
        try {
          const toStore = Object.fromEntries(routeCache);
          localStorage.setItem('osrmRouteCache_v1', JSON.stringify(toStore));
        } catch (e) {
          // ignore storage failures
        }

        // remove existing layer
        if (routeLayerRef.current) {
          map.removeLayer(routeLayerRef.current);
          routeLayerRef.current = null;
        }

        const poly = L.polyline(coords, { color: 'blue', weight: 5, opacity: 0.8 }).addTo(map);
        routeLayerRef.current = poly;
        map.fitBounds(poly.getBounds(), { padding: [50, 50] });

        if (onRouteFound) onRouteFound({ distance, duration });
      })
      .catch(err => {
        console.error('RoutingMachine: failed to fetch route', err);
        if (onRouteError) onRouteError(err);
      })
      .finally(() => {
        if (onRouteStart) onRouteStart(false);
      });

    return () => {
      cancelled = true;
      if (routeLayerRef.current) {
        try { map.removeLayer(routeLayerRef.current); } catch(e) {}
        routeLayerRef.current = null;
      }
    };
  }, [map, start, end, onRouteFound]);

  return null;
};

export default RoutingMachine;
