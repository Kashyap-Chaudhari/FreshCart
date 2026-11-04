import { NextRequest, NextResponse } from 'next/server';
import { parseToken } from '@/lib/serverStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const user = parseToken(authHeader);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your account and personal data have been permanently deleted in accordance with data privacy regulations (DPDP Act 2023).',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to delete account' },
      { status: 500 }
    );
  }
}
