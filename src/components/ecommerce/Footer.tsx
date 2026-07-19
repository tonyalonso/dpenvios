'use client';

import { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, ShieldCheck, Lock, Truck, Globe } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { SocialIcon } from '@/components/ecommerce/SocialIcons';

export function Footer() {
  const { setView } = useAppStore();
  const [config, setConfig] = useState<{
    phone: string; whatsappNumber: string; storeName: string; address: string;
    tagline: string; logo: string; zelleEmail: string;
    socialLinks: string; trustBadges: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/siteconfig')
      .then((r) => r.json())
      .then((data) => {
        setConfig({
          phone: data.phone || '+5350782825',
          whatsappNumber: data.whatsappNumber || '+5350782825',
          storeName: data.storeName || 'Díaz Premium Envíos',
          address: data.address || 'Ciego de Ávila, Cuba',
          tagline: data.tagline || 'Calidad y confianza en cada envío.',
          logo: data.logo || '/logo-real.jpg',
          zelleEmail: data.zelleEmail || '',
          socialLinks: data.socialLinks || '[]',
          trustBadges: data.trustBadges || '[]',
        });
      })
      .catch(() => {});
  }, []);

  const phone = config?.phone || '+5350782825';
  const whatsapp = config?.whatsappNumber || '+5350782825';
  const whatsappUrl = `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`;
  const logo = config?.logo || '/logo-real.jpg';
  const storeName = config?.storeName || 'Díaz Premium Envíos';
  const tagline = config?.tagline || 'Calidad y confianza en cada envío.';

  const socialLinks = (() => {
    try { const p = JSON.parse(config?.socialLinks || '[]'); return Array.isArray(p) ? p.filter((s: { visible: boolean }) => s.visible) : []; } catch { return []; }
  })();

  const trustBadges = (() => {
    try { const p = JSON.parse(config?.trustBadges || '[]'); return Array.isArray(p) ? p.filter((t: { visible: boolean }) => t.visible) : []; } catch { return []; }
  })();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Columna 1: Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt={storeName} className="w-10 h-10 rounded-xl object-cover" />
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">Díaz Premium</h3>
                <p className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase -mt-0.5">Envíos</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">{tagline}</p>
            <div className="space-y-2 text-sm">
              <a href={`tel:${phone}`} className="flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors">
                <Phone className="h-4 w-4 shrink-0" /> {phone}
              </a>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.892c0 2.096.549 4.142 1.595 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.582 0 11.94-5.359 11.944-11.892a11.821 11.821 0 00-3.495-8.413z"/></svg>
                {whatsapp}
              </a>
              <p className="flex items-center gap-2 text-gray-400">
                <MapPin className="h-4 w-4 shrink-0" /> Ciego de Ávila, Cuba
              </p>
            </div>
          </div>

          {/* Columna 2: Enlaces rápidos */}
          <div>
            <h4 className="font-semibold text-white mb-4">Enlaces rápidos</h4>
            <ul className="space-y-2.5 text-sm">
              <li><button onClick={() => setView('home')} className="text-gray-400 hover:text-amber-400 transition-colors">Inicio</button></li>
              <li><button onClick={() => setView('catalog')} className="text-gray-400 hover:text-amber-400 transition-colors">Productos</button></li>
              <li><button onClick={() => setView('account')} className="text-gray-400 hover:text-amber-400 transition-colors">Mi cuenta</button></li>
              <li><button onClick={() => setView('orders')} className="text-gray-400 hover:text-amber-400 transition-colors">Mis pedidos</button></li>
              <li><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-amber-400 transition-colors">Contacto</a></li>
            </ul>
          </div>

          {/* Columna 3: Información */}
          <div>
            <h4 className="font-semibold text-white mb-4">Información</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="text-gray-400 hover:text-amber-400 cursor-pointer transition-colors">Preguntas frecuentes</li>
              <li className="text-gray-400 hover:text-amber-400 cursor-pointer transition-colors">Cómo comprar</li>
              <li className="text-gray-400 hover:text-amber-400 cursor-pointer transition-colors">Métodos de pago</li>
              <li className="text-gray-400 hover:text-amber-400 cursor-pointer transition-colors">Política de privacidad</li>
              <li className="text-gray-400 hover:text-amber-400 cursor-pointer transition-colors">Términos y condiciones</li>
            </ul>
          </div>

          {/* Columna 4: Confianza */}
          <div>
            <h4 className="font-semibold text-white mb-4">Confianza</h4>
            <div className="space-y-3">
              {trustBadges.map((badge: { icon: string; text: string }, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="text-base">{badge.icon}</span> {badge.text}
                </div>
              ))}
            </div>
            {/* Redes sociales dinámicas */}
            {socialLinks.length > 0 && (
              <div className="mt-5">
                <p className="text-xs text-gray-500 mb-2">Síguenos</p>
                <div className="flex gap-3">
                  {socialLinks.map((social: { platform: string; url: string; icon?: string }, i: number) => {
                    // El campo `icon` (select del admin) tiene prioridad sobre `platform`
                    // porque algunas redes pueden tener varios nombres (ej: "WhatsApp Business").
                    const iconName = (social.icon || social.platform || '').toLowerCase();
                    return (
                      <a
                        key={i}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-amber-500 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                        title={social.platform}
                        aria-label={social.platform}
                      >
                        <SocialIcon platform={iconName} className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Parte inferior */}
        <div className="border-t border-gray-800 mt-10 pt-6 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Díaz Premium Envíos. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
