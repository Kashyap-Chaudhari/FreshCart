import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/serverStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = serverStore.updateCoupon(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Coupon not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      message: 'Coupon updated successfully',
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Error updating coupon' },
      { status: 500 }
    );
  }
}

