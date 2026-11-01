/**
 * GST Calculation, HSN Mapping, and Indian Currency Formatter Utilities
 * Designed in compliance with Section 31 and Section 34 of the CGST Act, 2017
 */

export interface BusinessGstDetails {
  legalName: string;
  tradeName: string;
  cin: string;
  gstin: string;
  pan: string;
  fssai: string;
  state: string;
  stateCode: string;
  address: string;
  city: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  bankDetails: {
    accountName: string;
    bankName: string;
    branch: string;
    accountNumber: string;
    ifscCode: string;
    upiId: string;
  };
}

export const DEFAULT_BUSINESS_GST: BusinessGstDetails = {
  legalName: 'FreshCart Supermarket Private Limited',
  tradeName: 'FreshCart Express Gujarat',
  cin: 'U52100GJ2024PTC123456',
  gstin: '24AABCF1234F1Z8',
  pan: 'AABCF1234F',
  fssai: '10722001000543',
  state: 'Gujarat',
  stateCode: '24',
  address: 'Shop 101-104, Iscon Elegance, Prahlad Nagar, S.G. Highway',
  city: 'Ahmedabad',
  pincode: '380015',
  phone: '+91 98765 43210',
  email: 'billing@freshcart.com',
  website: 'https://freshcart.com',
  bankDetails: {
    accountName: 'FreshCart Supermarket Private Limited',
    bankName: 'HDFC Bank Ltd',
    branch: 'Prahlad Nagar Branch, Ahmedabad',
    accountNumber: '50200012345678',
    ifscCode: 'HDFC0001234',
    upiId: 'freshcart@hdfcbank',
  },
};

export const STATE_CODE_MAP: Record<string, string> = {
  gujarat: '24',
  maharashtra: '27',
  rajasthan: '08',
  'madhya pradesh': '23',
  delhi: '07',
  karnataka: '29',
  tamilnadu: '33',
  'tamil nadu': '33',
  telangana: '36',
  'uttar pradesh': '09',
  'west bengal': '19',
  punjab: '03',
  haryana: '06',
  kerala: '32',
  bihar: '10',
  odisha: '21',
  'andhra pradesh': '37',
  andhrapradesh: '37',
  goa: '30',
  chhattisgarh: '22',
  jharkhand: '20',
  assam: '18',
  uttarakhand: '05',
  'himachal pradesh': '02',
};

/**
 * Maps product name and category to its accurate 4-digit or 6-digit Indian GST HSN/SAC code.
 */
export function getHsnCode(productName: string, categoryNameOrId?: string, taxPercent?: number): string {
  const name = (productName || '').toLowerCase();
  const cat = (categoryNameOrId || '').toLowerCase();

  // Fresh Vegetables (0% GST)
  if (name.includes('potato') || name.includes('aloo')) return '0701';
  if (name.includes('tomato')) return '0702';
  if (name.includes('onion') || name.includes('pyaz') || name.includes('garlic') || name.includes('lahsun')) return '0703';
  if (name.includes('cabbage') || name.includes('cauliflower') || name.includes('gobi') || name.includes('broccoli')) return '0704';
  if (name.includes('carrot') || name.includes('gajar') || name.includes('radish') || name.includes('mooli') || name.includes('beetroot')) return '0706';
  if (name.includes('chilli') || name.includes('capsicum') || name.includes('mirch') || name.includes('shimla')) return '0709';
  if (name.includes('spinach') || name.includes('palak') || name.includes('methi') || name.includes('coriander') || name.includes('mint') || name.includes('pudina')) return '0709';
  if (name.includes('bhindi') || name.includes('lady finger') || name.includes('okra') || name.includes('brinjal') || name.includes('baingan')) return '0709';
  if (name.includes('ginger') || name.includes('adrak')) return '0910';

  // Fresh Fruits (0% GST)
  if (name.includes('banana') || name.includes('kela')) return '0803';
  if (name.includes('mango') || name.includes('aam')) return '0804';
  if (name.includes('orange') || name.includes('lemon') || name.includes('nimbu') || name.includes('mosambi') || name.includes('sweet lime')) return '0805';
  if (name.includes('grape') || name.includes('angoor')) return '0806';
  if (name.includes('watermelon') || name.includes('tarbooz') || name.includes('muskmelon') || name.includes('papaya') || name.includes('papita')) return '0807';
  if (name.includes('apple') || name.includes('seb') || name.includes('pear')) return '0808';
  if (name.includes('pomegranate') || name.includes('anar') || name.includes('kiwi') || name.includes('strawberry')) return '0810';
  if (name.includes('almond') || name.includes('cashew') || name.includes('badam') || name.includes('kaju') || name.includes('raisin') || name.includes('kishmish') || name.includes('walnut')) return '0801';

  // Dairy & Eggs (0% or 5% GST)
  if (name.includes('milk') || name.includes('doodh')) return '0401';
  if (name.includes('curd') || name.includes('dahi') || name.includes('yogurt') || name.includes('buttermilk') || name.includes('chaas') || name.includes('lassi')) return '0403';
  if (name.includes('butter') || name.includes('ghee') || name.includes('makhan')) return '0405';
  if (name.includes('paneer') || name.includes('cheese')) return '0406';
  if (name.includes('egg') || name.includes('anda')) return '0407';

  // Staples, Rice, Atta, Flours & Dals
  if (name.includes('rice') || name.includes('chawal') || name.includes('basmati') || name.includes('kolam')) return '1006';
  if (name.includes('wheat') || name.includes('atta') || name.includes('flour') || name.includes('maida') || name.includes('sooji') || name.includes('suji') || name.includes('aashirvaad')) return '1101';
  if (name.includes('besan') || name.includes('sattu')) return '1102';
  if (name.includes('dal') || name.includes('daal') || name.includes('pulse') || name.includes('chana') || name.includes('moong') || name.includes('toor') || name.includes('urad') || name.includes('rajma') || name.includes('chole')) return '0713';
  if (name.includes('sugar') || name.includes('cheeni') || name.includes('jaggery') || name.includes('gur')) return '1701';
  if (name.includes('salt') || name.includes('namak')) return '2501';

  // Edible Cooking Oils
  if (name.includes('oil') || name.includes('tel') || name.includes('mustard') || name.includes('sunflower') || name.includes('groundnut') || name.includes('olive') || name.includes('fortune')) return '1515';

  // Spices & Condiments
  if (name.includes('turmeric') || name.includes('haldi') || name.includes('jeera') || name.includes('cumin') || name.includes('coriander powder') || name.includes('garam masala') || name.includes('masala') || name.includes('hing')) return '0910';
  if (name.includes('pepper') || name.includes('kali mirch')) return '0904';
  if (name.includes('cardamom') || name.includes('elaichi') || name.includes('clove') || name.includes('laung') || name.includes('cinnamon')) return '0908';

  // Tea, Coffee & Beverages
  if (name.includes('tea') || name.includes('chai') || name.includes('taj mahal') || name.includes('red label')) return '0902';
  if (name.includes('coffee') || name.includes('nescafe') || name.includes('bru')) return '0901';
  if (name.includes('juice') || name.includes('real') || name.includes('tropicana')) return '2009';
  if (name.includes('water') || name.includes('bisleri') || name.includes('kinley') || name.includes('soda') || name.includes('cola') || name.includes('pepsi') || name.includes('coke') || name.includes('sprite') || name.includes('thums up') || name.includes('energy drink')) return '2202';

  // Bakery, Snacks, Biscuits & Packaged Goods
  if (name.includes('bread') || name.includes('biscuit') || name.includes('cookie') || name.includes('rusk') || name.includes('cake') || name.includes('toast') || name.includes('parle') || name.includes('britannia') || name.includes('oreo')) return '1905';
  if (name.includes('noodle') || name.includes('pasta') || name.includes('maggi') || name.includes('vermicelli') || name.includes('yippee')) return '1902';
  if (name.includes('sauce') || name.includes('ketchup') || name.includes('mayonnaise') || name.includes('kissan')) return '2103';
  if (name.includes('namkeen') || name.includes('bhujia') || name.includes('chips') || name.includes('lays') || name.includes('kurkure') || name.includes('haldiram') || name.includes('balaji')) return '2106';
  if (name.includes('chocolate') || name.includes('cadbury') || name.includes('dairy milk') || name.includes('kitkat') || name.includes('amul dark')) return '1806';

  // Personal Care & Cleaning Supplies
  if (name.includes('soap') || name.includes('dettol') || name.includes('lifebuoy') || name.includes('dove') || name.includes('handwash')) return '3401';
  if (name.includes('shampoo') || name.includes('conditioner') || name.includes('hair oil') || name.includes('head & shoulders') || name.includes('clinic plus')) return '3305';
  if (name.includes('toothpaste') || name.includes('toothbrush') || name.includes('colgate') || name.includes('pepsodent') || name.includes('sensodyne')) return '3306';
  if (name.includes('detergent') || name.includes('surf') || name.includes('ariel') || name.includes('tide') || name.includes('dishwash') || name.includes('vim') || name.includes('pril') || name.includes('cleaner') || name.includes('harpic') || name.includes('lysol')) return '3402';
  if (name.includes('tissue') || name.includes('paper') || name.includes('wipe')) return '4818';

  // Category fallback
  if (cat.includes('fruit') || cat.includes('veg')) return '0709';
  if (cat.includes('dairy') || cat.includes('egg')) return '0401';
  if (cat.includes('staple') || cat.includes('grain')) return '1006';
  if (cat.includes('snack') || cat.includes('packaged')) return '2106';
  if (cat.includes('beverage') || cat.includes('drink')) return '2202';
  if (cat.includes('clean') || cat.includes('care')) return '3402';

  return '2106';
}

/**
 * Standard rounding to 2 decimal places.
 */
export function round2(num: number): number {
  return Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;
}

/**
 * Converts any monetary amount into Indian Currency Words.
 * e.g., 748.50 => "INR Seven Hundred Forty Eight and Fifty Paise Only"
 */
export function numberToIndianWords(num: number): string {
  if (isNaN(num) || num === 0) return 'INR Zero Only';

  const rounded = Math.round(Number(num) * 100) / 100;
  const parts = rounded.toFixed(2).split('.');
  const wholePart = parseInt(parts[0], 10);
  const decimalPart = parseInt(parts[1], 10);

  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 20) return units[n];
    const unit = n % 10;
    return `${tens[Math.floor(n / 10)]}${unit ? ' ' + units[unit] : ''}`;
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) res += `${units[hundred]} Hundred`;
    if (rest > 0) {
      if (res) res += ' ';
      res += convertTwoDigits(rest);
    }
    return res;
  }

  let n = wholePart;
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundredPart = n;

  const wordParts: string[] = [];
  if (crore > 0) wordParts.push(`${convertTwoDigits(crore)} Crore`);
  if (lakh > 0) wordParts.push(`${convertTwoDigits(lakh)} Lakh`);
  if (thousand > 0) wordParts.push(`${convertTwoDigits(thousand)} Thousand`);
  if (hundredPart > 0) wordParts.push(convertThreeDigits(hundredPart));

  let words = `INR ${wordParts.join(' ')}`;
  if (decimalPart > 0) {
    words += ` and ${convertTwoDigits(decimalPart)} Paise`;
  }
  words += ' Only';
  return words;
}

/**
 * Extracts Brand, Pack Size, and clean unit from product metadata
 */
export function extractBrandAndPackSize(
  productName: string,
  unitRaw?: string
): { brand: string; packSize: string; unitType: string; cleanName: string } {
  const KNOWN_BRANDS = [
    'Aashirvaad', 'Fortune', 'Amul', 'Tata', 'Saffola', 'Nestle', 'Cadbury', 'Britannia',
    'Parle', 'Sunfeast', 'Maggi', 'Dabur', 'Dettol', 'Surf Excel', 'Ariel', 'Tide',
    'Vim', 'Pril', 'Harpic', 'Lizol', 'Colgate', 'Pepsodent', 'Sensodyne', 'Haldiram',
    'Balaji', 'Lays', 'Kurkure', 'Bikaji', 'Real', 'Tropicana', 'Bisleri', 'Kinley',
    'Red Label', 'Taj Mahal', 'Wagh Bakri', 'Bru', 'Nescafe', 'Kissan', 'Everest',
    'MDH', 'Badshah', 'Catch', 'Eggoz', 'NECC', 'Farm Fresh', 'Mother Dairy', 'Gowardhan',
    'Patanjali', 'Kellogg\'s', 'Quaker', 'Horlicks', 'Bournvita', 'Complan', 'Dhara',
    'Gemini', 'Gulab', 'Pillsbury', 'Chambal', 'Madhur', 'Trust', 'Sundrop', 'India Gate',
    'Daawat', 'Kohinoor', 'Lal Qilla', 'Dawat'
  ];

  let brand = 'FreshCart';
  const nameTrimmed = (productName || '').trim();

  for (const b of KNOWN_BRANDS) {
    if (new RegExp(`^${b}\\b`, 'i').test(nameTrimmed)) {
      brand = b;
      break;
    }
  }

  if (brand === 'FreshCart') {
    const firstWord = nameTrimmed.split(' ')[0];
    if (firstWord && firstWord.length > 2 && /^[A-Z]/.test(firstWord)) {
      brand = firstWord;
    }
  }

  let packSize = (unitRaw || '').trim();
  if (!packSize || packSize === '1 pc' || packSize === '1 unit') {
    const match = nameTrimmed.match(/(\d+(?:\.\d+)?\s*(?:kg|g|gm|l|ltr|litre|ml|pcs|pc|pack|pack\s*size|units))/i);
    if (match) {
      packSize = match[1];
    } else {
      packSize = unitRaw || '1 pc';
    }
  }

  let unitType = 'pcs';
  if (/kg/i.test(packSize)) unitType = 'kg';
  else if (/g|gm/i.test(packSize)) unitType = 'gm';
  else if (/l|ltr|litre/i.test(packSize)) unitType = 'L';
  else if (/ml/i.test(packSize)) unitType = 'ml';
  else if (/pcs|pc/i.test(packSize)) unitType = 'pcs';
  else if (/pkt|pack/i.test(packSize)) unitType = 'pkt';

  return { brand, packSize, unitType, cleanName: nameTrimmed };
}

export interface GstLineItem {
  index: number;
  productId: string;
  productName: string;
  brand: string;
  packSize: string;
  unitType: string;
  sku: string;
  hsnCode: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  unitMrp: number;
  discount: number;
  taxPercent: number;
  grossAmount: number;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  lineTotal: number;
  isSubstituted?: boolean;
}

export interface HsnSummaryEntry {
  hsnCode: string;
  description: string;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
}

export interface GstInvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  invoiceTime: string;
  orderNumber: string;
  orderId: string;
  orderDate: string;
  supplier: BusinessGstDetails;
  customer: {
    name: string;
    phone: string;
    email?: string;
    street: string;
    landmark?: string;
    city: string;
    state: string;
    stateCode: string;
    pincode: string;
    gstin: string; // 'Unregistered Consumer' or customer GSTIN
  };
  shippingAddress: {
    name: string;
    phone: string;
    street: string;
    landmark?: string;
    city: string;
    state: string;
    stateCode: string;
    pincode: string;
  };
  placeOfSupply: string; // e.g. '24-Gujarat'
  isIntraState: boolean;
  reverseCharge: 'No';
  deliveryType: string;
  deliverySlot?: string;
  carrier?: string;
  trackingNumber?: string;
  paymentMethod: string;
  paymentStatus: string;
  isCodPending: boolean;
  amountPaid: number;
  balanceDue: number;
  items: GstLineItem[];
  hsnSummary: HsnSummaryEntry[];
  deliveryGst: {
    sacCode: string;
    description: string;
    grossAmount: number;
    taxableAmount: number;
    taxPercent: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
  };
  totals: {
    itemsGrossTotal: number;
    subtotal: number;
    discountTotal: number;
    taxableTotal: number;
    cgstTotal: number;
    sgstTotal: number;
    igstTotal: number;
    taxTotal: number;
    deliveryCharge: number;
    roundOff: number;
    grandTotal: number;
    amountPaid: number;
    balanceDue: number;
  };
  amountInWords: string;
  terms: string[];
}

/**
 * Calculates complete GST tax breakdown according to Indian GST statutes.
 */
export function calculateGstInvoice(order: any, settings: any = {}): GstInvoiceData {
  const supplier: BusinessGstDetails = {
    ...DEFAULT_BUSINESS_GST,
    ...(settings || {}),
    bankDetails: {
      ...DEFAULT_BUSINESS_GST.bankDetails,
      ...(settings?.bankDetails || {}),
    },
  };

  const address = order.shippingAddressSnapshot || {};
  const rawState = (address.state || 'Gujarat').trim();
  const normalizedState = rawState.toLowerCase();
  const customerStateCode = STATE_CODE_MAP[normalizedState] || (normalizedState.includes('gujarat') ? '24' : '24');
  const customerStateName = rawState.charAt(0).toUpperCase() + rawState.slice(1);

  // Supplier state is Gujarat (24)
  const isIntraState = customerStateCode === supplier.stateCode;
  const placeOfSupply = `${customerStateCode}-${customerStateName}`;

  let totalItemsGross = 0;
  let totalTaxableItems = 0;
  let totalCgstItems = 0;
  let totalSgstItems = 0;
  let totalIgstItems = 0;

  const hsnMap: Record<string, HsnSummaryEntry> = {};

  const processedItems: GstLineItem[] = (order.items || []).map((it: any, idx: number) => {
    const qty = Number(it.quantity) || 1;
    const unitPrice = Number(it.unitPrice) || Number(it.price) || 0;
    const mrp = Number(it.mrp) || unitPrice;
    const lineTotal = round2(unitPrice * qty);
    const taxPercent = Number(it.taxPercent) || 0;
    const hsnCode = it.hsnCode || getHsnCode(it.productName || it.name, it.categoryName, taxPercent);

    const extracted = extractBrandAndPackSize(it.productName || it.name, it.unit);
    const itemDiscount = round2(Math.max(0, mrp - unitPrice) * qty);

    // Backward-compatible calculation for tax-inclusive grocery items:
    // Taxable Amount = LineTotal / (1 + TaxPercent / 100)
    let taxableAmount = lineTotal;
    let totalTax = 0;

    if (taxPercent > 0) {
      taxableAmount = round2(lineTotal / (1 + taxPercent / 100));
      totalTax = round2(lineTotal - taxableAmount);
    }

    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;

    if (isIntraState) {
      cgstRate = round2(taxPercent / 2);
      sgstRate = round2(taxPercent / 2);
      cgstAmount = round2(totalTax / 2);
      sgstAmount = round2(totalTax - cgstAmount); // Exact split to eliminate rounding discrepancies
    } else {
      igstRate = taxPercent;
      igstAmount = totalTax;
    }

    totalItemsGross = round2(totalItemsGross + lineTotal);
    totalTaxableItems = round2(totalTaxableItems + taxableAmount);
    totalCgstItems = round2(totalCgstItems + cgstAmount);
    totalSgstItems = round2(totalSgstItems + sgstAmount);
    totalIgstItems = round2(totalIgstItems + igstAmount);

    // HSN Summary aggregation
    if (!hsnMap[hsnCode]) {
      hsnMap[hsnCode] = {
        hsnCode,
        description: it.productName || extracted.cleanName,
        taxableAmount: 0,
        cgstRate,
        cgstAmount: 0,
        sgstRate,
        sgstAmount: 0,
        igstRate,
        igstAmount: 0,
        totalTax: 0,
      };
    }
    hsnMap[hsnCode].taxableAmount = round2(hsnMap[hsnCode].taxableAmount + taxableAmount);
    hsnMap[hsnCode].cgstAmount = round2(hsnMap[hsnCode].cgstAmount + cgstAmount);
    hsnMap[hsnCode].sgstAmount = round2(hsnMap[hsnCode].sgstAmount + sgstAmount);
    hsnMap[hsnCode].igstAmount = round2(hsnMap[hsnCode].igstAmount + igstAmount);
    hsnMap[hsnCode].totalTax = round2(hsnMap[hsnCode].totalTax + totalTax);

    return {
      index: idx + 1,
      productId: it.productId || it.id,
      productName: it.productName || it.name,
      brand: extracted.brand,
      packSize: extracted.packSize,
      unitType: extracted.unitType,
      sku: it.productSku || it.sku || `SKU-${idx + 1}`,
      hsnCode,
      unit: it.unit || extracted.packSize || '1 pc',
      quantity: qty,
      unitPrice,
      unitMrp: mrp,
      discount: itemDiscount,
      taxPercent,
      grossAmount: lineTotal,
      taxableAmount,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      totalTax,
      lineTotal,
      isSubstituted: it.isSubstituted,
    };
  });

  // Delivery Charges handling (SAC: 996812 - Courier services, 18% GST standard)
  const deliveryCharge = Number(order.deliveryCharge) || 0;
  let deliveryTaxable = 0;
  let deliveryCgst = 0;
  let deliverySgst = 0;
  let deliveryIgst = 0;

  if (deliveryCharge > 0) {
    const deliveryTaxPercent = 18;
    deliveryTaxable = round2(deliveryCharge / 1.18);
    const deliveryTotalTax = round2(deliveryCharge - deliveryTaxable);

    if (isIntraState) {
      deliveryCgst = round2(deliveryTotalTax / 2);
      deliverySgst = round2(deliveryTotalTax - deliveryCgst);
    } else {
      deliveryIgst = deliveryTotalTax;
    }

    // Add delivery to HSN breakdown
    const sacCode = '996812';
    if (!hsnMap[sacCode]) {
      hsnMap[sacCode] = {
        hsnCode: sacCode,
        description: 'Courier Express Delivery Charges',
        taxableAmount: 0,
        cgstRate: isIntraState ? 9 : 0,
        cgstAmount: 0,
        sgstRate: isIntraState ? 9 : 0,
        sgstAmount: 0,
        igstRate: !isIntraState ? 18 : 0,
        igstAmount: 0,
        totalTax: 0,
      };
    }
    hsnMap[sacCode].taxableAmount = round2(hsnMap[sacCode].taxableAmount + deliveryTaxable);
    hsnMap[sacCode].cgstAmount = round2(hsnMap[sacCode].cgstAmount + deliveryCgst);
    hsnMap[sacCode].sgstAmount = round2(hsnMap[sacCode].sgstAmount + deliverySgst);
    hsnMap[sacCode].igstAmount = round2(hsnMap[sacCode].igstAmount + deliveryIgst);
    hsnMap[sacCode].totalTax = round2(hsnMap[sacCode].totalTax + deliveryTotalTax);
  }

  const discountTotal = Number(order.discountTotal) || 0;
  const taxableTotal = round2(totalTaxableItems + deliveryTaxable);
  const cgstTotal = round2(totalCgstItems + deliveryCgst);
  const sgstTotal = round2(totalSgstItems + deliverySgst);
  const igstTotal = round2(totalIgstItems + deliveryIgst);
  const taxTotal = round2(cgstTotal + sgstTotal + igstTotal);

  // Exact Grand Total matching order grandTotal
  const grandTotal = Number(order.grandTotal) || round2(Math.max(0, totalItemsGross - discountTotal + deliveryCharge));
  const amountInWords = numberToIndianWords(grandTotal);

  const isCollected = order.paymentStatus === 'COLLECTED' || String(order.status) === 'DELIVERED';
  const isCod = (order.paymentMethod || 'COD').toUpperCase() === 'COD';
  const isCodPending = isCod && !isCollected;
  const amountPaid = isCodPending ? 0 : grandTotal;
  const balanceDue = isCodPending ? grandTotal : 0;

  const customer = {
    name: order.customerName || 'Customer',
    phone: order.customerPhone || '',
    email: order.customerEmail || undefined,
    street: address.street || address.addressLine1 || '',
    landmark: address.landmark || undefined,
    city: address.city || 'Ahmedabad',
    state: customerStateName,
    stateCode: customerStateCode,
    pincode: address.pincode || order.pincode || '380015',
    gstin: order.customerGstin || 'Unregistered Consumer (B2C)',
  };

  const shippingAddress = {
    name: address.contactName || order.customerName || 'Customer',
    phone: address.contactPhone || order.customerPhone || '',
    street: address.street || address.addressLine1 || customer.street,
    landmark: address.landmark || undefined,
    city: address.city || customer.city,
    state: customerStateName,
    stateCode: customerStateCode,
    pincode: address.pincode || customer.pincode,
  };

  const rawInvoiceDate = order.invoiceDate ? new Date(order.invoiceDate) : new Date(order.createdAt || Date.now());
  const invoiceDateStr = rawInvoiceDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const invoiceTimeStr = rawInvoiceDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const orderDateStr = new Date(order.createdAt || Date.now()).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return {
    invoiceNumber: order.invoiceNumber,
    invoiceDate: invoiceDateStr,
    invoiceTime: invoiceTimeStr,
    orderNumber: order.orderNumber,
    orderId: order.id,
    orderDate: orderDateStr,
    supplier,
    customer,
    shippingAddress,
    placeOfSupply,
    isIntraState,
    reverseCharge: 'No',
    deliveryType: order.deliveryType || 'DELIVERY',
    deliverySlot: order.deliverySlot || 'Express 10-15 Mins Delivery',
    carrier: order.carrier || `${order.deliveryPersonName || 'FreshCart Fleet'} (Agent)`,
    trackingNumber: order.trackingNumber || `TRK-GJ-${order.orderNumber.replace(/\D/g, '')}`,
    paymentMethod: order.paymentMethod || 'COD',
    paymentStatus: isCodPending ? 'PENDING (Payable on Delivery)' : 'PAID',
    isCodPending,
    amountPaid,
    balanceDue,
    items: processedItems,
    hsnSummary: Object.values(hsnMap),
    deliveryGst: {
      sacCode: '996812',
      description: 'Courier Express Delivery Charges',
      grossAmount: deliveryCharge,
      taxableAmount: deliveryTaxable,
      taxPercent: 18,
      cgstAmount: deliveryCgst,
      sgstAmount: deliverySgst,
      igstAmount: deliveryIgst,
    },
    totals: {
      itemsGrossTotal: totalItemsGross,
      subtotal: Number(order.subtotal) || totalItemsGross,
      discountTotal,
      taxableTotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      taxTotal,
      deliveryCharge,
      roundOff: 0.0,
      grandTotal,
      amountPaid,
      balanceDue,
    },
    amountInWords,
    terms: [
      '1. Goods once sold can be returned/exchanged within 24 hours for fresh items and 7 days for packaged goods.',
      '2. In case of damaged or missing items, report within 2 hours of delivery with photo proof.',
      '3. All disputes are subject to Ahmedabad, Gujarat Jurisdiction only.',
      '4. Certified that the particulars given in this tax invoice are true and correct.',
    ],
  };
}
