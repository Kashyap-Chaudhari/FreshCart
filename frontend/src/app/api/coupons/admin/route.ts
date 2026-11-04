import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/serverStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.code) {
      return NextResponse.json(
        { success: false, message: 'Coupon code is required' },
        { status: 400 }
      );
    }
    const created = serverStore.createCoupon(body);
    return NextResponse.json({
      success: true,
      message: 'Coupon created successfully',
      data: created,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Error creating coupon' },
      { status: 500 }
    );
  }
}
