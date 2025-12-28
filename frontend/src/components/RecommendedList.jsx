
// frontend/src/components/RecommendedList.jsx
import { useEffect, useState } from 'react';
import { getRecommendations } from '@/services/recoService';           // use alias for consistency
import { getProducts } from '@/services/productService';               // named import

export default function RecommendedList({ user, location }) {
  const [items, setItems] = useState([]);
  const [recommended, setRecommended] = useState([]);

  const lat = location?.lat ?? 28.6139;
  const lon = location?.lon ?? 77.2090;

  useEffect(() => {
    async function run() {
      // 1) fetch a small candidate pool
      const res = await getProducts({});                               // Axios response
      const products = Array.isArray(res) ? res : (res?.data || []);   // read res.data
      setItems(products);

      const candidates = products.slice(0, 30).map(p => ({
        id: p._id,
        category: p.category,
        // align with your schema; Products.jsx shows pricePerKg in use
        price: p.pricePerKg ?? p.price ?? 0,
        material: p.material || '',
      }));

      // 2) ask backend for ranked IDs
      const ids = await getRecommendations({
        userId: user?._id || 'guest',
        lat,
        lon,
        candidates,
      });

      // 3) map IDs back to product objects
      const map = new Map(products.map(p => [p._id, p]));
      const ranked = ids.map(id => map.get(id)).filter(Boolean);
      setRecommended(ranked);
    }
    run().catch(console.error);
  }, [user?._id, lat, lon]);

  if (!recommended.length) return null;

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
    gap: 16
  };

  return (
    <section style={{ marginTop: 24 }}>
      <h3>Recommended for you</h3>
      <div style={gridStyle}>
        {recommended.map(p => (
          <div key={p._id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 600 }}>{p.name}</div>
            <div style={{ color: '#666' }}>{p.category}</div>
            <div style={{ marginTop: 6 }}>₹ {p.pricePerKg ?? p.price}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
