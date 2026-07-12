'use client';

import { useState, useEffect } from 'react';

interface HorarioCard {
  icon: string;
  title: string;
  description: string;
  color: string;
}

interface SiteConfigData {
  horarioSectionTitle: string;
  horarioSectionDesc: string;
  horarioCards: string;
}

const CARD_COLORS: Record<string, { bg: string; iconBg: string; border: string }> = {
  blue: { bg: 'bg-blue-50', iconBg: 'bg-blue-100', border: 'border-blue-100' },
  emerald: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', border: 'border-emerald-100' },
  purple: { bg: 'bg-purple-50', iconBg: 'bg-purple-100', border: 'border-purple-100' },
  amber: { bg: 'bg-amber-50', iconBg: 'bg-amber-100', border: 'border-amber-100' },
  rose: { bg: 'bg-rose-50', iconBg: 'bg-rose-100', border: 'border-rose-100' },
};

/** Convierte **texto** en <strong>texto</strong> para renderizar negritas. */
function renderDescription(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function HeroBanner() {
  const [config, setConfig] = useState<SiteConfigData | null>(null);

  useEffect(() => {
    fetch('/api/siteconfig')
      .then((r) => r.json())
      .then((data) => {
        setConfig({
          horarioSectionTitle: data.horarioSectionTitle || 'Pide cuando quieras, recíbelo en casa',
          horarioSectionDesc: data.horarioSectionDesc || 'Tres cosas que debes saber sobre cómo trabajamos para que tu compra llegue siempre a tiempo.',
          horarioCards: data.horarioCards || '[]',
        });
      })
      .catch(() => {});
  }, []);

  const cards: HorarioCard[] = (() => {
    if (!config) return [];
    try { return JSON.parse(config.horarioCards || '[]') as HorarioCard[]; } catch { return []; }
  })();

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-12">
        {/* ── Hero: imagen limpia ── */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl">
          <img
            src="/products/cover-real.jpg"
            alt="Diaz Premium Envíos - Envíos rápidos y seguros"
            className="w-full h-[200px] sm:h-[320px] md:h-[420px] object-cover"
          />
        </div>

        {/* ── Sección "Horario y Entregas" ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl mt-6 md:mt-8 py-8 md:py-12 border border-gray-200">
          <div className="relative max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-4">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              Horario y Entregas
            </div>
            <h2 className="text-xl md:text-4xl font-bold mb-3 leading-tight text-gray-900">
              {config?.horarioSectionTitle || 'Pide cuando quieras, recíbelo en casa'}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8 text-sm md:text-base">
              {config?.horarioSectionDesc || 'Tres cosas que debes saber sobre cómo trabajamos para que tu compra llegue siempre a tiempo.'}
            </p>
            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {cards.map((card, idx) => {
                const colorInfo = CARD_COLORS[card.color] || CARD_COLORS.amber;
                return (
                  <div
                    key={idx}
                    className={`${colorInfo.bg} rounded-2xl p-6 border ${colorInfo.border} hover:shadow-md hover:-translate-y-1 transition-all`}
                  >
                    <div className={`w-14 h-14 mx-auto ${colorInfo.iconBg} rounded-2xl flex items-center justify-center mb-3`}>
                      <span className="text-3xl" aria-hidden>{card.icon}</span>
                    </div>
                    <h3 className="font-bold text-lg leading-tight text-gray-900">{card.title}</h3>
                    <p className="text-sm text-gray-600 mt-1.5 leading-snug">
                      {renderDescription(card.description)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
