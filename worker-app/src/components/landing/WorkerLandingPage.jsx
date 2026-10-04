import React, { useState } from 'react';
import {
  Wrench,
  Zap,
  Droplets,
  Paintbrush,
  Hammer,
  HardHat,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  MapPin,
  TrendingUp,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  DollarSign,
  UserCheck,
  Award,
  HeartHandshake,
  HelpCircle,
  FileCheck,
  Briefcase,
  Star,
  Flame,
  X,
  Phone,
  MessageSquare,
  Shield,
  Search,
  User
} from 'lucide-react';

const CITIES = [
  "Mumbai (All Neighborhoods)",
  "Andheri West, Mumbai",
  "Bandra West, Mumbai",
  "Powai, Mumbai",
  "Dadar & South Mumbai",
  "Thane West, MMR",
  "Vashi (Navi Mumbai)"
];

const TRADES_CATALOG = [
  {
    id: 'plumber',
    name: 'Plumber / Pipe Fitter',
    hindiName: 'प्लंबर / नल मिस्त्री',
    icon: Droplets,
    color: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    avgDaily: '₹800 - ₹1,400',
    demand: 'High Demand',
    skills: ['CPVC Piping', 'Tap Repair', 'Water Tank', 'Bathroom Fitting'],
    baseRate: 950
  },
  {
    id: 'electrician',
    name: 'Master Electrician',
    hindiName: 'इलेक्ट्रिशियन / बिजली मिस्त्री',
    icon: Zap,
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    avgDaily: '₹900 - ₹1,600',
    demand: 'High Demand',
    skills: ['House Wiring', 'MCB Box', 'Inverter Setup', 'Fan & Light'],
    baseRate: 1100
  },
  {
    id: 'carpenter',
    name: 'Carpenter / Wood Worker',
    hindiName: 'बढ़ई / कारपेंटर',
    icon: Hammer,
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    avgDaily: '₹1,000 - ₹1,800',
    demand: 'High Demand',
    skills: ['Door Fitting', 'Modular Kitchen', 'Lock Repair', 'Furniture Work'],
    baseRate: 1200
  },
  {
    id: 'painter',
    name: 'Wall Painter & Waterproofing',
    hindiName: 'पेंटर / पुट्टी मिस्त्री',
    icon: Paintbrush,
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    avgDaily: '₹800 - ₹1,500',
    demand: 'Medium Demand',
    skills: ['Emulsion Paint', 'Wall Putty', 'Waterproofing', 'Texture Work'],
    baseRate: 900
  },
  {
    id: 'ac_technician',
    name: 'AC & Appliance Repair',
    hindiName: 'एसी व फ्रिज टेक्निशियन',
    icon: Wrench,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    avgDaily: '₹1,200 - ₹2,500',
    demand: 'Peak Demand',
    skills: ['AC Service', 'Gas Refill', 'PCB Repair', 'Washing Machine'],
    baseRate: 1400
  },
  {
    id: 'cleaner',
    name: 'Deep Cleaning Specialist',
    hindiName: 'सफाई / क्लीनिंग एक्सपर्ट',
    icon: Sparkles,
    color: 'bg-sky-50 border-sky-200 text-sky-700',
    avgDaily: '₹700 - ₹1,300',
    demand: 'High Demand',
    skills: ['Home Deep Cleaning', 'Sofa Shampoo', 'Bathroom Sanitation'],
    baseRate: 850
  },
  {
    id: 'mason',
    name: 'Mason & Tile Fitter',
    hindiName: 'राजमिस्त्री / टाइल्स फिटिंग',
    icon: HardHat,
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    avgDaily: '₹1,000 - ₹1,900',
    demand: 'High Demand',
    skills: ['Tile Laying', 'Plastering', 'Brickwork', 'Granite Fitting'],
    baseRate: 1250
  },
  {
    id: 'welder',
    name: 'Welder & Gate Fabricator',
    hindiName: 'वेल्डर / फैब्रिकेटर',
    icon: Flame,
    color: 'bg-red-50 border-red-200 text-red-700',
    avgDaily: '₹950 - ₹1,700',
    demand: 'Medium Demand',
    skills: ['Arc Welding', 'Iron Gate Repair', 'Grill Fabrication'],
    baseRate: 1150
  }
];

const TESTIMONIALS = [
  {
    id: 't-1',
    name: 'Ramesh Kumar Mistry',
    trade: 'Master Electrician',
    location: 'Sector 62, Noida',
    earnings: '₹42,000+ / month',
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80',
    quote: 'Pehle dukaan pe grahak ka intezar karna padta tha. Ab KAAM app se roz 3-4 pakke kaam milte hain, customer seedhe cash ya UPI deta hai.',
    rating: 4.9,
    jobsCompleted: 184
  },
  {
    id: 't-2',
    name: 'Sunil Sharma',
    trade: 'Plumber & Sanitary Specialist',
    location: 'Indirapuram, Ghaziabad',
    earnings: '₹38,500+ / month',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    quote: 'Direct client payment aur sabse kam commission fee! 36 ghante ka time milta hai 10% fee pay karne ka. Koi contractor ka tension nahi.',
    rating: 4.8,
    jobsCompleted: 152
  },
  {
    id: 't-3',
    name: 'Sunita Devi',
    trade: 'Home Deep Cleaning Expert',
    location: 'Lajpat Nagar, South Delhi',
    earnings: '₹29,000+ / month',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    quote: 'Part-time kaam karke roz 900-1200 rupees mil jaate hain. Platform pe Aadhaar verification ke baad clients ka bhi pura bharosa milta hai.',
    rating: 5.0,
    jobsCompleted: 119
  }
];

const FAQS = [
  {
    q: 'Kya KAAM app par worker registration bilkul free hai?',
    a: 'Haan! KAAM app par registration, profile banana, aur nearby jobs receive karna 100% FREE hai. Koi bhi advance ya secret registration fee nahi li jaati.'
  },
  {
    q: 'Payment mujhe kab aur kaise milegi?',
    a: 'Payment aapko seedhe customer se milati hai kaam khatam hone par. Customer aapko Cash de sakta hai ya aapke UPI QR par transfer kar sakta hai.'
  },
  {
    q: 'KAAM platform ki commission kitni hai aur kab deni hoti hai?',
    a: 'KAAM sirf 10% minimal platform fee leta hai. Aur iska sabse bada fayda ye hai ki aapko fee turant nahi deni – aapko 36 ghante (1.5 din) ka grace period milta hai UPI se pay karne ka.'
  },
  {
    q: 'KYC Verification ke liye konse documents chahiye?',
    a: 'Aapko sirf apna Aadhaar Card number, Mobile Number, aur Bank Details enter karni hoti hai. Verification ke baad aapke profile par Verified Karigar ka badge lag jata hai.'
  },
  {
    q: 'Kya me apni visiting fee aur service package charges khud set kar sakta hu?',
    a: 'Bilkul! Aap profile me jaakar apni Doorstep Visiting Fee aur apne Custom Service Packages ke rates khud fix kar sakte hain.'
  },
  {
    q: 'Agar kisi job me customer se koi issue ho toh kya karein?',
    a: 'KAAM platform par 24/7 dedicated Worker Partner Support Helpline aur WhatsApp Assistant uplabdh hai. Aap ek click me help desk se connect ho sakte hain.'
  }
];

export function WorkerLandingPage({ onOpenAuth }) {
  const [selectedCity, setSelectedCity] = useState("Mumbai (All Neighborhoods)");
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // Earning Estimator State
  const [selectedTrade, setSelectedTrade] = useState(TRADES_CATALOG[0]);
  const [workingDays, setWorkingDays] = useState(25);
  const [jobsPerDay, setJobsPerDay] = useState(3);

  // FAQ Accordion Toggle
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(0);

  // Quick Register Form State inside Hero
  const [quickPhone, setQuickPhone] = useState('');
  const [quickTrade, setQuickTrade] = useState('plumber');

  const estimatedMonthlyEarnings = Math.round(selectedTrade.baseRate * (jobsPerDay * 0.7) * workingDays);
  const estimatedDailyEarnings = Math.round(selectedTrade.baseRate * (jobsPerDay * 0.7));

  const handleQuickRegister = (e) => {
    e.preventDefault();
    onOpenAuth({ phone: quickPhone, trade: quickTrade, mode: 'SIGNUP_MAIN' });
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-slate-900 selection:bg-amber-400 selection:text-slate-950 font-['Plus_Jakarta_Sans',sans-serif] flex flex-col justify-between">
      
      <div>
        {/* TOP ANNOUNCEMENT BAR (Matching Client App Warm Accent) */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-extrabold text-xs px-4 py-2 text-center flex items-center justify-center gap-2 shadow-sm">
          <Sparkles className="w-4 h-4 shrink-0 text-slate-950" />
          <span>KAAM Karigar Partner Offer: 0% Joining Fee + Free ₹2 Lakh Accident Cover for First 5,000 Workers!</span>
          <button 
            onClick={() => onOpenAuth({ mode: 'SIGNUP_MAIN' })}
            className="hidden sm:inline-flex items-center gap-1 bg-slate-950 text-amber-400 px-3 py-0.5 rounded-full text-[11px] font-black hover:bg-slate-800 transition"
          >
            Join Now <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* HEADER / NAVIGATION BAR (EXACT CLIENT APP BRAND HEADER) */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-sm">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
            
            {/* Left: Brand Logo & Location Selector */}
            <div className="flex items-center gap-6">
              <div 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center gap-2.5 cursor-pointer"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-400 text-[20px] font-black text-slate-950 shadow-md shadow-amber-500/20">
                  K
                </span>
                <div>
                  <span className="text-2xl font-black text-slate-900 font-['Outfit'] tracking-tight">
                    kaam <span className="text-amber-700 text-xs font-bold uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">Karigar Partner</span>
                  </span>
                </div>
              </div>

              {/* City / Location Dropdown */}
              <div className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setShowCityDropdown(!showCityDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 text-xs font-bold text-slate-700 transition"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>{selectedCity}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showCityDropdown && (
                  <div className="absolute left-0 top-10 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 animate-in fade-in">
                    {CITIES.map(city => (
                      <button
                        key={city}
                        onClick={() => { setSelectedCity(city); setShowCityDropdown(false); }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition ${selectedCity === city ? 'bg-amber-50 text-amber-700 font-extrabold' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Center Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-600">
              <a href="#calculator" className="hover:text-slate-950 transition">Earnings Calculator</a>
              <a href="#trades" className="hover:text-slate-950 transition">Trade Categories</a>
              <a href="#how-it-works" className="hover:text-slate-950 transition">How it Works</a>
              <a href="#benefits" className="hover:text-slate-950 transition">Partner Perks</a>
              <a href="#stories" className="hover:text-slate-950 transition">Success Stories</a>
              <a href="#faqs" className="hover:text-slate-950 transition">FAQs</a>
            </nav>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenAuth({ mode: 'LOGIN_MAIN' })}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Partner Login
              </button>
              <button
                onClick={() => onOpenAuth({ mode: 'SIGNUP_MAIN' })}
                className="px-5 py-2.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-black shadow-md shadow-slate-900/10 flex items-center gap-2 active:scale-95 transition-all"
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Register as Worker</span>
              </button>
            </div>

          </div>
        </header>

        {/* HERO SECTION (MATCHING CLIENT APP WARM CREAM GRAPHIC BACKGROUND) */}
        <section className="bg-gradient-to-b from-[#faf7f2] via-white to-transparent py-12 px-4 sm:px-8 border-b border-slate-200">
          <div className="max-w-[1440px] mx-auto grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Main Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-xs font-extrabold tracking-wide uppercase">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>India's #1 Marketplace for Skilled Trades & Craftsmen</span>
              </span>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 font-['Outfit'] tracking-tight leading-tight">
                Apne Hunar Se Kamayein <br className="hidden sm:inline" />
                <span className="text-amber-600 underline decoration-amber-300 decoration-wavy underline-offset-8">
                  Har Din Behtareen Aamdani
                </span>
              </h1>

              <p className="text-slate-600 text-sm sm:text-base max-w-2xl font-medium leading-relaxed">
                Connect directly with 50,000+ homeowners in <span className="text-slate-950 font-bold">{selectedCity}</span>. Zero joining fee, 100% direct cash/UPI payouts from clients, and complete freedom to set your visiting fees and service package prices.
              </p>

              {/* Quick Hero Feature Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm text-left">
                  <DollarSign className="w-5 h-5 text-emerald-600 mb-1" />
                  <p className="text-xs font-bold text-slate-900">Daily Cash Payout</p>
                  <p className="text-[10px] text-slate-500 font-medium">Directly from client</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm text-left">
                  <MapPin className="w-5 h-5 text-amber-600 mb-1" />
                  <p className="text-xs font-bold text-slate-900">5-km Radius Jobs</p>
                  <p className="text-[10px] text-slate-500 font-medium">Near your home</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm text-left">
                  <Clock className="w-5 h-5 text-sky-600 mb-1" />
                  <p className="text-xs font-bold text-slate-900">36h Grace Period</p>
                  <p className="text-[10px] text-slate-500 font-medium">Flexible 10% dues fee</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm text-left">
                  <Shield className="w-5 h-5 text-purple-600 mb-1" />
                  <p className="text-xs font-bold text-slate-900">₹2 Lakh Cover</p>
                  <p className="text-[10px] text-slate-500 font-medium">Free Partner Insurance</p>
                </div>
              </div>

              {/* Platform Stats Row */}
              <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-center lg:justify-start gap-8">
                <div>
                  <p className="text-2xl font-black text-slate-950 font-['Outfit']">₹45,000+</p>
                  <p className="text-xs text-slate-500 font-semibold">Avg. Top Worker Earning</p>
                </div>
                <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                <div>
                  <p className="text-2xl font-black text-amber-600 font-['Outfit']">15,000+</p>
                  <p className="text-xs text-slate-500 font-semibold">Verified Karigars Online</p>
                </div>
                <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                <div>
                  <p className="text-2xl font-black text-emerald-600 font-['Outfit']">4.9 ★</p>
                  <p className="text-xs text-slate-500 font-semibold">Partner Satisfaction</p>
                </div>
              </div>

            </div>

            {/* Right Hero Registration Form Box */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-5 relative">
                <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                  ⚡ 2-Minute Setup
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-950 font-['Outfit']">Join KAAM as a Partner</h3>
                  <p className="text-xs text-slate-500 mt-1">Enter your details to receive daily job requests in your locality.</p>
                </div>

                <form onSubmit={handleQuickRegister} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Mobile Number (WhatsApp)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-500 font-bold">+91</span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="98765 43210"
                        value={quickPhone}
                        onChange={(e) => setQuickPhone(e.target.value)}
                        className="w-full pl-14 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Select Your Trade / Skill</label>
                    <select
                      value={quickTrade}
                      onChange={(e) => setQuickTrade(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition"
                    >
                      {TRADES_CATALOG.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.hindiName})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Preferred Work City</label>
                    <input
                      type="text"
                      disabled
                      value={selectedCity}
                      className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-bold cursor-not-allowed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs shadow-md shadow-slate-900/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Start Earning Today</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </button>
                </form>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 100% Free Signup</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Aadhaar KYC Enabled</span>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* SECTION 2: INTERACTIVE EARNINGS ESTIMATOR */}
        <section id="calculator" className="py-16 px-4 sm:px-8 bg-white border-b border-slate-200">
          <div className="max-w-[1440px] mx-auto space-y-12">
            
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-xs font-extrabold uppercase tracking-wide">
                💰 Live Earning Calculator
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-950 font-['Outfit']">
                Aap Har Mahine Kitna Kamayein?
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm font-medium">
                Select your trade, working days, and average jobs per day to calculate your potential monthly income on KAAM.
              </p>
            </div>

            <div className="bg-[#faf8f5] border border-slate-200 rounded-3xl p-6 sm:p-10 grid lg:grid-cols-12 gap-8 items-center shadow-sm">
              
              {/* Left Controls */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Select Trade Buttons Grid */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">1. Select Trade / Skill:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {TRADES_CATALOG.map(t => {
                      const IconComp = t.icon;
                      const isSelected = selectedTrade.id === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTrade(t)}
                          className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 ${
                            isSelected
                              ? 'bg-amber-100 border-amber-400 text-slate-950 shadow-sm font-extrabold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <IconComp className={`w-5 h-5 ${isSelected ? 'text-amber-700' : 'text-slate-500'}`} />
                          <div>
                            <p className="text-xs font-bold truncate">{t.name.split('/')[0]}</p>
                            <p className="text-[10px] text-slate-500">{t.avgDaily}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Slider 1: Working Days per Month */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-700">2. Working Days per Month:</span>
                    <span className="text-amber-800 bg-amber-100 px-3 py-1 rounded-lg border border-amber-200 font-black">
                      {workingDays} Days / month
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="30"
                    step="1"
                    value={workingDays}
                    onChange={(e) => setWorkingDays(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer bg-slate-200 h-2 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                    <span>15 Days (Part Time)</span>
                    <span>22 Days (Standard)</span>
                    <span>30 Days (Full Time)</span>
                  </div>
                </div>

                {/* Slider 2: Average Jobs per Day */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-700">3. Average Jobs Completed per Day:</span>
                    <span className="text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200 font-black">
                      {jobsPerDay} Jobs / day
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="1"
                    value={jobsPerDay}
                    onChange={(e) => setJobsPerDay(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer bg-slate-200 h-2 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                    <span>1 Job/day</span>
                    <span>3 Jobs/day</span>
                    <span>6 Jobs/day</span>
                  </div>
                </div>

              </div>

              {/* Right Result Display Box */}
              <div className="lg:col-span-5 bg-slate-950 text-white border border-slate-800 p-6 sm:p-8 rounded-3xl text-center space-y-6 shadow-xl">
                
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase">
                  Estimated Potential Earnings
                </span>

                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Estimated Monthly Income</p>
                  <h3 className="text-4xl sm:text-5xl font-black text-amber-400 font-['Outfit'] mt-1">
                    ₹{estimatedMonthlyEarnings.toLocaleString()}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 font-medium">
                    Approx. <span className="text-emerald-400 font-bold">₹{estimatedDailyEarnings.toLocaleString()}</span> / day in hand
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-2 text-xs text-left text-slate-300 font-medium">
                  <p className="flex items-center justify-between">
                    <span>Direct Client Cash Settlement:</span>
                    <span className="text-emerald-400 font-bold">100% Guaranteed</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Platform Fee (Dues Grace Period):</span>
                    <span className="text-amber-400 font-bold">10% (within 36h)</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Joining Fee:</span>
                    <span className="text-emerald-400 font-bold">₹0 Free</span>
                  </p>
                </div>

                <button
                  onClick={() => onOpenAuth({ mode: 'SIGNUP_MAIN', trade: selectedTrade.id })}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Register for {selectedTrade.name.split('/')[0]}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

              </div>

            </div>

          </div>
        </section>

        {/* SECTION 3: TRADES & SKILLS CATALOG */}
        <section id="trades" className="py-16 px-4 sm:px-8 bg-[#faf7f2] border-b border-slate-200">
          <div className="max-w-[1440px] mx-auto space-y-12">
            
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-xs font-extrabold uppercase tracking-wide">
                🛠️ High Demand Trade Categories
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-950 font-['Outfit']">
                Har Hunar Ke Liye Kaam Hai Available
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm font-medium">
                Browse skilled trade categories receiving high customer booking requests every 15 minutes across Delhi NCR.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TRADES_CATALOG.map(t => {
                const IconComp = t.icon;
                return (
                  <div key={t.id} className="bg-white border border-slate-200 hover:border-amber-400 p-6 rounded-3xl shadow-sm transition-all hover:-translate-y-1 flex flex-col justify-between space-y-4 group">
                    
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-2xl border ${t.color}`}>
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 uppercase">
                        {t.demand}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-950 group-hover:text-amber-700 transition">{t.name}</h3>
                      <p className="text-xs text-amber-800 font-bold mt-0.5">{t.hindiName}</p>
                      <p className="text-xs font-black text-emerald-700 font-['Outfit'] mt-2">Avg. Earning: {t.avgDaily} / day</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {t.skills.map((s, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium border border-slate-200">
                          {s}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => onOpenAuth({ mode: 'SIGNUP_MAIN', trade: t.id })}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-950 hover:text-white text-slate-800 font-bold text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <span>Apply for {t.name.split('/')[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* SECTION 4: HOW IT WORKS (KAISE SHURU KAREIN) */}
        <section id="how-it-works" className="py-16 px-4 sm:px-8 bg-white border-b border-slate-200">
          <div className="max-w-[1440px] mx-auto space-y-12">
            
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="px-3.5 py-1.5 rounded-full bg-sky-100 border border-sky-200 text-sky-900 text-xs font-extrabold uppercase tracking-wide">
                ⚡ 4 Simple Steps
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-950 font-['Outfit']">
                Kaise Shuru Karein KAAM Par Earning?
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm font-medium">
                Only 4 quick steps to verify your profile and start getting direct homeowner calls in your city.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Step 1 */}
              <div className="bg-[#faf8f5] border border-slate-200 p-6 rounded-3xl relative space-y-4 shadow-sm">
                <span className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black text-lg grid place-items-center font-['Outfit'] shadow-sm">
                  1
                </span>
                <h3 className="text-lg font-black text-slate-950 font-['Outfit']">Free Registration</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Enter your mobile number, select your trade (Plumber, Electrician, etc.), and set your preferred locality in 2 minutes.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-[#faf8f5] border border-slate-200 p-6 rounded-3xl relative space-y-4 shadow-sm">
                <span className="w-10 h-10 rounded-2xl bg-sky-500 text-white font-black text-lg grid place-items-center font-['Outfit'] shadow-sm">
                  2
                </span>
                <h3 className="text-lg font-black text-slate-950 font-['Outfit']">Aadhaar KYC Check</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Enter basic Aadhaar ID & bank details to earn the official <strong>Verified Karigar</strong> badge on your profile.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-[#faf8f5] border border-slate-200 p-6 rounded-3xl relative space-y-4 shadow-sm">
                <span className="w-10 h-10 rounded-2xl bg-emerald-500 text-white font-black text-lg grid place-items-center font-['Outfit'] shadow-sm">
                  3
                </span>
                <h3 className="text-lg font-black text-slate-950 font-['Outfit']">Get Nearby Job Alerts</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Receive instant booking requests from homeowners within 5 km. Accept or decline based on your schedule.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-[#faf8f5] border border-slate-200 p-6 rounded-3xl relative space-y-4 shadow-sm">
                <span className="w-10 h-10 rounded-2xl bg-purple-600 text-white font-black text-lg grid place-items-center font-['Outfit'] shadow-sm">
                  4
                </span>
                <h3 className="text-lg font-black text-slate-950 font-['Outfit']">100% Direct Payment</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Complete work at client's home and collect cash or UPI directly. Pay small 10% platform fee within 36 hours.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* SECTION 5: WHY CHOOSE KAAM (BENEFITS) */}
        <section id="benefits" className="py-16 px-4 sm:px-8 bg-[#faf7f2] border-b border-slate-200">
          <div className="max-w-[1440px] mx-auto space-y-12">
            
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-extrabold uppercase tracking-wide">
                🤝 Partner Advantages
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-950 font-['Outfit']">
                Kyu 15,000+ Karigar KAAM Platform Pasand Karte Hain?
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm font-medium">
                Compare why KAAM is far superior to traditional contractor arrangements or offline market waiting.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              
              <div className="bg-white border border-slate-200 p-8 rounded-3xl space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-amber-800 grid place-items-center font-bold">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-950 font-['Outfit']">100% Direct Cash Payments</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  No waiting for weekly payouts from company accounts. Customer pays you directly in cash or on your personal UPI QR right after job completion.
                </p>
              </div>

              <div className="bg-white border border-slate-200 p-8 rounded-3xl space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 border border-sky-200 text-sky-800 grid place-items-center font-bold">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-950 font-['Outfit']">36-Hour Dues Grace Period</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  KAAM charges only 10% commission. You get a generous 36-hour grace period to clear platform dues via UPI after collecting cash from client.
                </p>
              </div>

              <div className="bg-white border border-slate-200 p-8 rounded-3xl space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-800 grid place-items-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-950 font-['Outfit']">Free ₹2 Lakh Partner Insurance</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Active KAAM partners get complimentary accidental insurance cover up to ₹2,00,000 for work safety & family security.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* SECTION 6: REAL TESTIMONIALS */}
        <section id="stories" className="py-16 px-4 sm:px-8 bg-white border-b border-slate-200">
          <div className="max-w-[1440px] mx-auto space-y-12">
            
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-xs font-extrabold uppercase tracking-wide">
                ⭐ Humare Sathi Karigar
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-950 font-['Outfit']">
                Real Stories from Verified Craftsmen
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm font-medium">
                Read how tradespeople across Delhi NCR transformed their daily income with KAAM.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map(t => (
                <div key={t.id} className="bg-[#faf8f5] border border-slate-200 p-6 rounded-3xl space-y-4 flex flex-col justify-between shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 stroke-none" />
                      ))}
                      <span className="text-xs font-bold text-slate-700 ml-1">{t.rating}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed italic font-medium">
                      "{t.quote}"
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex items-center gap-3">
                    <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover border-2 border-amber-400" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-950">{t.name}</h4>
                      <p className="text-[11px] text-amber-700 font-bold">{t.trade}</p>
                      <p className="text-[10px] text-slate-500">{t.location} • <span className="text-emerald-700 font-bold">{t.earnings}</span></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* SECTION 7: INTERACTIVE FAQ ACCORDION */}
        <section id="faqs" className="py-16 px-4 sm:px-8 bg-[#faf7f2] border-b border-slate-200">
          <div className="max-w-[1000px] mx-auto space-y-10">
            
            <div className="text-center space-y-3">
              <span className="px-3.5 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-900 text-xs font-extrabold uppercase tracking-wide">
                ❓ Worker FAQs
              </span>
              <h2 className="text-3xl font-black text-slate-950 font-['Outfit']">
                Aam Sawal Aur Unke Jawab
              </h2>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, idx) => {
                const isOpen = expandedFaqIndex === idx;
                return (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all">
                    <button
                      onClick={() => setExpandedFaqIndex(isOpen ? -1 : idx)}
                      className="w-full p-5 text-left font-bold text-xs sm:text-sm text-slate-950 flex items-center justify-between gap-4"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-amber-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed font-medium border-t border-slate-100 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* BOTTOM HERO CTA BANNER (MATCHING CLIENT APP GOLD BANNER) */}
        <section className="py-16 px-4 sm:px-8 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 shadow-inner">
          <div className="max-w-[1200px] mx-auto text-center space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black font-['Outfit'] tracking-tight">
              Aaj Hi KAAM Partner Banein Aur Apne Hunar Ka Sahi Daam Payein!
            </h2>
            <p className="text-slate-950/90 text-sm sm:text-base font-bold max-w-2xl mx-auto">
              Join 15,000+ plumbers, electricians, carpenters & mechanics earning guaranteed daily income in your area.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => onOpenAuth({ mode: 'SIGNUP_MAIN' })}
                className="px-8 py-4 rounded-full bg-slate-950 hover:bg-slate-800 text-white font-black text-sm shadow-xl active:scale-95 transition-all flex items-center gap-2"
              >
                <User className="w-4 h-4 text-amber-400" />
                <span>Register Now (Free)</span>
              </button>
              <button
                onClick={() => onOpenAuth({ mode: 'LOGIN_MAIN' })}
                className="px-8 py-4 rounded-full bg-white/30 hover:bg-white/50 border border-slate-950/20 text-slate-950 font-black text-sm transition-all"
              >
                Existing Partner Login
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER (MATCHING CLIENT APP EXACT DARK FOOTER) */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 py-12 px-4 sm:px-8 text-xs">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-400 text-slate-950 font-black text-base">K</span>
              <span className="text-xl font-black text-white font-['Outfit']">kaam Partner</span>
            </div>
            <p className="text-slate-500 leading-relaxed font-medium">
              Dedicated marketplace platform empowering local skilled tradespeople with direct homeowner jobs, daily cash settlements & 36-hour flexible dues ledger.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Trade Specialties</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li>Plumber & Pipe Fitting</li>
              <li>Master Electrician</li>
              <li>Carpenter & Wood Work</li>
              <li>Wall Painting & Waterproofing</li>
              <li>AC & Fridge Repair</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Partner Locations</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li>Noida & Greater Noida</li>
              <li>Delhi NCR & South Delhi</li>
              <li>Gurgaon & Faridabad</li>
              <li>Ghaziabad & Indirapuram</li>
              <li>Mumbai & Pune</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Worker Partner Helpline</h4>
            <p className="text-slate-400 font-medium">Have questions or need assistance joining?</p>
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
              <PhoneCall className="w-4 h-4" />
              <span>1800-123-KAAM (Toll Free)</span>
            </div>
            <p className="text-slate-500 text-[10px]">Mon-Sat: 8:00 AM – 9:00 PM</p>
          </div>

        </div>

        <div className="max-w-[1440px] mx-auto pt-8 mt-8 border-t border-slate-900 flex flex-wrap items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© 2026 KAAM Skilled Trades Marketplace • All Rights Reserved</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-300">Partner Terms</a>
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Safety Guidelines</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
