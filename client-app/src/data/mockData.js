export const CATEGORIES = [
  { id: 'all', name: 'All Services', icon: 'Wrench', count: 48 },
  { id: 'plumber', name: 'Plumbers', icon: 'Droplets', count: 12, desc: 'Pipe fitting, bathroom leakages, tap repairs, motor setup' },
  { id: 'electrician', name: 'Electricians', icon: 'Zap', count: 15, desc: 'Wiring, MCB switches, ceiling fan, main breaker repair' },
  { id: 'mistry', name: 'Construction Mistry', icon: 'HardHat', count: 8, desc: 'Brickwork, slab casting, concrete plastering, column mistry' },
  { id: 'painter', name: 'House Painters', icon: 'Paintbrush', count: 6, desc: 'Wall putty, primer coat, texture paint, exterior waterproofing' },
  { id: 'carpenter', name: 'Carpenters', icon: 'Hammer', count: 7, desc: 'Wooden doors, modular kitchen, bed framing, lock repair' },
  { id: 'mason', name: 'Tile & Mason Workers', icon: 'Grid', count: 5, desc: 'Marble flooring, wall tiles, bathroom slates, granite fitting' },
  { id: 'welder', name: 'Welders & Metal', icon: 'Flame', count: 4, desc: 'Iron gates, window grills, staircase railing welding' },
  { id: 'cleaner', name: 'Site Cleaners', icon: 'Sparkles', count: 9, desc: 'Post-construction debris cleanup, deep home cleaning' },
];

export const INITIAL_WORKERS = [];

export const POPULAR_SERVICES = [
  {
    id: 'srv-1',
    title: 'Tap & Mixer Repair / Leakage',
    category: 'plumber',
    categoryName: 'Plumbing',
    price: 199,
    timeEst: '30 mins',
    rating: 4.85,
    reviews: '28k+',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    description: 'Diagnosis & complete fix for leaking taps, valves, or flush tanks.'
  },
  {
    id: 'srv-2',
    title: 'Switchboard & Socket Installation',
    category: 'electrician',
    categoryName: 'Electrical',
    price: 149,
    timeEst: '25 mins',
    rating: 4.9,
    reviews: '34k+',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    description: 'Safe replacement of 6A/16A switches, MCBs, or heavy appliance sockets.'
  },
  {
    id: 'srv-3',
    title: 'Wooden Door Lock & Handle Fitting',
    category: 'carpenter',
    categoryName: 'Carpentry',
    price: 299,
    timeEst: '45 mins',
    rating: 4.78,
    reviews: '14k+',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
    description: 'Installation of mortise locks, handles, or wooden cupboard repairs.'
  },
  {
    id: 'srv-4',
    title: 'Wall Putty & 1-Wall Texture Paint',
    category: 'painter',
    categoryName: 'Painting',
    price: 899,
    timeEst: '3 hrs',
    rating: 4.92,
    reviews: '19k+',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
    description: 'Premium acrylic paint coat with zero mess and spotless edge finishes.'
  },
  {
    id: 'srv-5',
    title: 'Deep Home & Bathroom Sanitation',
    category: 'cleaner',
    categoryName: 'Cleaning',
    price: 499,
    timeEst: '1.5 hrs',
    rating: 4.88,
    reviews: '41k+',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
    description: 'Tile descaling, stain removal, and mechanized floor scrubbing.'
  },
  {
    id: 'srv-6',
    title: 'Tile Grouting & Broken Tile Fix',
    category: 'mason',
    categoryName: 'Masonry',
    price: 349,
    timeEst: '1 hr',
    rating: 4.75,
    reviews: '9k+',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
    description: 'Epoxy grouting and precision leveling for kitchen and bathroom tiles.'
  }
];

export const TRADE_SERVICES = {
  plumber: {
    heroVideoThumb: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
    heroTagline: 'Certified Sanitary & Water Piping Solutions',
    subcategories: [
      { id: 'packages', name: 'Value Packages', icon: 'Sparkles', image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=200&q=80' },
      { id: 'tap_mixer', name: 'Taps & Mixers', icon: 'Droplets', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=200&q=80' },
      { id: 'toilet_flush', name: 'Toilet & Flush', icon: 'Wrench', image: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=200&q=80' },
      { id: 'drainage', name: 'Blockage & Drain', icon: 'Layers', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=200&q=80' },
      { id: 'geyser_motor', name: 'Water Motor & Tank', icon: 'Zap', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=200&q=80' }
    ],
    items: [
      {
        id: 'plumb-pkg-1',
        subcatId: 'packages',
        badge: 'POPULAR COMBO',
        title: 'Full Bathroom Tap & Leakage Overhaul',
        rating: 4.88,
        reviewsCount: '24k reviews',
        price: 399,
        originalPrice: 499,
        duration: '45 mins',
        features: ['Up to 3 tap washers & Teflon sealant', 'Shower pressure calibration', 'Under-sink trap descaling'],
        description: 'Complete inspection and fix for all leaking points in 1 bathroom.'
      },
      {
        id: 'plumb-pkg-2',
        subcatId: 'packages',
        badge: 'SAVER PACK',
        title: 'Kitchen & Wash Basin Repair Pack',
        rating: 4.92,
        reviewsCount: '19k reviews',
        price: 299,
        originalPrice: 380,
        duration: '35 mins',
        features: ['Sink mixer servicing', 'Waste coupling replacement', 'Angle valve repair'],
        description: 'Instant resolution for kitchen sink leaks and low water flow.'
      },
      {
        id: 'plumb-tap-1',
        subcatId: 'tap_mixer',
        badge: 'BESTSELLER',
        title: 'Tap Repair / Spindle Replacement',
        rating: 4.85,
        reviewsCount: '32k reviews',
        price: 149,
        originalPrice: 199,
        duration: '20 mins',
        features: ['Precision ceramic spindle replacement', 'Zero drip guarantee'],
        description: 'For dripping taps, tight knobs, or loose fittings.'
      },
      {
        id: 'plumb-tap-2',
        subcatId: 'tap_mixer',
        badge: 'SERVICE',
        title: 'Wall Mixer / Diverter Installation',
        rating: 4.8,
        reviewsCount: '11k reviews',
        price: 299,
        originalPrice: 350,
        duration: '40 mins',
        features: ['Hot & cold water line balance', 'Concealed body alignment'],
        description: 'Complete replacement or new setup of bathroom wall mixers.'
      },
      {
        id: 'plumb-flush-1',
        subcatId: 'toilet_flush',
        badge: 'SERVICE',
        title: 'Flush Tank Syphon & Ball Valve Fix',
        rating: 4.79,
        reviewsCount: '15k reviews',
        price: 249,
        originalPrice: 300,
        duration: '30 mins',
        features: ['Continuous flush water stop', 'Inlet diaphragm replacement'],
        description: 'Resolves continuous water leakage in Western or Indian toilet tanks.'
      }
    ]
  },
  electrician: {
    heroVideoThumb: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
    heroTagline: 'Certified Power & Safe Circuit Works',
    subcategories: [
      { id: 'packages', name: 'Safe Home Combos', icon: 'Sparkles', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=200&q=80' },
      { id: 'switch_socket', name: 'Switches & Sockets', icon: 'Zap', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=200&q=80' },
      { id: 'fan_light', name: 'Fan & Light Setup', icon: 'Wrench', image: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?auto=format&fit=crop&w=200&q=80' },
      { id: 'mcb_fuse', name: 'MCB & Fuse Tripping', icon: 'Shield', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=200&q=80' }
    ],
    items: [
      {
        id: 'elec-pkg-1',
        subcatId: 'packages',
        badge: 'TOP VALUE',
        title: '3-Point Switchboard & Safety Inspection',
        rating: 4.9,
        reviewsCount: '45k reviews',
        price: 349,
        originalPrice: 450,
        duration: '40 mins',
        features: ['Up to 3 switchboard repairs', 'Earthing voltage audit', 'MCB load check'],
        description: 'Complete electrical checkup for living room or kitchen.'
      },
      {
        id: 'elec-sw-1',
        subcatId: 'switch_socket',
        badge: 'QUICK FIX',
        title: 'Switch / Socket Replacement',
        rating: 4.87,
        reviewsCount: '62k reviews',
        price: 99,
        originalPrice: 150,
        duration: '15 mins',
        features: ['6A/16A modular switch installation', 'Sparking test & terminal tightening'],
        description: 'Safe replacement of burnt or faulty switches and power plugs.'
      },
      {
        id: 'elec-fan-1',
        subcatId: 'fan_light',
        badge: 'POPULAR',
        title: 'Ceiling Fan Installation / Uninstallation',
        rating: 4.83,
        reviewsCount: '28k reviews',
        price: 179,
        originalPrice: 220,
        duration: '25 mins',
        features: ['Downrod lock & canopy fit', 'Blade angle balance & regulator sync'],
        description: 'Hassle-free ceiling fan mounting with proper anchoring.'
      }
    ]
  },
  carpenter: {
    heroVideoThumb: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
    heroTagline: 'Precision Woodwork & Furniture Crafting',
    subcategories: [
      { id: 'packages', name: 'Furniture Combos', icon: 'Sparkles', image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=200&q=80' },
      { id: 'lock_handle', name: 'Locks & Handles', icon: 'Wrench', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=200&q=80' },
      { id: 'door_hinge', name: 'Doors & Hinges', icon: 'Layers', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=200&q=80' },
      { id: 'wardrobe_bed', name: 'Wardrobe & Beds', icon: 'Grid', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=200&q=80' }
    ],
    items: [
      {
        id: 'carp-pkg-1',
        subcatId: 'packages',
        badge: 'BESTSELLER',
        title: 'Full Door & Lock Alignment Pack',
        rating: 4.86,
        reviewsCount: '16k reviews',
        price: 449,
        originalPrice: 550,
        duration: '50 mins',
        features: ['Door bottom planing for smooth glide', 'Mortise lock lubrication', 'Hinge screw tightening'],
        description: 'Fix stuck, squeaking, or misaligned wooden doors.'
      },
      {
        id: 'carp-lock-1',
        subcatId: 'lock_handle',
        badge: 'SECURITY',
        title: 'Main Door Mortise Lock Fitting',
        rating: 4.91,
        reviewsCount: '21k reviews',
        price: 299,
        originalPrice: 380,
        duration: '35 mins',
        features: ['Precision mortise cavity drilling', 'Handle latch calibration'],
        description: 'New installation or replacement of main door locks and latches.'
      }
    ]
  },
  painter: {
    heroVideoThumb: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1200&q=80',
    heroTagline: 'Professional Royal Finish Wall Emulsions',
    subcategories: [
      { id: 'packages', name: 'Room Makeovers', icon: 'Sparkles', image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=200&q=80' },
      { id: 'touchup', name: 'Wall Putty & Touchups', icon: 'Paintbrush', image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=200&q=80' },
      { id: 'waterproofing', name: 'Waterproofing & Seepage', icon: 'Shield', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=200&q=80' }
    ],
    items: [
      {
        id: 'paint-pkg-1',
        subcatId: 'packages',
        badge: 'PREMIUM',
        title: '1-Room Express Paint Makeover',
        rating: 4.93,
        reviewsCount: '12k reviews',
        price: 1499,
        originalPrice: 1899,
        duration: '4 hrs',
        features: ['2 coats luxury acrylic emulsion', 'Floor masking & zero-mess guarantee', 'Crack filling with putty'],
        description: 'Complete transformation of 1 bedroom or living room.'
      },
      {
        id: 'paint-putty-1',
        subcatId: 'touchup',
        badge: 'QUICK TOUCHUP',
        title: 'Seepage Patch & Putty Repair',
        rating: 4.82,
        reviewsCount: '18k reviews',
        price: 499,
        originalPrice: 650,
        duration: '1 hr',
        features: ['Scraping loose paint', 'Waterproof putty application', 'Sanding for glass finish'],
        description: 'Repairs peeled or damp patches on walls.'
      }
    ]
  }
};

export const CUSTOMER_REVIEWS = [
  {
    id: 'rev-1',
    clientName: 'Priya Sharma',
    city: 'Mumbai',
    tradeUsed: 'Plumbing Service',
    rating: 5,
    comment: 'Harish was at my home within 25 minutes. Repaired the bathroom mixer faucet with zero extra hassle. Very clean work!',
    date: 'Yesterday'
  },
  {
    id: 'rev-2',
    clientName: 'Ankit Mehta',
    city: 'Delhi NCR',
    tradeUsed: 'Electrician Service',
    rating: 5,
    comment: 'Booked Aamir for short circuit fault finding. Super polite, professional, and transparent about rates. Highly recommend kaam!',
    date: '3 days ago'
  },
  {
    id: 'rev-3',
    clientName: 'Sunita Rao',
    city: 'Bengaluru',
    tradeUsed: 'Carpentry Repair',
    rating: 5,
    comment: 'Fixed our sagging modular wardrobe in under an hour. Great craftsmanship and genuine background-verified professional.',
    date: '1 week ago'
  }
];

