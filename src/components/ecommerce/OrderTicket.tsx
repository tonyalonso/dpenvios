'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, X, Zap, Clock, Calendar, CheckCircle2, DollarSign } from 'lucide-react';

export interface OrderTicketItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderTicketData {
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
  deliveryZoneName: string | null;
  deliveryDate: string | null;
  deliveryTimeSlot: string;
  deliverySurcharge: number;
  shippingCost: number;
  total: number;
  status: string;
  isPaid: boolean;
  items: OrderTicketItem[];
  createdAt: string;
}

interface StoreInfo {
  storeName: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  normalSchedule: string;
}

interface OrderTicketProps {
  order: OrderTicketData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTogglePaid?: (orderId: string, isPaid: boolean) => Promise<void> | void;
  store?: StoreInfo | null;
}

type PaperSize = '80mm' | 'letter';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatDeliveryDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function OrderTicket({ order, open, onOpenChange, onTogglePaid, store }: OrderTicketProps) {
  const [paperSize, setPaperSize] = useState<PaperSize>('80mm');
  const [togglingPaid, setTogglingPaid] = useState(false);

  // Reset paper size to 80mm cada vez que se abre
  useEffect(() => {
    if (open) setPaperSize('80mm');
  }, [open]);

  if (!order) return null;

  const subtotal = order.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const storeName = store?.storeName || 'Díaz Premium Envíos';
  const storePhone = store?.phone || '';
  const storeAddress = store?.address || '';
  const normalSchedule = store?.normalSchedule || '15:00 - 18:00';

  const slotLabel = order.deliveryTimeSlot === 'asap'
    ? 'Lo antes posible (urgente)'
    : `Normal (${normalSchedule})`;

  const handlePrint = () => {
    // Set the paper size attribute on <html> before printing; CSS @media print uses it.
    document.documentElement.setAttribute('data-paper-size', paperSize);
    window.print();
    // Clean up after print
    setTimeout(() => {
      document.documentElement.removeAttribute('data-paper-size');
    }, 1000);
  };

  const handleTogglePaid = async () => {
    if (!onTogglePaid) return;
    setTogglingPaid(true);
    try {
      await onTogglePaid(order.id, !order.isPaid);
    } finally {
      setTogglingPaid(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible print:p-0">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2">
            Pedido #{order.orderNumber}
          </DialogTitle>
        </DialogHeader>

        {/* Toolbar (no se imprime) */}
        <div className="flex items-center justify-between gap-3 flex-wrap print:hidden mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Tamaño:</span>
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setPaperSize('80mm')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  paperSize === '80mm' ? 'bg-amber-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                🧾 80mm
              </button>
              <button
                onClick={() => setPaperSize('letter')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  paperSize === 'letter' ? 'bg-amber-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                📄 Carta
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onTogglePaid && (
              <Button
                variant="outline"
                onClick={handleTogglePaid}
                disabled={togglingPaid}
                className={order.isPaid
                  ? 'border-green-500 text-green-700 hover:bg-green-50'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                {order.isPaid ? 'Pagado' : 'Marcar pagado'}
              </Button>
            )}
            <Button onClick={handlePrint} className="bg-amber-500 hover:bg-amber-600 text-white">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* TICKET — esto es lo único que se imprime */}
        <div
          id="printable-ticket"
          data-paper-size={paperSize}
          className="ticket-paper bg-white text-gray-900 mx-auto"
          style={{
            width: paperSize === '80mm' ? '80mm' : 'auto',
            maxWidth: paperSize === '80mm' ? '80mm' : '210mm',
            padding: paperSize === '80mm' ? '4mm 3mm' : '12mm',
            fontFamily: 'ui-monospace, "Courier New", monospace',
            fontSize: paperSize === '80mm' ? '11px' : '13px',
            lineHeight: 1.4,
          }}
        >
          {/* Header del ticket */}
          <div className="text-center mb-2 pb-2 border-b border-dashed border-gray-400">
            <div className="font-bold text-base">{storeName}</div>
            {storePhone && <div>Tel: {storePhone}</div>}
            {storeAddress && <div className="text-[10px]">{storeAddress}</div>}
          </div>

          {/* Info del pedido */}
          <div className="mb-2 pb-2 border-b border-dashed border-gray-400">
            <div className="flex justify-between">
              <span>Pedido:</span>
              <span className="font-bold">#{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Fecha:</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Estado:</span>
              <span>{STATUS_LABELS[order.status] || order.status}</span>
            </div>
            <div className="flex justify-between">
              <span>Pago:</span>
              <span className={order.isPaid ? 'font-bold' : ''}>
                {order.isPaid ? 'PAGADO ✓' : 'PENDIENTE DE PAGO'}
              </span>
            </div>
          </div>

          {/* Datos de quien envía */}
          <div className="mb-2 pb-2 border-b border-dashed border-gray-400">
            <div className="font-bold mb-1">PERSONA QUE ENVÍA:</div>
            <div>{order.customerName}</div>
            <div>{order.customerPhone}</div>
            {order.customerEmail && <div>{order.customerEmail}</div>}
          </div>

          {/* Datos de quien recibe */}
          <div className="mb-2 pb-2 border-b border-dashed border-gray-400">
            <div className="font-bold mb-1">PERSONA QUE RECIBE:</div>
            <div>{order.recipientName || '—'}</div>
            <div>{order.recipientPhone || '—'}</div>
            <div>{order.recipientAddress}{order.recipientCity ? `, ${order.recipientCity}` : ''}</div>
            {order.recipientNotes && (
              <div className="text-[10px] italic mt-1">Notas: {order.recipientNotes}</div>
            )}
          </div>

          {/* Datos de entrega */}
          <div className="mb-2 pb-2 border-b border-dashed border-gray-400">
            <div className="font-bold mb-1">ENTREGA:</div>
            <div className="flex justify-between">
              <span>Fecha:</span>
              <span>{formatDeliveryDate(order.deliveryDate)}</span>
            </div>
            <div className="flex justify-between">
              <span>Horario:</span>
              <span>{slotLabel}</span>
            </div>
            {order.deliveryZoneName && (
              <div className="flex justify-between">
                <span>Zona:</span>
                <span>{order.deliveryZoneName}</span>
              </div>
            )}
          </div>

          {/* Productos */}
          <div className="mb-2 pb-2 border-b border-dashed border-gray-400">
            <div className="font-bold mb-1">PRODUCTOS:</div>
            {order.items.map((item) => (
              <div key={item.id} className="mb-1">
                <div className="flex justify-between">
                  <span className="flex-1 truncate">
                    {item.quantity}x {item.name}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
                {paperSize === 'letter' && (
                  <div className="text-[10px] text-gray-500">
                    {item.price.toFixed(2)} c/u
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="mb-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Envío:</span>
              <span>${order.shippingCost.toFixed(2)}</span>
            </div>
            {order.deliverySurcharge > 0 && (
              <div className="flex justify-between">
                <span>Recargo urgente:</span>
                <span>+${order.deliverySurcharge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base mt-1 pt-1 border-t border-gray-400">
              <span>TOTAL:</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
            {!order.isPaid && (
              <div className="mt-2 text-center font-bold border border-gray-400 rounded p-1">
                ⚠ PENDIENTE DE PAGO
              </div>
            )}
            {order.isPaid && (
              <div className="mt-2 text-center font-bold border border-green-600 text-green-700 rounded p-1">
                ✓ PAGADO
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] mt-2 pt-2 border-t border-dashed border-gray-400">
            <div>¡Gracias por su compra!</div>
            {store?.whatsappNumber && <div>WhatsApp: {store.whatsappNumber}</div>}
          </div>
        </div>

        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
