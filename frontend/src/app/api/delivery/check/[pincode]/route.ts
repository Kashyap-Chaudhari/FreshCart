import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { pincode: string } }
) {
  const pincode = String(params.pincode || '').trim();

  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json({
      success: true,
      data: {
        pincode,
        isDeliverable: false,
        isAvailable: false,
        message: 'Please enter a valid 6-digit Indian PIN code (e.g. 380015, 380054, 380001).',
      },
    });
  }

  // Gujarat PIN codes start with 36, 37, 38, 39
  const isGujarat =
    pincode.startsWith('36') ||
    pincode.startsWith('37') ||
    pincode.startsWith('38') ||
    pincode.startsWith('39');

  const city = pincode.startsWith('38')
    ? 'Ahmedabad'
    : pincode.startsWith('39')
    ? 'Surat'
    : pincode.startsWith('36')
    ? 'Rajkot'
    : 'Gujarat';

  const areaName = pincode.startsWith('38')
    ? 'Ahmedabad (Vastrapur / SG Highway Hub)'
    : pincode.startsWith('39')
    ? 'Surat (Athwa / Vesu Hub)'
    : pincode.startsWith('36')
    ? 'Rajkot Express Hub'
    : 'Gujarat Express Delivery Hub';

  return NextResponse.json({
    success: true,
    data: {
      pincode,
      isDeliverable: true,
      isAvailable: true,
      instantDelivery: true,
      estimatedMinutes: isGujarat ? 15 : 30,
      deliveryFee: 0,
      city,
      state: 'Gujarat',
      areaName,
      message: `Serviceable: ${areaName} - 10-15 mins express delivery`,
    },
  });
}

