import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { pincode: string } }
) {
  const pincode = params.pincode;

  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json({
      success: false,
      message: 'Please enter a valid 6-digit Indian PIN code.',
    });
  }

  // Instant 15-minute quick delivery available across Gujarat & key cities
  const isExpress = pincode.startsWith('38') || pincode.startsWith('39') || pincode.startsWith('36') || pincode.startsWith('56') || pincode.startsWith('40') || pincode.startsWith('11');

  return NextResponse.json({
    success: true,
    data: {
      pincode,
      isAvailable: true,
      instantDelivery: isExpress,
      estimatedMinutes: isExpress ? 15 : 45,
      deliveryFee: 0,
      areaName: isExpress ? 'Express 15-Min Delivery Zone' : 'Standard Grocery Delivery Zone',
    },
  });
}

