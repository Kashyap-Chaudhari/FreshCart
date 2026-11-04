import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/serverStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('all') !== 'true';
    const coupons = serverStore.getCoupons(activeOnly);
    return NextResponse.json({
      success: true,
      data: coupons,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Error fetching coupons' },
      { status: 500 }
    );
  }
}

