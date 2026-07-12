import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Auto-seed default admin if no admin exists
    const adminCount = await db.admin.count();
    if (adminCount === 0) {
      await db.admin.create({
        data: {
          username: 'admin',
          password: 'diaz2024',
          name: 'Admin',
        },
      });
    }

    // Find admin by username
    const admin = await db.admin.findUnique({
      where: { username },
    });

    if (!admin || admin.password !== password) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Generate simple token (base64 encoded JSON with expiry)
    const tokenPayload = JSON.stringify({
      adminId: admin.id,
      username: admin.username,
      exp: Date.now() + 24 * 60 * 60 * 1000,
    });
    const token = Buffer.from(tokenPayload).toString('base64');

    return NextResponse.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
      },
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
