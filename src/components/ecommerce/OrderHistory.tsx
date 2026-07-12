'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Package, Clock, CheckCircle2, XCircle, Truck,
  ShoppingBag, MapPin, RefreshCw, Circle,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  recipientNotes: string;
  deliveryDate: string | null;
  deliveryTimeSlot: string;
  deliveryZoneName: string | null;
  shippingCost: number;
  total: number;
  status: string;
  isPaid: boolean;
  zelleRef: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

// ════════════════════════════════════════════════════════════════════════════
// Definición de los pasos del seguimiento (timeline)
// ════════════════════════════════════════════════════════════════════════════

/** Pasos lineales del pedido (excluyendo "cancelado" que es una rama aparte). */
const TRACKING_STEPS = [
  { key: 'pending',   label: 'Pedido realizado',   icon: ShoppingBag,   description: 'Hemos recibido tu pedido' },
  { key: 'confirmed', label: 'Confirmado',          icon: CheckCircle2, description: 'El vendedor confirmó tu pedido' },
  { key: 'shipped',   label: 'En camino',           icon: Truck,         description: 'Tu pedido está en ruta' },
  { key: 'delivered', label: 'Entregado',           icon: Package,       description: 'Pedido entregado al destinatario' },
] as const;

/** Mapeo de status interno → índice del paso (para saber hasta dónde llenar el timeline). */
function statusToStepIndex(status: string): number {
  const idx = TRACKING_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

/** Estados terminales: ya no se actualizan más. */
function isTerminal(status: string): boolean {
  return status === 'delivered' || status === 'cancelled';
}

/** Info visual (color + ícono) para el badge del estado actual. */
function getStatusBadge(status: string): { label: string; color: string; icon: typeof Clock } {
  switch (status) {
    case 'pending':   return { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: Clock };
    case 'confirmed': return { label: 'Confirmado', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 };
    case 'shipped':   return { label: 'Enviado', color: 'bg-purple-100 text-purple-700', icon: Truck };
    case 'delivered': return { label: 'Entregado', color: 'bg-green-100 text-green-700', icon: CheckCircle2 };
    case 'cancelled': return { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle };
    default:          return { label: status, color: 'bg-gray-100 text-gray-700', icon: Package };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Componente: Timeline horizontal de seguimiento
// ════════════════════════════════════════════════════════════════════════════

function TrackingTimeline({ status }: { status: string }) {
  // Si el pedido fue cancelado, mostramos un estado especial.
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shrink-0 shadow-md">
          <XCircle className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-red-900">Pedido cancelado</p>
          <p className="text-xs text-red-700">Este pedido fue cancelado. Si tienes dudas, contáctanos.</p>
        </div>
      </div>
    );
  }

  const currentIndex = statusToStepIndex(status);

  return (
    <div className="p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl">
      {/* Línea de progreso horizontal (escritorio) */}
      <div className="hidden sm:block">
        <div className="relative">
          {/* Línea de fondo */}
          <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 rounded-full" />
          {/* Línea de progreso (rellena hasta el paso actual) */}
          <div
            className="absolute top-5 left-5 h-1 bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `calc((100% - 2.5rem) * ${currentIndex / (TRACKING_STEPS.length - 1)})` }}
          />
          {/* Pasos */}
          <div className="relative flex justify-between">
            {TRACKING_STEPS.map((step, idx) => {
              const isDone = idx <= currentIndex;
              const isCurrent = idx === currentIndex;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex flex-col items-center w-1/4 px-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      isDone
                        ? isCurrent
                          ? 'bg-amber-500 border-amber-500 text-white shadow-lg ring-4 ring-amber-100 scale-110'
                          : 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className={`mt-2 text-xs font-semibold text-center leading-tight ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  <p className={`mt-0.5 text-[10px] text-center leading-tight ${isCurrent ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Versión vertical (móvil) */}
      <div className="sm:hidden space-y-3">
        {TRACKING_STEPS.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const isLast = idx === TRACKING_STEPS.length - 1;
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    isDone
                      ? isCurrent
                        ? 'bg-amber-500 border-amber-500 text-white shadow-md ring-4 ring-amber-100 scale-110'
                        : 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {!isLast && (
                  <div className={`w-0.5 h-6 mt-1 ${idx < currentIndex ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                )}
              </div>
              <div className="flex-1 pb-1">
                <p className={`text-sm font-semibold ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="text-[11px] text-amber-600 font-medium">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Componente principal: OrderHistory
// ════════════════════════════════════════════════════════════════════════════

export function OrderHistory() {
  const setView = useAppStore((s) => s.setView);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  /** Marca de tiempo del último refresh exitoso (para mostrar "actualizado hace Xs"). */
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  /** Set de IDs de pedidos que NO son terminales (sobre los que hacemos polling). */
  const pollingIdsRef = useRef<Set<string>>(new Set());

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data);
      setLastRefresh(Date.now());
      // Actualizar el set de IDs para polling
      const next = new Set<string>();
      for (const o of data as Order[]) {
        if (!isTerminal(o.status)) next.add(o.id);
      }
      pollingIdsRef.current = next;
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Refresh silencioso: no muestra skeleton, sólo actualiza el estado de los pedidos
   *  que no son terminales. Se llama por polling cada N segundos. */
  const silentRefresh = useCallback(async () => {
    if (pollingIdsRef.current.size === 0) return;
    setRefreshing(true);
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) return;
      const data = await res.json() as Order[];
      setOrders(data);
      setLastRefresh(Date.now());
      // Recalcular el set de IDs para polling
      const next = new Set<string>();
      for (const o of data) {
        if (!isTerminal(o.status)) next.add(o.id);
      }
      pollingIdsRef.current = next;
    } catch {
      /* ignore */
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Polling: cada 15 segundos, refrescar el estado de los pedidos no terminales.
  useEffect(() => {
    const interval = setInterval(() => {
      silentRefresh();
    }, 15000);
    return () => clearInterval(interval);
  }, [silentRefresh]);

  /** Tiempo transcurrido desde el último refresh, formateado. */
  const refreshAgo = (() => {
    const secs = Math.floor((Date.now() - lastRefresh) / 1000);
    if (secs < 5) return 'ahora mismo';
    if (secs < 60) return `hace ${secs}s`;
    const mins = Math.floor(secs / 60);
    return `hace ${mins} min`;
  })();

  // ¿Hay pedidos activos (no terminales) que justifican el polling?
  const hasActiveOrders = orders.some((o) => !isTerminal(o.status));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setView('home')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Mis Pedidos</h1>
          <p className="text-sm text-gray-500">Rastrea y revisa tus pedidos en tiempo real</p>
        </div>
        {/* Indicador de actualización automática */}
        {hasActiveOrders && !loading && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500" title="Actualización automática cada 15 segundos">
            {refreshing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-500" />
            ) : (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
            <span className="hidden sm:inline">{refreshing ? 'Actualizando…' : `Actualizado ${refreshAgo}`}</span>
          </div>
        )}
      </div>

      {/* Indicador de pedidos activos */}
      {hasActiveOrders && !loading && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-1.5">
          <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
          Tienes pedidos en curso. Su estado se actualiza automáticamente cada 15 segundos.
        </div>
      )}

      {/* Orders list */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No tienes pedidos aún</h3>
          <p className="text-sm text-gray-500 mt-1">Haz tu primera compra y verás tus pedidos aquí</p>
          <Button
            className="mt-4 bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => setView('catalog')}
          >
            Explorar Productos
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const badge = getStatusBadge(order.status);
            const StatusIcon = badge.icon;
            const isCancelled = order.status === 'cancelled';
            return (
              <Card key={order.id} className={`overflow-hidden ${isCancelled ? 'opacity-90' : ''}`}>
                <CardHeader className="bg-gray-50 pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <CardTitle className="text-base font-mono">{order.orderNumber}</CardTitle>
                      <Badge className={badge.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {badge.label}
                      </Badge>
                      {order.isPaid && (
                        <Badge className="bg-emerald-100 text-emerald-700">✓ Pagado</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Timeline de seguimiento */}
                  <TrackingTimeline status={order.status} />

                  {/* Items */}
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">Cantidad: {item.quantity} × ${item.price.toFixed(2)}</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Datos de entrega */}
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      {order.recipientName ? (
                        <span>Recibe: <strong>{order.recipientName}</strong>{order.recipientCity ? ` — ${order.recipientCity}` : ''}</span>
                      ) : (
                        <span>Envío a: <strong>{order.customerName}</strong></span>
                      )}
                      {order.deliveryDate && (
                        <span className="ml-2 text-gray-500">· Entrega: {new Date(order.deliveryDate + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                      )}
                      {order.deliveryTimeSlot === 'asap' && (
                        <span className="ml-1 text-amber-600 font-medium">· ⚡ Lo antes posible</span>
                      )}
                      {order.deliveryZoneName && (
                        <span className="ml-1 text-gray-500">· {order.deliveryZoneName}</span>
                      )}
                      {order.zelleRef && (
                        <span className="block mt-0.5 text-gray-500">Ref Zelle: {order.zelleRef}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <span>Total: </span>
                    </div>
                    <p className="text-lg font-bold text-amber-600">${order.total.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
