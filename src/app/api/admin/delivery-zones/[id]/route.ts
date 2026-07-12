import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * PUT /api/admin/delivery-zones/[id]
 * Actualiza una zona de delivery existente.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};

    if (typeof body.name === 'string') {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json(
          { error: 'El nombre de la zona es obligatorio.' },
          { status: 400 }
        );
      }
      data.name = name;
    }

    if (typeof body.description === 'string') {
      data.description = body.description.trim();
    }

    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json(
          { error: 'El precio debe ser un número mayor o igual a 0.' },
          { status: 400 }
        );
      }
      data.price = price;
    }

    if (typeof body.estimatedTime === 'string') {
      data.estimatedTime = body.estimatedTime.trim() || 'Mismo día';
    }

    if (typeof body.active === 'boolean') {
      data.active = body.active;
    }

    if (body.order !== undefined) {
      const order = Number(body.order);
      if (Number.isFinite(order)) data.order = order;
    }

    if (typeof body.asapSurchargeOverride === 'boolean') {
      data.asapSurchargeOverride = body.asapSurchargeOverride;
    }

    if (typeof body.asapSurchargeType === 'string') {
      const t = body.asapSurchargeType.trim().toLowerCase();
      if (t === 'fixed' || t === 'percent') {
        data.asapSurchargeType = t;
      }
    }

    if (body.asapSurchargeValue !== undefined) {
      const v = Number(body.asapSurchargeValue);
      if (Number.isFinite(v) && v >= 0) {
        data.asapSurchargeValue = v;
      }
    }

    const zone = await db.deliveryZone.update({
      where: { id },
      data,
    });

    return NextResponse.json(zone);
  } catch (error) {
    console.error('Error updating delivery zone:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery zone' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/delivery-zones/[id]
 * Elimina una zona de delivery.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.deliveryZone.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting delivery zone:', error);
    return NextResponse.json(
      { error: 'Failed to delete delivery zone' },
      { status: 500 }
    );
  }
}
