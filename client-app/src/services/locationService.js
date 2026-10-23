/**
 * Address validation used only during checkout.
 * Browser geolocation and near-me discovery are intentionally not included.
 */

// Entire Mumbai Metropolitan Region (MMR) Contiguous Geographic Bounding Box
export const MUMBAI_BOUNDING_BOX = {
  minLat: 18.700,
  maxLat: 19.550,
  minLng: 72.650,
  maxLng: 73.400
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

