import process from 'process';
import { PrismaClient, Role, DiscountType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { catalogCategories, catalogProducts } from '../src/config/productsCatalog';
import { gujaratDeliveryAreas } from '../src/utils/gujaratDelivery';

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
      tagLine: 'Your Daily Fresh & Reliable Grocery Store across Gujarat',
      logoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80',
      phone: '+91 98765 43210',
      email: 'support@freshcart.com',
      address: 'Shop 101-104, Iscon Elegance, Prahlad Nagar, SG Highway, Ahmedabad, Gujarat 380015',
      mapUrl: 'https://maps.google.com/?q=23.0135,72.5085',
      openingHours: 'Mon - Sun: 7:00 AM - 10:00 PM',
      gstin: '24AAAAA0000A1Z5',
      fssai: '11223344556677',
      invoicePrefix: 'INV-',
      invoiceNextNumber: 1001,
      invoiceFooterText: 'Thank you for shopping with FreshCart Gujarat! Goods once sold can be returned within 24 hours for perishable products and 7 days for packaged goods.',
      minOrderValue: 149,
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
            street: 'Flat 402, Shivalik High Street, Prahlad Nagar',
            landmark: 'Near Titanium Square, SG Highway',
            city: 'Ahmedabad',
            state: 'Gujarat',
            pincode: '380015',
            contactName: 'Priya Patel',
            contactPhone: '9876543210',
            isDefault: true,
          },
        ],
      },
    },
  });
  console.log('✔ Owner, Staff, and Customer users seeded');

  // 3. DELIVERY AREAS ACROSS GUJARAT
  for (const area of gujaratDeliveryAreas) {
    const { id, ...data } = area;
    await prisma.deliveryArea.upsert({
      where: { pincode: area.pincode },
      update: data,
      create: data,
    });
  }
  console.log(`✔ ${gujaratDeliveryAreas.length} Gujarat Delivery areas seeded`);

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

  // 5. CATEGORIES (19 Categories)
  const categoryMap = new Map<string, string>();
  for (const cat of catalogCategories) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        imageUrl: cat.imageUrl,
        displayOrder: cat.displayOrder,
        isActive: cat.isActive,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        displayOrder: cat.displayOrder,
        isActive: cat.isActive,
      },
    });
    categoryMap.set(cat.id, createdCat.id);
    categoryMap.set(cat.slug, createdCat.id);
  }
  console.log(`✔ ${catalogCategories.length} Categories seeded`);

  // 6. ALL PRODUCTS (2,023 PRODUCTS)
  for (const item of catalogProducts) {
    const categoryId = categoryMap.get(item.categoryId);
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
          isAvailable: item.isAvailable,
          images: item.images,
          description: item.description,
          categoryId,
        },
      });

      if (item.stockQty > 0) {
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
  }
  console.log(`✔ ${catalogProducts.length} grocery products and stock movements seeded successfully`);

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

