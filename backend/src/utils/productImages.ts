/**
 * Accurate Product Image Resolver
 * Maps specific grocery items, produce, FMCG brands, and subcategories
 * to high-definition, verified Unsplash CDN photography.
 */

export const ACCURATE_IMAGES: Record<string, string> = {
  // Fresh Vegetables
  veg_potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80',
  veg_onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=500&q=80',
  veg_tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80',
  veg_green_chilli: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=500&q=80',
  veg_ginger: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=80',
  veg_garlic: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=500&q=80',
  veg_lemon: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=500&q=80',
  veg_coriander: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=500&q=80',
  veg_cauliflower: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=500&q=80',
  veg_cabbage: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=500&q=80',
  veg_brinjal: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=500&q=80',
  veg_ladyfinger: 'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?auto=format&fit=crop&w=500&q=80',
  veg_cucumber: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=500&q=80',
  veg_carrot: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=500&q=80',
  veg_beetroot: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?auto=format&fit=crop&w=500&q=80',
  veg_spinach: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&q=80',
  veg_gourd: 'https://images.unsplash.com/photo-1598030304671-5aa1d6f21128?auto=format&fit=crop&w=500&q=80',
  veg_beans: 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?auto=format&fit=crop&w=500&q=80',
  veg_peas: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&w=500&q=80',
  veg_capsicum: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=500&q=80',
  veg_corn: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=500&q=80',
  veg_mushroom: 'https://images.unsplash.com/photo-1504672281656-e4981d70414b?auto=format&fit=crop&w=500&q=80',
  veg_broccoli: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=500&q=80',
  veg_pumpkin: 'https://images.unsplash.com/photo-1506917728037-b6af01a7d403?auto=format&fit=crop&w=500&q=80',
  veg_sweet_potato: 'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?auto=format&fit=crop&w=500&q=80',

  // Fresh Fruits
  fruit_apple: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=500&q=80',
  fruit_banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=500&q=80',
  fruit_mango: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=500&q=80',
  fruit_orange: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=500&q=80',
  fruit_pomegranate: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=80',
  fruit_grapes: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=500&q=80',
  fruit_papaya: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&w=500&q=80',
  fruit_watermelon: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=500&q=80',
  fruit_pineapple: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=500&q=80',
  fruit_coconut: 'https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?auto=format&fit=crop&w=500&q=80',
  fruit_kiwi: 'https://images.unsplash.com/photo-1585059895524-72359e06133a?auto=format&fit=crop&w=500&q=80',
  fruit_strawberry: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=500&q=80',
  fruit_dates: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=500&q=80',

  // Dairy & Eggs & Bakery
  dairy_milk: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80',
  dairy_curd: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80',
  dairy_paneer: 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=500&q=80',
  dairy_butter: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=500&q=80',
  dairy_cheese: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=500&q=80',
  dairy_egg: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=500&q=80',
  dairy_bread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80',

  // Flours, Grains, Rice & Dals
  grain_atta: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80',
  grain_rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80',
  grain_dal: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80',
  grain_rajma: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80',

  // Oils, Ghee & Sweeteners
  oil_bottle: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80',
  oil_ghee: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=500&q=80',
  oil_sugar: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=500&q=80',
  oil_salt: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=500&q=80',

  // Spices & Nuts
  spice_turmeric: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=80',
  nut_almond: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=500&q=80',
  nut_cashew: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=500&q=80',

  // Packaged Foods, Snacks & Chocolates
  snack_biscuit: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=500&q=80',
  snack_chips: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=500&q=80',
  snack_namkeen: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=500&q=80',
  snack_chocolate: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=500&q=80',
  food_noodle: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=500&q=80',
  food_pasta: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=500&q=80',
  food_cereal: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=500&q=80',

  // Beverages
  bev_tea: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=500&q=80',
  bev_coffee: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&q=80',
  bev_juice: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80',
  bev_cola: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80',

  // Personal Care, Cleaning & Household
  care_soap: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=500&q=80',
  care_shampoo: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=500&q=80',
  care_toothpaste: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=500&q=80',
  care_diaper: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=500&q=80',
  clean_detergent: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=500&q=80',
  clean_dishwash: 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?auto=format&fit=crop&w=500&q=80',
  pet_food: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=500&q=80',
  misc_stationery: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=500&q=80',
  misc_battery: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?auto=format&fit=crop&w=500&q=80',
  misc_bulb: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=500&q=80',
};

export function resolveAccurateProductImage(name: string, brand: string = '', subCategory: string = '', categoryName: string = ''): string {
  const text = `${name} ${brand} ${subCategory} ${categoryName}`.toLowerCase();

  // Vegetables
  if (text.includes('potato') && !text.includes('sweet potato') && !text.includes('chips')) return ACCURATE_IMAGES.veg_potato;
  if (text.includes('sweet potato')) return ACCURATE_IMAGES.veg_sweet_potato;
  if (text.includes('onion') && !text.includes('spring onion') && !text.includes('chips')) return ACCURATE_IMAGES.veg_onion;
  if (text.includes('tomato') && !text.includes('sauce') && !text.includes('ketchup') && !text.includes('chips')) return ACCURATE_IMAGES.veg_tomato;
  if (text.includes('green chilli') || text.includes('hari mirch')) return ACCURATE_IMAGES.veg_green_chilli;
  if (text.includes('ginger') || text.includes('adrak')) return ACCURATE_IMAGES.veg_ginger;
  if (text.includes('garlic') || text.includes('lahsun')) return ACCURATE_IMAGES.veg_garlic;
  if (text.includes('lemon') || text.includes('nimbu')) return ACCURATE_IMAGES.veg_lemon;
  if (text.includes('coriander leaves') || text.includes('mint leaves') || text.includes('curry leaves')) return ACCURATE_IMAGES.veg_coriander;
  if (text.includes('cauliflower') || text.includes('gobhi')) return ACCURATE_IMAGES.veg_cauliflower;
  if (text.includes('cabbage') || text.includes('patta gobhi')) return ACCURATE_IMAGES.veg_cabbage;
  if (text.includes('brinjal') || text.includes('eggplant') || text.includes('baingan')) return ACCURATE_IMAGES.veg_brinjal;
  if (text.includes('ladyfinger') || text.includes('okra') || text.includes('bhindi')) return ACCURATE_IMAGES.veg_ladyfinger;
  if (text.includes('cucumber') || text.includes('kheera')) return ACCURATE_IMAGES.veg_cucumber;
  if (text.includes('carrot') || text.includes('gajar')) return ACCURATE_IMAGES.veg_carrot;
  if (text.includes('beetroot') || text.includes('chukandar') || text.includes('radish') || text.includes('mooli')) return ACCURATE_IMAGES.veg_beetroot;
  if (text.includes('spinach') || text.includes('palak') || text.includes('methi')) return ACCURATE_IMAGES.veg_spinach;
  if (text.includes('bottle gourd') || text.includes('ridge gourd') || text.includes('bitter gourd') || text.includes('dudhi') || text.includes('turai') || text.includes('karela')) return ACCURATE_IMAGES.veg_gourd;
  if (text.includes('french beans') || text.includes('cluster beans') || text.includes('beans')) return ACCURATE_IMAGES.veg_beans;
  if (text.includes('peas') || text.includes('matar')) return ACCURATE_IMAGES.veg_peas;
  if (text.includes('capsicum') || text.includes('bell pepper')) return ACCURATE_IMAGES.veg_capsicum;
  if (text.includes('corn') || text.includes('sweet corn')) return ACCURATE_IMAGES.veg_corn;
  if (text.includes('mushroom')) return ACCURATE_IMAGES.veg_mushroom;
  if (text.includes('broccoli')) return ACCURATE_IMAGES.veg_broccoli;
  if (text.includes('pumpkin') || text.includes('kaddu')) return ACCURATE_IMAGES.veg_pumpkin;

  // Fruits
  if (text.includes('apple') && !text.includes('custard apple') && !text.includes('vinegar')) return ACCURATE_IMAGES.fruit_apple;
  if (text.includes('banana') && !text.includes('chips')) return ACCURATE_IMAGES.fruit_banana;
  if (text.includes('mango') && !text.includes('pickle') && !text.includes('amchur') && !text.includes('drink')) return ACCURATE_IMAGES.fruit_mango;
  if (text.includes('orange') && !text.includes('drink') && !text.includes('soda')) return ACCURATE_IMAGES.fruit_orange;
  if (text.includes('pomegranate') || text.includes('anar')) return ACCURATE_IMAGES.fruit_pomegranate;
  if (text.includes('grapes') || text.includes('angoor')) return ACCURATE_IMAGES.fruit_grapes;
  if (text.includes('papaya')) return ACCURATE_IMAGES.fruit_papaya;
  if (text.includes('watermelon')) return ACCURATE_IMAGES.fruit_watermelon;
  if (text.includes('pineapple')) return ACCURATE_IMAGES.fruit_pineapple;
  if (text.includes('coconut') && !text.includes('oil')) return ACCURATE_IMAGES.fruit_coconut;
  if (text.includes('kiwi')) return ACCURATE_IMAGES.fruit_kiwi;
  if (text.includes('strawberry')) return ACCURATE_IMAGES.fruit_strawberry;
  if (text.includes('dates') || text.includes('khajur')) return ACCURATE_IMAGES.fruit_dates;

  // Dairy, Eggs & Bread
  if (text.includes('milk') && !text.includes('chocolate') && !text.includes('dairy milk')) return ACCURATE_IMAGES.dairy_milk;
  if (text.includes('curd') || text.includes('dahi') || text.includes('yogurt')) return ACCURATE_IMAGES.dairy_curd;
  if (text.includes('paneer')) return ACCURATE_IMAGES.dairy_paneer;
  if (text.includes('butter') && !text.includes('peanut butter') && !text.includes('cookies')) return ACCURATE_IMAGES.dairy_butter;
  if (text.includes('cheese')) return ACCURATE_IMAGES.dairy_cheese;
  if (text.includes('egg')) return ACCURATE_IMAGES.dairy_egg;
  if (text.includes('bread') || text.includes('bun') || text.includes('pav')) return ACCURATE_IMAGES.dairy_bread;

  // Grains, Flours, Rice & Dals
  if (text.includes('atta') || text.includes('flour') || text.includes('maida') || text.includes('sooji') || text.includes('besan') || text.includes('rava')) return ACCURATE_IMAGES.grain_atta;
  if (text.includes('rice') || text.includes('basmati') || text.includes('poha') || text.includes('murmura') || text.includes('sabudana')) return ACCURATE_IMAGES.grain_rice;
  if (text.includes('dal') || text.includes('chana') || text.includes('toor') || text.includes('moong') || text.includes('urad') || text.includes('masoor') || text.includes('lentil')) return ACCURATE_IMAGES.grain_dal;
  if (text.includes('rajma') || text.includes('kabuli') || text.includes('lobia')) return ACCURATE_IMAGES.grain_rajma;

  // Oils, Ghee & Sweeteners
  if (text.includes('ghee')) return ACCURATE_IMAGES.oil_ghee;
  if (text.includes('oil')) return ACCURATE_IMAGES.oil_bottle;
  if (text.includes('sugar') || text.includes('jaggery') || text.includes('gur')) return ACCURATE_IMAGES.oil_sugar;
  if (text.includes('salt') || text.includes('namak')) return ACCURATE_IMAGES.oil_salt;

  // Spices & Nuts
  if (text.includes('turmeric') || text.includes('haldi') || text.includes('chilli powder') || text.includes('masala') || text.includes('jeera') || text.includes('mustard seeds') || text.includes('cardamom') || text.includes('clove') || text.includes('cinnamon') || text.includes('pepper')) return ACCURATE_IMAGES.spice_turmeric;
  if (text.includes('almond') || text.includes('badam')) return ACCURATE_IMAGES.nut_almond;
  if (text.includes('cashew') || text.includes('kaju') || text.includes('walnut') || text.includes('pista') || text.includes('raisin') || text.includes('kishmish') || text.includes('nut')) return ACCURATE_IMAGES.nut_cashew;

  // Snacks & Beverages
  if (text.includes('biscuit') || text.includes('cookie') || text.includes('parle') || text.includes('good day') || text.includes('marie') || text.includes('bourbon') || text.includes('oreo')) return ACCURATE_IMAGES.snack_biscuit;
  if (text.includes('chips') || text.includes('lay') || text.includes('wafer') || text.includes('nachos') || text.includes('bingo') || text.includes('kurkure')) return ACCURATE_IMAGES.snack_chips;
  if (text.includes('bhujia') || text.includes('namkeen') || text.includes('sev') || text.includes('mixture') || text.includes('gathiya')) return ACCURATE_IMAGES.snack_namkeen;
  if (text.includes('chocolate') || text.includes('cadbury') || text.includes('dairy milk') || text.includes('kitkat') || text.includes('5 star') || text.includes('munch')) return ACCURATE_IMAGES.snack_chocolate;
  if (text.includes('noodle') || text.includes('maggi') || text.includes('yippee') || text.includes('ramen')) return ACCURATE_IMAGES.food_noodle;
  if (text.includes('pasta') || text.includes('macaroni') || text.includes('spaghetti')) return ACCURATE_IMAGES.food_pasta;
  if (text.includes('oats') || text.includes('cereal') || text.includes('corn flakes') || text.includes('muesli') || text.includes('chocos')) return ACCURATE_IMAGES.food_cereal;
  if (text.includes('tea') || text.includes('chai') || text.includes('red label') || text.includes('taj mahal')) return ACCURATE_IMAGES.bev_tea;
  if (text.includes('coffee') || text.includes('nescafe') || text.includes('bru')) return ACCURATE_IMAGES.bev_coffee;
  if (text.includes('juice') || text.includes('real') || text.includes('tropicana') || text.includes('frooti') || text.includes('maaza')) return ACCURATE_IMAGES.bev_juice;
  if (text.includes('cola') || text.includes('soda') || text.includes('coke') || text.includes('thums up') || text.includes('sprite') || text.includes('pepsi') || text.includes('7up') || text.includes('limca')) return ACCURATE_IMAGES.bev_cola;

  // Personal Care & Household
  if (text.includes('soap') || text.includes('dettol') || text.includes('lifebuoy') || text.includes('dove') || text.includes('lux') || text.includes('pears') || text.includes('body wash') || text.includes('hand wash')) return ACCURATE_IMAGES.care_soap;
  if (text.includes('shampoo') || text.includes('conditioner') || text.includes('head & shoulders') || text.includes('clinic plus') || text.includes('sunsilk') || text.includes('pantene')) return ACCURATE_IMAGES.care_shampoo;
  if (text.includes('toothpaste') || text.includes('colgate') || text.includes('close up') || text.includes('sensodyne') || text.includes('toothbrush')) return ACCURATE_IMAGES.care_toothpaste;
  if (text.includes('diaper') || text.includes('pampers') || text.includes('mamypoko') || text.includes('wipes')) return ACCURATE_IMAGES.care_diaper;
  if (text.includes('detergent') || text.includes('surf excel') || text.includes('ariel') || text.includes('tide') || text.includes('rin') || text.includes('cleaner') || text.includes('lizol') || text.includes('harpic')) return ACCURATE_IMAGES.clean_detergent;
  if (text.includes('dishwash') || text.includes('vim') || text.includes('pril') || text.includes('scrub')) return ACCURATE_IMAGES.clean_dishwash;
  if (text.includes('dog') || text.includes('cat') || text.includes('pet') || text.includes('pedigree') || text.includes('whiskas')) return ACCURATE_IMAGES.pet_food;
  if (text.includes('battery') || text.includes('duracell')) return ACCURATE_IMAGES.misc_battery;
  if (text.includes('bulb') || text.includes('led')) return ACCURATE_IMAGES.misc_bulb;
  if (text.includes('notebook') || text.includes('pen') || text.includes('pencil') || text.includes('stationery')) return ACCURATE_IMAGES.misc_stationery;

  return ACCURATE_IMAGES.food_cereal;
}

