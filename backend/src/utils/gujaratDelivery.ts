export interface DeliveryAreaInfo {
  id?: string;
  pincode: string;
  areaName: string;
  city: string;
  state: string;
  minOrderValue: number;
  deliveryCharge: number;
  freeDeliveryAbove: number | null;
  estimatedDeliveryHours: number;
  isDeliverable: boolean;
}

export const gujaratDeliveryAreas: DeliveryAreaInfo[] = [
  // --- Ahmedabad Hubs ---
  {
    id: 'area-gj-380015',
    pincode: '380015',
    areaName: 'Prahlad Nagar, SG Highway, Satellite, Bodakdev',
    city: 'Ahmedabad',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 30,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 2,
    isDeliverable: true,
  },
  {
    id: 'area-gj-380009',
    pincode: '380009',
    areaName: 'Navrangpura, CG Road, University Area',
    city: 'Ahmedabad',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 30,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 2,
    isDeliverable: true,
  },
  {
    id: 'area-gj-380054',
    pincode: '380054',
    areaName: 'Vastrapur, IIM Road, Drive-In, Thaltej',
    city: 'Ahmedabad',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 30,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 2,
    isDeliverable: true,
  },
  {
    id: 'area-gj-380058',
    pincode: '380058',
    areaName: 'Bopal, South Bopal, Ghuma, Shela',
    city: 'Ahmedabad',
    state: 'Gujarat',
    minOrderValue: 199,
    deliveryCharge: 35,
    freeDeliveryAbove: 599,
    estimatedDeliveryHours: 2,
    isDeliverable: true,
  },
  {
    id: 'area-gj-380008',
    pincode: '380008',
    areaName: 'Maninagar, Kankaria Lake, Khokhra',
    city: 'Ahmedabad',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 35,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 2,
    isDeliverable: true,
  },
  {
    id: 'area-gj-380001',
    pincode: '380001',
    areaName: 'Lal Darwaja, Relief Road, Kalupur, Old City',
    city: 'Ahmedabad',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 35,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 2,
    isDeliverable: true,
  },
  {
    id: 'area-gj-382424',
    pincode: '382424',
    areaName: 'Chandkheda, Motera Stadium, Sabarmati',
    city: 'Ahmedabad',
    state: 'Gujarat',
    minOrderValue: 199,
    deliveryCharge: 35,
    freeDeliveryAbove: 599,
    estimatedDeliveryHours: 3,
    isDeliverable: true,
  },

  // --- Gandhinagar (Capital & GIFT City) ---
  {
    id: 'area-gj-382010',
    pincode: '382010',
    areaName: 'Sector 1-30, Infocity, Secretariat, Akshardham',
    city: 'Gandhinagar',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 35,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 2,
    isDeliverable: true,
  },
  {
    id: 'area-gj-382421',
    pincode: '382421',
    areaName: 'Kudasan, Raysan, PDPU, GIFT City',
    city: 'Gandhinagar',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 35,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 2,
    isDeliverable: true,
  },

  // --- Surat Hubs ---
  {
    id: 'area-gj-395007',
    pincode: '395007',
    areaName: 'Vesu, Piplod, Athwa Lines, Dumas Road',
    city: 'Surat',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 35,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 3,
    isDeliverable: true,
  },
  {
    id: 'area-gj-395009',
    pincode: '395009',
    areaName: 'Adajan, Pal, Gaurav Path, Jahangirpura',
    city: 'Surat',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 35,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 3,
    isDeliverable: true,
  },
  {
    id: 'area-gj-395006',
    pincode: '395006',
    areaName: 'Varachha, Mini Bazar, Katargam',
    city: 'Surat',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 35,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 3,
    isDeliverable: true,
  },
  {
    id: 'area-gj-395001',
    pincode: '395001',
    areaName: 'Ring Road, Textile Market, Nanpura, Station',
    city: 'Surat',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 35,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 3,
    isDeliverable: true,
  },

  // --- Vadodara (Baroda) Hubs ---
  {
    id: 'area-gj-390007',
    pincode: '390007',
    areaName: 'Alkapuri, Race Course, Akota, Sayajiganj',
    city: 'Vadodara',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 35,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 3,
    isDeliverable: true,
  },
  {
    id: 'area-gj-390011',
    pincode: '390011',
    areaName: 'Manjalpur, Makarpura GIDC, Tarsali',
    city: 'Vadodara',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 35,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 3,
    isDeliverable: true,
  },
  {
    id: 'area-gj-390021',
    pincode: '390021',
    areaName: 'Gotri, Vasna-Bhayli Road, Sevasi',
    city: 'Vadodara',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 35,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 3,
    isDeliverable: true,
  },

  // --- Rajkot Hubs ---
  {
    id: 'area-gj-360005',
    pincode: '360005',
    areaName: 'Kalawad Road, University Road, Indira Circle',
    city: 'Rajkot',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 35,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 3,
    isDeliverable: true,
  },
  {
    id: 'area-gj-360001',
    pincode: '360001',
    areaName: 'Dr. Yagnik Road, Dharmendra Road, Rajkot City',
    city: 'Rajkot',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 35,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 3,
    isDeliverable: true,
  },
  {
    id: 'area-gj-360004',
    pincode: '360004',
    areaName: 'Mavdi, 150 Feet Ring Road, Gondal Road',
    city: 'Rajkot',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 35,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 3,
    isDeliverable: true,
  },

  // --- Bhavnagar & Jamnagar ---
  {
    id: 'area-gj-364002',
    pincode: '364002',
    areaName: 'Waghawadi Road, Kaliyabid, Vidhyanagar',
    city: 'Bhavnagar',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 40,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 4,
    isDeliverable: true,
  },
  {
    id: 'area-gj-364001',
    pincode: '364001',
    areaName: 'Bhavnagar Main City, Station Road, Crescent',
    city: 'Bhavnagar',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 40,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 4,
    isDeliverable: true,
  },
  {
    id: 'area-gj-361008',
    pincode: '361008',
    areaName: 'Digvijay Plot, Patel Colony, Reliance Greens road',
    city: 'Jamnagar',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 40,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 4,
    isDeliverable: true,
  },
  {
    id: 'area-gj-361001',
    pincode: '361001',
    areaName: 'Jamnagar City, Grain Market, Lal Bunglow',
    city: 'Jamnagar',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 40,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 4,
    isDeliverable: true,
  },

  // --- Anand & Kheda ---
  {
    id: 'area-gj-388001',
    pincode: '388001',
    areaName: 'Amul Dairy Road, Anand Town, Gamdi Vad',
    city: 'Anand',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 35,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 3,
    isDeliverable: true,
  },
  {
    id: 'area-gj-388120',
    pincode: '388120',
    areaName: 'Vallabh Vidyanagar Educational Hub, Bakrol',
    city: 'Anand',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 35,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 3,
    isDeliverable: true,
  },
  {
    id: 'area-gj-387001',
    pincode: '387001',
    areaName: 'Santram Mandir, College Road, Station Road',
    city: 'Nadiad',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 40,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 4,
    isDeliverable: true,
  },

  // --- Bharuch & Ankleshwar ---
  {
    id: 'area-gj-392001',
    pincode: '392001',
    areaName: 'Zadeshwar Road, Station Road, Link Road',
    city: 'Bharuch',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 40,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 4,
    isDeliverable: true,
  },
  {
    id: 'area-gj-393001',
    pincode: '393001',
    areaName: 'Ankleshwar GIDC, City Station Road',
    city: 'Ankleshwar',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 40,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 4,
    isDeliverable: true,
  },

  // --- Mehsana & Morbi ---
  {
    id: 'area-gj-384002',
    pincode: '384002',
    areaName: 'Radhanpur Road, Modhera Cross Road, Nagalpur',
    city: 'Mehsana',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 40,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 4,
    isDeliverable: true,
  },
  {
    id: 'area-gj-363641',
    pincode: '363641',
    areaName: 'Sanala Road, Ceramic Industrial Zone, Morbi City',
    city: 'Morbi',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 40,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 4,
    isDeliverable: true,
  },

  // --- Junagadh & Porbandar ---
  {
    id: 'area-gj-362001',
    pincode: '362001',
    areaName: 'Girnar Taleti Road, Zanzarda Road, Motibaug',
    city: 'Junagadh',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 40,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 6,
    isDeliverable: true,
  },
  {
    id: 'area-gj-360575',
    pincode: '360575',
    areaName: 'MG Road, Chowpati, Sudama Chowk',
    city: 'Porbandar',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 40,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 6,
    isDeliverable: true,
  },

  // --- South Gujarat: Navsari, Valsad, Vapi ---
  {
    id: 'area-gj-396445',
    pincode: '396445',
    areaName: 'Lunsikui, Station Road, Fuwara',
    city: 'Navsari',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 40,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 4,
    isDeliverable: true,
  },
  {
    id: 'area-gj-396001',
    pincode: '396001',
    areaName: 'Tithal Road, Halar, Dharampur Road',
    city: 'Valsad',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 40,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 4,
    isDeliverable: true,
  },
  {
    id: 'area-gj-396191',
    pincode: '396191',
    areaName: 'Vapi GIDC, Gunjan, Chala, Silvassa Road',
    city: 'Vapi',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 40,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 4,
    isDeliverable: true,
  },

  // --- Kutch: Bhuj & Gandhidham ---
  {
    id: 'area-gj-370001',
    pincode: '370001',
    areaName: 'Jubilee Ground, Station Road, Bhuj City',
    city: 'Bhuj (Kutch)',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 45,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 12,
    isDeliverable: true,
  },
  {
    id: 'area-gj-370201',
    pincode: '370201',
    areaName: 'Oslo Circle, Tagore Road, Gandhidham City',
    city: 'Gandhidham (Kutch)',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 45,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 12,
    isDeliverable: true,
  },

  // --- Other Key Gujarat Districts ---
  {
    id: 'area-gj-363001',
    pincode: '363001',
    areaName: 'Wadhwan, Main Bazar, Station Road',
    city: 'Surendranagar',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 40,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 6,
    isDeliverable: true,
  },
  {
    id: 'area-gj-384265',
    pincode: '384265',
    areaName: 'HNGU University, Rani ki Vav Road, Patan City',
    city: 'Patan',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 40,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 6,
    isDeliverable: true,
  },
  {
    id: 'area-gj-385001',
    pincode: '385001',
    areaName: 'Station Road, Aroma Circle, Palanpur City',
    city: 'Palanpur (Banaskantha)',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 40,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 6,
    isDeliverable: true,
  },
  {
    id: 'area-gj-383001',
    pincode: '383001',
    areaName: 'Motipura, Station Road, Sabarkantha',
    city: 'Himatnagar',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 40,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 6,
    isDeliverable: true,
  },
  {
    id: 'area-gj-389001',
    pincode: '389001',
    areaName: 'Vavdi, Civil Hospital Road, Godhra Town',
    city: 'Godhra (Panchmahal)',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 40,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 6,
    isDeliverable: true,
  },
  {
    id: 'area-gj-365601',
    pincode: '365601',
    areaName: 'Station Road, Lathi Road, Amreli Town',
    city: 'Amreli',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 40,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 6,
    isDeliverable: true,
  },
  {
    id: 'area-gj-362265',
    pincode: '362265',
    areaName: 'Somnath Temple Road, Prabhas Patan, Bypass',
    city: 'Veraval (Gir Somnath)',
    state: 'Gujarat',
    minOrderValue: 149,
    deliveryCharge: 40,
    freeDeliveryAbove: 499,
    estimatedDeliveryHours: 8,
    isDeliverable: true,
  },
];

/**
 * Checks if a given 6-digit PIN code belongs to Gujarat circle (36xxxx, 37xxxx, 38xxxx, 39xxxx)
 */
export function isGujaratPincode(pincode: string): boolean {
  if (!pincode) return false;
  const clean = pincode.toString().trim();
  return /^(36|37|38|39)\d{4}$/.test(clean);
}

/**
 * Maps a Gujarat PIN prefix to the corresponding district / major city
 */
export function getGujaratCityByPincode(pincode: string): { city: string; areaName: string } {
  const p = pincode.trim();
  const prefix3 = p.slice(0, 3);

  switch (prefix3) {
    case '380':
      return { city: 'Ahmedabad', areaName: `Ahmedabad Zone (${p})` };
    case '382':
      return { city: 'Gandhinagar / Ahmedabad Rural', areaName: `Gandhinagar / North Ahmedabad (${p})` };
    case '383':
      return { city: 'Himatnagar (Sabarkantha)', areaName: `Sabarkantha District (${p})` };
    case '384':
      return { city: 'Mehsana / Patan', areaName: `North Gujarat Zone (${p})` };
    case '385':
      return { city: 'Palanpur (Banaskantha)', areaName: `Banaskantha District (${p})` };
    case '387':
      return { city: 'Nadiad (Kheda)', areaName: `Kheda District (${p})` };
    case '388':
      return { city: 'Anand', areaName: `Anand District (${p})` };
    case '389':
      return { city: 'Godhra / Dahod / Panchmahal', areaName: `Panchmahal District (${p})` };
    case '390':
      return { city: 'Vadodara', areaName: `Vadodara Zone (${p})` };
    case '391':
      return { city: 'Vadodara Rural / Chhota Udepur', areaName: `Vadodara Rural Zone (${p})` };
    case '392':
      return { city: 'Bharuch', areaName: `Bharuch / Narmada Zone (${p})` };
    case '393':
      return { city: 'Ankleshwar', areaName: `Ankleshwar Industrial Zone (${p})` };
    case '394':
      return { city: 'Surat Rural', areaName: `Surat Rural Zone (${p})` };
    case '395':
      return { city: 'Surat', areaName: `Surat City Zone (${p})` };
    case '396':
      return { city: 'Vapi / Valsad / Navsari', areaName: `South Gujarat Zone (${p})` };
    case '360':
      return { city: 'Rajkot', areaName: `Rajkot City Zone (${p})` };
    case '361':
      return { city: 'Jamnagar / Dwarka', areaName: `Jamnagar District (${p})` };
    case '362':
      return { city: 'Junagadh / Gir Somnath', areaName: `Junagadh / Gir Zone (${p})` };
    case '363':
      return { city: 'Surendranagar / Morbi', areaName: `Surendranagar / Morbi Zone (${p})` };
    case '364':
      return { city: 'Bhavnagar / Botad', areaName: `Bhavnagar / Botad Zone (${p})` };
    case '365':
      return { city: 'Amreli', areaName: `Amreli District (${p})` };
    case '370':
      return { city: 'Bhuj / Gandhidham (Kutch)', areaName: `Kutch District (${p})` };
    default:
      return { city: 'Gujarat', areaName: `Gujarat Serviceable Area (${p})` };
  }
}

/**
 * Resolves delivery area info for any Gujarat PIN code
 */
export function resolveDeliveryArea(pincode: string): DeliveryAreaInfo | null {
  const clean = pincode.trim();
  const directMatch = gujaratDeliveryAreas.find((a) => a.pincode === clean);
  if (directMatch) {
    return directMatch;
  }

  if (isGujaratPincode(clean)) {
    const { city, areaName } = getGujaratCityByPincode(clean);
    return {
      pincode: clean,
      areaName,
      city,
      state: 'Gujarat',
      minOrderValue: 149,
      deliveryCharge: 40,
      freeDeliveryAbove: 499,
      estimatedDeliveryHours: 24,
      isDeliverable: true,
    };
  }

  return null;
}

