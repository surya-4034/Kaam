import React, { useState, useEffect } from 'react';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Plus,
  Minus,
  Check,
  Play,
  Share2,
  Sparkles,
  Award,
  ChevronRight,
  ChevronLeft,
  ShoppingCart,
  Camera,
  Eye,
  X,
  ImageIcon,
  Maximize2
} from 'lucide-react';
import { TRADE_SERVICES } from '../../data/mockData';

export const WorkerProfileDetail = ({
  worker,
  onBack,
  onBookNow,
  selectedCity = 'Mumbai',
  activeCategoryFilter = 'all',
  searchQuery = ''
}) => {
  // Helper for Trade Icons
  const getTradeIcon = (t) => {
    const low = (t || '').toLowerCase();
    if (low.includes('elec')) return '⚡';
    if (low.includes('plumb')) return '🔧';
    if (low.includes('paint')) return '🎨';
    if (low.includes('carp')) return '🪚';
    if (low.includes('clean')) return '🧹';
    if (low.includes('ac')) return '❄️';
    if (low.includes('mason') || low.includes('tile')) return '🧱';
    if (low.includes('weld')) return '👨‍🏭';
    return '🛠️';
  };

  // Trade catalog fallback to 'plumber' if not specifically mapped
  const tradeKey = (worker.trade || 'plumber').toLowerCase();

  // Trade Synonym & Keyword Map for Smart Matching
  const TRADE_SYNONYMS = {
    electrician: ['electrician', 'electric', 'electrical', 'wire', 'wiring', 'switch', 'switchboard', 'fan', 'light', 'mcb', 'fuse', 'socket', 'inverter'],
    plumber: ['plumber', 'plumbing', 'pipe', 'tap', 'leak', 'water', 'drain', 'basin', 'sink', 'toilet', 'flush', 'faucet'],
    carpenter: ['carpenter', 'carpentry', 'wood', 'furniture', 'door', 'window', 'table', 'bed', 'chair', 'cupboard', 'drawer', 'lock'],
    painter: ['painter', 'painting', 'paint', 'pa', 'wall', 'color', 'putty', 'primer', 'texture', 'waterproof'],
    ac_repair: ['ac', 'aircon', 'cooling', 'fridge', 'refrigerator', 'chiller', 'appliance', 'compressor'],
    cleaner: ['cleaner', 'cleaning', 'clean', 'wash', 'maid', 'sanitation', 'dust', 'sofa'],
    mason: ['mason', 'tile', 'marble', 'brick', 'granite', 'stone'],
    welder: ['welder', 'welding', 'iron', 'gate', 'grill', 'metal']
  };

  const resolveTrade = (term) => {
    if (!term || term === 'all') return null;
    const clean = term.toLowerCase().trim();
    for (const [trade, syns] of Object.entries(TRADE_SYNONYMS)) {
      if (trade === clean || syns.includes(clean) || syns.some(s => clean.includes(s) || s.includes(clean))) {
        return trade;
      }
    }
    return clean;
  };

  const cleanFilter = (activeCategoryFilter || 'all').toLowerCase().trim();
  const cleanQ = (searchQuery || '').toLowerCase().trim();
  const initialSearchedTrade = resolveTrade(cleanFilter !== 'all' ? cleanFilter : cleanQ);

  const rawPackages = worker.packages || [];

  // Extract distinct trade categories available on this worker across packages and categories
  const distinctTradeCategories = Array.from(new Set([
    ...rawPackages.map(p => (p.category || worker.trade || '').toLowerCase()).filter(Boolean),
    ...(Array.isArray(worker.categories) ? worker.categories.map(c => c.toLowerCase()) : [worker.trade?.toLowerCase() || 'plumber'])
  ])).filter(Boolean);

  const initialActiveTrade = (() => {
    if (initialSearchedTrade) {
      const match = distinctTradeCategories.find(c => c === initialSearchedTrade || c.includes(initialSearchedTrade) || initialSearchedTrade.includes(c));
      if (match) return match;
    }
    if (cleanFilter !== 'all') {
      const match = distinctTradeCategories.find(c => c === cleanFilter || c.includes(cleanFilter) || cleanFilter.includes(c));
      if (match) return match;
    }
    return distinctTradeCategories[0] || 'all';
  })();

  const [selectedTrade, setSelectedTrade] = useState(initialActiveTrade);

  // Dynamic catalog matching selected trade or worker's default trade
  const effectiveCatalogKey = (selectedTrade !== 'all' && TRADE_SERVICES[selectedTrade]) ? selectedTrade : (TRADE_SERVICES[tradeKey] ? tradeKey : 'plumber');
  const catalog = TRADE_SERVICES[effectiveCatalogKey] || TRADE_SERVICES.plumber;

  const [activeSubcat, setActiveSubcat] = useState(catalog.subcategories[0]?.id || 'packages');
  const [cartItems, setCartItems] = useState([]);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Past Work Portfolio Images
  const pastWorkImages = (Array.isArray(worker.portfolio) && worker.portfolio.length > 0)
    ? worker.portfolio
    : (Array.isArray(worker.portfolioImages) && worker.portfolioImages.length > 0)
      ? worker.portfolioImages
      : [];

  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState('all');
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightboxAt = (index) => {
    if (!pastWorkImages || pastWorkImages.length === 0) return;
    const safeIndex = Math.max(0, Math.min(index, pastWorkImages.length - 1));
    setLightboxIndex(safeIndex);
    setActiveLightboxImage(pastWorkImages[safeIndex]);
  };

  const handlePrevLightbox = () => {
    if (!pastWorkImages || pastWorkImages.length === 0) return;
    const prevIdx = (lightboxIndex - 1 + pastWorkImages.length) % pastWorkImages.length;
    setLightboxIndex(prevIdx);
    setActiveLightboxImage(pastWorkImages[prevIdx]);
  };

  const handleNextLightbox = () => {
    if (!pastWorkImages || pastWorkImages.length === 0) return;
    const nextIdx = (lightboxIndex + 1) % pastWorkImages.length;
    setLightboxIndex(nextIdx);
    setActiveLightboxImage(pastWorkImages[nextIdx]);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!activeLightboxImage) return;
      if (e.key === 'Escape') setActiveLightboxImage(null);
      if (e.key === 'ArrowLeft') handlePrevLightbox();
      if (e.key === 'ArrowRight') handleNextLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxImage, lightboxIndex, pastWorkImages]);

  // Filter items by selected subcategory
  const displayedItems = catalog.items.filter(item => item.subcatId === activeSubcat);

  const handleAddToCart = (item) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const handleRemoveFromCart = (itemId) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.qty > 1) {
        return prev.map(i => i.id === itemId ? { ...i, qty: i.qty - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const visitingCharge = Number(worker.visitingCharge || worker.visiting_charge || 149);

  // Filter packages strictly by selected trade (or show all if 'all' chosen)
  const hasCustomPackages = rawPackages.length > 0;

  const filteredRawPackages = rawPackages.filter(pkg => {
    if (selectedTrade === 'all') return true;
    const pCat = (pkg.category || worker.trade || '').toLowerCase().trim();
    const pTitle = (pkg.title || '').toLowerCase().trim();
    const pDesc = (pkg.description || '').toLowerCase().trim();

    if (pCat === selectedTrade || pCat.includes(selectedTrade) || selectedTrade.includes(pCat)) return true;
    const syns = TRADE_SYNONYMS[selectedTrade] || [];
    return syns.some(s => pCat.includes(s) || pTitle.includes(s) || pDesc.includes(s));
  });

  const packagesToUse = selectedTrade === 'all' ? rawPackages : filteredRawPackages;

  const customPackages = packagesToUse.map((pkg, i) => ({
    id: pkg.id || `pkg-${i}`,
    title: pkg.title,
    price: pkg.price,
    originalPrice: Math.round(pkg.price * 1.25),
    duration: pkg.duration || '1 hour',
    category: pkg.category || worker.trade,
    rating: '5.0',
    reviewsCount: worker.completedJobsCount || 12,
    badge: 'Verified Package',
    features: [pkg.description || 'Includes doorstep visit, inspection & complete service.']
  }));

  const itemsToRender = hasCustomPackages ? customPackages : displayedItems;

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] pb-24 animate-in fade-in">
      
      {/* Top Context Sub-Navbar */}
      <div className="bg-white border-b border-slate-200 sticky top-[65px] z-30 px-4 sm:px-8 py-3 shadow-sm">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-black text-slate-700 hover:text-slate-950 transition active:scale-95 group"
          >
            <span className="p-1.5 rounded-xl bg-slate-100 group-hover:bg-amber-100 transition">
              <ArrowLeft className="w-4 h-4 text-slate-700 group-hover:text-amber-800" />
            </span>
            <span>All {worker.tradeTitle || 'Trade'} Professionals</span>
          </button>

          {/* Worker summary chip */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src={worker.photo} alt={worker.name} className="w-8 h-8 rounded-full object-cover border border-amber-400" />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-extrabold text-slate-900 leading-none">{worker.name}</p>
                <p className="text-[10px] text-amber-700 font-bold">{worker.tradeTitle} • {worker.locality}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg text-xs font-black text-amber-900">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{worker.rating}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Main 3-Column Studio Layout */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: 2-COLUMN SELECT A SERVICE GRID (EXACT IMAGE) */}
          {/* ======================================================== */}
          <div className="lg:col-span-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm sticky top-[130px]">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              Select a service
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
              {catalog.subcategories.map((subcat) => {
                const isSelected = activeSubcat === subcat.id;
                return (
                  <button
                    key={subcat.id}
                    onClick={() => setActiveSubcat(subcat.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-200 group ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/60 shadow-sm ring-2 ring-amber-400/20'
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl overflow-hidden mb-2 bg-white shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                      <img src={subcat.image} alt={subcat.name} className="w-full h-full object-cover" />
                    </div>
                    <span className={`text-[11px] font-bold leading-tight ${isSelected ? 'text-amber-950 font-black' : 'text-slate-700'}`}>
                      {subcat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ======================================================== */}
          {/* CENTER COLUMN: HERO VIDEO PLAYER & PACKAGES CATALOG      */}
          {/* ======================================================== */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* ======================================================== */}
            {/* WHATSAPP-STYLE PHOTO SHOWCASE (REPLACES VIDEO PLAYER)     */}
            {/* ======================================================== */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-950 shadow-md border border-slate-200 group h-64 sm:h-80 w-full select-none">
              {pastWorkImages.length === 0 ? (
                /* Fallback 0 Photos: Verified Craftsman Guarantee Banner */
                <div className="relative w-full h-full bg-slate-950 flex flex-col justify-end p-6">
                  <img
                    src={catalog.heroVideoThumb || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80'}
                    alt="Craftsman Showcase"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent"></div>
                  <div className="relative z-10 space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs shadow-md">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified Partner Craftsmanship</span>
                    </span>
                    <h3 className="text-white text-lg sm:text-xl font-black drop-shadow">
                      {worker.name} • {worker.tradeTitle || 'Professional Services'}
                    </h3>
                    <p className="text-slate-300 text-xs max-w-lg leading-relaxed">
                      Doorstep inspection, genuine spare parts & transparent pricing guaranteed on every booking.
                    </p>
                  </div>
                </div>
              ) : pastWorkImages.length === 1 ? (
                /* 1 Photo: Full bleed view */
                <div
                  onClick={() => openLightboxAt(0)}
                  className="relative w-full h-full cursor-pointer overflow-hidden group/img"
                >
                  <img
                    src={pastWorkImages[0].url || pastWorkImages[0].image_url}
                    alt={pastWorkImages[0].title || 'Completed Work'}
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-80 group-hover/img:opacity-100 transition-opacity"></div>
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-xs font-black uppercase tracking-wider border border-white/20">
                      {pastWorkImages[0].category || pastWorkImages[0].category_tag || 'Past Work'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified Work
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                    <div>
                      <h4 className="text-white text-base font-black drop-shadow-sm line-clamp-1">
                        {pastWorkImages[0].title || 'Completed Project'}
                      </h4>
                      {pastWorkImages[0].description && (
                        <p className="text-slate-300 text-xs line-clamp-1 mt-0.5">
                          {pastWorkImages[0].description}
                        </p>
                      )}
                    </div>
                    <span className="p-2.5 rounded-full bg-white/95 text-slate-950 font-black text-xs flex items-center gap-1 shadow-lg shrink-0">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Expand</span>
                    </span>
                  </div>
                </div>
              ) : pastWorkImages.length === 2 ? (
                /* 2 Photos: 2-column split (50% / 50%) */
                <div className="grid grid-cols-2 gap-1.5 w-full h-full p-1 bg-slate-950">
                  {pastWorkImages.slice(0, 2).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      onClick={() => openLightboxAt(idx)}
                      className="relative w-full h-full overflow-hidden cursor-pointer group/cell"
                    >
                      <img
                        src={item.url || item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover/cell:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 opacity-60 group-hover/cell:opacity-90 transition-opacity"></div>
                      <div className="absolute bottom-2.5 left-2.5 right-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-black/60 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                          {item.category || item.category_tag || 'Work'}
                        </span>
                        <p className="text-white text-xs font-bold truncate mt-1 drop-shadow-sm">{item.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : pastWorkImages.length === 3 ? (
                /* 3 Photos: 1 large on left, 2 stacked on right */
                <div className="grid grid-cols-2 gap-1.5 w-full h-full p-1 bg-slate-950">
                  {/* Left: 1 large photo */}
                  <div
                    onClick={() => openLightboxAt(0)}
                    className="relative w-full h-full overflow-hidden cursor-pointer group/cell"
                  >
                    <img
                      src={pastWorkImages[0].url || pastWorkImages[0].image_url}
                      alt={pastWorkImages[0].title}
                      className="w-full h-full object-cover group-hover/cell:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 opacity-60 group-hover/cell:opacity-90 transition-opacity"></div>
                    <div className="absolute bottom-2.5 left-2.5 right-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-black/60 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                        {pastWorkImages[0].category || pastWorkImages[0].category_tag || 'Work'}
                      </span>
                      <p className="text-white text-xs font-bold truncate mt-1 drop-shadow-sm">{pastWorkImages[0].title}</p>
                    </div>
                  </div>

                  {/* Right: 2 stacked photos */}
                  <div className="grid grid-rows-2 gap-1.5 h-full">
                    {pastWorkImages.slice(1, 3).map((item, idx) => (
                      <div
                        key={item.id || (idx + 1)}
                        onClick={() => openLightboxAt(idx + 1)}
                        className="relative w-full h-full overflow-hidden cursor-pointer group/cell"
                      >
                        <img
                          src={item.url || item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover/cell:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 opacity-60 group-hover/cell:opacity-90 transition-opacity"></div>
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white text-[11px] font-bold truncate drop-shadow-sm">{item.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : pastWorkImages.length === 4 ? (
                /* 4 Photos: 2x2 equal grid */
                <div className="grid grid-cols-2 grid-rows-2 gap-1.5 w-full h-full p-1 bg-slate-950">
                  {pastWorkImages.slice(0, 4).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      onClick={() => openLightboxAt(idx)}
                      className="relative w-full h-full overflow-hidden cursor-pointer group/cell"
                    >
                      <img
                        src={item.url || item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover/cell:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 opacity-60 group-hover/cell:opacity-90 transition-opacity"></div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-[11px] font-bold truncate drop-shadow-sm">{item.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* > 4 Photos: WhatsApp Grid with + N Overlay on 4th quadrant */
                <div className="grid grid-cols-2 grid-rows-2 gap-1.5 w-full h-full p-1 bg-slate-950">
                  {pastWorkImages.slice(0, 3).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      onClick={() => openLightboxAt(idx)}
                      className="relative w-full h-full overflow-hidden cursor-pointer group/cell"
                    >
                      <img
                        src={item.url || item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover/cell:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 opacity-60 group-hover/cell:opacity-90 transition-opacity"></div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-[11px] font-bold truncate drop-shadow-sm">{item.title}</p>
                      </div>
                    </div>
                  ))}

                  {/* 4th cell with + N overlay (Exact match to WhatsApp reference image) */}
                  <div
                    onClick={() => openLightboxAt(3)}
                    className="relative w-full h-full overflow-hidden cursor-pointer group/more"
                  >
                    <img
                      src={pastWorkImages[3].url || pastWorkImages[3].image_url}
                      alt={pastWorkImages[3].title}
                      className="w-full h-full object-cover group-hover/more:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px] hover:bg-black/75 transition-colors flex flex-col items-center justify-center text-white">
                      <span className="text-3xl sm:text-4xl font-black tracking-tight font-['Outfit'] drop-shadow-md">
                        +{pastWorkImages.length - 3}
                      </span>
                      <span className="text-[10.5px] font-extrabold text-amber-300 mt-0.5 tracking-wider uppercase">
                        More Photos
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Status Bar overlay when photos exist */}
              {pastWorkImages.length > 0 && (
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                  <span className="px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-white text-[11px] font-black border border-white/10 shadow-md flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>{pastWorkImages.length} Past Work Photo{pastWorkImages.length === 1 ? '' : 's'}</span>
                  </span>
                  <span className="px-2 py-1 rounded-xl bg-black/70 backdrop-blur-md text-amber-300 text-[10px] font-bold border border-white/10 shadow-md flex items-center gap-1">
                    <Maximize2 className="w-3 h-3" />
                    <span>Click to view</span>
                  </span>
                </div>
              )}
            </div>

            {/* Packages & Service Items List */}
            <div className="space-y-4">
              
              {/* Multi-Trade Category Selector Filter Tabs */}
              {distinctTradeCategories.length > 1 && (
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                    Partner Skills:
                  </span>
                  {distinctTradeCategories.map((cat) => {
                    const isCatActive = selectedTrade === cat;
                    const catCount = rawPackages.filter(p => {
                      const pCat = (p.category || worker.trade || '').toLowerCase();
                      return pCat === cat || pCat.includes(cat) || cat.includes(pCat);
                    }).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedTrade(cat)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                          isCatActive
                            ? 'bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-400/40'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{getTradeIcon(cat)}</span>
                        <span className="capitalize">{cat}</span>
                        {catCount > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                            isCatActive ? 'bg-amber-600/30 text-slate-950' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {catCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setSelectedTrade('all')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                      selectedTrade === 'all'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    All Services ({rawPackages.length})
                  </button>
                </div>
              )}

              {/* Active Search & Trade Specific Banner */}
              {selectedTrade !== 'all' && (
                <div className="flex items-center justify-between bg-amber-50/90 border border-amber-200 text-amber-950 px-4 py-3 rounded-2xl text-xs shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl p-1.5 bg-amber-200/60 rounded-xl">{getTradeIcon(selectedTrade)}</span>
                    <div>
                      <p className="font-extrabold text-slate-950 capitalize text-sm">
                        Showing {selectedTrade} packages for {worker.name}
                      </p>
                      <p className="text-[11px] text-amber-800 font-medium">
                        {searchQuery ? `Matched your search query "${searchQuery}"` : `Filtered by ${selectedTrade}`} • Only packages for this skill are shown.
                      </p>
                    </div>
                  </div>
                  {distinctTradeCategories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSelectedTrade('all')}
                      className="text-xs font-black text-amber-900 underline hover:text-amber-950 px-2 py-1 rounded-lg hover:bg-amber-100 transition shrink-0"
                    >
                      View all trades
                    </button>
                  )}
                </div>
              )}

              {/* Partner Visiting Charge Notice (Temporary display until package chosen) */}
              {cartItems.length === 0 ? (
                <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/80 border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-sm shadow-amber-500/20">
                      ₹
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-slate-950">
                          Doorstep Visiting & Inspection Charge: ₹{visitingCharge}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200/90 text-amber-950 px-2.5 py-0.5 rounded-full border border-amber-300">
                          Active Until Package Selected
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                        Currently showing {worker.name}'s visiting charge. If you select any package below, this visiting charge is <strong className="text-emerald-700 font-extrabold">100% waived</strong> and the package price will start showing. If you book without selecting a package, this visiting charge is mandatory for doorstep diagnosis.
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 bg-white/90 border border-amber-200/90 rounded-2xl px-4 py-2.5 shadow-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Visiting Fee</span>
                    <span className="text-xl font-black text-amber-600 font-['Outfit']">₹{visitingCharge}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 shadow-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-emerald-950">
                          Visiting Charge (₹{visitingCharge}) 100% Waived!
                        </p>
                        <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                          Package Value Active
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        You selected {cartItemCount} service package{cartItemCount > 1 ? 's' : ''}. Only the package total of ₹{cartTotal} applies.
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-400 line-through block font-medium">₹{visitingCharge}</span>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">FREE</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-950 font-['Outfit'] capitalize">
                    {hasCustomPackages
                      ? (selectedTrade !== 'all' ? `${worker.name}'s ${selectedTrade} Packages` : `${worker.name}'s Custom Service Packages`)
                      : (catalog.subcategories.find(s => s.id === activeSubcat)?.name || 'Service Packages')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Customized for {worker.name}'s verified trade expertise</p>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  {itemsToRender.length} Available
                </span>
              </div>

              {/* Empty state if worker has packages for other trades, but not the selected trade */}
              {hasCustomPackages && itemsToRender.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center text-3xl font-bold shadow-xs">
                    {getTradeIcon(selectedTrade)}
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    No {selectedTrade} Packages Listed Yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {worker.name} provides custom services upon booking. You can also view packages across their other verified skills.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedTrade('all')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-slate-800 transition"
                  >
                    View All Listed Services ({rawPackages.length})
                  </button>
                </div>
              ) : (
                itemsToRender.map((item) => {
                  const inCart = cartItems.find(i => i.id === item.id);

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          {item.badge && (
                            <span className="inline-block text-[10px] font-black tracking-wider uppercase bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-200">
                              ★ {item.badge}
                            </span>
                          )}
                          <h3 className="text-base font-extrabold text-slate-900">{item.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <span className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>{item.rating}</span>
                            </span>
                            <span>({item.reviewsCount})</span>
                          </div>
                        </div>

                        {/* Add / Quantity Control Button */}
                        <div>
                          {inCart ? (
                            <div className="flex items-center gap-2 bg-purple-600 text-white rounded-2xl px-2 py-1.5 shadow-md shadow-purple-600/30">
                              <button
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold text-xs active:scale-95"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-mono font-black text-xs px-1.5">{inCart.qty}</span>
                              <button
                                onClick={() => handleAddToCart(item)}
                                className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold text-xs active:scale-95"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="px-5 py-2 rounded-2xl border-2 border-purple-600 text-purple-700 hover:bg-purple-600 hover:text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-lg font-black text-slate-950 font-['Outfit']">₹{item.price}</span>
                        {item.originalPrice && (
                          <span className="text-xs text-slate-400 line-through">₹{item.originalPrice}</span>
                        )}
                        <span className="text-slate-400">•</span>
                        <span className="flex items-center gap-1 text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {item.duration}
                        </span>
                      </div>

                      {/* Features List */}
                      {item.features && item.features.length > 0 && (
                        <ul className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                          {item.features.map((feat, fIdx) => (
                            <li key={fIdx} className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                        {item.description}
                      </p>

                      <button
                        onClick={() => handleAddToCart(item)}
                        className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
                      >
                        <span>Edit or customize package</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: UC PROMISE CARD & FLOATING VIEW CART BAR   */}
          {/* ======================================================== */}
          <div className="lg:col-span-3 space-y-5 sticky top-[130px]">
            
            {/* UC / KAAM PROMISE CARD */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-black text-slate-900 font-['Outfit']">KAAM Promise</h4>
                  <p className="text-[11px] text-slate-400">Guaranteed quality assurance</p>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-50 to-emerald-100 border border-teal-200/80 flex flex-col items-center justify-center text-teal-900 font-black text-[9px] text-center shadow-inner">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>ASSURED</span>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex items-center gap-2.5 font-bold">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Verified Professionals</span>
                </div>
                <div className="flex items-center gap-2.5 font-bold">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Hassle Free Booking</span>
                </div>
                <div className="flex items-center gap-2.5 font-bold">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Transparent Fixed Pricing</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Craftsman</span>
                <p className="font-extrabold text-slate-900">{worker.name}</p>
                <p className="text-slate-500 text-[11px]">{worker.completedJobsCount || 184} jobs completed • {worker.experience} yrs exp</p>
              </div>
            </div>

            {/* FLOATING VIEW CART & BOOKING ACTION BAR */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">Selected Items:</span>
                <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                  {cartItemCount} {cartItemCount === 1 ? 'service' : 'services'}
                </span>
              </div>

              {cartItems.length === 0 ? (
                <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>Doorstep Visiting Fee:</span>
                    <span className="font-black text-amber-700 font-['Outfit'] text-sm">₹{visitingCharge}</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-snug">
                    Temporary rate until a package is selected. Mandatory if booking without any package.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>Package Total:</span>
                    <span className="font-black text-emerald-700 font-['Outfit'] text-sm">₹{cartTotal}</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-snug">
                    Visiting charge ₹{visitingCharge} waived. Only package value applies.
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  if (cartItems.length > 0) {
                    onBookNow({
                      ...worker,
                      selectedCartItems: cartItems,
                      totalFee: cartTotal
                    });
                  } else {
                    onBookNow({
                      ...worker,
                      selectedCartItems: [
                        {
                          id: 'visiting-charge-item',
                          title: 'Doorstep Visiting & Inspection',
                          price: visitingCharge,
                          qty: 1,
                          isVisitingCharge: true,
                          features: [
                            'Mandatory partner visiting & inspection charge',
                            'Doorstep diagnosis & repair estimation',
                            'Waived when purchasing packages'
                          ]
                        }
                      ],
                      totalFee: visitingCharge
                    });
                  }
                }}
                className={`w-full py-4 px-6 rounded-2xl font-black text-sm shadow-xl flex items-center justify-between active:scale-95 transition-all text-white ${
                  cartItems.length > 0
                    ? 'bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 hover:brightness-110 shadow-purple-600/30'
                    : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-600/30'
                }`}
              >
                <div className="text-left">
                  <span className="text-[10px] block opacity-90 font-medium">
                    {cartItems.length > 0 ? 'Package Value' : 'Mandatory Visiting Fee'}
                  </span>
                  <span className="font-['Outfit'] text-base font-black">
                    ₹{cartTotal > 0 ? cartTotal : visitingCharge}
                  </span>
                </div>
                <span className="flex items-center gap-1.5 bg-black/20 px-3.5 py-1.5 rounded-xl">
                  <ShoppingCart className="w-4 h-4" />
                  <span>{cartTotal > 0 ? 'Proceed to Pay & Checkout ➔' : 'Book Doorstep Visit ➔'}</span>
                </span>
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* MOBILE STICKY CHECKOUT & PAY BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
        <div>
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
            {cartItems.length > 0 ? `${cartItemCount} Packages Chosen` : 'Doorstep Visiting Fee'}
          </span>
          <span className="font-['Outfit'] text-lg font-black text-slate-900">
            ₹{cartTotal > 0 ? cartTotal : visitingCharge}
          </span>
        </div>

        <button
          onClick={() => {
            if (cartItems.length > 0) {
              onBookNow({
                ...worker,
                selectedCartItems: cartItems,
                totalFee: cartTotal
              });
            } else {
              onBookNow({
                ...worker,
                selectedCartItems: [
                  {
                    id: 'visiting-charge-item',
                    title: 'Doorstep Visiting & Inspection',
                    price: visitingCharge,
                    qty: 1,
                    isVisitingCharge: true,
                    features: [
                      'Mandatory partner visiting & inspection charge',
                      'Doorstep diagnosis & repair estimation',
                      'Waived when purchasing packages'
                    ]
                  }
                ],
                totalFee: visitingCharge
              });
            }
          }}
          className={`py-3 px-5 rounded-2xl font-black text-xs shadow-lg flex items-center gap-2 active:scale-95 transition-all text-white ${
            cartItems.length > 0
              ? 'bg-gradient-to-r from-purple-700 to-indigo-600 shadow-purple-600/30'
              : 'bg-gradient-to-r from-amber-600 to-amber-700 shadow-amber-600/30'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Pay & Checkout ➔</span>
        </button>
      </div>

      {/* FULL-SCREEN PAST WORK LIGHTBOX MODAL */}
      {activeLightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-white flex flex-col max-h-[92vh]">
            <div className="relative bg-black flex items-center justify-center max-h-[62vh] overflow-hidden select-none">
              <img
                src={activeLightboxImage.url || activeLightboxImage.image_url}
                alt={activeLightboxImage.title}
                className="w-full h-full max-h-[62vh] object-contain transition-opacity duration-200"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80';
                }}
              />

              {/* Top Photo Counter & Close */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                {pastWorkImages.length > 1 ? (
                  <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-amber-300 text-xs font-black border border-white/10 shadow-md">
                    Photo {lightboxIndex + 1} of {pastWorkImages.length}
                  </span>
                ) : <span />}

                <button
                  type="button"
                  onClick={() => setActiveLightboxImage(null)}
                  className="pointer-events-auto w-9 h-9 rounded-full bg-black/70 hover:bg-black/95 text-white flex items-center justify-center transition font-bold shadow-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Prev & Next Carousel Buttons */}
              {pastWorkImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevLightbox();
                    }}
                    title="Previous Photo (Left Arrow)"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition active:scale-90 shadow-xl border border-white/10"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextLightbox();
                    }}
                    title="Next Photo (Right Arrow)"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition active:scale-90 shadow-xl border border-white/10"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            <div className="p-6 space-y-3 bg-slate-900 border-t border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-400 text-xs font-black uppercase tracking-wider capitalize">
                    {activeLightboxImage.category || activeLightboxImage.category_tag || 'Project'}
                  </span>
                  {activeLightboxImage.date && (
                    <span className="text-xs text-slate-400 font-medium">
                      Completed: {activeLightboxImage.date}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="font-bold text-amber-400">{worker.name}</span>
                  <span>•</span>
                  <span>{worker.tradeTitle}</span>
                </div>
              </div>

              <h3 className="text-lg font-black text-white font-['Outfit']">
                {activeLightboxImage.title || 'Completed Project'}
              </h3>

              {activeLightboxImage.description && (
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                  {activeLightboxImage.description}
                </p>
              )}

              <div className="pt-2 flex items-center justify-between">
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Use ← and → arrow keys to navigate photos
                </p>
                <button
                  type="button"
                  onClick={() => setActiveLightboxImage(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition ml-auto"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
