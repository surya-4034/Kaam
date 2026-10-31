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
  User,
  Check
} from 'lucide-react';

const TRADES_CATALOG = [
  {
    id: 'plumber',
    name: 'Plumbing & Pipe Fitting',
    roleTag: 'Certified Master Plumber',
    icon: Droplets,
    color: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    avgDaily: '₹1,200 - ₹2,400',
    demand: 'High Demand',
    skills: ['CPVC Piping', 'Leak Diagnosis', 'Pressure Pumps', 'Sanitary Fixtures'],
    baseRate: 950
  },
  {
    id: 'electrician',
    name: 'Electrical Engineering & Wiring',
    roleTag: 'Licensed Electrician',
    icon: Zap,
    color: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    avgDaily: '₹1,400 - ₹2,800',
    demand: 'Peak Demand',
    skills: ['Distribution Panels', 'Circuit Diagnostics', 'Smart Inverters', 'Appliance Setup'],
    baseRate: 1100
  },
  {
    id: 'carpenter',
    name: 'Custom Carpentry & Woodcraft',
    roleTag: 'Master Craftsman',
    icon: Hammer,
    color: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    avgDaily: '₹1,500 - ₹2,900',
    demand: 'High Demand',
    skills: ['Modular Cabinetry', 'Hardware Installation', 'Precision Joinery', 'Furniture Restoration'],
    baseRate: 1200
  },
  {
    id: 'painter',
    name: 'Architectural Painting & Finishes',
    roleTag: 'Finishing Specialist',
    icon: Paintbrush,
    color: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    avgDaily: '₹1,200 - ₹2,500',
    demand: 'Steady Demand',
    skills: ['Waterproof Coating', 'Surface Priming', 'Textured Finishes', 'Airless Spraying'],
    baseRate: 900
  },
  {
    id: 'ac_technician',
    name: 'HVAC & Appliance Systems',
    roleTag: 'Certified HVAC Tech',
    icon: Wrench,
    color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    avgDaily: '₹1,800 - ₹3,600',
    demand: 'Peak Demand',
    skills: ['Coolant Recharging', 'Inverter PCB Repair', 'Deep Coil Sanitation', 'Compressor Diagnostics'],
    baseRate: 1400
  },
  {
    id: 'cleaner',
    name: 'Industrial & Deep Sanitation',
    roleTag: 'Sanitation Pro',
    icon: Sparkles,
    color: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    avgDaily: '₹1,100 - ₹2,200',
    demand: 'High Demand',
    skills: ['Steam Extraction', 'Post-Construction Scrub', 'Tile Buffing', 'Chemical Disinfection'],
    baseRate: 850
  },
  {
    id: 'mason',
    name: 'Masonry & Precision Tiling',
    roleTag: 'Structural Mason',
    icon: HardHat,
    color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    avgDaily: '₹1,500 - ₹2,800',
    demand: 'High Demand',
    skills: ['Vitrified Tile Laying', 'Laser Level Plastering', 'Structural Brickwork', 'Granite Fitting'],
    baseRate: 1250
  },
  {
    id: 'welder',
    name: 'Precision Welding & Fabrication',
    roleTag: 'Structural Fabricator',
    icon: Flame,
    color: 'bg-red-500/10 border-red-500/30 text-red-400',
    avgDaily: '₹1,400 - ₹2,600',
    demand: 'Steady Demand',
    skills: ['TIG/MIG Welding', 'Architectural Grilles', 'Safety Railings', 'Gate Alignment'],
    baseRate: 1150
  }
];

const TESTIMONIALS = [
  {
    id: 't-1',
    name: 'Ramesh Kumar',
    trade: 'Licensed Electrician',
    location: 'Sector 62, Noida',
    earnings: '₹54,000+ / mo',
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80',
    quote: 'Instead of waiting for store referrals, I now get 3 to 4 direct homeowner bookings daily through Connect. Clients pay immediately in cash or UPI, and the transparent dues system keeps everything smooth.',
    rating: 4.9,
    jobsCompleted: 218
  },
  {
    id: 't-2',
    name: 'Sunil Sharma',
    trade: 'Plumbing & Hydraulic Specialist',
    location: 'Indirapuram, Ghaziabad',
    earnings: '₹48,500+ / mo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    quote: 'Direct client payment with the lowest platform fees in the industry. The 36-hour grace period means no upfront deductions, giving me complete control over my daily operating cash flow.',
    rating: 4.9,
    jobsCompleted: 184
  },
  {
    id: 't-3',
    name: 'Sunita Devi',
    trade: 'Commercial Deep Cleaning Lead',
    location: 'South Delhi, New Delhi',
    earnings: '₹38,000+ / mo',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    quote: 'Having a verified digital profile showcasing my equipment and fixed package pricing makes homeowners trust my work instantly. I choose the hours and localities that work for my schedule.',
    rating: 5.0,
    jobsCompleted: 147
  }
];

const FAQS = [
  {
    q: 'Is partner registration completely free on Connect?',
    a: 'Yes. Profile registration, trade verification, and receiving job requests are 100% free with zero upfront or hidden fees.'
  },
  {
    q: 'How and when do I receive payment for completed jobs?',
    a: 'Clients pay you directly at their doorstep upon job completion, either in cash or directly into your personal UPI QR code.'
  },
  {
    q: 'What is Connect’s platform fee and how does the dues window work?',
    a: 'Connect charges an industry-low 10% platform fee. You receive a generous 36-hour grace period to settle the platform fee via UPI after receiving direct payment from the client.'
  },
  {
    q: 'Can I set my own doorstep visiting fees and service rates?',
    a: 'Absolutely. You maintain full autonomy over your doorstep inspection fee, hourly rates, and custom service package pricing directly from your partner dashboard.'
  },
  {
    q: 'What protection or support is provided for partner technicians?',
    a: 'Active verified partners receive complimentary ₹2 Lakh accidental insurance coverage, plus dedicated 24/7 partner phone and WhatsApp support.'
  }
];

export function WorkerLandingPage({ onOpenAuth }) {
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
    <div className="min-h-screen bg-[#07080f] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-['Plus_Jakarta_Sans',sans-serif] flex flex-col justify-between relative overflow-hidden">
      
      {/* Background Ambient Glows (Reference Theme Style) */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none"></div>
      <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-20 w-[600px] h-[600px] rounded-full bg-indigo-900/15 blur-[160px] pointer-events-none"></div>

      <div className="relative z-10">
        
        {/* TOP ANNOUNCEMENT BAR */}
        <div className="bg-gradient-to-r from-violet-950/80 via-slate-900 to-indigo-950/80 border-b border-slate-800/80 text-slate-300 font-semibold text-xs px-4 py-2.5 text-center flex items-center justify-center gap-2 backdrop-blur-md">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Connect Pro Network</span>
          </div>
          <span className="hidden sm:inline text-slate-400">Zero joining fee + Complimentary ₹2 Lakh insurance coverage for verified technicians.</span>
          <button 
            onClick={() => onOpenAuth({ mode: 'SIGNUP_MAIN' })}
            className="inline-flex items-center gap-1 bg-white hover:bg-slate-200 text-slate-950 px-3 py-1 rounded-full text-[11px] font-bold transition active:scale-95 ml-2"
          >
            Apply as Partner <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* HEADER / NAVIGATION BAR */}
        <header className="sticky top-0 z-50 bg-[#07080f]/85 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-4">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
            
            {/* Brand Logo */}
            <div 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-violet-600 text-slate-950 font-black text-xl shadow-lg shadow-cyan-500/20">
                C
              </div>
              <div>
                <span className="text-2xl font-black text-white font-['Outfit'] tracking-tight">
                  connect <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">Partner Pro</span>
                </span>
              </div>
            </div>

            {/* Center Navigation Links */}
            <nav className="hidden lg:flex items-center gap-8 text-xs font-bold text-slate-400">
              <a href="#calculator" className="hover:text-cyan-400 transition">Earnings Calculator</a>
              <a href="#trades" className="hover:text-cyan-400 transition">Service Specialties</a>
              <a href="#how-it-works" className="hover:text-cyan-400 transition">Onboarding Workflow</a>
              <a href="#benefits" className="hover:text-cyan-400 transition">Partner Benefits</a>
              <a href="#stories" className="hover:text-cyan-400 transition">Technician Reviews</a>
              <a href="#faqs" className="hover:text-cyan-400 transition">FAQ</a>
            </nav>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenAuth({ mode: 'LOGIN_MAIN' })}
                className="px-4 py-2 rounded-full text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-700/60 transition"
              >
                Partner Sign In
              </button>
              <button
                onClick={() => onOpenAuth({ mode: 'SIGNUP_MAIN' })}
                className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold shadow-lg shadow-white/10 flex items-center gap-2 active:scale-95 transition-all"
              >
                <User className="w-3.5 h-3.5 text-slate-950" />
                <span>Join as Partner</span>
              </button>
            </div>

          </div>
        </header>

        {/* HERO SECTION (Reference Theme 1 AI Glass Style) */}
        <section className="px-4 py-16 sm:px-8 sm:py-24 border-b border-slate-800/80 relative">
          <div className="max-w-[1440px] mx-auto grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Main Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-bold tracking-wide">
                <Briefcase className="w-4 h-4 text-cyan-400" />
                <span>Premier Infrastructure for Independent Technicians</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white font-['Outfit'] tracking-tight leading-tight">
                Empower Your Trade. <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
                  Grow Your Business on Your Terms.
                </span>
              </h1>

              <p className="text-slate-400 text-sm sm:text-base max-w-2xl font-medium leading-relaxed">
                Connect directly with residential and commercial property owners. Receive verified booking requests, manage custom service packages, and collect direct cash or UPI payments with an industry-low 10% platform fee.
              </p>

              {/* Quick Hero Feature Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-[#0d0f18]/80 border border-slate-800/80 shadow-lg text-left backdrop-blur-md">
                  <DollarSign className="w-5 h-5 text-emerald-400 mb-1" />
                  <p className="text-xs font-bold text-white">Instant Payouts</p>
                  <p className="text-[10px] text-slate-400 font-medium">Direct customer cash/UPI</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#0d0f18]/80 border border-slate-800/80 shadow-lg text-left backdrop-blur-md">
                  <Briefcase className="w-5 h-5 text-cyan-400 mb-1" />
                  <p className="text-xs font-bold text-white">Real-Time Requests</p>
                  <p className="text-[10px] text-slate-400 font-medium">Nearby client bookings</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#0d0f18]/80 border border-slate-800/80 shadow-lg text-left backdrop-blur-md">
                  <Clock className="w-5 h-5 text-indigo-400 mb-1" />
                  <p className="text-xs font-bold text-white">36h Grace Period</p>
                  <p className="text-[10px] text-slate-400 font-medium">Flexible ledger dues</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#0d0f18]/80 border border-slate-800/80 shadow-lg text-left backdrop-blur-md">
                  <Shield className="w-5 h-5 text-violet-400 mb-1" />
                  <p className="text-xs font-bold text-white">₹2 Lakh Cover</p>
                  <p className="text-[10px] text-slate-400 font-medium">Safety insurance included</p>
                </div>
              </div>

              {/* Platform Stats Row */}
              <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center lg:justify-start gap-8">
                <div>
                  <p className="text-2xl font-black text-white font-['Outfit']">₹52,000+</p>
                  <p className="text-xs text-slate-400 font-semibold">Average Monthly Earnings</p>
                </div>
                <div className="h-8 w-px bg-slate-800 hidden sm:block" />
                <div>
                  <p className="text-2xl font-black text-cyan-400 font-['Outfit']">15,000+</p>
                  <p className="text-xs text-slate-400 font-semibold">Verified Active Technicians</p>
                </div>
                <div className="h-8 w-px bg-slate-800 hidden sm:block" />
                <div>
                  <p className="text-2xl font-black text-emerald-400 font-['Outfit']">4.92 ★</p>
                  <p className="text-xs text-slate-400 font-semibold">Partner Satisfaction Rating</p>
                </div>
              </div>

            </div>

            {/* Right Hero Registration Form Box */}
            <div className="lg:col-span-5">
              <div className="relative space-y-5 rounded-3xl border border-slate-800/80 bg-[#0d0f18]/90 p-6 sm:p-8 shadow-2xl shadow-violet-950/40 backdrop-blur-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
                  ⚡ Express 2-Minute Onboarding
                </div>

                <div>
                  <h3 className="text-xl font-black text-white font-['Outfit']">Join Connect as a Service Partner</h3>
                  <p className="text-xs text-slate-400 mt-1">Submit your details to start receiving local customer requests today.</p>
                </div>

                <form onSubmit={handleQuickRegister} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Mobile Number</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3.5 text-slate-500 font-bold">+91</span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="98765 43210"
                        value={quickPhone}
                        onChange={(e) => setQuickPhone(e.target.value)}
                        className="w-full pl-14 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none focus:border-cyan-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Primary Trade Specialization</label>
                    <select
                      value={quickTrade}
                      onChange={(e) => setQuickTrade(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none focus:border-cyan-500 transition"
                    >
                      {TRADES_CATALOG.map(t => (
                        <option key={t.id} value={t.id}>{t.name} — {t.roleTag}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Start Receiving Client Requests</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100% Free Registration</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Verified Credentials</span>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* SECTION 2: INTERACTIVE EARNINGS ESTIMATOR */}
        <section id="calculator" className="py-20 px-4 sm:px-8 border-b border-slate-800/80">
          <div className="max-w-[1440px] mx-auto space-y-12">
            
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wide">
                💰 Earnings Projection Calculator
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white font-['Outfit']">
                Calculate Your Monthly Income Potential
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                Customize your trade specialty, monthly working schedule, and completed tasks per day.
              </p>
            </div>

            <div className="bg-[#0d0f18]/80 border border-slate-800/80 rounded-3xl p-6 sm:p-10 grid lg:grid-cols-12 gap-8 items-center shadow-2xl backdrop-blur-2xl">
              
              {/* Left Controls */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Select Trade Buttons Grid */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">1. Select Trade Specialization:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {TRADES_CATALOG.map(t => {
                      const IconComp = t.icon;
                      const isSelected = selectedTrade.id === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTrade(t)}
                          className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 ${
                            isSelected
                              ? 'bg-cyan-500/15 border-cyan-400/60 text-white shadow-lg shadow-cyan-500/10 font-bold'
                              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          <IconComp className={`w-5 h-5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                          <div>
                            <p className="text-xs font-bold truncate">{t.name.split('&')[0]}</p>
                            <p className="text-[10px] text-slate-400">{t.avgDaily}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Slider 1: Working Days per Month */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-300">2. Active Working Days per Month:</span>
                    <span className="text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20 font-black">
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
                    className="w-full accent-cyan-400 cursor-pointer bg-slate-900 h-2 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                    <span>15 Days (Flexible Part-Time)</span>
                    <span>22 Days (Standard Full-Time)</span>
                    <span>30 Days (Maximum Schedule)</span>
                  </div>
                </div>

                {/* Slider 2: Average Jobs per Day */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-300">3. Average Jobs Completed Daily:</span>
                    <span className="text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 font-black">
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
                    className="w-full accent-emerald-400 cursor-pointer bg-slate-900 h-2 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                    <span>1 Job/day</span>
                    <span>3 Jobs/day</span>
                    <span>6 Jobs/day</span>
                  </div>
                </div>

              </div>

              {/* Right Result Display Box */}
              <div className="lg:col-span-5 bg-gradient-to-b from-[#131728] to-[#0a0d18] border border-slate-700/80 p-6 sm:p-8 rounded-3xl text-center space-y-6 shadow-2xl">
                
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  Estimated Take-Home Projection
                </span>

                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Projected Monthly Gross</p>
                  <h3 className="text-4xl sm:text-5xl font-black text-white font-['Outfit'] mt-1 bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                    ₹{estimatedMonthlyEarnings.toLocaleString()}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 font-medium">
                    Approx. <span className="text-emerald-400 font-bold">₹{estimatedDailyEarnings.toLocaleString()}</span> / daily net cash
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-2 text-xs text-left text-slate-300 font-medium">
                  <p className="flex items-center justify-between">
                    <span>Direct Doorstep Settlement:</span>
                    <span className="text-emerald-400 font-bold">100% Retained</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Platform Commission:</span>
                    <span className="text-cyan-400 font-bold">10% (36h grace window)</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Onboarding Fee:</span>
                    <span className="text-emerald-400 font-bold">₹0 Free</span>
                  </p>
                </div>

                <button
                  onClick={() => onOpenAuth({ mode: 'SIGNUP_MAIN', trade: selectedTrade.id })}
                  className="w-full py-3.5 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-lg shadow-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>Register as {selectedTrade.roleTag}</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </button>

              </div>

            </div>

          </div>
        </section>

        {/* SECTION 3: TRADES & SKILLS CATALOG */}
        <section id="trades" className="py-20 px-4 sm:px-8 border-b border-slate-800/80">
          <div className="max-w-[1440px] mx-auto space-y-12">
            
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-wide">
                🛠️ Certified Trade Disciplines
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white font-['Outfit']">
                High-Volume Work Across Every Craft
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                Explore specialized trades experiencing consistent booking requests from homeowners, property managers, and businesses.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TRADES_CATALOG.map(t => {
                const IconComp = t.icon;
                return (
                  <div key={t.id} className="bg-[#0d0f18]/80 border border-slate-800/80 hover:border-cyan-500/50 p-6 rounded-3xl shadow-xl transition-all hover:-translate-y-1 flex flex-col justify-between space-y-4 group backdrop-blur-md">
                    
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-2xl border ${t.color}`}>
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 uppercase">
                        {t.demand}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition">{t.name}</h3>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">{t.roleTag}</p>
                      <p className="text-xs font-bold text-emerald-400 font-['Outfit'] mt-2">Avg: {t.avgDaily} / day</p>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-1.5">
                      {t.skills.map((s, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-900 text-slate-300 px-2.5 py-1 rounded-lg font-medium border border-slate-800">
                          {s}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => onOpenAuth({ mode: 'SIGNUP_MAIN', trade: t.id })}
                      className="w-full py-2.5 rounded-full bg-slate-800/80 hover:bg-white hover:text-slate-950 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-slate-700/60"
                    >
                      <span>Apply for {t.roleTag}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* SECTION 4: HOW IT WORKS */}
        <section id="how-it-works" className="py-20 px-4 sm:px-8 border-b border-slate-800/80">
          <div className="max-w-[1440px] mx-auto space-y-12">
            
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wide">
                ⚡ Four-Step Process
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white font-['Outfit']">
                How Connect Pro Operates
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                From fast registration to daily job completion and transparent ledger settlement.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Step 1 */}
              <div className="bg-[#0d0f18]/80 border border-slate-800/80 p-6 rounded-3xl relative space-y-4 shadow-xl backdrop-blur-md">
                <span className="w-10 h-10 rounded-2xl bg-cyan-500 text-slate-950 font-black text-lg grid place-items-center font-['Outfit'] shadow-lg shadow-cyan-500/20">
                  1
                </span>
                <h3 className="text-lg font-black text-white font-['Outfit']">Free Digital Registration</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Register with your mobile number or Google account. Select your trade, preferred service radius, and inspection fees in under two minutes.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-[#0d0f18]/80 border border-slate-800/80 p-6 rounded-3xl relative space-y-4 shadow-xl backdrop-blur-md">
                <span className="w-10 h-10 rounded-2xl bg-indigo-500 text-white font-black text-lg grid place-items-center font-['Outfit'] shadow-lg shadow-indigo-500/20">
                  2
                </span>
                <h3 className="text-lg font-black text-white font-['Outfit']">Showcase Your Expertise</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Upload certifications, define service packages, showcase past project photos, and display transparent customer pricing.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-[#0d0f18]/80 border border-slate-800/80 p-6 rounded-3xl relative space-y-4 shadow-xl backdrop-blur-md">
                <span className="w-10 h-10 rounded-2xl bg-violet-600 text-white font-black text-lg grid place-items-center font-['Outfit'] shadow-lg shadow-violet-600/20">
                  3
                </span>
                <h3 className="text-lg font-black text-white font-['Outfit']">Receive Live Job Leads</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Review customer booking requests directly in your dashboard with full job descriptions, addresses, and timing before accepting.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-[#0d0f18]/80 border border-slate-800/80 p-6 rounded-3xl relative space-y-4 shadow-xl backdrop-blur-md">
                <span className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 font-black text-lg grid place-items-center font-['Outfit'] shadow-lg shadow-emerald-500/20">
                  4
                </span>
                <h3 className="text-lg font-black text-white font-['Outfit']">Direct Cash/UPI Settlement</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Collect 100% of the service fee directly from the homeowner. Settle the 10% platform fee via UPI within the 36-hour grace window.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* SECTION 5: WHY CHOOSE CONNECT */}
        <section id="benefits" className="py-20 px-4 sm:px-8 border-b border-slate-800/80">
          <div className="max-w-[1440px] mx-auto space-y-12">
            
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wide">
                🤝 The Connect Advantage
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white font-['Outfit']">
                Why 15,000+ Certified Technicians Choose Connect
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                Eliminate middlemen, contractor delays, and delayed wage disbursements.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              
              <div className="bg-[#0d0f18]/80 border border-slate-800/80 p-8 rounded-3xl space-y-4 shadow-xl backdrop-blur-md">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 grid place-items-center font-bold">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white font-['Outfit']">Zero Payment Delay</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  No escrow delays or arbitrary holding periods. Customers remit payment directly to your hand or UPI account the moment you finish work.
                </p>
              </div>

              <div className="bg-[#0d0f18]/80 border border-slate-800/80 p-8 rounded-3xl space-y-4 shadow-xl backdrop-blur-md">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 grid place-items-center font-bold">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white font-['Outfit']">36-Hour Dues Grace Period</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  You are never locked out immediately after a job. Our flexible ledger provides an automatic 36-hour grace window to remit standard 10% platform fees.
                </p>
              </div>

              <div className="bg-[#0d0f18]/80 border border-slate-800/80 p-8 rounded-3xl space-y-4 shadow-xl backdrop-blur-md">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 grid place-items-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white font-['Outfit']">Complimentary Insurance</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  All active verified service technicians are protected under our group policy covering accidental insurance up to ₹2,00,000 during active work hours.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* SECTION 6: REAL TESTIMONIALS */}
        <section id="stories" className="py-20 px-4 sm:px-8 border-b border-slate-800/80">
          <div className="max-w-[1440px] mx-auto space-y-12">
            
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wide">
                ⭐ Verified Reviews
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white font-['Outfit']">
                Real Stories from Certified Specialists
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                Hear how professional tradespeople scaled their independent customer base with Connect.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map(t => (
                <div key={t.id} className="bg-[#0d0f18]/80 border border-slate-800/80 p-6 rounded-3xl space-y-4 flex flex-col justify-between shadow-xl backdrop-blur-md">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 stroke-none" />
                      ))}
                      <span className="text-xs font-bold text-slate-300 ml-1">{t.rating}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed italic font-medium">
                      "{t.quote}"
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
                    <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover border-2 border-cyan-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">{t.name}</h4>
                      <p className="text-[11px] text-cyan-400 font-semibold">{t.trade}</p>
                      <p className="text-[10px] text-slate-400">{t.location} • <span className="text-emerald-400 font-bold">{t.earnings}</span></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* SECTION 7: FAQ ACCORDION */}
        <section id="faqs" className="py-20 px-4 sm:px-8 border-b border-slate-800/80">
          <div className="max-w-[1000px] mx-auto space-y-10">
            
            <div className="text-center space-y-3">
              <span className="px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-wide">
                ❓ Frequently Asked Questions
              </span>
              <h2 className="text-3xl font-black text-white font-['Outfit']">
                Everything You Need to Know
              </h2>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, idx) => {
                const isOpen = expandedFaqIndex === idx;
                return (
                  <div key={idx} className="bg-[#0d0f18]/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg transition-all backdrop-blur-md">
                    <button
                      onClick={() => setExpandedFaqIndex(isOpen ? -1 : idx)}
                      className="w-full p-5 text-left font-bold text-xs sm:text-sm text-white flex items-center justify-between gap-4"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed font-medium border-t border-slate-800/60 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* BOTTOM CTA BANNER (AI Dark Gradient Theme) */}
        <section className="py-20 px-4 sm:px-8 relative overflow-hidden bg-gradient-to-r from-violet-950/60 via-slate-900 to-cyan-950/60 border-b border-slate-800/80">
          <div className="max-w-[1200px] mx-auto text-center space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black font-['Outfit'] tracking-tight text-white">
              Launch Your Independent Service Business Today
            </h2>
            <p className="text-slate-300 text-sm sm:text-base font-medium max-w-2xl mx-auto">
              Join thousands of licensed electricians, plumbers, carpenters and technicians earning verified daily revenue.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={() => onOpenAuth({ mode: 'SIGNUP_MAIN' })}
                className="px-8 py-4 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-black text-sm shadow-xl active:scale-95 transition-all flex items-center gap-2"
              >
                <User className="w-4 h-4 text-slate-950" />
                <span>Register as Partner (100% Free)</span>
              </button>
              <button
                onClick={() => onOpenAuth({ mode: 'LOGIN_MAIN' })}
                className="px-8 py-4 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white font-bold text-sm transition-all"
              >
                Existing Partner Sign In
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER (Dark AI Theme) */}
      <footer className="bg-[#05060a] text-slate-400 border-t border-slate-800/80 py-12 px-4 sm:px-8 text-xs relative z-10">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-tr from-cyan-400 to-violet-600 text-slate-950 font-black text-base">C</span>
              <span className="text-xl font-black text-white font-['Outfit']">connect Partner Pro</span>
            </div>
            <p className="text-slate-500 leading-relaxed font-medium">
              Next-generation trade marketplace empowering certified professionals with direct customer bookings, instant cash settlements, and transparent ledger tools.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Certified Trades</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li>Plumbing & Hydraulic Systems</li>
              <li>Master Electrical Engineering</li>
              <li>Architectural Carpentry</li>
              <li>Precision Surface Finishing</li>
              <li>HVAC & Thermal Systems</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Active Hubs</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li>Noida & Greater Noida Expressway</li>
              <li>Delhi NCR & South Extension</li>
              <li>Gurgaon CyberCity & Golf Course Rd</li>
              <li>Ghaziabad & Indirapuram</li>
              <li>Mumbai Western Suburbs & Pune</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Partner Support Desk</h4>
            <p className="text-slate-400 font-medium">Questions or technical assistance regarding your account?</p>
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <PhoneCall className="w-4 h-4" />
              <span>1800-123-CONNECT (Toll Free)</span>
            </div>
            <p className="text-slate-500 text-[10px]">Mon-Sat: 8:00 AM – 9:00 PM IST</p>
          </div>

        </div>

        <div className="max-w-[1440px] mx-auto pt-8 mt-8 border-t border-slate-900 flex flex-wrap items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© 2026 Connect Skilled Trades Marketplace • All Rights Reserved</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-300">Partner Terms of Service</a>
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Platform Standards</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
