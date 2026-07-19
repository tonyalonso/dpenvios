import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/delivery-zones
 * Lista TODAS las zonas (activas e inactivas) para gestión admin.
 */
export async function GET() {
  try {
    const zones = await db.deliveryZone.findMany({
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(zones);
  } catch (error) {
    console.error('Error fetching delivery zones (admin):', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery zones' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/delivery-zones
 * Crea una nueva zona de delivery.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validación básica
    const name = String(body.name ?? '').trim();
    if (!name) {
      return NextResponse.json(
        { error: 'El nombre de la zona es obligatorio.' },
        { status: 400 }
      );
    }

    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un número mayor o igual a 0.' },
        { status: 400 }
      );
    }

    const zone = await db.deliveryZone.create({
      data: {
        name,
        description: String(body.description ?? '').trim(),
        price,
        estimatedTime: String(body.estimatedTime ?? 'Mismo día').trim() || 'Mismo día',
        active: body.active !== false,
        order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
        allowsPriorityDelivery: body.allowsPriorityDelivery === true,
        asapSurchargeOverride: body.asapSurchargeOverride === true,
        asapSurchargeType: body.asapSurchargeType === 'percent' ? 'percent' : 'fixed',
        asapSurchargeValue: Number.isFinite(Number(body.asapSurchargeValue)) ? Number(body.asapSurchargeValue) : 0,
      },
    });

    return NextResponse.json(zone, { status: 201 });
  } catch (error) {
    console.error('Error creating delivery zone:', error);
    return NextResponse.json(
      { error: 'Failed to create delivery zone' },
      { status: 500 }
    );
  }
}
