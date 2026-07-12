import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    const where: Record<string, unknown> = {};
    if (email) {
      where.customerEmail = email;
    }

    const orders = await db.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      address,
      city,
      state,
      zipCode,
      recipientName,
      recipientPhone,
      recipientAddress,
      recipientCity,
      recipientNotes,
      deliveryZoneId,
      deliveryDate,
      deliveryTimeSlot,
      items,
      zelleRef,
      paymentProof,
    } = body;

    if (!customerName || !customerEmail || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0
    );

    // Resolver la zona de delivery seleccionada (snapshot nombre + precio)
    let zoneSnapshot: { id: string | null; name: string | null; price: number; asapOverride: boolean; asapType: string; asapValue: number } = {
      id: null,
      name: null,
      price: 0,
      asapOverride: false,
      asapType: 'fixed',
      asapValue: 0,
    };
    if (deliveryZoneId && typeof deliveryZoneId === 'string') {
      const zone = await db.deliveryZone.findUnique({ where: { id: deliveryZoneId } });
      if (zone && zone.active) {
        zoneSnapshot = {
          id: zone.id,
          name: zone.name,
          price: Number(zone.price) || 0,
          asapOverride: Boolean(zone.asapSurchargeOverride),
          asapType: String(zone.asapSurchargeType || 'fixed'),
          asapValue: Number(zone.asapSurchargeValue) || 0,
        };
      } else {
        return NextResponse.json(
          { error: 'La zona de delivery seleccionada no está disponible.' },
          { status: 400 }
        );
      }
    }

    // Costo de envío base = precio de la zona
    const shipping = zoneSnapshot.id ? zoneSnapshot.price : 0;

    // Cálculo del surcharge por entrega ASAP (fuente de verdad en el servidor).
    //  - Si deliveryTimeSlot !== 'asap' → 0
    //  - Si la zona tiene override → usar type/value de la zona
    //  - Si no → usar type/value global del SiteConfig
    let surcharge = 0;
    const slot = String(deliveryTimeSlot || 'normal').toLowerCase();
    if (slot === 'asap') {
      let surchargeType = 'fixed';
      let surchargeValue = 0;
      if (zoneSnapshot.asapOverride) {
        surchargeType = zoneSnapshot.asapType;
        surchargeValue = zoneSnapshot.asapValue;
      } else {
        const siteConfig = await db.siteConfig.findUnique({ where: { id: 'site' } });
        if (siteConfig) {
          surchargeType = String((siteConfig as { asapSurchargeType?: string }).asapSurchargeType || 'fixed');
          surchargeValue = Number((siteConfig as { asapSurchargeValue?: number }).asapSurchargeValue) || 0;
        }
      }
      if (surchargeType === 'percent') {
        // El porcentaje se aplica sobre (subtotal + envío)
        surcharge = ((subtotal + shipping) * surchargeValue) / 100;
      } else {
        surcharge = surchargeValue;
      }
      surcharge = Math.round(surcharge * 100) / 100; // redondeo a 2 decimales
    }

    const total = subtotal + shipping + surcharge;

    const orderNumber = `DPE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const order = await db.order.create({
      data: {
        orderNumber,
        customerName,
        customerEmail,
        customerPhone: customerPhone || '',
        address: address || '',
        city: city || '',
        state: state || '',
        zipCode: zipCode || '',
        recipientName: recipientName || '',
        recipientPhone: recipientPhone || '',
        recipientAddress: recipientAddress || '',
        recipientCity: recipientCity || 'Ciego de Ávila',
        recipientNotes: recipientNotes || '',
        deliveryZoneId: zoneSnapshot.id,
        deliveryZoneName: zoneSnapshot.name,
        deliveryZonePrice: zoneSnapshot.price,
        deliveryDate: typeof deliveryDate === 'string' ? deliveryDate : null,
        deliveryTimeSlot: slot,
        deliverySurcharge: surcharge,
        shippingCost: shipping,
        total,
        status: zelleRef ? 'confirmed' : 'pending',
        isPaid: false,
        zelleRef: zelleRef || null,
        paymentProof: paymentProof || null,
        items: {
          create: items.map((item: { productId: string; name: string; price: number; quantity: number; image: string }) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
        },
      },
      include: { items: true },
    });

    // Update stock for each product
    for (const item of items) {
      await db.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
