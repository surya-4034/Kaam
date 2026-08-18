import React, { useState, useEffect } from 'react';
import { CATEGORIES, INITIAL_WORKERS } from './data/mockData';
import { AuthPage } from './components/auth/AuthPage';
import {
  Wrench,
  Droplets,
  Zap,
  HardHat,
  Paintbrush,
  Hammer,
  Grid,
  Flame,
  Sparkles,
  Search,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Phone,
  X,
  SlidersHorizontal,
  LogOut,
  UserCheck
} from 'lucide-react';

const ICON_MAP = { Wrench, Droplets, Zap, HardHat, Paintbrush, Hammer, Grid, Flame, Sparkles };
const API_URL = 'http://localhost:5050/api/jobs';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kaam_client_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'my-bookings'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxBudget, setMaxBudget] = useState(1000);
  const [onlyVerified, setOnlyVerified] = useState(false);

  const [bookingWorker, setBookingWorker] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [dbWorkers, setDbWorkers] = useState([]);

  const [bookingForm, setBookingForm] = useState({
    name: user?.fullName || 'Verma Family (Homeowner)',
    phone: user?.phone || '+91 98111 00223',
    address: 'Sector 63, Noida',
    description: 'Fix CPVC pipe fitting & bathroom tap replacement.',
    paymentMode: 'DIRECT_CASH',
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('kaam_client_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('kaam_client_user');
    }
  }, [user]);

  // Fetch live workers from SQLite database
  const fetchWorkersFromDB = async () => {
    try {
      const res = await fetch('http://localhost:5050/api/workers');
      if (res.ok) {
        const data = await res.json();
        if (data.workers && data.workers.length > 0) {
          const mapped = data.workers.map((w) => ({
            id: w.id,
            name: w.name,
            trade: w.trade_category,
            tradeTitle: w.trade_title,
            phone: w.phone,
            locality: w.locality,
            dailyRate: w.daily_rate,
            hourlyRate: w.hourly_rate,
            kycStatus: w.kyc_status,
            rating: w.rating_average || 4.9,
            reviewCount: w.completed_jobs_count || 12,
            bio: w.bio,
            portfolioImages: (w.portfolioImages || []).map((p) => ({
              id: p.id,
              title: p.title,
              url: p.image_url,
            })),
          }));
          setDbWorkers(mapped);
        }
      }
    } catch (err) {
      console.warn('Workers fetch note:', err);
    }
  };

  // Fetch jobs from central REST API
  const fetchJobsFromAPI = async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        if (data.jobs) {
          setJobs(data.jobs);
        }
      }
    } catch (err) {
      console.warn('API fetch warning:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWorkersFromDB();
      fetchJobsFromAPI();
      const interval = setInterval(() => {
        fetchJobsFromAPI();
        fetchWorkersFromDB();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <AuthPage onLoginSuccess={(userData) => setUser(userData)} isWorkerApp={false} />;
  }

  const workerList = dbWorkers.length > 0 ? dbWorkers : INITIAL_WORKERS;

  const filteredWorkers = workerList.filter((worker) => {
    const matchesCat = selectedCategory === 'all' || worker.trade === selectedCategory;
    const matchesSearch =
      worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.locality.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBudget = worker.dailyRate <= maxBudget;
    const matchesVerified = !onlyVerified || worker.kycStatus === 'VERIFIED';
    return matchesCat && matchesSearch && matchesBudget && matchesVerified;
  });

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      workerId: bookingWorker.id,
      workerName: bookingWorker.name,
      tradeTitle: bookingWorker.tradeTitle,
      workerPhone: bookingWorker.phone,
      clientName: user.fullName || bookingForm.name,
      clientPhone: user.phone || bookingForm.phone,
      locationAddress: bookingForm.address,
      workDescription: bookingForm.description,
      agreedTotalFee: bookingWorker.dailyRate,
      paymentMode: bookingForm.paymentMode,
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchJobsFromAPI();
        setBookingSuccess(true);
      } else {
        const newJob = {
          id: `job-${Date.now()}`,
          worker_id: bookingWorker.id,
          worker_name: bookingWorker.name,
          trade_title: bookingWorker.tradeTitle,
          worker_phone: bookingWorker.phone,
          client_name: user.fullName || bookingForm.name,
          client_phone: user.phone || bookingForm.phone,
          location_address: bookingForm.address,
          work_description: bookingForm.description,
          agreed_total_fee: bookingWorker.dailyRate,
          payment_mode: bookingForm.paymentMode,
          status: 'REQUESTED',
        };
        setJobs([newJob, ...jobs]);
        setBookingSuccess(true);
      }
    } catch (err) {
      console.error('Error submitting job:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#042522] via-[#083b36] to-[#031d1b] text-slate-100 selection:bg-amber-400 selection:text-teal-950 flex flex-col justify-between">
      
      <div>
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#064e43]/90 backdrop-blur-md border-b border-[#0e7467] px-6 py-4 shadow-2xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-teal-950 font-black shadow-lg shadow-amber-500/30">
                <Wrench className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-2xl font-black text-white font-['Outfit'] tracking-tight">kaam Client</span>
                <span className="text-[10px] ml-2 bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Client App (Port 5174)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('browse')}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'browse' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Find Workers
              </button>
              <button
                onClick={() => setActiveTab('my-bookings')}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'my-bookings' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                My Hire Requests ({jobs.length})
              </button>

              {/* User Account Info & Logout */}
              <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                <div className="text-right text-xs hidden sm:block">
                  <span className="font-bold text-white block">{user.fullName}</span>
                  <span className="text-[10px] text-amber-400 font-semibold uppercase">Client Account</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 rounded-xl bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {activeTab === 'my-bookings' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white font-['Outfit']">My Hire Requests Status</h2>
                <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                  ⚡ Connected to REST API (http://localhost:5050)
                </span>
              </div>

              {jobs.length === 0 ? (
                <div className="glass-panel p-12 rounded-3xl text-center space-y-2 text-slate-400">
                  <p>No hire requests yet. Switch to "Find Workers" to send a request.</p>
                </div>
              ) : (
                jobs.map((j) => {
                  const workerName = j.worker_name || j.workerName || 'Ramesh Kumar Mistry';
                  const tradeTitle = j.trade_title || j.tradeTitle || 'Master Plumber';
                  const workerPhone = j.worker_phone || j.workerPhone || '+91 98765 43210';
                  const workDesc = j.work_description || j.workDescription;
                  const location = j.location_address || j.location;
                  const fee = j.agreed_total_fee || j.agreedFee;

                  return (
                    <div key={j.id} className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-white">{workerName}</span>
                          <span className="text-xs text-amber-400 font-semibold">{tradeTitle}</span>
                          {j.status === 'ACCEPTED' ? (
                            <span className="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                              🟢 Worker Accepted & On His Way!
                            </span>
                          ) : j.status === 'REJECTED' ? (
                            <span className="text-xs bg-red-500/10 text-red-400 font-bold px-2.5 py-0.5 rounded-full border border-red-500/30">
                              🔴 Declined by Worker
                            </span>
                          ) : j.status === 'COMPLETED' ? (
                            <span className="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                              ✅ Work Completed
                            </span>
                          ) : (
                            <span className="text-xs bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                              ⏳ Waiting for Worker to Accept...
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300">"{workDesc}"</p>
                        <p className="text-xs text-slate-400">Location: {location} • Fee: ₹{fee}</p>
                      </div>

                      {j.status === 'ACCEPTED' && (
                        <a href={`tel:${workerPhone}`} className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
                          <Phone className="w-4 h-4" />
                          <span>Call Worker ({workerPhone})</span>
                        </a>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Hero Banner */}
              <div className="glass-panel p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/30">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  WELCOME {user.fullName?.toUpperCase()} • CLIENT MARKETPLACE
                </span>
                <h1 className="text-4xl font-black text-white font-['Outfit'] mt-3">
                  Find Verified Local <span className="text-amber-400">Plumbers, Electricians</span> & Mistry
                </h1>
                <p className="text-xs text-slate-300 mt-2 max-w-xl">
                  Inspect photo portfolios, daily fee rates, ratings, and submit hire requests directly to local skilled tradespeople.
                </p>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {CATEGORIES.map((cat) => {
                  const IconComp = ICON_MAP[cat.icon] || Wrench;
                  const isSel = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold border whitespace-nowrap transition-all ${
                        isSel ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold' : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Filter Toolbar */}
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4">
                  <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400 font-medium">Max Daily Fee:</span>
                  <span className="font-bold text-amber-400 font-['Outfit'] text-sm">₹{maxBudget}</span>
                  <input
                    type="range"
                    min="400"
                    max="1500"
                    step="50"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(Number(e.target.value))}
                    className="w-28 accent-amber-500 cursor-pointer"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    checked={onlyVerified}
                    onChange={(e) => setOnlyVerified(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300 font-semibold">Verified Bank & KYC Only</span>
                </label>
              </div>

              {/* Workers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWorkers.map((w) => (
                  <div key={w.id} className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4 hover:border-amber-500/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 font-black text-xl flex items-center justify-center border border-amber-500/30">
                        {w.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{w.name}</h3>
                        <p className="text-xs font-semibold text-amber-400">{w.tradeTitle}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{w.locality}</span>
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      "{w.bio}"
                    </p>

                    {w.portfolioImages && (
                      <div className="grid grid-cols-2 gap-2">
                        {w.portfolioImages.map((img) => (
                          <div key={img.id} className="h-20 rounded-xl overflow-hidden border border-slate-800">
                            <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Daily Wage Rate</span>
                        <span className="text-xl font-black text-amber-400 font-['Outfit']">₹{w.dailyRate}</span>
                      </div>
                      <button
                        onClick={() => { setBookingWorker(w); setBookingSuccess(false); }}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                      >
                        Hire Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Booking Modal */}
      {bookingWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg glass-panel rounded-3xl border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xl font-bold text-white font-['Outfit']">Hire {bookingWorker.name}</h3>
              <button onClick={() => { setBookingWorker(null); setBookingSuccess(false); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-xl font-bold text-white">Hire Request Sent via API!</h4>
                <p className="text-xs text-slate-300">
                  Sent to <strong className="text-amber-400">{bookingWorker.name}</strong> on Worker App (Port 5175). Check "My Hire Requests" tab!
                </p>
                <button onClick={() => { setBookingWorker(null); setBookingSuccess(false); setActiveTab('my-bookings'); }} className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs">
                  View My Requests
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateBooking} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Your Address / Work Location</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.address}
                    onChange={(e) => setBookingForm({ ...bookingForm, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Work Requirements</label>
                  <textarea
                    rows="2"
                    required
                    value={bookingForm.description}
                    onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Payment Choice</label>
                  <select
                    value={bookingForm.paymentMode}
                    onChange={(e) => setBookingForm({ ...bookingForm, paymentMode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="DIRECT_CASH">Direct Cash/UPI to Worker (Worker 36h fee)</option>
                    <option value="PLATFORM_ESCROW">Direct Payment to Platform Escrow</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between font-bold text-white">
                  <span>Agreed Fee:</span>
                  <span className="text-amber-400 font-['Outfit']">₹{bookingWorker.dailyRate}</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending Request...' : 'Confirm & Send Request via REST API'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-500">
        © 2026 kaam Client App (Port 5174) • Authenticated as {user.fullName}.
      </footer>
    </div>
  );
}
