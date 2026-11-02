import { NextRequest, NextResponse } from 'next/server';
import { serverStore, parseToken } from '@/lib/serverStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const user = parseToken(authHeader);
    const body = await req.json();

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Your cart is empty. Please add items to checkout.' },
        { status: 400 }
      );
    }

    const order = serverStore.createOrder(body, user);

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully! Instant delivery in progress.',
      data: order,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Checkout failed' },
      { status: 500 }
    );
  }
}
