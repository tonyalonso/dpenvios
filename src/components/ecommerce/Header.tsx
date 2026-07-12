'use client';

import { ShoppingCart, Search, History, Menu, X, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/cart-store';
import { useAppStore } from '@/store/app-store';
import { useCustomerStore } from '@/store/customer-store';
import { useState, useEffect } from 'react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [tickerItems, setTickerItems] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState<string>('/logo-real.jpg');
  const cartItems = useCartStore((s) => s.items);
  const hydrated = useCartStore((s) => s._hydrated);
  const { setSearchQuery, setView } = useAppStore();
  const customer = useCustomerStore((s) => s.customer);
  const customerHydrated = useCustomerStore((s) => s.hydrated);
  const hydrateCustomer = useCustomerStore((s) => s.hydrate);

  useEffect(() => {
    if (!customerHydrated) hydrateCustomer();
  }, [customerHydrated, hydrateCustomer]);

  // Cargar titulares y logo desde la API
  useEffect(() => {
    fetch('/api/siteconfig')
      .then((r) => r.json())
      .then((data) => {
        try {
          const items = JSON.parse(data.tickerItems || '[]');
          if (Array.isArray(items) && items.length > 0) setTickerItems(items);
        } catch { /* ignore */ }
        if (data.logo) setLogoUrl(data.logo);
      })
      .catch(() => {});
  }, []);

  const itemCount = hydrated ? cartItems.reduce((sum, i) => sum + i.quantity, 0) : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchValue);
    setView('catalog');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center gap-4 px-4 py-3">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer shrink-0"
            onClick={() => { setView('home'); setSearchQuery(''); setSearchValue(''); }}
          >
            <img src={logoUrl} alt="Díaz Premium Envíos" className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Díaz Premium</h1>
              <p className="text-[10px] text-amber-600 font-semibold tracking-wider uppercase -mt-0.5">Envíos</p>
            </div>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden sm:flex">
            <div className="relative w-full flex">
              <Input
                type="text"
                placeholder="Buscar productos..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
              />
              <Button
                type="submit"
                className="rounded-l-none bg-amber-500 hover:bg-amber-600 h-10 px-6"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Nav links */}
          <nav className="hidden lg:flex items-center gap-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setView('home'); setSearchQuery(''); setSearchValue(''); }}
              className="text-sm text-gray-700 hover:text-amber-600"
            >
              Inicio
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('catalog')}
              className="text-sm text-gray-700 hover:text-amber-600"
            >
              Productos
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('orders')}
              className="text-sm text-gray-700 hover:text-amber-600"
            >
              <History className="h-4 w-4 mr-1" />
              Mis Pedidos
            </Button>
          </nav>

          {/* Account button */}
          <Button
            variant={customer ? 'outline' : 'default'}
            size="sm"
            className={`shrink-0 h-9 ${customer
              ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm'
            }`}
            onClick={() => setView('account')}
          >
            {customer ? (
              <>
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold mr-1.5">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:inline max-w-[100px] truncate">{customer.name.split(' ')[0]}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Mi Cuenta</span>
                <User className="h-4 w-4 sm:hidden" />
              </>
            )}
          </Button>

          {/* Cart button */}
          <Button
            variant="outline"
            size="icon"
            className="relative shrink-0"
            onClick={() => {
              const event = new CustomEvent('toggleCart');
              window.dispatchEvent(event);
            }}
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-amber-500 text-white text-[10px] font-bold">
                {itemCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Mobile search */}
        <form onSubmit={handleSearch} className="sm:hidden px-4 pb-3">
          <div className="flex">
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9"
            />
            <Button type="submit" className="rounded-l-none bg-amber-500 hover:bg-amber-600 h-9 px-4">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t px-4 py-3 space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700"
              onClick={() => { setView('home'); setMobileMenuOpen(false); }}
            >
              Inicio
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700"
              onClick={() => { setView('catalog'); setMobileMenuOpen(false); }}
            >
              Productos
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700"
              onClick={() => { setView('orders'); setMobileMenuOpen(false); }}
            >
              <History className="h-4 w-4 mr-2" />
              Mis Pedidos
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start ${customer ? 'text-amber-700' : 'text-gray-700'}`}
              onClick={() => { setView('account'); setMobileMenuOpen(false); }}
            >
              {customer ? <User className="h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {customer ? `Hola, ${customer.name.split(' ')[0]}` : 'Mi Cuenta / Registrarme'}
            </Button>
          </div>
        )}
      </div>

      {/* Cinta de titulares (marquee) — animación horizontal infinita */}
      {tickerItems.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white overflow-hidden">
          <div
            className="flex whitespace-nowrap"
            style={{
              animation: 'marquee 30s linear infinite',
              willChange: 'transform',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.animationPlayState = 'paused'; }}
            onMouseLeave={(e) => { e.currentTarget.style.animationPlayState = 'running'; }}
          >
            {/* Duplicamos el contenido para que el scroll sea continuo */}
            {[0, 1].map((dup) => (
              <div key={dup} className="flex items-center shrink-0">
                {tickerItems.map((item, i) => (
                  <span key={`${dup}-${i}`} className="text-xs py-1.5 px-6 font-medium inline-flex items-center gap-1.5">
                    {item}
                    <span className="text-white/40 ml-3">·</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
