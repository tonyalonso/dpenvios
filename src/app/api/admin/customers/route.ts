import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Customer } from '@/lib/store';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function publicCustomer(c: Customer) {
  const { passwordHash, ...rest } = c;
  return rest;
}

function hashPassword(password: string): string {
  const salt = 'diaz-premium-envios-v1';
  return crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

/**
 * GET /api/admin/customers
 * Lista todos los clientes registrados (sin passwordHash).
 */
export async function GET() {
  try {
    const customers = await db.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(customers.map(publicCustomer));
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

/**
 * POST /api/admin/customers
 * Crea un nuevo cliente desde el panel admin.
 * Body: { name, phone, email, password?, country, address?, deliveryZoneId?, deliveryZoneName? }
 * Si no se envía password, se genera una aleatoria (el admin no la verá; el cliente
 * podrá cambiarla después o usar "recuperar contraseña").
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? '').trim();
    const phone = String(body.phone ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const country = String(body.country ?? 'US').trim().toUpperCase();
    const address = String(body.address ?? '').trim();
    const deliveryZoneId = body.deliveryZoneId ? String(body.deliveryZoneId) : null;
    const deliveryZoneName = body.deliveryZoneName ? String(body.deliveryZoneName) : null;
    // Si se envía password, se usa; si no, se genera una aleatoria de 12 chars.
    const password = body.password ? String(body.password) : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

    if (!name || !phone || !email) {
      return NextResponse.json(
        { error: 'Nombre, teléfono y correo son obligatorios.' },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    // Verificar email único
    const existing = await db.customer.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con este correo electrónico.' },
        { status: 409 }
      );
    }

    const customer = await db.customer.create({
      data: {
        name,
        phone,
        email,
        passwordHash: hashPassword(password),
        country,
        address,
        deliveryZoneId,
        deliveryZoneName,
        savedRecipients: [],
      },
    });

    return NextResponse.json(publicCustomer(customer), { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'No se pudo crear el cliente.' },
      { status: 500 }
    );
  }
}
