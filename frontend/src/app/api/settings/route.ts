import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      storeName: 'FreshCart Supermarket',
      storePhone: '+91 98765 43210',
      storeEmail: 'support@freshcart.com',
      storeAddress: '123 Market Road, Koramangala 4th Block, Bengaluru, Karnataka 560034',
      gstin: '29AAAAA0000A1Z5',
      fssai: '11223344556677',
      minOrderAmount: 99,
      freeShippingThreshold: 499,
      deliveryFee: 30,
      supportPhone: '+91 98765 43210',
      instantDeliveryNotice: 'Guaranteed 10-15 minute grocery delivery from nearest Dark Store',
    },
  });
}
