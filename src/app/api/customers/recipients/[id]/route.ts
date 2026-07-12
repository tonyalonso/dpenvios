import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { SavedRecipient } from '@/lib/store';
import { decodeCustomerToken, getCustomerTokenFromRequest, publicCustomer } from '@/lib/customer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PUT /api/customers/recipients/[id]
 * Actualiza un destinatario guardado.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getCustomerTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    }
    const payload = decodeCustomerToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido o expirado.' }, { status: 401 });
    }

    const customer = await db.customer.findUnique({ where: { id: payload.customerId } });
    if (!customer) {
      return NextResponse.json({ error: 'Cuenta no encontrada.' }, { status: 404 });
    }

    const recipients = customer.savedRecipients ?? [];
    const idx = recipients.findIndex((r) => r.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Destinatario no encontrado.' }, { status: 404 });
    }

    const body = await request.json();
    const updated: SavedRecipient = {
      ...recipients[idx],
      label: body.label !== undefined ? String(body.label).trim() : recipients[idx].label,
      name: body.name !== undefined ? String(body.name).trim() : recipients[idx].name,
      phone: body.phone !== undefined ? String(body.phone).trim() : recipients[idx].phone,
      address: body.address !== undefined ? String(body.address).trim() : recipients[idx].address,
      notes: body.notes !== undefined ? String(body.notes).trim() : recipients[idx].notes,
      deliveryZoneId: body.deliveryZoneId !== undefined
        ? (body.deliveryZoneId ? String(body.deliveryZoneId) : null)
        : recipients[idx].deliveryZoneId,
      updatedAt: new Date().toISOString(),
    };

    const newRecipients = [...recipients];
    newRecipients[idx] = updated;

    const updatedCustomer = await db.customer.update({
      where: { id: customer.id },
      data: { savedRecipients: newRecipients },
    });

    return NextResponse.json({
      customer: publicCustomer(updatedCustomer),
      recipient: updated,
    });
  } catch (error) {
    console.error('Error updating recipient:', error);
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 });
  }
}

/**
 * DELETE /api/customers/recipients/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getCustomerTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    }
    const payload = decodeCustomerToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido o expirado.' }, { status: 401 });
    }

    const customer = await db.customer.findUnique({ where: { id: payload.customerId } });
    if (!customer) {
      return NextResponse.json({ error: 'Cuenta no encontrada.' }, { status: 404 });
    }

    const recipients = customer.savedRecipients ?? [];
    const newRecipients = recipients.filter((r) => r.id !== id);

    if (newRecipients.length === recipients.length) {
      return NextResponse.json({ error: 'Destinatario no encontrado.' }, { status: 404 });
    }

    const updatedCustomer = await db.customer.update({
      where: { id: customer.id },
      data: { savedRecipients: newRecipients },
    });

    return NextResponse.json({ customer: publicCustomer(updatedCustomer) });
  } catch (error) {
    console.error('Error deleting recipient:', error);
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 });
  }
}
