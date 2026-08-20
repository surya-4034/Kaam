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

export const INITIAL_WORKERS = [
  {
    id: 'w-1',
    name: 'Harish Namdev',
    phone: '+91 98765 43210',
    locality: 'Sector 62, Noida',
    trade: 'plumber',
    tradeTitle: 'Plumber',
    distance: 1.8,
    experience: 8,
    dailyRate: 800,
    hourlyRate: 140,
    rating: 4.9,
    reviewCount: 118,
    completedJobsCount: 184,
    isAvailable: true,
    kycStatus: 'VERIFIED',
    photo: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=600&q=80',
    bio: 'Arrived on time, diagnosed the leak in minutes, and left the kitchen spotless. 8 years heavy plumbing and sanitary experience.',
    portfolioImages: [
      {
        id: 'p-1',
        title: 'Modern Bathroom Concealed Fitting',
        category: 'Plumbing',
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
        date: 'Aug 2026',
        description: 'Installed 32mm CPVC pipes and concealed shower valves for 3-story house.'
      },
      {
        id: 'p-1b',
        title: 'Kitchen Sink Trap Replacement',
        category: 'Plumbing',
        url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
        date: 'Aug 2026',
        description: 'Repaired kitchen drainage trap with zero leaks.'
      }
    ]
  },
  {
    id: 'w-2',
    name: 'Aamir Khan',
    phone: '+91 98123 76543',
    locality: 'Indirapuram, Ghaziabad',
    trade: 'electrician',
    tradeTitle: 'Electrician',
    distance: 2.4,
    experience: 10,
    dailyRate: 810,
    hourlyRate: 150,
    rating: 4.8,
    reviewCount: 94,
    completedJobsCount: 130,
    isAvailable: true,
    kycStatus: 'VERIFIED',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    bio: 'Very clear about the work and the cost. Specializes in 3-phase house wiring, MCB panel installation, and inverter setup.',
    portfolioImages: [
      {
        id: 'p-2',
        title: 'Main MCB Distribution Panel Wiring',
        category: 'Electrical',
        url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
        date: 'Aug 2026',
        description: 'Organized 12-way distribution box with surge protection for new villa.'
      }
    ]
  },
  {
    id: 'w-3',
    name: 'Joan D\'Souza',
    phone: '+91 98334 11223',
    locality: 'Sector 18, Noida',
    trade: 'carpenter',
    tradeTitle: 'Carpenter',
    distance: 3.1,
    experience: 14,
    dailyRate: 950,
    hourlyRate: 180,
    rating: 4.7,
    reviewCount: 76,
    completedJobsCount: 112,
    isAvailable: true,
    kycStatus: 'VERIFIED',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    bio: 'The bookshelf finish is beautiful. 14 years crafting bespoke wood furniture, modular kitchens, and door frames.',
    portfolioImages: [
      {
        id: 'p-3',
        title: 'Modular Kitchen Teak Cabinets',
        category: 'Carpentry',
        url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
        date: 'Aug 2026',
        description: 'Built custom waterproof ply kitchen with soft-close hinges.'
      }
    ]
  },
  {
    id: 'w-4',
    name: 'Bhavna Reddy',
    phone: '+91 98450 99887',
    locality: 'Sector 63, Noida',
    trade: 'painter',
    tradeTitle: 'Painter',
    distance: 4.7,
    experience: 9,
    dailyRate: 1200,
    hourlyRate: 200,
    rating: 4.9,
    reviewCount: 62,
    completedJobsCount: 88,
    isAvailable: true,
    kycStatus: 'VERIFIED',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    bio: 'Neat edges, no paint on the floor, and a quick turnaround. Expert in royal luxury emulsions, wall putty, and waterproofing.',
    portfolioImages: [
      {
        id: 'p-4',
        title: 'Accent Wall Geometric Texture',
        category: 'Painting',
        url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
        date: 'Aug 2026',
        description: 'Living room metallic stencil texture paint with flawless coat.'
      }
    ]
  }
];

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
