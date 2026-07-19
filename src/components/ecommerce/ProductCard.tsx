'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, Eye } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { useAppStore } from '@/store/app-store';
import { useToast } from '@/hooks/use-toast';

interface ProductTag {
  name: string;
  color: string;
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
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    image?: string;
  };
}

function parseTags(tags?: string): ProductTag[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((t) => t && typeof t === 'object' && t.name)
        .map((t) => ({ name: String(t.name), color: String(t.color || '#6B7280') }));
    }
  } catch {
    /* ignore */
  }
  return [];
}

function isOfferActive(product: Product): boolean {
  if (!product.offerEnabled) return false;
  if (!product.offerPrice || product.offerPrice <= 0) return false;
  if (product.offerPrice >= product.price) return false;
  const now = new Date();
  if (product.offerStart) {
    const start = new Date(product.offerStart);
    if (!isNaN(start.getTime()) && now < start) return false;
  }
  if (product.offerEnd) {
    const end = new Date(product.offerEnd);
    if (!isNaN(end.getTime()) && now > end) return false;
  }
  return true;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const selectProduct = useAppStore((s) => s.selectProduct);
  const { toast } = useToast();

  const tags = parseTags(product.tags);
  const offerActive = isOfferActive(product);
  const effectivePrice = offerActive ? (product.offerPrice as number) : product.price;
  const wholesaleActive = !!product.wholesaleEnabled && (product.wholesalePrice ?? 0) > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      price: effectivePrice,
      image: product.image,
    });
    toast({
      title: 'Agregado al carrito',
      description: `${product.name} se agregó a tu carrito.`,
    });
  };

  // Mantenemos el descuento "destacado" (10%) sólo si NO hay oferta activa,
  // para no duplicar badges de descuento.
  const discount = !offerActive && product.featured ? 10 : 0;
  const originalPrice = discount ? (product.price / (1 - discount / 100)).toFixed(2) : null;

  const title = product.shortName?.trim() || product.name;

  return (
    <Card
      className="group cursor-pointer overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white"
      onClick={() => selectProduct(product.id)}
    >
      <div className="relative overflow-hidden">
        <div className="aspect-square bg-gray-50">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        {/* Tags como badges coloreados */}
        {tags.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
            {tags.slice(0, 3).map((t) => (
              <span
                key={t.name}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: t.color }}
              >
                {t.name}
              </span>
            ))}
          </div>
        )}
        {product.featured && (
          <Badge className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold">
            ⭐ DESTACADO
          </Badge>
        )}
        {offerActive && (
          <Badge className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold animate-pulse">
            OFERTA
          </Badge>
        )}
        {wholesaleActive && !offerActive && (
          <Badge className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold">
            💰 Por mayor
          </Badge>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge className="bg-red-600 text-white text-sm font-bold">SIN STOCK</Badge>
          </div>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <Badge className="absolute bottom-2 left-2 bg-orange-500 text-white text-[10px]">
            ¡Solo {product.stock} disponibles!
          </Badge>
        )}
        {/* Quick action overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/90 hover:bg-white shadow-lg"
            onClick={(e) => { e.stopPropagation(); selectProduct(product.id); }}
          >
            <Eye className="h-4 w-4 mr-1" />
            Ver Detalle
          </Button>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 mb-1">
          {product.category.image ? (
            <img
              src={product.category.image}
              alt=""
              className="h-4 w-4 rounded-full object-cover"
            />
          ) : null}
          <span className="text-xs text-amber-600 font-medium">
            {!product.category.image && product.category.icon ? `${product.category.icon} ` : ''}
            {product.category.name}
          </span>
        </div>
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 min-h-[2.5rem] leading-tight">
          {title}
        </h3>
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.reviewCount})</span>
          </div>
        )}
        <div className="mt-3 flex items-end justify-between">
          <div>
            {offerActive ? (
              <>
                <p className="text-xl font-bold text-orange-500">${(product.offerPrice as number).toFixed(2)}</p>
                <p className="text-xs text-gray-400 line-through">${product.price.toFixed(2)}</p>
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</p>
                {originalPrice && (
                  <p className="text-xs text-gray-400 line-through">${originalPrice}</p>
                )}
              </>
            )}
          </div>
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
            disabled={product.stock === 0}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
