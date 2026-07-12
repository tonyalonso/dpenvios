'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image?: string;
  _count?: { products: number };
}

interface CategoryBarProps {
  categories: Category[];
  selectedCategory: string | null;
}

export function CategoryBar({ categories, selectedCategory }: CategoryBarProps) {
  const { selectCategory } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  /** Desplaza la barra para que el botón de la categoría seleccionada quede visible.
   *  Si está cerca del extremo izquierdo, lo alinea a la izquierda con padding.
   *  Si está cerca del extremo derecho, lo alinea a la derecha con padding.
   *  Si está en el medio, lo centra. */
  const scrollToSelected = useCallback((slug: string | null) => {
    const container = scrollRef.current;
    if (!container) return;
    // Si es "Todos" (null), ir al inicio
    if (slug === null) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }
    // Buscar el botón correspondiente al slug
    const buttons = container.querySelectorAll<HTMLButtonElement>('[data-cat-slug]');
    const target = Array.from(buttons).find((b) => b.dataset.catSlug === slug);
    if (!target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetLeft = target.offsetLeft;
    const targetWidth = target.offsetWidth;
    const containerWidth = container.clientWidth;
    const scrollLeft = container.scrollLeft;

    // ¿El botón está visible actualmente?
    const isVisible = targetRect.left >= containerRect.left && targetRect.right <= containerRect.right;

    if (isVisible) return; // Ya está visible, no hacer nada

    // Calcular la posición de scroll para que el botón quede visible
    // Si el botón está a la izquierda del viewport → alinearlo a la izquierda con padding
    // Si está a la derecha → alinearlo a la derecha con padding
    // Si está en el medio → centrarlo
    let newScrollLeft: number;
    if (targetRect.left < containerRect.left) {
      // Botón está a la izquierda (oculto por la izquierda) → alinear a la izquierda con padding 16px
      newScrollLeft = targetLeft - 16;
    } else if (targetRect.right > containerRect.right) {
      // Botón está a la derecha (oculto por la derecha) → alinear a la derecha con padding 16px
      newScrollLeft = targetLeft + targetWidth - containerWidth + 16;
    } else {
      // En el medio → centrar
      newScrollLeft = targetLeft - (containerWidth - targetWidth) / 2;
    }

    // Clamp para no salirse de los límites
    const maxScroll = container.scrollWidth - containerWidth;
    newScrollLeft = Math.max(0, Math.min(newScrollLeft, maxScroll));

    container.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    void scrollLeft;
  }, []);

  // Auto-scroll cuando cambia la categoría seleccionada
  useEffect(() => {
    // Pequeño delay para asegurar que el DOM se actualizó
    const timer = setTimeout(() => scrollToSelected(selectedCategory), 50);
    return () => clearTimeout(timer);
  }, [selectedCategory, categories, scrollToSelected]);

  /** Desplazar manualmente con las flechas. */
  const scrollByAmount = (amount: number) => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 py-2">
          {/* Botón flecha izquierda */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full text-gray-500 hover:text-amber-600 hover:bg-amber-50"
            onClick={() => scrollByAmount(-200)}
            title="Desplazar a la izquierda"
            aria-label="Desplazar a la izquierda"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Contenedor scrollable de categorías */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-x-auto scroll-smooth"
            style={{
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none', // IE/Edge
            }}
          >
            {/* Ocultar scrollbar en WebKit */}
            <style>{`
              div::-webkit-scrollbar { display: none; }
            `}</style>
            <div className="flex gap-2 py-1">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                data-cat-slug="__all__"
                className={`shrink-0 rounded-full ${
                  selectedCategory === null
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'hover:border-amber-300 hover:text-amber-600'
                }`}
                onClick={() => selectCategory(null)}
              >
                Todos
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.slug ? 'default' : 'outline'}
                  size="sm"
                  data-cat-slug={cat.slug}
                  className={`shrink-0 rounded-full ${
                    selectedCategory === cat.slug
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'hover:border-amber-300 hover:text-amber-600'
                  }`}
                  onClick={() => selectCategory(cat.slug)}
                >
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt=""
                      className="h-4 w-4 rounded-full object-cover inline-block mr-1"
                    />
                  ) : null}
                  {cat.icon && !cat.image ? `${cat.icon} ` : ''}
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Botón flecha derecha */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full text-gray-500 hover:text-amber-600 hover:bg-amber-50"
            onClick={() => scrollByAmount(200)}
            title="Desplazar a la derecha"
            aria-label="Desplazar a la derecha"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
