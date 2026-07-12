import { db } from '@/lib/db';
import type { Customer } from '@/lib/store';
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function hashPassword(password: string): string {
  // SHA-256 con salt fijo de app (suficiente para JSON store, no production-grade).
  const salt = 'diaz-premium-envios-v1';
  return crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

function makeToken(customer: { id: string; email: string }): string {
  const payload = JSON.stringify({
    customerId: customer.id,
    email: customer.email,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 días
  });
  return Buffer.from(payload, 'utf-8').toString('base64');
}

function publicCustomer(c: Customer) {
  // Nunca devolver passwordHash
  const { passwordHash, ...rest } = c;
  return rest;
}

/**
 * POST /api/customers/register
 * Body: { name, phone, email, password, country, address?, deliveryZoneId?, deliveryZoneName? }
 * - Si country === 'CU' (Cuba), address y deliveryZoneId son obligatorios.
 * - Si country !== 'CU', address y deliveryZoneId son opcionales.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? '').trim();
    const phone = String(body.phone ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const country = String(body.country ?? 'US').trim().toUpperCase();
    const address = String(body.address ?? '').trim();
    const deliveryZoneId = body.deliveryZoneId ? String(body.deliveryZoneId) : null;
    const deliveryZoneName = body.deliveryZoneName ? String(body.deliveryZoneName) : null;

    if (!name || !phone || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, teléfono, correo y contraseña son obligatorios.' },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }
    // Si es de Cuba, la dirección y zona de delivery son obligatorias
    if (country === 'CU') {
      if (!address) {
        return NextResponse.json(
          { error: 'La dirección es obligatoria para clientes en Cuba.' },
          { status: 400 }
        );
      }
      if (!deliveryZoneId) {
        return NextResponse.json(
          { error: 'Debes seleccionar tu zona de delivery.' },
          { status: 400 }
        );
      }
    }

    // Verificar email único
    const existing = await db.customer.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este correo electrónico.' },
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

    const token = makeToken(customer);

    return NextResponse.json({
      token,
      customer: publicCustomer(customer),
    }, { status: 201 });
  } catch (error) {
    console.error('Error registering customer:', error);
    return NextResponse.json(
      { error: 'No se pudo registrar la cuenta.' },
      { status: 500 }
    );
  }
}
