import { NextResponse } from 'next/server';
import { catalogCategories, catalogProducts } from '@/lib/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const categories = catalogCategories
    .filter((c) => c.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((c) => ({
      ...c,
      _count: {
        products: catalogProducts.filter((p) => p.categoryId === c.id && p.isAvailable).length,
      },
    }));

  return NextResponse.json({ success: true, data: categories });
}

