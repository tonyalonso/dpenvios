import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const config = await db.siteConfig.findUnique({ where: { id: 'site' } });
    if (!config) {
      return NextResponse.json({ error: 'Site config not found' }, { status: 404 });
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching site config:', error);
    return NextResponse.json({ error: 'Failed to fetch site config' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    // Filter to only allow SiteConfig fields
    const allowedFields = [
      'storeName', 'tagline', 'logo', 'cover', 'phone', 'whatsappNumber', 'address',
      'zelleEmail', 'zelleName', 'primaryColor', 'freeShippingMin', 'shippingCost',
      'scheduleLunes', 'scheduleMartes', 'scheduleMiercoles', 'scheduleJueves',
      'scheduleViernes', 'scheduleSabado', 'scheduleDomingo',
      'asapSurchargeType', 'asapSurchargeValue', 'normalSchedule', 'activeCountries',
      'tickerItems', 'horarioSectionTitle', 'horarioSectionDesc', 'horarioCards',
      'socialLinks', 'trustBadges', 'socialStats', 'testimonials', 'homeBenefits',
    ];
    const data: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) data[key] = body[key];
    }
    const config = await db.siteConfig.update({
      where: { id: 'site' },
      data,
    });
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating site config:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
