import React, { useState } from 'react';
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
  ShoppingCart
} from 'lucide-react';
import { TRADE_SERVICES } from '../../data/mockData';

export const WorkerProfileDetail = ({
  worker,
  onBack,
  onBookNow,
  selectedCity = 'Mumbai'
}) => {
  // Trade catalog fallback to 'plumber' if not specifically mapped
  const tradeKey = (worker.trade || 'plumber').toLowerCase();
  const catalog = TRADE_SERVICES[tradeKey] || TRADE_SERVICES.plumber;

  const [activeSubcat, setActiveSubcat] = useState(catalog.subcategories[0]?.id || 'packages');
  const [cartItems, setCartItems] = useState([]);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

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
            
            {/* Top Video / Hero Showcase Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-950 shadow-md border border-slate-200 group h-64 sm:h-80">
              <img
                src={catalog.heroVideoThumb}
                alt="Service Showcase"
                className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent"></div>

              {/* Play Video CTA */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                  className="w-14 h-14 rounded-full bg-white/90 hover:bg-white text-slate-950 flex items-center justify-center shadow-2xl shadow-black/60 transition-transform active:scale-95 group-hover:scale-110"
                >
                  <Play className="w-6 h-6 fill-slate-950 text-slate-950 ml-1" />
                </button>
                <span className="text-white text-xs font-bold bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                  {catalog.heroTagline}
                </span>
              </div>

              {/* Bottom Progress Bar */}
              <div className="absolute bottom-4 left-6 right-6 flex items-center gap-2">
                <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 w-1/3 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Packages & Service Items List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-950 font-['Outfit'] capitalize">
                    {catalog.subcategories.find(s => s.id === activeSubcat)?.name || 'Service Packages'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Customized for {worker.name}'s verified trade expertise</p>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  {displayedItems.length} Available
                </span>
              </div>

              {displayedItems.map((item) => {
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
              })}
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

            {/* FLOATING PURPLE VIEW CART BUTTON BAR */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">Selected Items:</span>
                <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                  {cartItemCount} {cartItemCount === 1 ? 'service' : 'services'}
                </span>
              </div>

              <button
                onClick={() => {
                  onBookNow({
                    ...worker,
                    selectedCartItems: cartItems,
                    totalFee: cartTotal > 0 ? cartTotal : worker.dailyRate
                  });
                }}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 hover:brightness-110 text-white font-black text-sm shadow-xl shadow-purple-600/30 flex items-center justify-between active:scale-95 transition-all"
              >
                <span className="font-['Outfit'] text-base">₹{cartTotal > 0 ? cartTotal : worker.dailyRate}</span>
                <span className="flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4" />
                  <span>{cartTotal > 0 ? 'View Cart & Book' : 'Book Standard Visit'}</span>
                </span>
              </button>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
