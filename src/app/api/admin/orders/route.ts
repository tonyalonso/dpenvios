import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const orders = await db.order.findMany({
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(orders);
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;
    const order = await db.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await db.orderItem.deleteMany({ where: { orderId: id } });
    await db.order.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
