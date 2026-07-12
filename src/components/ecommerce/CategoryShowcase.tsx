'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image?: string;
  _count?: { products: number };
}

export function CategoryShowcase() {
  const { selectCategory } = useAppStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const colors = [
    'from-blue-500 to-cyan-500',
    'from-pink-500 to-rose-500',
    'from-green-500 to-emerald-500',
    'from-purple-500 to-violet-500',
    'from-orange-500 to-red-500',
    'from-teal-500 to-cyan-500',
  ];

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Comprar por Categoría</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Comprar por Categoría</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {categories.map((category, i) => (
          <Button
            key={category.id}
            variant="outline"
            className="h-auto flex-col gap-2 py-4 border-0 bg-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 overflow-hidden group"
            onClick={() => selectCategory(category.slug)}
          >
            <div className={`relative w-full aspect-square rounded-xl overflow-hidden ${category.image ? '' : `bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center`}`}>
              {category.image ? (
                <>
                  <img
                    src={category.image}
                    alt={category.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <span className="absolute bottom-1.5 right-2 text-xl drop-shadow-lg">
                    {category.icon}
                  </span>
                </>
              ) : (
                <span className="text-4xl">{category.icon}</span>
              )}
            </div>
            <span className="text-sm font-semibold text-gray-800 text-center leading-tight px-1">
              {category.name}
            </span>
            {category._count && (
              <span className="text-xs text-gray-500">{category._count.products} productos</span>
            )}
          </Button>
        ))}
      </div>
    </section>
  );
}
