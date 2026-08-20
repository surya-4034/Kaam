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
