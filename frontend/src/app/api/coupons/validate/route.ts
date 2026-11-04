import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/serverStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = String(body.code || '').toUpperCase().trim();
    const subtotal = Number(body.subtotal) || 0;

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid coupon code.' },
        { status: 400 }
      );
    }

    const validation = serverStore.validateCoupon(code, subtotal);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        message: validation.message,
      });
    }

    const coupon = validation.coupon!;
    return NextResponse.json({
      success: true,
      message: validation.message,
      data: {
        code: coupon.code,
        discountAmount: validation.discountAmount,
        discount: validation.discountAmount,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue,
        description: coupon.description,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Coupon validation error' },
      { status: 500 }
    );
  }
}

