import { NextRequest, NextResponse } from 'next/server';
import { serverStore, generateToken } from '@/lib/serverStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = String(body.phone || '').replace(/\D/g, '').slice(-10);
    const otp = String(body.otp || '').trim();
    const name = body.name ? String(body.name).trim() : '';

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, message: 'Phone number and OTP code are required.' },
        { status: 400 }
      );
    }

    const verification = serverStore.verifyOtp(phone, otp);
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, message: 'Invalid OTP code. Use the demo OTP shown on screen or 123456.' },
        { status: 401 }
      );
    }

    // Look up existing user by phone or create new one
    let user = serverStore.findUserByPhone(phone);
    if (!user) {
      user = serverStore.createUser({
        name: name || 'Valued Customer',
        phone,
        role: 'CUSTOMER',
      });
    } else if (name && user.name === 'Valued Customer') {
      user.name = name;
    }

    const token = generateToken(user);

    return NextResponse.json({
      success: true,
      message: 'Phone verified successfully',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          addresses: user.addresses,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Verification failed' },
      { status: 500 }
    );
  }
}

