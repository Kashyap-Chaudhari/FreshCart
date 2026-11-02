import { NextRequest, NextResponse } from 'next/server';
import { serverStore, parseToken } from '@/lib/serverStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const user = parseToken(authHeader);

    const orders = serverStore.getOrdersForUser(user?.id, user?.phone);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page: 1,
        limit: 50,
        total: orders.length,
        totalPages: 1,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
