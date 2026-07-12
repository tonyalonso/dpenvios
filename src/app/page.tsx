'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { useCartStore } from '@/store/cart-store';
import { Header } from '@/components/ecommerce/Header';
import { Footer } from '@/components/ecommerce/Footer';
import { HeroBanner } from '@/components/ecommerce/HeroBanner';
import { FeaturedProducts } from '@/components/ecommerce/FeaturedProducts';
import { CategoryShowcase } from '@/components/ecommerce/CategoryShowcase';
import { ProductGrid } from '@/components/ecommerce/ProductGrid';
import { ProductDetail } from '@/components/ecommerce/ProductDetail';
import { CartSidebar } from '@/components/ecommerce/CartSidebar';
import { CheckoutForm } from '@/components/ecommerce/CheckoutForm';
import { OrderHistory } from '@/components/ecommerce/OrderHistory';
import { AIAssistant } from '@/components/ecommerce/AIAssistant';
import { CustomerView } from '@/components/ecommerce/CustomerView';

function HomeView() {
  return (
    <>
      <HeroBanner />
      <FeaturedProducts />
      <CategoryShowcase />
    </>
  );
}

function AppContent() {
  const currentView = useAppStore((s) => s.currentView);

  // Rehydrate cart from localStorage after mount
  useEffect(() => {
    const rehydrate = () => {
      try {
        const saved = localStorage.getItem('diaz-premium-cart');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.state?.items) {
            useCartStore.setState({ items: parsed.state.items, _hydrated: true });
          } else {
            useCartStore.setState({ _hydrated: true });
          }
        } else {
          useCartStore.setState({ _hydrated: true });
        }
      } catch {
        useCartStore.setState({ _hydrated: true });
      }
    };
    requestAnimationFrame(rehydrate);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'catalog':
        return <ProductGrid />;
      case 'product':
        return <ProductDetail />;
      case 'checkout':
        return <CheckoutForm />;
      case 'orders':
        return <OrderHistory />;
      case 'account':
        return <CustomerView />;
      default:
        return <HomeView />;
    }
  };

  // Ocultar footer en vistas que aprovechan toda la pantalla (detalle de producto, cuenta, checkout)
  const hideFooter = currentView === 'product' || currentView === 'account' || currentView === 'checkout';

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#ffffff' }}>
      <Header />
      <main className="flex-1">
        {renderView()}
      </main>
      {!hideFooter && <Footer />}
      <CartSidebar />
      <AIAssistant />
    </div>
  );
}

export default function HomePage() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
