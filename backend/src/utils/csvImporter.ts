import { catalogCategories } from '../config/productsCatalog';
import { resolveAccurateProductImage } from './productImages';

export interface ParsedCsvProduct {
  sku: string;
  name: string;
  categoryName: string;
  subCategory?: string;
  brand?: string;
  unit: string;
  price: number;
  mrp: number;
  costPrice: number;
  taxPercent: number;
  stockQty: number;
  lowStockThreshold: number;
  isAvailable: boolean;
  images: string[];
  description?: string;
}

export function parseCsvRows(csvContent: string): string[][] {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const rows: string[][] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = i === 0 ? lines[i].replace(/^\uFEFF/, '') : lines[i];
    const tokens: string[] = [];
    let insideQuote = false;
    let current = '';

    for (const c of line) {
      if (c === '"') {
        insideQuote = !insideQuote;
      } else if (c === ',' && !insideQuote) {
        tokens.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += c;
      }
    }
    tokens.push(current.trim().replace(/^"|"$/g, ''));
    if (tokens.some((t) => t.length > 0)) {
      rows.push(tokens);
    }
  }
  return rows;
}

export function computePricingAndDefaults(name: string, unit: string, categoryName: string) {
  const c = (categoryName || '').toLowerCase();
  const n = (name || '').toLowerCase();
  const u = (unit || '').toLowerCase();

  let mult = 1.0;
  if (u.includes('10 kg') || u.includes('10kg')) mult = 10.0;
  else if (u.includes('5 kg') || u.includes('5kg') || u.includes('5 l') || u.includes('5l')) mult = 5.0;
  else if (u.includes('2 kg') || u.includes('2kg') || u.includes('2 l') || u.includes('2l')) mult = 2.0;
  else if (u.includes('1 kg') || u.includes('1kg') || u.includes('1 l') || u.includes('1l')) mult = 1.0;
  else if (u.includes('500 g') || u.includes('500g') || u.includes('500 ml') || u.includes('500ml')) mult = 0.52;
  else if (u.includes('250 g') || u.includes('250g') || u.includes('200 ml') || u.includes('250 ml')) mult = 0.28;
  else if (u.includes('100 g') || u.includes('100g') || u.includes('100 ml')) mult = 0.15;
  else if (u.includes('50 g') || u.includes('50g')) mult = 0.08;
  else if (u.includes('30 pcs') || u.includes('pack of 30')) mult = 3.2;
  else if (u.includes('12 pcs') || u.includes('pack of 12')) mult = 1.3;
  else if (u.includes('6 pcs') || u.includes('pack of 6')) mult = 0.7;

  let baseMrp = 60;
  let taxPercent = 5;

  if (c.includes('fruit') || c.includes('vegetable')) {
    taxPercent = 0;
    if (n.includes('potato')) baseMrp = 38;
    else if (n.includes('onion')) baseMrp = 48;
    else if (n.includes('tomato')) baseMrp = 40;
    else if (n.includes('apple')) baseMrp = 220;
    else if (n.includes('banana')) baseMrp = 60;
    else baseMrp = 65;
  } else if (c.includes('rice') || c.includes('flour') || c.includes('grain')) {
    taxPercent = 5;
    if (n.includes('basmati')) baseMrp = 140;
    else if (n.includes('atta')) baseMrp = 58;
    else baseMrp = 70;
  } else if (c.includes('pulse') || c.includes('dal')) {
    taxPercent = 5;
    if (n.includes('toor')) baseMrp = 190;
    else if (n.includes('moong')) baseMrp = 175;
    else baseMrp = 145;
  } else if (c.includes('dairy') || c.includes('egg')) {
    if (n.includes('milk') || n.includes('curd') || n.includes('egg')) { taxPercent = 0; baseMrp = 75; }
    else if (n.includes('butter') || n.includes('cheese')) { taxPercent = 12; baseMrp = 580; }
    else { taxPercent = 5; baseMrp = 180; }
  } else if (c.includes('snack') || c.includes('namkeen')) {
    taxPercent = n.includes('biscuit') || n.includes('cookie') ? 18 : 12;
    baseMrp = 180;
  } else if (c.includes('beverage')) {
    if (n.includes('coke') || n.includes('pepsi') || n.includes('thums')) { taxPercent = 28; baseMrp = 95; }
    else if (n.includes('tea') || n.includes('coffee')) { taxPercent = 5; baseMrp = 480; }
    else { taxPercent = 12; baseMrp = 140; }
  } else if (c.includes('cleaning') || c.includes('personal') || c.includes('household')) {
    taxPercent = 18;
    baseMrp = 200;
  }

  let rawMrp = Math.round(baseMrp * mult);
  if (rawMrp < 20) rawMrp = 20;
  if (rawMrp > 100) rawMrp = Math.round(rawMrp / 5) * 5;

  const discountRate = 0.10 + ((n.length % 5) * 0.02);
  let price = Math.round(rawMrp * (1 - discountRate));
  if (price >= rawMrp) price = rawMrp - 2;
  const costPrice = Math.round(price * 0.76);
  const stockQty = 30 + ((n.length * 9) % 70);
  const lowStockThreshold = 8 + (stockQty % 8);

  return { price, mrp: rawMrp, costPrice, taxPercent, stockQty, lowStockThreshold };
}

export function parseProductCsv(csvContent: string): ParsedCsvProduct[] {
  const rows = parseCsvRows(csvContent);
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => h.toLowerCase().trim());
  const isBrandedFormat = header.includes('brand') || header.includes('full product name');

  const products: ParsedCsvProduct[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 3) continue;

    let sku = '';
    let categoryName = '';
    let subCategory = '';
    let brand = '';
    let name = '';
    let unit = '1 unit';
    let rawPrice = '';
    let rawMrp = '';
    let rawTax = '';
    let rawStock = '';
    let rawLowStock = '';
    let availableStr = 'yes';

    if (isBrandedFormat) {
      // Header: SKU, Category, Sub-category, Brand, Product, Full Product Name, Pack Size, Price, MRP, Tax, Stock, Low Stock, Available
      sku = row[0] || '';
      categoryName = row[1] || 'Fruits & Vegetables';
      subCategory = row[2] || '';
      brand = row[3] || '';
      name = row[5] || row[4] || `${brand} ${row[4]}`.trim();
      unit = row[6] || '1 unit';
      rawPrice = row[7] || '';
      rawMrp = row[8] || '';
      rawTax = row[9] || '';
      rawStock = row[10] || '';
      rawLowStock = row[11] || '';
      availableStr = (row[12] || 'yes').toLowerCase();
    } else {
      // Header: SKU, Category, Sub-category, Product Name, Unit / Pack Size, Price, MRP, Tax, Stock, Low Stock, Available
      sku = row[0] || '';
      categoryName = row[1] || 'Fruits & Vegetables';
      subCategory = row[2] || '';
      name = row[3] || 'Grocery Item';
      unit = row[4] || '1 unit';
      rawPrice = row[5] || '';
      rawMrp = row[6] || '';
      rawTax = row[7] || '';
      rawStock = row[8] || '';
      rawLowStock = row[9] || '';
      availableStr = (row[10] || 'yes').toLowerCase();
    }

    if (!name.trim()) continue;

    const defaults = computePricingAndDefaults(name, unit, categoryName);

    const price = parseFloat(rawPrice) || defaults.price;
    const mrp = parseFloat(rawMrp) || defaults.mrp;
    const costPrice = Math.round(price * 0.76);
    const taxPercent = rawTax !== '' && !isNaN(parseFloat(rawTax)) ? parseFloat(rawTax) : defaults.taxPercent;
    const stockQty = rawStock !== '' && !isNaN(parseInt(rawStock, 10)) ? parseInt(rawStock, 10) : defaults.stockQty;
    const lowStockThreshold = rawLowStock !== '' && !isNaN(parseInt(rawLowStock, 10)) ? parseInt(rawLowStock, 10) : defaults.lowStockThreshold;
    const isAvailable = availableStr.includes('y') || availableStr === '1' || availableStr === 'true';

    // Match accurate image for specific product
    const imageUrl = resolveAccurateProductImage(name, brand, subCategory, categoryName);

    products.push({
      sku: sku || `SKU-${Date.now()}-${i}`,
      name: name.trim(),
      categoryName: categoryName.trim(),
      subCategory: subCategory.trim(),
      brand: brand.trim(),
      unit: unit.trim(),
      price,
      mrp,
      costPrice,
      taxPercent,
      stockQty,
      lowStockThreshold,
      isAvailable,
      images: [imageUrl],
      description: `${name} (${unit}). Freshly packed and delivered to your doorstep.`,
    });
  }

  return products;
}

