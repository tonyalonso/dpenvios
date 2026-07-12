'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cart-store';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, User, MapPin, MessageCircle, Truck, UserCheck, Calendar, Clock, Zap, Sparkles, Heart, Lock } from 'lucide-react';
import { ZoneSelector } from '@/components/ecommerce/ZoneSelector';
import { useCustomerStore } from '@/store/customer-store';

interface SiteConfigData {
  whatsappNumber: string;
  freeShippingMin: number;
  asapSurchargeType: string;
  asapSurchargeValue: number;
  normalSchedule: string;
}

interface DeliveryZone {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedTime: string;
  active: boolean;
  order: number;
  asapSurchargeOverride: boolean;
  asapSurchargeType: string;
  asapSurchargeValue: number;
}

export function CheckoutForm() {
  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);
  const setView = useAppStore((s) => s.setView);
  const { toast } = useToast();

  // Flujo: paso 1 "Quien Recibe" → (si toggle OFF) paso 2 "Quien Envía" → éxito
  const [step, setStep] = useState<'recipient' | 'sender' | 'success'>('recipient');
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [createdOrder, setCreatedOrder] = useState<{
    recipientName: string;
    recipientPhone: string;
    recipientAddress: string;
    recipientCity: string;
    items: { name: string; price: number; quantity: number }[];
    total: number;
    shippingCost: number;
    asapSurcharge: number;
    deliveryDate: string;
    deliveryTimeSlot: string;
  } | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfigData | null>(null);

  // Toggle: "Recibe la misma persona que envía" — por defecto desactivado.
  // Si está ON, se usa la data del destinatario para ambos y se omite el paso 2.
  const [samePerson, setSamePerson] = useState(false);

  // Sesión del cliente (si está logueado, autocompleta datos)
  const customer = useCustomerStore((s) => s.customer);
  const customerHydrated = useCustomerStore((s) => s.hydrated);
  const hydrateCustomer = useCustomerStore((s) => s.hydrate);
  const setSession = useCustomerStore((s) => s.setSession);
  const updateCustomer = useCustomerStore((s) => s.updateCustomer);

  // Toggle para registrar como cliente nuevo (solo si NO está logueado)
  const [registerAsCustomer, setRegisterAsCustomer] = useState(false);
  const [registerPassword, setRegisterPassword] = useState('');
  const [selectedSavedRecipientId, setSelectedSavedRecipientId] = useState<string>('');

  // Hidratar sesión del cliente al montar + refrescar perfil para tener
  // los destinatarios guardados más recientes.
  useEffect(() => {
    if (!customerHydrated) {
      hydrateCustomer();
    } else if (customer) {
      // Ya hidratado pero hay sesión: refrescar perfil para asegurar
      // que los destinatarios guardados estén actualizados.
      const token = localStorage.getItem('diaz-customer-token');
      if (token) {
        fetch('/api/customers/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.customer) {
              updateCustomer(data.customer);
            }
          })
          .catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autocompletar los datos de "Quien Envía" y "Email del destinatario (samePerson)"
  // cuando el cliente está logueado. Solo rellena si el campo está vacío
  // (no sobrescribe lo que el cliente ya haya escrito manualmente).
  useEffect(() => {
    if (!customer) return;
    setFormData((f) => ({
      ...f,
      customerName: f.customerName || customer.name,
      customerPhone: f.customerPhone || customer.phone,
      customerEmail: f.customerEmail || customer.email,
      // Si samePerson está activado, también autocompletar el email del destinatario
      recipientEmail: f.recipientEmail || (samePerson ? customer.email : ''),
    }));
  }, [customer, samePerson]);

  const [formData, setFormData] = useState({
    // Datos de quien recibe (Step 1 — siempre)
    recipientName: '',
    recipientPhone: '',
    recipientAddress: '',
    recipientCity: '',
    recipientNotes: '',
    // Email del destinatario (solo visible cuando samePerson es true)
    recipientEmail: '',
    // Datos de quien envía/pide (Step 2 — solo si samePerson es false)
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    // Fecha y horario de entrega
    deliveryDate: '',
    deliveryTimeSlot: 'normal' as 'normal' | 'asap',
  });

  // Delivery zones state
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');

  // Autocompletar TODOS los datos del destinatario cuando el cliente de Cuba
  // activa "samePerson" (misma persona recibe y pide). Usa los datos de su perfil.
  useEffect(() => {
    if (!customer || !samePerson) return;
    if (customer.country !== 'CU') return;
    setFormData((f) => ({
      ...f,
      recipientName: customer.name,
      recipientPhone: customer.phone,
      recipientAddress: customer.address || '',
      recipientEmail: customer.email,
    }));
    setSelectedZoneId(customer.deliveryZoneId || '');
  }, [customer, samePerson]);

  // Al cargar el checkout con un cliente logueado que tiene familiares guardados,
  // autocompletar por defecto con el PRIMER familiar (y su zona).
  useEffect(() => {
    if (!customer || samePerson) return;
    if (customer.savedRecipients.length === 0) return;
    const r = customer.savedRecipients[0];
    setSelectedSavedRecipientId(r.id);
    setFormData((f) => ({
      ...f,
      recipientName: r.name,
      recipientPhone: r.phone,
      recipientAddress: r.address,
      recipientNotes: r.notes,
    }));
    if (r.deliveryZoneId) {
      setSelectedZoneId(r.deliveryZoneId);
    }
    // Solo al montar — no re-ejecutar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer]);

  // Manejo inteligente del toggle: al activarse/desactivarse limpia o autocompleta.
  const handleSamePersonToggle = () => {
    const next = !samePerson;
    setSamePerson(next);

    if (next) {
      // ── ACTIVANDO: limpiar TODO y colocar los datos del cliente que pide ──
      setSelectedSavedRecipientId('');
      if (customer) {
        setFormData((f) => ({
          ...f,
          recipientName: customer.name,
          recipientPhone: customer.phone,
          recipientAddress: customer.address || '',
          recipientNotes: '',
          recipientEmail: customer.email,
        }));
        // Solo sobrescribir la zona si el cliente tiene una guardada
        if (customer.deliveryZoneId) {
          setSelectedZoneId(customer.deliveryZoneId);
        }
      } else {
        setFormData((f) => ({
          ...f,
          recipientName: '',
          recipientPhone: '',
          recipientAddress: '',
          recipientNotes: '',
          recipientEmail: '',
        }));
        // No limpiar la zona
      }
    } else {
      // ── DESACTIVANDO: limpiar TODO y colocar el primer familiar guardado ──
      setFormData((f) => ({
        ...f,
        recipientEmail: '',
        recipientNotes: '',
      }));
      if (customer && customer.savedRecipients.length > 0) {
        const r = customer.savedRecipients[0];
        setSelectedSavedRecipientId(r.id);
        setFormData((f) => ({
          ...f,
          recipientName: r.name,
          recipientPhone: r.phone,
          recipientAddress: r.address,
          recipientNotes: r.notes,
          recipientEmail: '',
        }));
        // Solo sobrescribir la zona si el destinatario tiene una guardada
        if (r.deliveryZoneId) {
          setSelectedZoneId(r.deliveryZoneId);
        }
      } else {
        setSelectedSavedRecipientId('');
        setFormData((f) => ({
          ...f,
          recipientName: '',
          recipientPhone: '',
          recipientAddress: '',
          recipientNotes: '',
          recipientEmail: '',
        }));
        // No limpiar la zona — dejar la que ya estaba seleccionada
      }
    }
  };

  // Fetch site config + delivery zones
  useEffect(() => {
    fetch('/api/siteconfig')
      .then((res) => res.json())
      .then((data) => setSiteConfig(data))
      .catch(console.error);

    fetch('/api/delivery-zones')
      .then((res) => res.json())
      .then((data: DeliveryZone[]) => {
        const sorted = (data || [])
          .filter((z) => z && z.active)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setDeliveryZones(sorted);
        if (sorted.length > 0 && !selectedZoneId) {
          setSelectedZoneId(sorted[0].id);
        }
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedZone = deliveryZones.find((z) => z.id === selectedZoneId) ?? null;

  const total = getTotal();
  // Lógica de envío:
  //  - Si el subtotal ≥ freeShippingMin → envío GRATIS (pero se requiere zona para logística).
  //  - Si no, el costo lo define el precio de la zona de delivery seleccionada.
  const freeShippingMin = siteConfig?.freeShippingMin ?? 100;
  const freeShipping = total >= freeShippingMin;
  const zonePrice = selectedZone ? Number(selectedZone.price) || 0 : 0;
  const shippingCost = freeShipping ? 0 : zonePrice;

  // Cálculo del surcharge por entrega ASAP (espeja la lógica del servidor).
  //  - Si el slot es 'normal' → 0
  //  - Si la zona tiene override → usar type/value de la zona
  //  - Si no → usar type/value global del SiteConfig
  const asapSurcharge = (() => {
    if (formData.deliveryTimeSlot !== 'asap') return 0;
    let type = 'fixed';
    let value = 0;
    if (selectedZone?.asapSurchargeOverride) {
      type = selectedZone.asapSurchargeType || 'fixed';
      value = Number(selectedZone.asapSurchargeValue) || 0;
    } else {
      type = siteConfig?.asapSurchargeType || 'fixed';
      value = Number(siteConfig?.asapSurchargeValue) || 0;
    }
    if (type === 'percent') {
      return Math.round(((total + shippingCost) * value) / 100 * 100) / 100;
    }
    return value;
  })();

  const finalTotal = total + shippingCost + asapSurcharge;

  // Texto del horario normal (configurable desde el admin)
  const normalSchedule = siteConfig?.normalSchedule || '15:00 - 18:00';

  // ── Cálculo de la fecha por defecto según la hora de Cuba ──
  //
  // Regla del negocio:
  //   - Si el cliente hace el pedido ANTES de las 14:00 (hora Cuba),
  //     la fecha de entrega por defecto es HOY (en modo Normal).
  //   - Si el cliente hace el pedido a las 14:00 o DESPUÉS, la fecha
  //     por defecto es MAÑANA (ya no da tiempo a entregar hoy).
  //   - Si elige "Lo antes posible" (ASAP / envío rápido), la fecha
  //     siempre es HOY, sin importar la hora.
  //
  // Para obtener la hora exacta de Cuba usamos Intl.DateTimeFormat con
  // timeZone: 'America/Havana'. Esto funciona independientemente de la
  // zona horaria del navegador del cliente.

  // Hora actual en Cuba (America/Havana) como objeto Date "raw" con
  // componentes ya ajustados a la zona de Cuba.
  const nowInCuba = (() => {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Havana',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const parts = fmt.formatToParts(new Date());
    const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
    const y = parseInt(get('year'));
    const m = parseInt(get('month')) - 1; // Date usa 0-11
    const d = parseInt(get('day'));
    const h = parseInt(get('hour')) % 24; // hour12:false puede dar "24" en lugar de "00"
    const min = parseInt(get('minute'));
    return { year: y, month: m, day: d, hour: h, minute: min };
  })();

  // Fecha de HOY en formato YYYY-MM-DD basada en la hora de Cuba.
  const todayStr = `${nowInCuba.year}-${String(nowInCuba.month + 1).padStart(2, '0')}-${String(nowInCuba.day).padStart(2, '0')}`;

  // ¿Es antes de las 14:00 en Cuba? Si sí, aún hay tiempo para entregar hoy.
  const canDeliverToday = nowInCuba.hour < 14;

  // Fecha de mañana en formato YYYY-MM-DD (sumar 1 día a la fecha de Cuba).
  const tomorrowDate = new Date(nowInCuba.year, nowInCuba.month, nowInCuba.day + 1);
  const tomorrowStr = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;

  // Fecha por defecto en modo Normal:
  //   - Antes de las 14:00 → hoy
  //   - 14:00 o después → mañana
  const defaultNormalDate = canDeliverToday ? todayStr : tomorrowStr;

  // ASAP implica entrega hoy: forzar la fecha a hoy y deshabilitar el date picker.
  const isAsap = formData.deliveryTimeSlot === 'asap';

  // Inicializar la fecha de entrega por defecto (si está vacía y no es ASAP).
  // - Antes de las 14:00 Cuba → hoy
  // - 14:00 o después → mañana
  useEffect(() => {
    if (!isAsap && !formData.deliveryDate) {
      setFormData((f) => ({ ...f, deliveryDate: defaultNormalDate }));
    }
  }, [isAsap, defaultNormalDate, formData.deliveryDate]);

  // Función central que envía el pedido al servidor.
  // `customerData` permite sobreescribir los datos de quien pide (caso samePerson).
  const submitOrder = async (customerData?: { name: string; email: string; phone: string }) => {
    const customerName = customerData?.name ?? formData.customerName;
    const customerEmail = customerData?.email ?? formData.customerEmail;
    const customerPhone = customerData?.phone ?? formData.customerPhone;

    setLoading(true);
    try {
      const recipientCity = selectedZone?.name ?? '';

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          recipientName: formData.recipientName,
          recipientPhone: formData.recipientPhone,
          recipientAddress: formData.recipientAddress,
          recipientCity,
          recipientNotes: formData.recipientNotes,
          deliveryDate: formData.deliveryDate || undefined,
          deliveryTimeSlot: formData.deliveryTimeSlot,
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
          deliveryZoneId: selectedZoneId || undefined,
          shippingCost,
        }),
      });

      const order = await res.json();
      if (res.ok) {
        // Si el cliente NO está logueado y activó "Registrarme como cliente",
        // registramos la cuenta después de crear el pedido (no bloquea el flujo).
        if (registerAsCustomer && !customer && customerData && registerPassword.length >= 6) {
          try {
            const regRes = await fetch('/api/customers/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: customerData.name,
                phone: customerData.phone,
                email: customerData.email,
                password: registerPassword,
              }),
            });
            if (regRes.ok) {
              const regData = await regRes.json();
              setSession(regData.customer, regData.token);
              toast({
                title: '¡Cuenta creada!',
                description: `Bienvenido/a ${regData.customer.name}. Tu perfil guardará tus próximos destinatarios.`,
              });
            } else {
              const err = await regRes.json().catch(() => ({}));
              toast({
                title: 'No se pudo registrar la cuenta',
                description: err.error || 'Tu pedido se procesó igualmente.',
                variant: 'destructive',
              });
            }
          } catch {
            /* no bloquear el éxito del pedido */
          }
        }

        // Guardar el destinatario actual en el perfil del cliente si está logueado
        // y NO es samePerson (para no duplicar el propio perfil).
        if (customer && !samePerson && formData.recipientName && formData.recipientAddress) {
          try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('diaz-customer-token') : null;
            // Solo guardar si no es un destinatario ya seleccionado de la lista
            if (token && !selectedSavedRecipientId) {
              await fetch('/api/customers/recipients', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  label: 'Destinatario reciente',
                  name: formData.recipientName,
                  phone: formData.recipientPhone,
                  address: formData.recipientAddress,
                  notes: formData.recipientNotes,
                  deliveryZoneId: selectedZoneId || null,
                }),
              });
            }
          } catch {
            /* best-effort, no bloquea el flujo */
          }
        }

        setOrderNumber(order.orderNumber);
        setCreatedOrder({
          recipientName: formData.recipientName,
          recipientPhone: formData.recipientPhone,
          recipientAddress: formData.recipientAddress,
          recipientCity,
          items: items.map((item) => ({ name: item.name, price: item.price, quantity: item.quantity })),
          total: finalTotal,
          shippingCost,
          asapSurcharge,
          deliveryDate: formData.deliveryDate,
          deliveryTimeSlot: formData.deliveryTimeSlot,
        });
        setStep('success');
        clearCart();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast({ title: 'Error', description: order.error || 'Error al procesar el pedido', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Error de conexión. Intenta de nuevo.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Paso 1 (recipient): si samePerson es true → confirma el pedido directamente;
  // si es false → pasa al paso 2 (sender).
  const handleRecipientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.recipientName || !formData.recipientPhone || !formData.recipientAddress) {
      toast({ title: 'Campos requeridos', description: 'Completa nombre, teléfono y dirección de quien recibe.', variant: 'destructive' });
      return;
    }
    if (!selectedZoneId) {
      toast({ title: 'Selecciona la zona', description: 'Debes elegir una zona de delivery para continuar.', variant: 'destructive' });
      return;
    }
    if (!formData.deliveryDate) {
      toast({ title: 'Fecha de entrega', description: 'Selecciona la fecha en que deseas recibir el pedido.', variant: 'destructive' });
      return;
    }
    // Validación de horario de Cuba: si el cliente elige entrega HOY en modo
    // Normal pero ya pasaron las 14:00, no se puede entregar hoy (sólo ASAP puede).
    if (!isAsap && formData.deliveryDate === todayStr && !canDeliverToday) {
      toast({
        title: 'Entrega hoy no disponible',
        description: 'Ya pasaron las 14:00 (hora Cuba) y no podemos entregar hoy en horario normal. Elige una fecha futura o selecciona "Lo antes posible" para entrega urgente.',
        variant: 'destructive',
      });
      return;
    }

    if (samePerson) {
      // La misma persona recibe y pide: usamos los datos del destinatario para ambos.
      if (!formData.recipientEmail) {
        toast({ title: 'Correo requerido', description: 'Ingresa tu correo electrónico para continuar.', variant: 'destructive' });
        return;
      }
      // Si activó registro, validar contraseña
      if (registerAsCustomer && !customer && registerPassword.length < 6) {
        toast({ title: 'Contraseña muy corta', description: 'Mínimo 6 caracteres para crear tu cuenta.', variant: 'destructive' });
        return;
      }
      await submitOrder({
        name: formData.recipientName,
        email: formData.recipientEmail,
        phone: formData.recipientPhone,
      });
    } else {
      // Personas diferentes: ir al paso 2 para capturar los datos de quien envía.
      setStep('sender');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Paso 2 (sender): confirma el pedido con los datos de quien envía.
  const handleSenderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone) {
      toast({ title: 'Campos requeridos', description: 'Completa nombre, teléfono y correo electrónico.', variant: 'destructive' });
      return;
    }
    // Si activó registro, validar contraseña
    if (registerAsCustomer && !customer && registerPassword.length < 6) {
      toast({ title: 'Contraseña muy corta', description: 'Mínimo 6 caracteres para crear tu cuenta.', variant: 'destructive' });
      return;
    }
    await submitOrder();
  };

  // Autocompletar desde un destinatario guardado
  const applySavedRecipient = (recipientId: string) => {
    setSelectedSavedRecipientId(recipientId);
    if (!recipientId || !customer) return;
    const r = customer.savedRecipients.find((x) => x.id === recipientId);
    if (!r) return;
    setFormData((f) => ({
      ...f,
      recipientName: r.name,
      recipientPhone: r.phone,
      recipientAddress: r.address,
      recipientNotes: r.notes,
    }));
    if (r.deliveryZoneId) setSelectedZoneId(r.deliveryZoneId);
  };

  // Build WhatsApp message
  const buildWhatsAppUrl = () => {
    if (!siteConfig?.whatsappNumber || !createdOrder) return '#';
    const phone = siteConfig.whatsappNumber.replace(/[^0-9]/g, '');
    const itemsText = createdOrder.items.map((i) => `• ${i.name} x${i.quantity} - $${(i.price * i.quantity).toFixed(2)}`).join('\n');
    const senderName = samePerson ? createdOrder.recipientName : formData.customerName;
    const senderEmail = samePerson ? formData.recipientEmail : formData.customerEmail;
    const senderPhone = samePerson ? createdOrder.recipientPhone : formData.customerPhone;
    const sameNote = samePerson ? '\n_(Misma persona recibe y pide)_' : '';
    const slotLabel = createdOrder.deliveryTimeSlot === 'asap' ? 'Lo antes posible (urgente)' : `Normal (${normalSchedule})`;
    const surchargeLine = createdOrder.asapSurcharge > 0
      ? `\nRecargo urgente: $${createdOrder.asapSurcharge.toFixed(2)}`
      : '';
    const dateLine = createdOrder.deliveryDate
      ? `\n*Entrega:* ${createdOrder.deliveryDate} · ${slotLabel}`
      : `\n*Entrega:* ${slotLabel}`;
    const message = `*NUEVO PEDIDO* ${orderNumber}\n\n*Quien Pide:*\n${senderName}\n${senderEmail}\n${senderPhone}${sameNote}\n\n*Quien Recibe:*\n${createdOrder.recipientName}\n${createdOrder.recipientPhone}\n${createdOrder.recipientAddress}, ${createdOrder.recipientCity}${dateLine}\n${formData.recipientNotes ? `Notas: ${formData.recipientNotes}\n` : ''}\n*Productos:*\n${itemsText}\n\nEnvío: $${createdOrder.shippingCost.toFixed(2)}${surchargeLine}\n*Total: $${createdOrder.total.toFixed(2)}*\n\n_Pago se gestiona externamente_`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  if (items.length === 0 && step !== 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Tu carrito está vacío</p>
        <Button variant="outline" className="mt-4" onClick={() => setView('catalog')}>
          Ver Productos
        </Button>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pedido Registrado!</h2>
        <p className="text-gray-600 mb-4">
          Tu pedido ha sido registrado exitosamente. Nos pondremos en contacto contigo para coordinar el pago y la entrega.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-500">Número de Pedido</p>
          <p className="text-xl font-bold text-amber-600">{orderNumber}</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm text-amber-800 font-medium mb-1">📌 Siguiente paso</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Envíanos tu pedido por WhatsApp para confirmar los detalles y coordinar el pago. El pago se gestiona de forma externa.
          </p>
        </div>

        {/* WhatsApp Button */}
        {siteConfig?.whatsappNumber && (
          <a
            href={buildWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-4"
          >
            <Button
              className="w-full bg-green-500 hover:bg-green-600 text-white h-12 text-base shadow-lg shadow-green-500/25"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Enviar Pedido por WhatsApp
            </Button>
          </a>
        )}

        <div className="space-y-3">
          <Button
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => setView('orders')}
          >
            Ver Mis Pedidos
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setView('home')}>
            Seguir Comprando
          </Button>
        </div>
      </div>
    );
  }

  // Orden de pasos: paso 1 = "Quien Recibe", paso 2 = "Quien Envía" (solo si samePerson es false)
  const stepIndex = step === 'recipient' ? 0 : 1;
  const stepLabels = samePerson ? ['Quien Recibe'] : ['Quien Recibe', 'Quien Envía'];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (step === 'sender') setStep('recipient');
            else setView('catalog');
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
          <p className="text-sm text-gray-500">
            Paso {stepIndex + 1} de {stepLabels.length}: {stepLabels[stepIndex]}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {stepLabels.map((label, i) => {
          const isCompleted = i < stepIndex;
          const isCurrent = i === stepIndex;
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 ${isCurrent ? 'text-amber-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isCurrent ? 'bg-amber-100 text-amber-600' : isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {isCompleted ? 'OK' : i + 1}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`flex-1 h-0.5 ${i < stepIndex ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Form */}
        <div className="md:col-span-2">
          {/* Step 1: Datos de Quien Recibe */}
          {step === 'recipient' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-amber-500" />
                  Datos de Quien Recibe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRecipientSubmit} className="space-y-4">
                  {/* Toggle: misma persona recibe y pide — ARRIBA de todo */}
                  <div className={`rounded-xl border-2 p-4 transition-all ${
                    samePerson
                      ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50'
                      : 'border-gray-200 bg-white'
                  }`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={samePerson}
                        onClick={handleSamePersonToggle}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                          samePerson ? 'bg-amber-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            samePerson ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                          <UserCheck className="h-4 w-4 text-amber-500" />
                          Recibe la misma persona que envía
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {samePerson
                            ? '✓ Datos del destinatario se usarán también para el envío. No necesitas completar el paso 2.'
                            : 'Actívalo si pides para ti mismo(a). No necesitarás completar datos de quien envía.'}
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Banner: cliente logueado + selector de destinatarios guardados */}
                  {customer && customer.savedRecipients.length > 0 && !samePerson && (
                    <div className="rounded-xl border-2 border-amber-200 bg-amber-50/40 p-3.5 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <p className="text-sm font-semibold text-gray-900">
                          ¡Hola, {customer.name.split(' ')[0]}! Autocompleta con tus destinatarios guardados:
                        </p>
                      </div>
                      <select
                        value={selectedSavedRecipientId}
                        onChange={(e) => applySavedRecipient(e.target.value)}
                        className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                      >
                        <option value="">— Elegir destinatario guardado —</option>
                        {customer.savedRecipients.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label} — {r.name}
                          </option>
                        ))}
                      </select>
                      {selectedSavedRecipientId && (
                        <p className="text-[11px] text-green-700 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Datos autocompletados. Puedes editarlos abajo si hace falta.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                    {samePerson
                      ? 'Tus datos se usarán como destinatario. Completa/verifica abajo.'
                      : 'Ingresa los datos de la persona que recibirá el pedido.'}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipientName">Nombre Completo *</Label>
                      <Input
                        id="recipientName"
                        value={formData.recipientName}
                        onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                        placeholder="María García"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipientPhone">Teléfono *</Label>
                      <Input
                        id="recipientPhone"
                        value={formData.recipientPhone}
                        onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                        placeholder="+53 5XXX XXXX"
                        required
                      />
                    </div>
                  </div>

                  {/* Email visible solo cuando samePerson es true */}
                  {samePerson && (
                    <div className="space-y-2">
                      <Label htmlFor="recipientEmail">Correo Electrónico *</Label>
                      <Input
                        id="recipientEmail"
                        type="email"
                        value={formData.recipientEmail}
                        onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                        placeholder="maria@email.com"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Lo usaremos para confirmar tu pedido.
                      </p>
                    </div>
                  )}

                  {/* Toggle: Registrarme como cliente (solo si NO está logueado) */}
                  {!customer && (
                    <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-3.5 space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={registerAsCustomer}
                          onClick={() => setRegisterAsCustomer((v) => !v)}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                            registerAsCustomer ? 'bg-amber-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              registerAsCustomer ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            Registrarme como cliente
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            Guarda tus datos para no volver a escribirlos y autocompleta tus familiares en próximos envíos.
                          </p>
                        </div>
                      </label>
                      {registerAsCustomer && (
                        <div className="space-y-2 pt-1">
                          <Label htmlFor="registerPassword" className="text-xs flex items-center gap-1.5">
                            <Lock className="h-3 w-3" /> Crea una contraseña (mínimo 6 caracteres)
                          </Label>
                          <Input
                            id="registerPassword"
                            type="password"
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            placeholder="••••••••"
                            minLength={6}
                          />
                          <p className="text-[11px] text-amber-700">
                            Crearemos tu cuenta al confirmar el pedido usando {samePerson ? 'tus datos de arriba' : 'los datos que ingreses en el siguiente paso'}.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="recipientAddress">Dirección de Entrega *</Label>
                    <Input
                      id="recipientAddress"
                      value={formData.recipientAddress}
                      onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
                      placeholder="Calle 1 Norte #45 e/ Ave. 2 y 3, Rpto. Latino"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientNotes">Notas para la Entrega</Label>
                    <Textarea
                      id="recipientNotes"
                      value={formData.recipientNotes}
                      onChange={(e) => setFormData({ ...formData, recipientNotes: e.target.value })}
                      placeholder="Ej: Casa con reja verde, frente al parque. Llamar al llegar."
                      rows={3}
                    />
                  </div>

                  {/* Selector de Zona de Delivery (combobox con buscador) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-amber-500" />
                        <Label className="text-base font-semibold">Zona de Delivery *</Label>
                      </div>
                      {freeShipping ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-[11px]">
                          🎉 Envío GRATIS aplicado
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-gray-500">
                          Envío gratis desde <span className="font-semibold text-amber-600">${freeShippingMin.toFixed(2)}</span>
                        </span>
                      )}
                    </div>

                    {deliveryZones.length === 0 ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        No hay zonas de delivery configuradas. Contacta con la tienda para continuar.
                      </div>
                    ) : (
                      <ZoneSelector
                        zones={deliveryZones}
                        value={selectedZoneId}
                        onChange={setSelectedZoneId}
                        showFreeLabel={freeShipping}
                        placeholder="Busca y selecciona tu zona…"
                      />
                    )}

                    {selectedZone && (
                      <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3 text-xs text-gray-600">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800">{selectedZone.name}</p>
                            {selectedZone.description && (
                              <p className="mt-0.5 leading-relaxed">{selectedZone.description}</p>
                            )}
                            <p className="mt-1">
                              <span className="font-medium">Entrega estimada:</span> {selectedZone.estimatedTime}
                              {!freeShipping && (
                                <>
                                  {' · '}
                                  <span className="font-medium text-amber-600">
                                    Envío: ${Number(selectedZone.price).toFixed(2)}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-gray-500">
                      Las zonas se muestran ordenadas alfabéticamente. Escribe para filtrar cuando la lista sea larga.
                    </p>
                  </div>

                  {/* Fecha y horario de entrega */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-amber-500" />
                      <Label className="text-base font-semibold">Fecha de Entrega *</Label>
                      {isAsap && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[11px] ml-auto">
                          ⚡ Entrega hoy
                        </Badge>
                      )}
                    </div>
                    <Input
                      type="date"
                      value={isAsap ? todayStr : formData.deliveryDate}
                      min={isAsap ? todayStr : (canDeliverToday ? todayStr : tomorrowStr)}
                      max={isAsap ? todayStr : undefined}
                      disabled={isAsap}
                      onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                      required
                      className={`max-w-xs ${isAsap ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                    />
                    {!isAsap && canDeliverToday && (
                      <p className="text-[11px] text-emerald-700">
                        ✅ Aún hay tiempo para entregar <strong>hoy</strong> (pedido antes de las 14:00, hora Cuba).
                      </p>
                    )}
                    {!isAsap && !canDeliverToday && (
                      <p className="text-[11px] text-gray-500">
                        🕐 Como ya pasaron las 14:00 (hora Cuba), la entrega más pronto es <strong>mañana</strong>. Para entrega urgente hoy, elige "Lo antes posible".
                      </p>
                    )}
                    {isAsap && (
                      <p className="text-[11px] text-amber-700">
                        ⚡ Al elegir "Lo antes posible", la entrega se realiza <strong>hoy mismo</strong>. No puedes seleccionar una fecha futura.
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <Clock className="h-5 w-5 text-amber-500" />
                      <Label className="text-base font-semibold">Horario de Entrega *</Label>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      {/* Opción Normal */}
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition-all ${
                          formData.deliveryTimeSlot === 'normal'
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="deliveryTimeSlot"
                          value="normal"
                          checked={formData.deliveryTimeSlot === 'normal'}
                          onChange={() => setFormData({
                            ...formData,
                            deliveryTimeSlot: 'normal',
                            // Si venía de ASAP (fecha = hoy), restaurar a la fecha
                            // por defecto del modo Normal (hoy si <14:00 Cuba, mañana si no)
                            deliveryDate: formData.deliveryDate === todayStr ? defaultNormalDate : formData.deliveryDate,
                          })}
                          className="mt-0.5 h-4 w-4 accent-amber-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-amber-500" />
                              Normal
                            </p>
                            <span className="text-[11px] text-gray-500">
                              {freeShipping ? 'Envío gratis' : 'Precio zona'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Horario: {normalSchedule}
                          </p>
                          <p className="text-[11px] text-gray-600 mt-1">
                            <span className="font-medium">Costo:</span>{' '}
                            {freeShipping ? (
                              <span className="text-green-600 font-medium">GRATIS</span>
                            ) : (
                              <span>${shippingCost.toFixed(2)}</span>
                            )}
                          </p>
                        </div>
                      </label>

                      {/* Opción ASAP */}
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition-all ${
                          formData.deliveryTimeSlot === 'asap'
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="deliveryTimeSlot"
                          value="asap"
                          checked={formData.deliveryTimeSlot === 'asap'}
                          onChange={() => setFormData({ ...formData, deliveryTimeSlot: 'asap', deliveryDate: todayStr })}
                          className="mt-0.5 h-4 w-4 accent-amber-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                              <Zap className="h-3.5 w-3.5 text-amber-500" />
                              Lo antes posible
                            </p>
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              +${asapSurcharge.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Entrega urgente hoy mismo, prioritaria
                          </p>
                          <p className="text-[11px] text-gray-600 mt-1">
                            <span className="font-medium">Recargo:</span> ${asapSurcharge.toFixed(2)}{' '}
                            <span className="text-gray-400">
                              ({(() => {
                                let type = 'fixed';
                                let value = 0;
                                if (selectedZone?.asapSurchargeOverride) {
                                  type = selectedZone.asapSurchargeType || 'fixed';
                                  value = Number(selectedZone.asapSurchargeValue) || 0;
                                } else {
                                  type = siteConfig?.asapSurchargeType || 'fixed';
                                  value = Number(siteConfig?.asapSurchargeValue) || 0;
                                }
                                return type === 'percent' ? `${value}% del pedido` : `monto fijo`;
                              })()})
                            </span>
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-12 text-base shadow-lg shadow-amber-500/25"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Procesando Pedido...
                      </>
                    ) : samePerson ? (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Confirmar Pedido — ${finalTotal.toFixed(2)}
                      </>
                    ) : (
                      <>
                        <ArrowRight className="mr-2 h-5 w-5" />
                        Continuar — Datos de Quien Envía
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Datos de Quien Envía (solo si samePerson es false) */}
          {step === 'sender' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-amber-500" />
                  Datos de Quien Envía (Pide)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSenderSubmit} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    Solo necesitamos tus datos de contacto. El pago se gestiona externamente.
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre y Apellidos *</Label>
                    <Input
                      id="name"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="Juan Pérez"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      placeholder="juan@email.com"
                      required
                    />
                  </div>

                  {/* Toggle: Registrarme como cliente (solo si NO está logueado) */}
                  {!customer && (
                    <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-3.5 space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={registerAsCustomer}
                          onClick={() => setRegisterAsCustomer((v) => !v)}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                            registerAsCustomer ? 'bg-amber-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              registerAsCustomer ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            Registrarme como cliente
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            Guarda tus datos para no volver a escribirlos y autocompleta tus familiares en próximos envíos.
                          </p>
                        </div>
                      </label>
                      {registerAsCustomer && (
                        <div className="space-y-2 pt-1">
                          <Label htmlFor="registerPassword2" className="text-xs flex items-center gap-1.5">
                            <Lock className="h-3 w-3" /> Crea una contraseña (mínimo 6 caracteres)
                          </Label>
                          <Input
                            id="registerPassword2"
                            type="password"
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            placeholder="••••••••"
                            minLength={6}
                          />
                          <p className="text-[11px] text-amber-700">
                            Crearemos tu cuenta al confirmar el pedido usando los datos de arriba.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-12 text-base shadow-lg shadow-amber-500/25"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Procesando Pedido...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Confirmar Pedido — ${finalTotal.toFixed(2)}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order summary */}
        <div>
          <Card className="sticky top-28">
            <CardHeader>
              <CardTitle className="text-lg">Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3">
                  <div className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                    <p className="text-xs text-gray-500">Cant: {item.quantity}</p>
                    <p className="text-sm font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Envío{selectedZone ? ` · ${selectedZone.name}` : ''}
                  </span>
                  <span className={freeShipping ? 'text-green-600 font-medium' : ''}>
                    {freeShipping ? 'GRATIS' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                {asapSurcharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Recargo urgente <span className="text-amber-600">⚡ ASAP</span>
                    </span>
                    <span className="text-amber-600 font-medium">
                      +${asapSurcharge.toFixed(2)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="text-amber-600">${finalTotal.toFixed(2)}</span>
                </div>
              </div>
              {step === 'sender' && formData.recipientName && (
                <>
                  <Separator />
                  <div className="text-xs text-gray-500 space-y-1">
                    <p className="font-semibold text-gray-700">Recibe: {formData.recipientName}</p>
                    {selectedZone && (
                      <p className="text-gray-500">Zona: {selectedZone.name}</p>
                    )}
                  </div>
                </>
              )}
              {step === 'recipient' && samePerson && formData.recipientName && (
                <>
                  <Separator />
                  <div className="text-xs text-gray-500 space-y-1">
                    <p className="font-semibold text-gray-700">Recibe y pide: {formData.recipientName}</p>
                    {selectedZone && (
                      <p className="text-gray-500">Zona: {selectedZone.name}</p>
                    )}
                  </div>
                </>
              )}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-center">
                <p className="text-[11px] text-blue-700 font-medium">
                  💬 Pago se gestiona externamente vía WhatsApp
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
