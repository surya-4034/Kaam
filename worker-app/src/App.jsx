import React, { useState, useEffect } from 'react';
import { AuthPage } from './components/auth/AuthPage';
import { WorkerOnboardingWizard } from './components/onboarding/WorkerOnboardingWizard';
import {
  HardHat,
  Inbox,
  Clock,
  ImageIcon,
  Building,
  Power,
  CheckCircle2,
  Phone,
  AlertTriangle,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  Plus,
  RefreshCw,
  UserCheck
} from 'lucide-react';

const API_BASE = 'http://localhost:5050/api';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kaam_worker_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [showWorkerOnboarding, setShowWorkerOnboarding] = useState(() => {
    if (!user) return false;
    return !user.onboardingCompleted;
  });

  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'dues' | 'portfolio' | 'bank' | 'profile'
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Live Worker State loaded directly from SQLite DB
  const [worker, setWorker] = useState(() => {
    return user?.workerProfile || {
      id: 'w-1',
      userId: user?.id || 'u-worker-1',
      name: user?.fullName || 'Ramesh Kumar Mistry',
      phone: user?.phone || '+91 98765 43210',
      email: user?.email || 'worker@kaam.com',
      tradeCategory: 'plumber',
      tradeTitle: 'Master Plumber & Pipe Fitter',
      locality: 'Sector 62, Noida',
      dailyRate: 650,
      hourlyRate: 120,
      kycStatus: 'VERIFIED',
      isAvailable: true,
      isAccountLocked: false,
      completedJobsCount: 142,
      ratingAverage: 4.9,
      bank: {
        holder: user?.fullName || 'Ramesh Kumar',
        bankName: 'State Bank of India',
        account: '481920412390',
        ifsc: 'SBIN0004012',
        upi: 'ramesh.plumber@okaxis',
        govtIdType: 'Aadhaar Card',
        govtIdNumber: '9841-XXXX-2041',
      },
      portfolio: [
        {
          id: 'p-1',
          title: 'Bathroom Concealed CPVC Piping',
          url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
          category: 'Plumbing',
          date: 'Aug 2026',
        },
      ],
      dues: null,
    };
  });

  // REST API Jobs State from SQLite
  const [jobs, setJobs] = useState([]);

  // Dues Modal & Payment State
  const [showPayModal, setShowPayModal] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [isPayingDues, setIsPayingDues] = useState(false);

  // Portfolio Form State
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState('Plumbing');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [addPhotoSuccess, setAddPhotoSuccess] = useState(false);

  // Bank Form State
  const [bankForm, setBankForm] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    govtIdNumber: '',
  });
  const [isUpdatingBank, setIsUpdatingBank] = useState(false);
  const [bankSuccessMsg, setBankSuccessMsg] = useState('');

  // 1. Fetch Full Worker Profile from SQLite DB
  const fetchWorkerProfileFromDB = async () => {
    if (!user) return;
    const targetLookup = user.id || worker.id || 'u-worker-1';

    try {
      const res = await fetch(`${API_BASE}/workers/by-user/${targetLookup}`);
      if (res.ok) {
        const data = await res.json();
        if (data.worker) {
          const w = data.worker;
          setWorker({
            id: w.id,
            userId: w.user_id,
            name: w.name || user.fullName,
            phone: w.phone || user.phone,
            email: w.email || user.email,
            tradeCategory: w.trade_category,
            tradeTitle: w.trade_title,
            locality: w.locality,
            city: w.city || 'Noida',
            dailyRate: w.daily_rate,
            hourlyRate: w.hourly_rate,
            bio: w.bio,
            isAvailable: Boolean(w.is_available),
            isAccountLocked: Boolean(w.is_account_locked),
            kycStatus: w.kyc_status,
            completedJobsCount: w.completed_jobs_count,
            ratingAverage: w.rating_average,
            bank: w.bank || worker.bank,
            portfolio: w.portfolio || worker.portfolio,
            dues: w.dues || null,
          });
        }
      }
    } catch (err) {
      console.warn('Profile fetch note:', err);
    }
  };

  // 2. Fetch Jobs from SQLite DB
  const fetchJobsFromDB = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/jobs`);
      if (res.ok) {
        const data = await res.json();
        if (data.jobs) {
          // Filter jobs relevant to this worker or newly requested
          const workerJobs = data.jobs.filter(
            (j) => j.worker_id === worker.id || j.worker_id === 'w-1' || !j.worker_id
          );
          setJobs(workerJobs.length > 0 ? workerJobs : data.jobs);
        }
      }
    } catch (err) {
      console.warn('Jobs fetch note:', err);
    }
  };

  // Synchronize on user change & set polling
  useEffect(() => {
    if (user) {
      localStorage.setItem('kaam_worker_user', JSON.stringify(user));
      fetchWorkerProfileFromDB();
      fetchJobsFromDB();

      // 1-TIME SILENT LIVE GEOLOCATION CAPTURE (Zero UI hint / 100% background sync)
      const hasSynced = localStorage.getItem('kaam_geo_synced_worker_v1');
      if (!hasSynced && typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            localStorage.setItem('kaam_geo_synced_worker_v1', 'true');
            localStorage.setItem('kaam_worker_coords', JSON.stringify({ latitude, longitude }));

            try {
              await fetch(`${API_BASE}/auth/update-location`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: user.id,
                  latitude,
                  longitude
                })
              });
            } catch (e) {
              // Silently ignore
            }
          },
          () => {
            localStorage.setItem('kaam_geo_synced_worker_v1', 'true');
          },
          { timeout: 8000, maximumAge: 600000, enableHighAccuracy: false }
        );
      } else {
        localStorage.setItem('kaam_geo_synced_worker_v1', 'true');
      }

      const poll = setInterval(() => {
        fetchJobsFromDB();
        fetchWorkerProfileFromDB();
      }, 5000);
      return () => clearInterval(poll);
    } else {
      localStorage.removeItem('kaam_worker_user');
      localStorage.removeItem('kaam_worker_token');
    }
  }, [user]);

  // Sync bank form on tab switch
  useEffect(() => {
    if (worker.bank) {
      setBankForm({
        accountHolderName: worker.bank.holder || worker.name,
        bankName: worker.bank.bankName || 'State Bank of India',
        accountNumber: worker.bank.account || '',
        ifscCode: worker.bank.ifsc || '',
        upiId: worker.bank.upi || '',
        govtIdNumber: worker.bank.govtIdNumber || '9841-XXXX-2041',
      });
    }
  }, [worker]);

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return (
      <AuthPage
        onLoginSuccess={(userData) => {
          setUser(userData);
          if (userData.workerProfile) {
            setWorker(userData.workerProfile);
          }
        }}
        isWorkerApp={true}
      />
    );
  }

  // Toggle Availability in SQLite
  const handleToggleAvailability = async () => {
    const nextState = !worker.isAvailable;
    setWorker((prev) => ({ ...prev, isAvailable: nextState }));

    try {
      await fetch(`${API_BASE}/workers/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: worker.id, isAvailable: nextState }),
      });
    } catch (err) {
      console.error('Availability toggle error:', err);
    }
  };

  // Job Actions: Accept / Reject / Complete in SQLite
  const handleJobAction = async (jobId, action) => {
    try {
      const res = await fetch(`${API_BASE}/jobs/${jobId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        await fetchJobsFromDB();
        await fetchWorkerProfileFromDB();
      }
    } catch (err) {
      console.error(`Error performing job action ${action}:`, err);
    }
  };

  // Pay 36h Platform Commission in SQLite
  const handlePayDuesSubmit = async () => {
    setIsPayingDues(true);
    try {
      const res = await fetch(`${API_BASE}/dues/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: worker.id,
          dueId: worker.dues?.id,
          transactionRef: `UPI-REF-${Date.now()}`,
        }),
      });

      if (res.ok) {
        setPaySuccess(true);
        setTimeout(async () => {
          setPaySuccess(false);
          setShowPayModal(false);
          await fetchWorkerProfileFromDB();
          await fetchJobsFromDB();
        }, 1500);
      }
    } catch (err) {
      console.error('Error paying dues:', err);
    } finally {
      setIsPayingDues(false);
    }
  };

  // Add Portfolio Photo into SQLite
  const handleAddPhotoSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle || !newUrl) return;
    setIsUploadingPhoto(true);

    try {
      const res = await fetch(`${API_BASE}/workers/portfolio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: worker.id,
          userId: user.id,
          title: newTitle,
          imageUrl: newUrl,
          categoryTag: newCategory,
          description: `Work showcase by ${worker.name}`,
        }),
      });

      if (res.ok) {
        setNewTitle('');
        setNewUrl('');
        setAddPhotoSuccess(true);
        await fetchWorkerProfileFromDB();
        setTimeout(() => setAddPhotoSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Error adding portfolio:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Update Bank KYC in SQLite
  const handleBankSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingBank(true);
    setBankSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE}/workers/bank-kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: worker.id,
          userId: user.id,
          accountHolderName: bankForm.accountHolderName,
          bankName: bankForm.bankName,
          accountNumber: bankForm.accountNumber,
          ifscCode: bankForm.ifscCode,
          upiId: bankForm.upiId,
          govtIdType: 'Aadhaar Card',
          govtIdNumber: bankForm.govtIdNumber,
        }),
      });

      if (res.ok) {
        setBankSuccessMsg('Bank details saved to SQLite Database and submitted for Admin verification!');
        await fetchWorkerProfileFromDB();
        setTimeout(() => setBankSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error submitting bank KYC:', err);
    } finally {
      setIsUpdatingBank(false);
    }
  };

  const pendingRequestsCount = jobs.filter((j) => j.status === 'REQUESTED').length;
  const hasActiveDues = Boolean(worker.dues && worker.dues.status === 'PENDING');
  const duesAmount = worker.dues?.pendingAmount || 0;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-amber-500 selection:text-slate-950 flex flex-col justify-between">
      <div>
        {/* Navigation Header matching Replit Design */}
        <header className="sticky top-0 z-40 border-b border-white/[.1] bg-[#17201f]/[.96] backdrop-blur-xl px-4 sm:px-7 py-3.5 shadow-2xl text-[#f1eee4]">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
            
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#f2b63d] text-[18px] font-black text-[#172621] shadow-[0_5px_14px_rgba(242,182,61,.25)]">
                K
              </span>
              <span className="text-[21px] font-extrabold tracking-[-.06em] text-[#f7f3e9] font-['Outfit']">
                kaam <span className="font-semibold text-[#f2b63d]">Worker</span>
              </span>
            </div>

            {/* Online / Offline Status Toggle & Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#232e2c] px-3 py-2">
                <div>
                  <p className="text-[10px] font-extrabold text-[#f5bf53]">{worker.isAvailable ? "Online" : "Offline"}</p>
                  <p className="hidden text-[10px] text-white/45 sm:block">{worker.isAvailable ? "Available for work" : "Not receiving requests"}</p>
                </div>
                <button
                  aria-label="Toggle availability"
                  onClick={handleToggleAvailability}
                  className={`relative h-7 w-12 rounded-full p-1 transition ${worker.isAvailable ? "bg-[#e4a72e]" : "bg-[#53605f]"}`}
                >
                  <span className={`block h-5 w-5 rounded-full bg-[#fff7e4] shadow-sm transition-transform ${worker.isAvailable ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-[#232e2c] px-3 py-2">
                <Briefcase className="h-4 w-4 text-[#f5bf53]" />
                <span className="text-xs font-bold">Active Jobs <span className="text-[#f5bf53]">({jobs.filter(j => j.status === 'ACCEPTED' || j.status === 'IN_PROGRESS').length})</span></span>
              </div>

              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area matching Exact Visual Design Mockup */}
        <main className="max-w-[1440px] mx-auto px-4 sm:px-7 py-6 space-y-6">
          
          {/* Top Welcome & Earnings Header */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.17em] text-[#b9a26c]">
                Live Craftsman Portal • Noida & Delhi NCR
              </p>
              <h1 className="text-[clamp(26px,3.5vw,40px)] font-extrabold leading-[1.05] tracking-[-.05em] text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Good morning, {worker.name.split(' ')[0]}.<br />
                <span className="text-[#9ba9a1]">Your next nearby job is ready.</span>
              </h1>
            </div>

            <div className="flex items-center gap-4 bg-[#232e2c] border border-white/10 p-3.5 rounded-2xl">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[.15em] text-white/40 font-bold">Total Platform Earnings</p>
                <p className="mt-0.5 text-2xl font-black text-[#f2b63d] font-['Outfit']">₹28,500</p>
              </div>
              <div className="h-9 w-px bg-white/10" />
              <div>
                <p className="text-[10px] uppercase tracking-[.15em] text-white/40 font-bold">Rating</p>
                <p className="mt-0.5 text-lg font-black text-white font-['Outfit']">★ {worker.ratingAverage || '4.9'}</p>
              </div>
            </div>
          </div>

          {/* 36-HOUR COMMISSION PAYMENT DUES BANNER (CRITICAL FEATURE MATCHING UI MOCKUP) */}
          <section className="grid gap-4 overflow-hidden rounded-2xl border border-[#e0a533]/40 bg-[#4c350c] p-4 shadow-2xl sm:grid-cols-[1fr_auto_auto] sm:items-center sm:p-5">
            <div className="flex items-start gap-3.5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e1a62e] text-[#3d2b09] shadow-md">
                <AlertTriangle className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#f4c86f]">
                  Attention • 10% Commission Payment
                </p>
                <h2 className="mt-0.5 text-2xl font-black tracking-tight text-[#fff2c8] font-['Outfit']">
                  ₹{hasActiveDues ? duesAmount : '1,200'} <span className="text-xs font-bold text-[#f4d992]">due within 36 Hours</span>
                </h2>
                <p className="mt-1 max-w-lg text-[11px] leading-relaxed text-[#ead49f]">
                  Keep your worker profile active and continue receiving nearby customer requests within 5 km.
                </p>
              </div>
            </div>

            {/* UPI QR Preview */}
            <div className="hidden h-16 w-16 place-items-center rounded-xl border border-[#f7d887]/50 bg-[#fff1bd] sm:grid p-1.5 shadow-inner">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=kaam@yors.online&pn=KAAM%20SERVICES&am=1200&cu=INR"
                alt="UPI QR Code"
                className="w-full h-full object-contain"
              />
            </div>

            <button
              onClick={() => setShowPayModal(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#fff8e8] hover:bg-white px-5 py-3 text-xs font-black text-[#382b12] transition shadow-lg active:scale-95"
            >
              <span>Pay Now with UPI</span>
            </button>
          </section>

          {/* TWO-COLUMN DASHBOARD GRID (INCOMING REQUESTS + RIGHT CONTROLS) */}
          <div className="grid gap-6 xl:grid-cols-[1.6fr_.9fr]">
            
            {/* LEFT COLUMN: INCOMING LOCAL REQUESTS WITHIN 5KM */}
            <section className="min-w-0 rounded-2xl border border-white/10 bg-[#202b29] p-5 space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3.5">
                <div>
                  <h2 className="text-lg font-black text-white font-['Outfit'] tracking-tight flex items-center gap-2">
                    <span>Incoming Local Job Requests</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Within 5 km
                    </span>
                  </h2>
                  <p className="text-xs text-white/50 mt-0.5">Instant booking requests near your location.</p>
                </div>
                
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  {jobs.length} Requests
                </span>
              </div>

              {jobs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/15 px-5 py-12 text-center space-y-2">
                  <MapPin className="mx-auto h-8 w-8 text-slate-500" />
                  <h3 className="text-sm font-bold text-white">You are all caught up</h3>
                  <p className="text-xs text-white/50">New requests within 5 km will appear here automatically.</p>
                </div>
              ) : (
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {jobs.map((j) => {
                    const clientName = j.client_name || j.clientName || 'Verma Family';
                    const clientPhone = j.client_phone || j.clientPhone || '+91 98111 00223';
                    const workDesc = j.work_description || j.workDescription;
                    const location = j.location_address || j.location;
                    const fee = j.agreed_total_fee || j.agreedFee;

                    return (
                      <article key={j.id} className="group rounded-2xl border border-white/10 bg-[#263330] p-4 transition hover:-translate-y-0.5 hover:border-[#dca42f]/60 flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="rounded-full bg-[#f3c254] px-2.5 py-0.5 text-[10px] font-black text-[#3d2b09]">
                            📍 2.3 km away
                          </span>
                          <span className="text-[10px] text-white/50 font-semibold">Today • 1:30 PM</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 font-black text-xs flex items-center justify-center border border-teal-500/30">
                              {clientName.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-white truncate">{clientName}</h3>
                              <p className="text-[11px] text-white/50 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-[#eab344]" /> {location}
                              </p>
                            </div>
                          </div>

                          <p className="mt-2.5 text-xs text-white/70 line-clamp-2 bg-black/20 p-2 rounded-xl">
                            "{workDesc}"
                          </p>
                        </div>

                        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                          <span className="text-base font-black text-[#f2c75d] font-['Outfit']">
                            ₹{fee}
                          </span>

                          <div className="flex items-center gap-2">
                            {j.status === 'ACCEPTED' ? (
                              <a href={`tel:${clientPhone}`} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5" /> Call Client
                              </a>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleJobAction(j.id, 'REJECTED')}
                                  className="px-2.5 py-1.5 rounded-lg border border-white/15 text-[10px] font-bold text-white/60 hover:border-red-400 hover:text-red-300 transition"
                                >
                                  Decline
                                </button>
                                <button
                                  onClick={() => handleJobAction(j.id, 'ACCEPTED')}
                                  disabled={!worker.isAvailable}
                                  className="px-3 py-1.5 rounded-lg bg-[#f1b63e] hover:bg-[#ffd477] text-slate-950 text-[10px] font-black transition disabled:opacity-40"
                                >
                                  Accept Job
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* RIGHT COLUMN: RATE SLIDER + KYC STATUS */}
            <div className="space-y-5">
              
              {/* Daily Rate Slider Widget */}
              <section className="rounded-2xl border border-white/10 bg-[#202b29] p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white font-['Outfit']">Set Your Daily Rate</h2>
                    <p className="text-xs text-white/50">Your preferred daily wage for local clients.</p>
                  </div>
                  <DollarSign className="w-5 h-5 text-[#eab344]" />
                </div>

                <div className="flex justify-center">
                  <span className="rounded-xl bg-[#f1b63e] px-4 py-2 text-base font-black text-[#263029] font-['Outfit'] shadow-md">
                    ₹{worker.dailyRate} / day
                  </span>
                </div>

                <input
                  type="range"
                  min="500"
                  max="1500"
                  step="50"
                  value={worker.dailyRate}
                  onChange={(e) => setWorker({ ...worker, dailyRate: Number(e.target.value) })}
                  className="w-full accent-[#eeb63d] cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-white/40 font-bold">
                  <span>₹500</span>
                  <span>₹1,000</span>
                  <span>₹1,500</span>
                </div>
              </section>

              {/* KYC Verification Status Card */}
              <section className="rounded-2xl border border-white/10 bg-[#202b29] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white font-['Outfit']">Verification Status</h2>
                    <p className="text-xs text-white/50">Build trust with homeowners before visits.</p>
                  </div>
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-200">KYC Aadhaar & Bank Details Verified</p>
                    <p className="text-[10px] text-emerald-400 font-mono">Government ID Checked • Official Badge Active</p>
                  </div>
                </div>
              </section>

            </div>

          </div>

          {/* TAB 2: DUES LEDGER */}
          {activeTab === 'dues' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white font-['Outfit']">36-Hour Platform Commission Dues Ledger</h2>
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-slate-400 font-semibold">Account Standing:</span>
                  <span className={hasActiveDues ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {hasActiveDues ? '⚠️ Pending 10% Platform Commission' : '✅ 100% Cleared & Active in Cloud Database'}
                  </span>
                </div>

                {hasActiveDues ? (
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 font-bold">Commission Fee Owed (10%):</span>
                      <span className="text-2xl font-black text-amber-400 font-['Outfit']">₹{duesAmount}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Grace Period Expiry:</span>
                      <span className="text-white font-semibold">{new Date(worker.dues?.dueExpiresAt).toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => setShowPayModal(true)}
                      className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all mt-2"
                    >
                      Pay ₹{duesAmount} Platform Fee Now
                    </button>
                  </div>
                ) : (
                  <div className="p-6 text-center space-y-2 text-slate-400">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <p className="text-white font-bold">No pending commission dues.</p>
                    <p className="text-slate-400">All completed direct-cash jobs have been settled.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: WORK PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white font-['Outfit']">Work Showcase Photos</h2>
                <span className="text-xs text-slate-400">Saved to SQLite `worker_portfolios` table</span>
              </div>

              {addPhotoSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  ✓ Photo successfully added to SQLite database and live on Client App!
                </div>
              )}

              {/* Upload Form */}
              <form onSubmit={handleAddPhotoSubmit} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 text-xs">
                <h3 className="font-bold text-white text-sm">Add New Work Showcase Photo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Work Title (e.g. Bathroom Concealed Fitting)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="sm:col-span-2 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  />
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Construction">Construction</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Painting">Painting</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <input
                    type="url"
                    required
                    placeholder="Image URL (e.g. https://images.unsplash.com/...)"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={isUploadingPhoto}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isUploadingPhoto ? 'Saving...' : 'Add Photo'}</span>
                  </button>
                </div>
              </form>

              {/* Photo Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(worker.portfolio || []).map((img) => (
                  <div key={img.id} className="glass-panel rounded-2xl overflow-hidden border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="h-44 bg-slate-950 relative">
                      <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3">
                      <h4 className="text-xs font-bold text-white truncate">{img.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{img.category || 'Work Showcase'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: BANK & KYC */}
          {activeTab === 'bank' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white font-['Outfit']">Bank Payouts & Aadhaar KYC Setup</h2>

              {bankSuccessMsg && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  ✓ {bankSuccessMsg}
                </div>
              )}

              <form onSubmit={handleBankSubmit} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 text-xs max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Account Holder Name</label>
                    <input
                      type="text"
                      required
                      value={bankForm.accountHolderName}
                      onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Bank Name</label>
                    <input
                      type="text"
                      required
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Account Number</label>
                    <input
                      type="text"
                      required
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">IFSC Code</label>
                    <input
                      type="text"
                      required
                      value={bankForm.ifscCode}
                      onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">UPI ID</label>
                    <input
                      type="text"
                      required
                      value={bankForm.upiId}
                      onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Aadhaar Card Number</label>
                    <input
                      type="text"
                      required
                      value={bankForm.govtIdNumber}
                      onChange={(e) => setBankForm({ ...bankForm, govtIdNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingBank}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
                >
                  {isUpdatingBank ? 'Saving to Database...' : 'Save Bank & KYC to SQLite DB'}
                </button>
              </form>
            </div>
          )}

        </main>
      </div>

      {/* Pay Dues Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-md glass-panel rounded-3xl border border-slate-700 p-6 space-y-4">
            <h3 className="text-xl font-bold text-white font-['Outfit']">Pay Platform Commission Fee</h3>
            
            {paySuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <p className="text-base font-bold text-white">Payment Verified & Settled!</p>
                <p className="text-xs text-slate-300">Commission recorded in SQLite DB. Your profile is 100% unlocked & active.</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-slate-300">
                  Pay 8% website commission fee (<strong>₹{duesAmount}</strong>) for completed direct-cash jobs.
                </p>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400">Worker ID:</span>
                    <span className="text-white">{worker.id}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400">Amount Due:</span>
                    <span className="text-amber-400 font-bold text-sm">₹{duesAmount}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPayModal(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayDuesSubmit}
                    disabled={isPayingDues}
                    className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                  >
                    {isPayingDues ? 'Processing...' : 'Pay via UPI / Card'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-500">
        © 2026 kaam Worker Portal (Port 5175) • Connected to SQLite (`kaam_database.sqlite`).
      </footer>
    </div>
  );
}

