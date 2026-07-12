import { db } from '@/lib/db';
import type { Customer } from '@/lib/store';
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function hashPassword(password: string): string {
  const salt = 'diaz-premium-envios-v1';
  return crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

function makeToken(customer: { id: string; email: string }): string {
  const payload = JSON.stringify({
    customerId: customer.id,
    email: customer.email,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });
  return Buffer.from(payload, 'utf-8').toString('base64');
}

function publicCustomer(c: Customer) {
  const { passwordHash, ...rest } = c;
  return rest;
}

/**
 * POST /api/customers/login
 * Body: { email, password }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Correo y contraseña son obligatorios.' },
        { status: 400 }
      );
    }

    const customer = await db.customer.findUnique({ where: { email } });
    if (!customer || customer.passwordHash !== hashPassword(password)) {
      return NextResponse.json(
        { error: 'Correo o contraseña incorrectos.' },
        { status: 401 }
      );
    }

    const token = makeToken(customer);

    return NextResponse.json({
      token,
      customer: publicCustomer(customer),
    });
  } catch (error) {
    console.error('Error logging in customer:', error);
    return NextResponse.json(
      { error: 'No se pudo iniciar sesión.' },
      { status: 500 }
    );
  }
}
