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
    name: 'Ramesh Kumar Mistry',
    phone: '+91 98765 43210',
    locality: 'Sector 62, Noida / Indirapuram',
    trade: 'plumber',
    tradeTitle: 'Master Plumber & Pipe Fitter',
    experience: 8,
    dailyRate: 650,
    hourlyRate: 120,
    rating: 4.9,
    reviewCount: 142,
    completedJobsCount: 184,
    isAvailable: true,
    kycStatus: 'VERIFIED',
    bio: '8 years of experience in heavy plumbing, underground pipe laying, bathroom fittings, and motor installation.',
    portfolioImages: [
      {
        id: 'p-1',
        title: 'Modern Bathroom Concealed Fitting',
        category: 'Plumbing',
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
        date: 'Aug 2026',
        description: 'Installed 32mm CPVC pipes and concealed shower valves for 3-story house.'
      }
    ]
  },
  {
    id: 'w-2',
    name: 'Sunil Sharma',
    phone: '+91 98123 76543',
    locality: 'Indirapuram & Vaishali',
    trade: 'electrician',
    tradeTitle: 'Certified Senior Electrician',
    experience: 10,
    dailyRate: 750,
    hourlyRate: 150,
    rating: 4.8,
    reviewCount: 98,
    completedJobsCount: 130,
    isAvailable: true,
    kycStatus: 'VERIFIED',
    bio: 'Specialist in 3-phase house wiring, MCB panel installation, inverter setup, and emergency short-circuit fault repair.',
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
  }
];
