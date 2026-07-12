import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { SavedRecipient } from '@/lib/store';
import { decodeCustomerToken, getCustomerTokenFromRequest, publicCustomer } from '@/lib/customer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/customers/recipients
 * Lista los destinatarios guardados del cliente autenticado.
 */
export async function GET(request: NextRequest) {
  try {
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

    return NextResponse.json({ recipients: customer.savedRecipients ?? [] });
  } catch (error) {
    console.error('Error fetching recipients:', error);
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 });
  }
}

/**
 * POST /api/customers/recipients
 * Agrega un nuevo destinatario al perfil del cliente.
 * Body: { label, name, phone, address, notes?, deliveryZoneId? }
 */
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const label = String(body.label ?? '').trim();
    const name = String(body.name ?? '').trim();
    const phone = String(body.phone ?? '').trim();
    const address = String(body.address ?? '').trim();
    const notes = String(body.notes ?? '').trim();
    const deliveryZoneId = body.deliveryZoneId ? String(body.deliveryZoneId) : null;

    if (!label || !name || !phone || !address) {
      return NextResponse.json(
        { error: 'Etiqueta, nombre, teléfono y dirección son obligatorios.' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const newRecipient: SavedRecipient = {
      id: `rcp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      label,
      name,
      phone,
      address,
      notes,
      deliveryZoneId,
      createdAt: now,
      updatedAt: now,
    };

    const updatedRecipients = [...(customer.savedRecipients ?? []), newRecipient];
    const updated = await db.customer.update({
      where: { id: customer.id },
      data: { savedRecipients: updatedRecipients },
    });

    return NextResponse.json({
      customer: publicCustomer(updated),
      recipient: newRecipient,
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding recipient:', error);
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 });
  }
}
