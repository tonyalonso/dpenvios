'use client';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo-real.jpg" alt="Díaz Premium Envíos" className="w-10 h-10 rounded-xl object-cover" />
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">Díaz Premium</h3>
                <p className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase -mt-0.5">Envíos</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              Calidad y confianza en cada envío. Tu tienda de confianza en Ciego de Ávila, Cuba.
            </p>
            <p className="text-sm text-gray-500 mt-2">📞 +5363169968</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-3">Categorías</h4>
            <ul className="space-y-2 text-sm">
              <li className="hover:text-amber-400 cursor-pointer transition-colors">🍱 Ofertas Especiales</li>
              <li className="hover:text-amber-400 cursor-pointer transition-colors">🍕 Alimentos y Repostería</li>
              <li className="hover:text-amber-400 cursor-pointer transition-colors">🍪 Confituras</li>
              <li className="hover:text-amber-400 cursor-pointer transition-colors">🍨 Lácteos y Bebidas</li>
              <li className="hover:text-amber-400 cursor-pointer transition-colors">🥩 Cárnicos y Embutidos</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Horario</h4>
            <ul className="space-y-1.5 text-sm text-gray-400">
              <li>Lunes: 15:00 - 18:00</li>
              <li>Martes: 15:00 - 18:00</li>
              <li>Miércoles: 15:00 - 18:00</li>
              <li>Jueves: 15:00 - 18:00</li>
              <li>Viernes: 15:00 - 18:00</li>
              <li>Sábado: 15:00 - 18:00</li>
              <li>Domingo: 15:00 - 18:00</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Pago Seguro</h4>
            <div className="space-y-3">
              <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-amber-400 font-bold text-sm">Z</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Zelle</p>
                  <p className="text-xs text-gray-400">Pago seguro y rápido</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Aceptamos pagos a través de Zelle para una experiencia de compra segura y sin complicaciones.
              </p>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400">📍 Ciego de Ávila, Cuba</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Díaz Premium Envíos. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="hover:text-amber-400 cursor-pointer transition-colors">Términos</span>
            <span className="hover:text-amber-400 cursor-pointer transition-colors">Privacidad</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
