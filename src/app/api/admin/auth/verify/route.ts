import { NextResponse } from 'next/server';

function decodeToken(token: string): { adminId: string; username: string; exp: number } | null {
  try {
    const json = Buffer.from(token, 'base64').toString('utf-8');
    const payload = JSON.parse(json);
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    const payload = decodeToken(token);

    if (!payload) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    return NextResponse.json({
      valid: true,
      admin: {
        adminId: payload.adminId,
        username: payload.username,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
