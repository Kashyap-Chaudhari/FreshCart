import { NextRequest, NextResponse } from 'next/server';
import { catalogProducts, catalogCategories } from '@/lib/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const skip = (page - 1) * limit;
  const category = searchParams.get('category');
  const subcategory = searchParams.get('subcategory');
  const search = searchParams.get('search');
  const inStock = searchParams.get('inStock');
  const sortBy = searchParams.get('sortBy');
  const sortOrder = searchParams.get('sortOrder');

  let filtered = catalogProducts.filter((p) => p.isAvailable);

  if (category) {
    const cat = catalogCategories.find((c) => c.slug === category);
    if (cat) filtered = filtered.filter((p) => p.categoryId === cat.id);
  }
  if (subcategory) {
    const sub = subcategory.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.subcategory?.toLowerCase() === sub ||
        p.subcategorySlug?.toLowerCase() === sub ||
        p.subcategory?.toLowerCase().includes(sub)
    );
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }
  if (inStock === 'true') {
    filtered = filtered.filter((p) => p.stockQty > 0);
  }

  if (sortBy === 'price') {
    filtered.sort((a, b) => sortOrder === 'desc' ? b.price - a.price : a.price - b.price);
  } else if (sortBy === 'name') {
    filtered.sort((a, b) => sortOrder === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name));
  }

  const total = filtered.length;
  const products = filtered.slice(skip, skip + limit).map((p) => ({
    ...p,
    category: catalogCategories.find((c) => c.id === p.categoryId) || null,
  }));

  return NextResponse.json({
    success: true,
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

