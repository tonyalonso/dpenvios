'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { ProductCard } from './ProductCard';
import { CategoryBar } from './CategoryBar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image?: string;
  _count?: { products: number };
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

export function ProductGrid() {
  const { selectedCategory, searchQuery } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.set('category', selectedCategory);
        if (searchQuery) params.set('search', searchQuery);
        params.set('sort', sort);

        const [productsRes, categoriesRes] = await Promise.all([
          fetch(`/api/products?${params.toString()}`),
          fetch('/api/categories'),
        ]);

        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();

        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedCategory, searchQuery, sort]);

  return (
    <div>
      <CategoryBar categories={categories} selectedCategory={selectedCategory} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {searchQuery ? `Resultados para "${searchQuery}"` : selectedCategory ? categories.find(c => c.slug === selectedCategory)?.name || 'Productos' : 'Todos los Productos'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {loading ? 'Cargando...' : `${products.length} productos encontrados`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-500" />
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[260px] h-9">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Más Recientes</SelectItem>
                <SelectItem value="price-asc">Precio: Menor a Mayor</SelectItem>
                <SelectItem value="price-desc">Precio: Mayor a Menor</SelectItem>
                <SelectItem value="rating">Mejor Valorados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LayoutGrid className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No se encontraron productos</h3>
            <p className="text-sm text-gray-500 mt-1">Intenta con otra búsqueda o categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
