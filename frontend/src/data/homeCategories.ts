export interface HomeCategoryItem {
  id: string;
  name: string;
  image: string;
  link: string;
}

export interface HomeCategoryGroup {
  id: string;
  title: string;
  items: HomeCategoryItem[];
}

export const HOME_CATEGORY_GROUPS: HomeCategoryGroup[] = [
  {
    id: 'fresh-items',
    title: 'Fresh items',
    items: [
      {
        id: 'fresh-veg',
        name: 'Fresh Vegetables',
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=fruits-vegetables',
      },
      {
        id: 'fresh-fruits',
        name: 'Fresh Fruits',
        image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=fruits-vegetables',
      },
      {
        id: 'dairy-bread-eggs',
        name: 'Dairy, Bread and Eggs',
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=dairy-bread-eggs',
      },
      {
        id: 'meat-seafood',
        name: 'Meat and Seafood',
        image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=frozen-foods',
      },
    ],
  },
  {
    id: 'grocery-kitchen',
    title: 'Grocery & Kitchen',
    items: [
      {
        id: 'atta-rice-dal',
        name: 'Atta, Rice and Dal',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=grocery-staples',
      },
      {
        id: 'masalas',
        name: 'Masalas',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=grocery-staples',
      },
      {
        id: 'oils-ghee',
        name: 'Oils and Ghee',
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=oils-ghee',
      },
      {
        id: 'cereals-breakfast',
        name: 'Cereals and Breakfast',
        image: 'https://images.unsplash.com/photo-1521483451569-e33803c0330c?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=packaged-food',
      },
    ],
  },
  {
    id: 'snacks-drinks',
    title: 'Snacks & drinks',
    items: [
      {
        id: 'cold-drinks-juices',
        name: 'Cold Drinks and Juices',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=beverages',
      },
      {
        id: 'ice-creams-frozen',
        name: 'Ice Creams and Frozen...',
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=frozen-foods',
      },
      {
        id: 'chips-namkeens',
        name: 'Chips and Namkeens',
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=snacks-confectionery',
      },
      {
        id: 'chocolates',
        name: 'Chocolates',
        image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=snacks-confectionery',
      },
      {
        id: 'biscuits-cakes',
        name: 'Biscuits and Cakes',
        image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=snacks-confectionery',
      },
      {
        id: 'tea-coffee-milk',
        name: 'Tea, Coffee and Milk dr...',
        image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=beverages',
      },
      {
        id: 'sauces-spreads',
        name: 'Sauces and Spreads',
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=packaged-food',
      },
      {
        id: 'sweet-corner',
        name: 'Sweet Corner',
        image: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=snacks-confectionery',
      },
      {
        id: 'noodles-pasta',
        name: 'Noodles, Pasta, Ver...',
        image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=packaged-food',
      },
      {
        id: 'frozen-food',
        name: 'Frozen Food',
        image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=frozen-foods',
      },
      {
        id: 'dry-fruits-seeds',
        name: 'Dry Fruits and Seeds ...',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=grocery-staples',
      },
      {
        id: 'paan-corner',
        name: 'Paan Corner',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=snacks-confectionery',
      },
    ],
  },
  {
    id: 'beauty-wellness',
    title: 'Beauty & Wellness',
    items: [
      {
        id: 'bath-body',
        name: 'Bath and Body',
        image: 'https://images.unsplash.com/photo-1608248597359-2c7b50937c41?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=bath-body',
      },
      {
        id: 'hair-care',
        name: 'Hair Care',
        image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=personal-care-beauty',
      },
      {
        id: 'skincare',
        name: 'Skincare',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=personal-care-beauty',
      },
      {
        id: 'makeup',
        name: 'Makeup',
        image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=personal-care-beauty',
      },
    ],
  },
  {
    id: 'household-lifestyle',
    title: 'Household & Lifestyle',
    items: [
      {
        id: 'home-kitchen',
        name: 'Home and Kitchen',
        image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=home-kitchen',
      },
      {
        id: 'puja-store',
        name: 'Puja Store',
        image: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=pooja-needs',
      },
      {
        id: 'cleaners-repellents',
        name: 'Cleaners and Repell...',
        image: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=household-cleaning',
      },
      {
        id: 'toys-stationery',
        name: 'Toys and Stationery',
        image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=stationery-office',
      },
      {
        id: 'electronics-appliances',
        name: 'Electronics and Applia...',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=electronics-electrical',
      },
      {
        id: 'fashion',
        name: 'Fashion',
        image: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=apparel-fashion',
      },
      {
        id: 'pet-supplies',
        name: 'Pet Supplies',
        image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=pet-care',
      },
      {
        id: 'sports-fitness',
        name: 'Sports and Fitness',
        image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80',
        link: '/products?category=seasonal-special',
      },
    ],
  },
];

export interface ShopByStoreItem {
  id: string;
  name: string;
  image: string;
  link: string;
  bgColor: string;
}

export const SHOP_BY_STORES: ShopByStoreItem[] = [
  {
    id: 'store-book',
    name: 'Book Store',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=500&q=80',
    link: '/products?category=stationery-office',
    bgColor: 'from-sky-100 to-sky-200',
  },
  {
    id: 'store-noice',
    name: 'The Noice Store',
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=500&q=80',
    link: '/products?category=packaged-food',
    bgColor: 'from-amber-100 to-orange-200',
  },
  {
    id: 'store-fitness',
    name: 'Sports & Fitness',
    image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=500&q=80',
    link: '/products?category=seasonal-special',
    bgColor: 'from-emerald-100 to-teal-200',
  },
];

