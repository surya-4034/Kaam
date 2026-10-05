/**
 * 📍 Client Location Helper Unit Module
 * Handles HTML5 Geolocation API auto-detection, distance badges,
 * and whole-city Mumbai Metropolitan Region (MMR) boundary enforcement.
 */

// Default Fallback Coordinates (Mumbai Center)
export const DEFAULT_CLIENT_LOCATION = {
  lat: 19.0760,
  lng: 72.8777,
  city: 'Mumbai',
  locality: 'Mumbai (All Neighborhoods)'
};

// Entire Mumbai Metropolitan Region (MMR) Contiguous Geographic Bounding Box
export const MUMBAI_BOUNDING_BOX = {
  minLat: 18.700,
  maxLat: 19.550,
  minLng: 72.650,
  maxLng: 73.400
};

// Known Mumbai Neighborhoods & Regions for quick navigation
export const MUMBAI_LOCATIONS = [
  { name: 'Mumbai (All Neighborhoods)', lat: 19.0760, lng: 72.8777, zone: 'Central' },
  // Western Suburbs
  { name: 'Andheri West', lat: 19.1363, lng: 72.8277, zone: 'Western Suburbs' },
  { name: 'Andheri East', lat: 19.1155, lng: 72.8679, zone: 'Western Suburbs' },
  { name: 'Bandra West', lat: 19.0596, lng: 72.8295, zone: 'Western Suburbs' },
  { name: 'Bandra East / BKC', lat: 19.0660, lng: 72.8680, zone: 'Western Suburbs' },
  { name: 'Juhu', lat: 19.1075, lng: 72.8263, zone: 'Western Suburbs' },
  { name: 'Goregaon West', lat: 19.1663, lng: 72.8526, zone: 'Western Suburbs' },
  { name: 'Malad West', lat: 19.1874, lng: 72.8484, zone: 'Western Suburbs' },
  { name: 'Kandivali West', lat: 19.2045, lng: 72.8376, zone: 'Western Suburbs' },
  { name: 'Borivali West', lat: 19.2307, lng: 72.8567, zone: 'Western Suburbs' },
  { name: 'Santacruz West', lat: 19.0843, lng: 72.8360, zone: 'Western Suburbs' },
  { name: 'Vile Parle', lat: 19.0998, lng: 72.8441, zone: 'Western Suburbs' },
  // South Mumbai
  { name: 'Colaba / South Mumbai', lat: 18.9067, lng: 72.8147, zone: 'South Mumbai' },
  { name: 'Marine Drive / Nariman Point', lat: 18.9432, lng: 72.8230, zone: 'South Mumbai' },
  { name: 'Dadar West', lat: 19.0178, lng: 72.8478, zone: 'South Mumbai' },
  { name: 'Worli / Lower Parel', lat: 19.0134, lng: 72.8197, zone: 'South Mumbai' },
  { name: 'Byculla', lat: 18.9774, lng: 72.8331, zone: 'South Mumbai' },
  // Eastern Suburbs
  { name: 'Powai', lat: 19.1176, lng: 72.9060, zone: 'Eastern Suburbs' },
  { name: 'Kurla West', lat: 19.0726, lng: 72.8845, zone: 'Eastern Suburbs' },
  { name: 'Ghatkopar West', lat: 19.0860, lng: 72.9090, zone: 'Eastern Suburbs' },
  { name: 'Chembur', lat: 19.0522, lng: 72.8994, zone: 'Eastern Suburbs' },
  { name: 'Mulund West', lat: 19.1726, lng: 72.9565, zone: 'Eastern Suburbs' },
  // Extended MMR
  { name: 'Thane West', lat: 19.2183, lng: 72.9781, zone: 'Thane & Navi Mumbai' },
  { name: 'Thane East', lat: 19.1870, lng: 72.9730, zone: 'Thane & Navi Mumbai' },
  { name: 'Kalyan', lat: 19.2437, lng: 73.1355, zone: 'Thane & Navi Mumbai' },
  { name: 'Dombivli', lat: 19.2184, lng: 73.0867, zone: 'Thane & Navi Mumbai' },
  { name: 'Ulhasnagar', lat: 19.2215, lng: 73.1645, zone: 'Thane & Navi Mumbai' },
  { name: 'Vashi (Navi Mumbai)', lat: 19.0771, lng: 72.9986, zone: 'Thane & Navi Mumbai' },
  { name: 'Nerul (Navi Mumbai)', lat: 19.0330, lng: 73.0160, zone: 'Thane & Navi Mumbai' },
  { name: 'Kharghar (Navi Mumbai)', lat: 19.0470, lng: 73.0690, zone: 'Thane & Navi Mumbai' },
  { name: 'Mira Road', lat: 19.2812, lng: 72.8561, zone: 'Thane & Navi Mumbai' },
  { name: 'Panvel', lat: 18.9894, lng: 73.1175, zone: 'Thane & Navi Mumbai' },
  // Outside Cities (Provided to test and verify boundary enforcement)
  { name: 'Delhi NCR (Outside Mumbai)', lat: 28.6139, lng: 77.2090, zone: 'Outside Operating Zone' },
  { name: 'Noida, UP (Outside Mumbai)', lat: 28.5355, lng: 77.3910, zone: 'Outside Operating Zone' },
  { name: 'Bengaluru, KA (Outside Mumbai)', lat: 12.9716, lng: 77.5946, zone: 'Outside Operating Zone' },
  { name: 'Pune, MH (Outside Mumbai)', lat: 18.5204, lng: 73.8567, zone: 'Outside Operating Zone' }
];

export const CITY_COORDINATES = {
  ...MUMBAI_LOCATIONS.reduce((acc, loc) => {
    acc[loc.name] = { lat: loc.lat, lng: loc.lng, city: loc.zone === 'Outside Operating Zone' ? loc.name : 'Mumbai', zone: loc.zone };
    return acc;
  }, {}),
  'Mumbai, MH': { lat: 19.0760, lng: 72.8777, city: 'Mumbai', zone: 'Central' },
  'Mumbai': { lat: 19.0760, lng: 72.8777, city: 'Mumbai', zone: 'Central' },
  'Delhi NCR': { lat: 28.6139, lng: 77.2090, city: 'Delhi', zone: 'Outside Operating Zone' },
  'Noida, UP': { lat: 28.5355, lng: 77.3910, city: 'Noida', zone: 'Outside Operating Zone' },
  'Bengaluru, KA': { lat: 12.9716, lng: 77.5946, city: 'Bengaluru', zone: 'Outside Operating Zone' },
  'Pune, MH': { lat: 18.5204, lng: 73.8567, city: 'Pune', zone: 'Outside Operating Zone' },
  'Hyderabad, TS': { lat: 17.3850, lng: 78.4867, city: 'Hyderabad', zone: 'Outside Operating Zone' },
  'Lucknow, UP': { lat: 26.8467, lng: 80.9462, city: 'Lucknow', zone: 'Outside Operating Zone' },
  'Gurgaon, HR': { lat: 28.4595, lng: 77.0266, city: 'Gurgaon', zone: 'Outside Operating Zone' },
};

/**
 * Validates whether a text location or coordinate point is inside the whole Mumbai coverage area.
 * Returns { isAvailable: boolean, message?: string }
 */
export const isMumbaiLocation = (textOrAddress = '', coords = null) => {
  const UNAVAILABLE_MSG = 'Service was unavailable at this place, sorry for inconvenience!';

  // 1. Check text string first (address, city name, locality)
  if (textOrAddress && typeof textOrAddress === 'string') {
    const clean = textOrAddress.toLowerCase().trim();

    // Check explicit non-Mumbai markers
    if (clean.includes('outside mumbai') || clean.includes('outside operating zone')) {
      return { isAvailable: false, message: UNAVAILABLE_MSG };
    }

    const outsideIndicators = [
      'noida', 'delhi', 'gurgaon', 'gurugram', 'faridabad', 'ghaziabad',
      'pune', 'bengaluru', 'bangalore', 'hyderabad', 'lucknow',
      'kanpur', 'patna', 'gaya', 'kolkata', 'chennai', 'ahmedabad', 'jaipur'
    ];
    if (outsideIndicators.some(ind => clean.includes(ind) && !clean.includes('mumbai') && !clean.includes('bombay') && !clean.includes('thane'))) {
      return { isAvailable: false, message: UNAVAILABLE_MSG };
    }

    // Check PIN codes (400xxx, 401xxx, 421xxx for MMR)
    if (/\b(40[01]\d{3}|421\d{3})\b/.test(clean)) {
      return { isAvailable: true };
    }

    // Check Mumbai neighborhoods keywords (covering all zones of Mumbai & MMR)
    const mumbaiKeywords = [
      'mumbai', 'bombay', 'bandra', 'andheri', 'borivali', 'dadar', 'kurla', 'colaba', 'powai',
      'juhu', 'goregaon', 'malad', 'kandivali', 'dahisar', 'ghatkopar', 'mulund', 'bhandup',
      'chembur', 'vikhroli', 'santacruz', 'vile parle', 'worli', 'lower parel', 'mahim', 'byculla',
      'charni road', 'grant road', 'parel', 'sion', 'wadala', 'sewri', 'antop hill', 'trombay',
      'govandi', 'mankhurd', 'thane', 'navi mumbai', 'vashi', 'nerul', 'seawoods', 'belapur',
      'kharghar', 'airoli', 'ghansoli', 'kopar khairane', 'mira road', 'bhayandar', 'kalyan',
      'dombivli', 'fort', 'nariman point', 'marine drive', 'churchgate', 'cst', 'prabhadevi',
      'matunga', 'pali hill', 'versova', 'lokhandwala', 'oshiwara', 'jogeshwari', 'bkc',
      'bandra kurla complex', 'hiranandani', 'kanjurmarg', 'ghodbunder', 'majiwada',
      'ulhasnagar', 'badlapur', 'ambernath', 'panvel', 'vasai', 'virar', 'kalwa', 'mumbra', 'bhiwandi', 'titwala'
    ];

    if (mumbaiKeywords.some(kw => clean.includes(kw))) {
      return { isAvailable: true };
    }
  }

  // 2. Check coordinates if valid non-zero numbers provided
  if (coords && typeof coords === 'object') {
    const lat = Number(coords.lat || coords.latitude);
    const lng = Number(coords.lng || coords.longitude);

    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      const inBox = (
        lat >= MUMBAI_BOUNDING_BOX.minLat &&
        lat <= MUMBAI_BOUNDING_BOX.maxLat &&
        lng >= MUMBAI_BOUNDING_BOX.minLng &&
        lng <= MUMBAI_BOUNDING_BOX.maxLng
      );
      if (inBox) {
        return { isAvailable: true };
      }
      return { isAvailable: false, message: UNAVAILABLE_MSG };
    }
  }

  // If text is empty and no coords, default to available
  if (!textOrAddress && !coords) {
    return { isAvailable: true };
  }

  return { isAvailable: false, message: UNAVAILABLE_MSG };
};

/**
 * Get current browser GPS location via HTML5 Geolocation API
 * @returns {Promise<{lat: number, lng: number, isMumbai: boolean}>}
 */
export const getCurrentClientLocation = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('⚠️ Geolocation is not supported by this browser.');
      return resolve({ ...DEFAULT_CLIENT_LOCATION, isMumbai: true });
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const check = isMumbaiLocation('', { lat, lng });
        resolve({
          lat,
          lng,
          isMumbai: check.isAvailable
        });
      },
      (error) => {
        console.warn('⚠️ Client Geolocation access denied or unavailable:', error.message);
        resolve({ ...DEFAULT_CLIENT_LOCATION, isMumbai: true });
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000
      }
    );
  });
};

/**
 * Formats distance into a human-readable badge text (e.g., "📍 3.2 km away")
 * @param {number} distanceKm 
 * @returns {string} Badge text
 */
export const formatDistanceBadge = (distanceKm) => {
  if (distanceKm === undefined || distanceKm === null || isNaN(distanceKm)) {
    return '📍 Near you in Mumbai';
  }
  const dist = Number(distanceKm);
  if (dist < 0.5) {
    return '📍 < 500m away (Nearby)';
  }
  return `📍 ${dist.toFixed(1)} km away`;
};
