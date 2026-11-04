import { NextResponse } from 'next/server';
import { serverStore } from '@/lib/serverStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const coupons = serverStore.getCoupons(true);
    return NextResponse.json({
      success: true,
      data: coupons,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Error fetching active coupons' },
      { status: 500 }
    );
  }
}

