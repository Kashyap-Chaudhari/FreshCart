import { NextRequest, NextResponse } from 'next/server';
import { serverStore, generateToken } from '@/lib/serverStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, password } = body;

    if (!name || !phone || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, mobile number, and password are required.' },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    const cleanEmail = email ? String(email).toLowerCase().trim() : null;

    // Check existing phone
    const existingPhone = serverStore.findUserByPhone(cleanPhone);
    if (existingPhone) {
      // If user exists, update password and return session
      existingPhone.name = name.trim();
      existingPhone.password = password;
      if (cleanEmail) existingPhone.email = cleanEmail;
      const token = generateToken(existingPhone);
      return NextResponse.json({
        success: true,
        message: 'Account updated and logged in',
        data: {
          token,
          user: {
            id: existingPhone.id,
            name: existingPhone.name,
            email: existingPhone.email,
            phone: existingPhone.phone,
            role: existingPhone.role,
          },
        },
      });
    }

    const user = serverStore.createUser({
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password,
      role: 'CUSTOMER',
    });

    const token = generateToken(user);

    return NextResponse.json({
      success: true,
      message: 'Account registered successfully',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Registration failed' },
      { status: 500 }
    );
  }
}

