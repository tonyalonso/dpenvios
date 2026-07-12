import type { Customer } from '@/lib/store';

export interface CustomerTokenPayload {
  customerId: string;
  email: string;
  exp: number;
}

export function decodeCustomerToken(token: string): CustomerTokenPayload | null {
  try {
    const json = Buffer.from(token, 'base64').toString('utf-8');
    const payload = JSON.parse(json) as CustomerTokenPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getCustomerTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }
  const url = new URL(req.url);
  return url.searchParams.get('token');
}

export function publicCustomer<T extends Customer>(c: T): Omit<T, 'passwordHash'> {
  const { passwordHash, ...rest } = c;
  return rest;
}
