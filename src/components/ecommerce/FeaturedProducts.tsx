'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from './ProductCard';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image?: string;
}

interface Product {
  id: string;
  name: string;
  shortName?: string;
  sku?: string;
  description: string;
  price: number;
  image: string;
  tags?: string;
  offerEnabled?: boolean;
  offerPrice?: number;
  offerType?: string;
  offerStart?: string | null;
  offerEnd?: string | null;
  wholesaleEnabled?: boolean;
  wholesalePrice?: number;
  wholesaleMinQty?: number;
  rating: number;
  reviewCount: number;
  stock: number;
  featured: boolean;
  category: Category;
}

export function FeaturedProducts() {
  const { selectCategory, setView } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products?featured=true')
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-amber-500" />
          <h2 className="text-2xl font-bold text-gray-900">Productos Destacados</h2>
        </div>
        <Button
          variant="ghost"
          className="text-amber-600 hover:text-amber-700"
          onClick={() => setView('catalog')}
        >
          Ver Todos
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-6 w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
