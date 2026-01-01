import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRecommendations } from '@/services/recoService';
import { getProducts } from '@/services/productService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IndianRupee } from 'lucide-react';
import { ProgressiveImage } from './ProgressiveImage';

export default function RecommendedList({ user, location }) {
  const [recommended, setRecommended] = useState([]);

  const lat = location?.lat ?? 28.6139;
  const lon = location?.lon ?? 77.2090;

  useEffect(() => {
    async function run() {
      // 1) fetch a small candidate pool
      const res = await getProducts({});
      const products = Array.isArray(res) ? res : (res?.data || []);

      const candidates = products.slice(0, 30).map(p => ({
        id: p._id,
        category: p.category,
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

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {recommended.map(p => (
          <Card
            key={p._id}
            className="flex flex-col h-full overflow-hidden rounded-xl bg-white border border-gray-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          >
            <Link to={`/products/${p._id}`} className="flex flex-col h-full">
              {p.imageUrl && (
                <ProgressiveImage
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-32 object-cover"
                  skeletonClassName="h-32"
                />
              )}
              <CardHeader className="p-3 pb-2 flex-shrink-0">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">
                    {p.name}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs flex-shrink-0 ml-1">
                    {p.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 flex-1 flex flex-col justify-end">
                <div className="flex items-center space-x-1">
                  <IndianRupee className="w-3 h-3 text-green-700 flex-shrink-0" />
                  <span className="text-base font-bold text-green-700">
                    {p.pricePerKg ?? p.price ?? 0}
                  </span>
                  {p.unit && (
                    <span className="text-xs text-gray-500">/{p.unit}</span>
                  )}
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
