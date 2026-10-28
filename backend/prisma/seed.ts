import { PrismaClient, Role, DiscountType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting FreshCart database seeding...');

  // 1. STORE SETTINGS
  await prisma.storeSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeName: 'FreshCart Supermarket',
      tagLine: 'Your Daily Fresh & Reliable Grocery Store',
      logoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80',
      phone: '+91 98765 43210',
      email: 'support@freshcart.com',
      address: '123 Market Road, Koramangala 4th Block, Bengaluru, Karnataka 560034',
      mapUrl: 'https://maps.google.com/?q=12.9352,77.6245',
      openingHours: 'Mon - Sun: 7:00 AM - 10:00 PM',
      gstin: '29AAAAA0000A1Z5',
      fssai: '11223344556677',
      invoicePrefix: 'INV-',
      invoiceNextNumber: 1001,
      invoiceFooterText: 'Thank you for shopping with FreshCart! Goods once sold can be returned within 24 hours for perishable products and 7 days for packaged goods.',
      minOrderValue: 199,
      defaultDeliveryCharge: 40,
      banners: [
        {
          id: 'banner-1',
          title: 'Farm Fresh Fruits & Vegetables',
          subtitle: 'Direct from organic farmers, hand-picked daily',
          buttonText: 'Shop Produce',
          link: '/products?category=fruits-vegetables',
          badge: 'Daily Fresh',
        },
        {
          id: 'banner-2',
          title: 'Daily Essentials & Dairy Hub',
          subtitle: 'Milk, bread, butter & farm-fresh brown eggs',
          buttonText: 'Order Essentials',
          link: '/products?category=dairy-bread-eggs',
          badge: '100% Pure',
        },
        {
          id: 'banner-3',
          title: 'Staples, Atta & Premium Rice',
          subtitle: 'Use coupon FRESH15 for 15% discount on your order',
          buttonText: 'Explore Staples',
          link: '/products?category=atta-rice-dals',
          badge: 'Best Value',
        },
      ],
    },
  });
  console.log('✔ Store settings initialized');

  // 2. USERS: OWNER, STAFF, CUSTOMER
  const ownerPasswordHash = await bcrypt.hash('OwnerPass@2026', 10);
  const staffPasswordHash = await bcrypt.hash('StaffPass@2026', 10);
  const customerPasswordHash = await bcrypt.hash('CustomerPass@2026', 10);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@freshcart.com' },
    update: {},
    create: {
      name: 'Rajesh Sharma (Owner)',
      email: 'owner@freshcart.com',
      phone: '9999999999',
      passwordHash: ownerPasswordHash,
      role: Role.OWNER,
      isPhoneVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff@freshcart.com' },
    update: {},
    create: {
      name: 'Sunil Kumar (Store Staff)',
      email: 'staff@freshcart.com',
      phone: '8888888888',
      passwordHash: staffPasswordHash,
      role: Role.STAFF,
      isPhoneVerified: true,
    },
  });

  const sampleCustomer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      name: 'Priya Patel',
      email: 'customer@example.com',
      phone: '9876543210',
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
      isPhoneVerified: true,
      addresses: {
        create: [
          {
            label: 'Home',
            street: 'Flat 402, Green View Apartments, 8th Main, 4th Block',
            landmark: 'Near Sony World Signal',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560034',
            contactName: 'Priya Patel',
            contactPhone: '9876543210',
            isDefault: true,
          },
        ],
      },
    },
  });
  console.log('✔ Owner, Staff, and Customer users seeded');

  // 3. DELIVERY AREAS
  const deliveryAreas = [
    { pincode: '560034', areaName: 'Koramangala (Blocks 1-8)', city: 'Bengaluru', state: 'Karnataka', minOrderValue: 149, deliveryCharge: 30, freeDeliveryAbove: 499, estimatedDeliveryHours: 2 },
    { pincode: '560095', areaName: 'Koramangala Ejipura / National Games Village', city: 'Bengaluru', state: 'Karnataka', minOrderValue: 199, deliveryCharge: 35, freeDeliveryAbove: 599, estimatedDeliveryHours: 2 },
    { pincode: '560102', areaName: 'HSR Layout (Sectors 1-7)', city: 'Bengaluru', state: 'Karnataka', minOrderValue: 199, deliveryCharge: 40, freeDeliveryAbove: 599, estimatedDeliveryHours: 3 },
    { pincode: '560001', areaName: 'MG Road / Brigade Road / Shivajinagar', city: 'Bengaluru', state: 'Karnataka', minOrderValue: 299, deliveryCharge: 50, freeDeliveryAbove: 799, estimatedDeliveryHours: 3 },
    { pincode: '560037', areaName: 'Marathahalli & Outer Ring Road', city: 'Bengaluru', state: 'Karnataka', minOrderValue: 249, deliveryCharge: 45, freeDeliveryAbove: 699, estimatedDeliveryHours: 4 },
  ];

  for (const area of deliveryAreas) {
    await prisma.deliveryArea.upsert({
      where: { pincode: area.pincode },
      update: area,
      create: area,
    });
  }
  console.log('✔ Delivery areas seeded');

  // 4. COUPONS
  const coupons = [
    {
      code: 'FRESH15',
      description: 'Get 15% OFF on minimum order of ₹399 (up to ₹150 discount)',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 15,
      minOrderValue: 399,
      maxDiscount: 150,
      validFrom: new Date('2026-01-01'),
      validTo: new Date('2027-12-31'),
      usageLimit: 500,
    },
    {
      code: 'FLAT50',
      description: 'Flat ₹50 OFF on orders above ₹299',
      discountType: DiscountType.FLAT,
      discountValue: 50,
      minOrderValue: 299,
      validFrom: new Date('2026-01-01'),
      validTo: new Date('2027-12-31'),
      usageLimit: 1000,
    },
    {
      code: 'WELCOME100',
      description: '₹100 OFF on mega grocery basket above ₹999',
      discountType: DiscountType.FLAT,
      discountValue: 100,
      minOrderValue: 999,
      validFrom: new Date('2026-01-01'),
      validTo: new Date('2027-12-31'),
      usageLimit: 300,
    },
  ];

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: coupon,
      create: coupon,
    });
  }
  console.log('✔ Coupons seeded');

  // 5. CATEGORIES
  const categoriesData = [
    { name: 'Fruits & Vegetables', slug: 'fruits-vegetables', description: 'Fresh seasonal fruits, greens, and vegetables', imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80', displayOrder: 1 },
    { name: 'Dairy, Bread & Eggs', slug: 'dairy-bread-eggs', description: 'Milk, butter, paneer, artisanal breads and organic eggs', imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80', displayOrder: 2 },
    { name: 'Atta, Rice & Dals', slug: 'atta-rice-dals', description: 'Premium grains, whole wheat flour, basmati and organic pulses', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80', displayOrder: 3 },
    { name: 'Oils, Ghee & Masalas', slug: 'oils-ghee-masalas', description: 'Cold-pressed oils, pure cow ghee, whole and ground spices', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80', displayOrder: 4 },
    { name: 'Snacks & Biscuits', slug: 'snacks-biscuits', description: 'Crispy namkeens, healthy cookies, chips and wafers', imageUrl: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=400&q=80', displayOrder: 5 },
    { name: 'Cold Drinks & Juices', slug: 'cold-drinks-juices', description: 'Fresh natural juices, coconut water, tea, coffee and soda', imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80', displayOrder: 6 },
    { name: 'Cleaning & Household', slug: 'cleaning-household', description: 'Dishwashing liquids, detergents, paper towels and cleaners', imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=400&q=80', displayOrder: 7 },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categoryMap.set(cat.slug, createdCat.id);
  }
  console.log('✔ Categories seeded');

  // 6. 30 REALISTIC GROCERY PRODUCTS
  const productsData = [
    // Fruits & Vegetables (Tax 0%)
    { name: 'Fresh Farm Tomatoes (Hybrid)', slug: 'fresh-farm-tomatoes-hybrid', sku: 'VEG-TOM-001', unit: '1 kg', price: 38, mrp: 45, costPrice: 28, taxPercent: 0, stockQty: 85, lowStockThreshold: 15, categorySlug: 'fruits-vegetables', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80' },
    { name: 'Red Onions (Nashik Quality)', slug: 'red-onions-nashik-quality', sku: 'VEG-ONI-002', unit: '1 kg', price: 42, mrp: 50, costPrice: 32, taxPercent: 0, stockQty: 120, lowStockThreshold: 20, categorySlug: 'fruits-vegetables', image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=400&q=80' },
    { name: 'Fresh Potatoes (Jyoti)', slug: 'fresh-potatoes-jyoti', sku: 'VEG-POT-003', unit: '1 kg', price: 32, mrp: 40, costPrice: 24, taxPercent: 0, stockQty: 100, lowStockThreshold: 20, categorySlug: 'fruits-vegetables', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80' },
    { name: 'Shimla Fresh Apples (Royal Delicious)', slug: 'shimla-fresh-apples', sku: 'FRU-APP-004', unit: '1 kg (4-5 pcs)', price: 185, mrp: 220, costPrice: 145, taxPercent: 0, stockQty: 40, lowStockThreshold: 10, categorySlug: 'fruits-vegetables', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80' },
    { name: 'Robusta Golden Bananas', slug: 'robusta-golden-bananas', sku: 'FRU-BAN-005', unit: '1 kg (5-6 pcs)', price: 48, mrp: 60, costPrice: 35, taxPercent: 0, stockQty: 60, lowStockThreshold: 15, categorySlug: 'fruits-vegetables', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80' },
    { name: 'Fresh Green Spinach (Palak)', slug: 'fresh-green-spinach-palak', sku: 'VEG-PAL-006', unit: '250 g bunch', price: 20, mrp: 28, costPrice: 12, taxPercent: 0, stockQty: 30, lowStockThreshold: 10, categorySlug: 'fruits-vegetables', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&q=80' },

    // Dairy, Bread & Eggs (Tax 0% / 5%)
    { name: 'Amul Taaza Homogenised Toned Milk', slug: 'amul-taaza-toned-milk-1l', sku: 'DAI-AMU-007', unit: '1 L Tetra', price: 74, mrp: 75, costPrice: 66, taxPercent: 0, stockQty: 50, lowStockThreshold: 12, categorySlug: 'dairy-bread-eggs', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80' },
    { name: 'Amul Salted Pasteurised Butter', slug: 'amul-salted-butter-500g', sku: 'DAI-BUT-008', unit: '500 g', price: 275, mrp: 285, costPrice: 248, taxPercent: 12, stockQty: 35, lowStockThreshold: 8, categorySlug: 'dairy-bread-eggs', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80' },
    { name: 'Nandini Fresh Malai Paneer', slug: 'nandini-fresh-malai-paneer-200g', sku: 'DAI-PAN-009', unit: '200 g', price: 88, mrp: 95, costPrice: 75, taxPercent: 5, stockQty: 25, lowStockThreshold: 8, categorySlug: 'dairy-bread-eggs', image: 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=400&q=80' },
    { name: 'Modern 100% Whole Wheat Brown Bread', slug: 'modern-whole-wheat-brown-bread', sku: 'BAK-BRD-010', unit: '400 g', price: 50, mrp: 55, costPrice: 40, taxPercent: 0, stockQty: 28, lowStockThreshold: 10, categorySlug: 'dairy-bread-eggs', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80' },
    { name: 'Farm Fresh White Table Eggs (Pack of 12)', slug: 'farm-fresh-white-eggs-12pcs', sku: 'DAI-EGG-011', unit: 'Pack of 12', price: 92, mrp: 105, costPrice: 76, taxPercent: 0, stockQty: 45, lowStockThreshold: 10, categorySlug: 'dairy-bread-eggs', image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=400&q=80' },

    // Atta, Rice & Dals (Tax 0% / 5%)
    { name: 'Aashirvaad Superior Sharbati Atta', slug: 'aashirvaad-sharbati-atta-5kg', sku: 'STA-ATT-012', unit: '5 kg', price: 295, mrp: 330, costPrice: 255, taxPercent: 5, stockQty: 40, lowStockThreshold: 8, categorySlug: 'atta-rice-dals', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80' },
    { name: 'Fortune Everyday Basmati Rice', slug: 'fortune-everyday-basmati-rice-5kg', sku: 'STA-RIC-013', unit: '5 kg', price: 420, mrp: 499, costPrice: 360, taxPercent: 5, stockQty: 30, lowStockThreshold: 6, categorySlug: 'atta-rice-dals', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80' },
    { name: 'Tata Sampann Unpolished Toor Dal', slug: 'tata-sampann-toor-dal-1kg', sku: 'STA-DAL-014', unit: '1 kg', price: 178, mrp: 198, costPrice: 152, taxPercent: 5, stockQty: 50, lowStockThreshold: 10, categorySlug: 'atta-rice-dals', image: 'https://images.unsplash.com/photo-1585994192701-f1a505c8574a?auto=format&fit=crop&w=400&q=80' },
    { name: 'Tata Sampann Unpolished Moong Dal Split', slug: 'tata-sampann-moong-dal-1kg', sku: 'STA-MNG-015', unit: '1 kg', price: 165, mrp: 185, costPrice: 140, taxPercent: 5, stockQty: 40, lowStockThreshold: 10, categorySlug: 'atta-rice-dals', image: 'https://images.unsplash.com/photo-1585994192701-f1a505c8574a?auto=format&fit=crop&w=400&q=80' },
    { name: 'Organic Kabuli Chana (Big White Chickpeas)', slug: 'organic-kabuli-chana-1kg', sku: 'STA-CHA-016', unit: '1 kg', price: 155, mrp: 175, costPrice: 128, taxPercent: 5, stockQty: 35, lowStockThreshold: 8, categorySlug: 'atta-rice-dals', image: 'https://images.unsplash.com/photo-1585994192701-f1a505c8574a?auto=format&fit=crop&w=400&q=80' },

    // Oils, Ghee & Masalas (Tax 5% / 12%)
    { name: 'Fortune Sunlite Refined Sunflower Oil', slug: 'fortune-sunlite-sunflower-oil-1l', sku: 'OIL-SUN-017', unit: '1 L Pouch', price: 135, mrp: 155, costPrice: 118, taxPercent: 5, stockQty: 60, lowStockThreshold: 15, categorySlug: 'oils-ghee-masalas', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80' },
    { name: 'GRB Pure Cow Ghee Jar', slug: 'grb-pure-cow-ghee-500ml', sku: 'OIL-GHE-018', unit: '500 ml', price: 360, mrp: 395, costPrice: 310, taxPercent: 12, stockQty: 25, lowStockThreshold: 5, categorySlug: 'oils-ghee-masalas', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80' },
    { name: 'Tata Salt Vacuum Evaporated Iodised Salt', slug: 'tata-salt-iodised-1kg', sku: 'MAS-SLT-019', unit: '1 kg', price: 28, mrp: 30, costPrice: 22, taxPercent: 0, stockQty: 150, lowStockThreshold: 30, categorySlug: 'oils-ghee-masalas', image: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=400&q=80' },
    { name: 'Everest Turmeric Powder (Haldi)', slug: 'everest-turmeric-powder-200g', sku: 'MAS-TUR-020', unit: '200 g', price: 62, mrp: 70, costPrice: 48, taxPercent: 5, stockQty: 45, lowStockThreshold: 10, categorySlug: 'oils-ghee-masalas', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&q=80' },
    { name: 'Catch Red Chilli Powder (Teekha Lal)', slug: 'catch-red-chilli-powder-200g', sku: 'MAS-CHL-021', unit: '200 g', price: 84, mrp: 95, costPrice: 68, taxPercent: 5, stockQty: 40, lowStockThreshold: 10, categorySlug: 'oils-ghee-masalas', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&q=80' },

    // Snacks & Biscuits (Tax 12% / 18%)
    { name: 'Parle-G Original Glucose Biscuits', slug: 'parle-g-glucose-biscuits-250g', sku: 'SNK-PAR-022', unit: '250 g', price: 25, mrp: 28, costPrice: 20, taxPercent: 18, stockQty: 90, lowStockThreshold: 20, categorySlug: 'snacks-biscuits', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80' },
    { name: 'Britannia Good Day Cashew Cookies', slug: 'britannia-good-day-cashew-200g', sku: 'SNK-GDA-023', unit: '200 g', price: 42, mrp: 48, costPrice: 33, taxPercent: 18, stockQty: 65, lowStockThreshold: 15, categorySlug: 'snacks-biscuits', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80' },
    { name: 'Lays India\'s Magic Masala Potato Chips', slug: 'lays-magical-masala-chips-90g', sku: 'SNK-LAY-024', unit: '90 g pouch', price: 30, mrp: 30, costPrice: 24, taxPercent: 12, stockQty: 80, lowStockThreshold: 15, categorySlug: 'snacks-biscuits', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80' },
    { name: 'Haldiram\'s Nagpur Aloo Bhujia', slug: 'haldirams-nagpur-aloo-bhujia-400g', sku: 'SNK-ALU-025', unit: '400 g', price: 110, mrp: 125, costPrice: 88, taxPercent: 12, stockQty: 45, lowStockThreshold: 10, categorySlug: 'snacks-biscuits', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=400&q=80' },

    // Cold Drinks & Juices (Tax 12% / 28%)
    { name: 'Real Fruit Power Mixed Fruit Juice', slug: 'real-mixed-fruit-juice-1l', sku: 'BEV-REL-026', unit: '1 L Tetra', price: 125, mrp: 140, costPrice: 102, taxPercent: 12, stockQty: 35, lowStockThreshold: 8, categorySlug: 'cold-drinks-juices', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80' },
    { name: 'Raw Pressery 100% Tender Coconut Water', slug: 'raw-pressery-tender-coconut-water-200ml', sku: 'BEV-RAW-027', unit: '200 ml bottle', price: 55, mrp: 60, costPrice: 42, taxPercent: 12, stockQty: 40, lowStockThreshold: 10, categorySlug: 'cold-drinks-juices', image: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=400&q=80' },
    { name: 'Thums Up Charged Carbonated Drink', slug: 'thums-up-can-300ml', sku: 'BEV-THU-028', unit: '300 ml Can', price: 40, mrp: 40, costPrice: 31, taxPercent: 28, stockQty: 50, lowStockThreshold: 12, categorySlug: 'cold-drinks-juices', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80' },

    // Cleaning & Household (Tax 18%)
    { name: 'Vim Dishwash Gel Lemon', slug: 'vim-dishwash-gel-lemon-750ml', sku: 'CLN-VIM-029', unit: '750 ml bottle', price: 175, mrp: 205, costPrice: 140, taxPercent: 18, stockQty: 30, lowStockThreshold: 6, categorySlug: 'cleaning-household', image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=400&q=80' },
    { name: 'Surf Excel Quick Wash Detergent Powder', slug: 'surf-excel-quick-wash-1kg', sku: 'CLN-SRF-030', unit: '1 kg', price: 180, mrp: 210, costPrice: 150, taxPercent: 18, stockQty: 25, lowStockThreshold: 5, categorySlug: 'cleaning-household', image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=400&q=80' },
  ];

  for (const item of productsData) {
    const categoryId = categoryMap.get(item.categorySlug);
    if (!categoryId) continue;

    const existingProduct = await prisma.product.findUnique({
      where: { sku: item.sku },
    });

    if (!existingProduct) {
      const product = await prisma.product.create({
        data: {
          name: item.name,
          slug: item.slug,
          sku: item.sku,
          unit: item.unit,
          price: item.price,
          mrp: item.mrp,
          costPrice: item.costPrice,
          taxPercent: item.taxPercent,
          stockQty: item.stockQty,
          lowStockThreshold: item.lowStockThreshold,
          isAvailable: true,
          images: [item.image],
          categoryId,
        },
      });

      // Record initial stock movement
      await prisma.stockMovementLedger.create({
        data: {
          productId: product.id,
          type: 'PURCHASE',
          quantityChange: item.stockQty,
          balanceAfter: item.stockQty,
          reason: 'Initial store inventory opening balance',
          referenceType: 'SEED',
          createdByUserId: owner.id,
        },
      });
    }
  }
  console.log(`✔ 30 grocery products and stock movements seeded successfully`);

  console.log('\n🎉 FreshCart database seeded successfully!');
  console.log('----------------------------------------------------');
  console.log('👑 Owner Credentials:');
  console.log('   Email:    owner@freshcart.com');
  console.log('   Password: OwnerPass@2026');
  console.log('   Phone:    9999999999');
  console.log('----------------------------------------------------');
  console.log('👨‍💼 Staff Credentials:');
  console.log('   Email:    staff@freshcart.com');
  console.log('   Password: StaffPass@2026');
  console.log('   Phone:    8888888888');
  console.log('----------------------------------------------------');
  console.log('🛍️ Customer Credentials:');
  console.log('   Email:    customer@example.com');
  console.log('   Password: CustomerPass@2026');
  console.log('   Phone:    9876543210');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
