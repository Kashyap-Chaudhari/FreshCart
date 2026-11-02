import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/serverStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = String(body.phone || '').replace(/\D/g, '').slice(-10);

    if (!phone || phone.length !== 10) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid 10-digit mobile number.' },
        { status: 400 }
      );
    }

    // Generate real 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    serverStore.setOtp(phone, generatedOtp);

    return NextResponse.json({
      success: true,
      message: `OTP sent successfully to +91 ${phone}`,
      data: {
        phone,
        devOtp: generatedOtp, // Visible in demo mode so tester can proceed in 1 click!
        expiresInSeconds: 600,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
