'use client';

import { useCartStore } from '@/store/cart-store';
import { useAppStore } from '@/store/app-store';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SiteConfigData {
  freeShippingMin: number;
  shippingCost: number;
}

export function CartSidebar() {
  const [open, setOpen] = useState(false);
  const [siteConfig, setSiteConfig] = useState<SiteConfigData | null>(null);
  const items = useCartStore((s) => s.items);
  const hydrated = useCartStore((s) => s._hydrated);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const getTotal = useCartStore((s) => s.getTotal);
  const getItemCount = useCartStore((s) => s.getItemCount);
  const clearCart = useCartStore((s) => s.clearCart);
  const setView = useAppStore((s) => s.setView);

  useEffect(() => {
    const handler = () => setOpen((prev) => !prev);
    window.addEventListener('toggleCart', handler);
    return () => window.removeEventListener('toggleCart', handler);
  }, []);

  useEffect(() => {
    fetch('/api/siteconfig')
      .then((res) => res.json())
      .then((data) => setSiteConfig(data))
      .catch(console.error);
  }, []);

  const total = getTotal();
  const itemCount = getItemCount();
  const freeShippingMin = siteConfig?.freeShippingMin ?? 100;
  const shippingCostValue = siteConfig?.shippingCost ?? 9.99;
  const freeShipping = total >= freeShippingMin;
  const shippingCost = freeShipping ? 0 : shippingCostValue;
  const finalTotal = total + shippingCost;

  const handleCheckout = () => {
    setOpen(false);
    setView('checkout');
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col px-4 sm:px-6">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-amber-500" />
            Mi Carrito ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Tu carrito está vacío</h3>
            <p className="text-sm text-gray-500 mt-1">Agrega productos para comenzar</p>
            <Button
              className="mt-4 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => { setOpen(false); setView('catalog'); }}
            >
              Explorar Productos
            </Button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 bg-gray-50 rounded-xl p-4">
                  <div className="w-20 h-20 bg-white rounded-lg overflow-hidden shrink-0 border border-gray-200">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{item.name}</h4>
                    <p className="text-sm font-bold text-amber-600 mt-1">${item.price.toFixed(2)}</p>
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="flex items-center border rounded-md bg-white">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-9 text-center text-sm font-semibold">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Summary */}
            <div className="space-y-3 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Envío</span>
                <span className={`font-medium ${freeShipping ? 'text-green-600' : ''}`}>
                  {freeShipping ? 'GRATIS' : `$${shippingCost.toFixed(2)}`}
                </span>
              </div>
              {!freeShipping && (
                <div className="bg-amber-50 text-amber-700 text-xs p-3 rounded-lg text-center leading-relaxed">
                  ¡Agrega ${(freeShippingMin - total).toFixed(2)} más para envío GRATIS!
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-amber-600">${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <SheetFooter className="flex flex-col gap-2 pt-4">
              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg h-11"
                onClick={handleCheckout}
              >
                Completar Pedido
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={clearCart}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Vaciar Carrito
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
