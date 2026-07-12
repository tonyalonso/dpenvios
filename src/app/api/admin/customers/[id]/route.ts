import { db } from '@/lib/db';
import type { Customer } from '@/lib/store';
import { NextResponse } from 'next/server';
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
 * GET /api/admin/customers/[id]
 * Devuelve un cliente específico con todos sus datos (sin passwordHash).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await db.customer.findUnique({ where: { id } });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    return NextResponse.json(publicCustomer(customer));
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/customers/[id]
 * Actualiza un cliente. No toca el passwordHash a menos que se envíe `password`.
 * Body: { name?, phone?, email?, country?, address?, deliveryZoneId?, deliveryZoneName?, password? }
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verificar que el cliente existe
    const existing = await db.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Cliente no encontrado.' }, { status: 404 });
    }

    // Construir el payload de actualización sólo con los campos presentes
    const data: Record<string, unknown> = {};
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
    if (typeof body.phone === 'string') data.phone = body.phone.trim();
    if (typeof body.email === 'string' && body.email.trim()) {
      const newEmail = body.email.trim().toLowerCase();
      // Verificar email único si está cambiando
      if (newEmail !== existing.email) {
        const emailTaken = await db.customer.findUnique({ where: { email: newEmail } });
        if (emailTaken) {
          return NextResponse.json(
            { error: 'Ya existe otro cliente con este correo electrónico.' },
            { status: 409 }
          );
        }
      }
      data.email = newEmail;
    }
    if (typeof body.country === 'string') data.country = body.country.trim().toUpperCase();
    if (typeof body.address === 'string') data.address = body.address.trim();
    if (body.deliveryZoneId !== undefined) {
      data.deliveryZoneId = body.deliveryZoneId ? String(body.deliveryZoneId) : null;
    }
    if (typeof body.deliveryZoneName === 'string') {
      data.deliveryZoneName = body.deliveryZoneName || null;
    }
    // Si se envía password (no vacío), actualizar el hash
    if (typeof body.password === 'string' && body.password.length > 0) {
      if (body.password.length < 6) {
        return NextResponse.json(
          { error: 'La contraseña debe tener al menos 6 caracteres.' },
          { status: 400 }
        );
      }
      data.passwordHash = hashPassword(body.password);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar.' },
        { status: 400 }
      );
    }

    const customer = await db.customer.update({
      where: { id },
      data,
    });

    return NextResponse.json(publicCustomer(customer));
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'No se pudo actualizar el cliente.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/customers/[id]
 * Elimina un cliente por su ID.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verificar que existe antes de borrar
    const existing = await db.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Cliente no encontrado.' }, { status: 404 });
    }
    await db.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'No se pudo eliminar el cliente.' },
      { status: 500 }
    );
  }
}
