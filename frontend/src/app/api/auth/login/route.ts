import { NextRequest, NextResponse } from 'next/server';
import { serverStore, generateToken } from '@/lib/serverStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide both email and password.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).toLowerCase().trim();
    let user = serverStore.findUserByEmail(cleanEmail);

    if (user) {
      // Validate password if user has one configured
      if (user.password && user.password !== password) {
        return NextResponse.json(
          { success: false, message: 'Invalid password. Please check your password or use demo credentials.' },
          { status: 401 }
        );
      }
    } else {
      // Real user dynamic sign-in: if user doesn't exist yet, auto-register as customer!
      // This allows ANY valid email + password to log in without getting blocked!
      const nameFromEmail = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
      const capitalized = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      user = serverStore.createUser({
        name: capitalized || 'Customer',
        email: cleanEmail,
        phone: '98' + Math.floor(10000000 + Math.random() * 90000000),
        password,
        role: 'CUSTOMER',
      });
    }

    const token = generateToken(user);

    return NextResponse.json({
      success: true,
      message: 'Logged in successfully',
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
      { success: false, message: err?.message || 'Login failed' },
      { status: 500 }
    );
  }
}
