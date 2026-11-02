import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = String(body.code || '').toUpperCase().trim();
    const subtotal = Number(body.subtotal) || 0;

    if (code === 'FRESH20') {
      if (subtotal < 299) {
        return NextResponse.json({
          success: false,
          message: 'FRESH20 coupon requires a minimum cart value of ₹299.',
        });
      }
      const discount = Math.min(150, Math.round(subtotal * 0.2));
      return NextResponse.json({
        success: true,
        message: 'Coupon FRESH20 applied! You saved 20%.',
        data: { code: 'FRESH20', discount, discountType: 'PERCENTAGE', discountValue: 20 },
      });
    }

    if (code === 'WELCOME50') {
      if (subtotal < 199) {
        return NextResponse.json({
          success: false,
          message: 'WELCOME50 coupon requires a minimum cart value of ₹199.',
        });
      }
      return NextResponse.json({
        success: true,
        message: 'Coupon WELCOME50 applied! Flat ₹50 off.',
        data: { code: 'WELCOME50', discount: 50, discountType: 'FLAT', discountValue: 50 },
      });
    }

    if (code === 'FLAT100') {
      if (subtotal < 699) {
        return NextResponse.json({
          success: false,
          message: 'FLAT100 coupon requires a minimum cart value of ₹699.',
        });
      }
      return NextResponse.json({
        success: true,
        message: 'Coupon FLAT100 applied! Flat ₹100 off.',
        data: { code: 'FLAT100', discount: 100, discountType: 'FLAT', discountValue: 100 },
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid coupon code. Try FRESH20, WELCOME50, or FLAT100.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Coupon validation error' },
      { status: 500 }
    );
  }
}
