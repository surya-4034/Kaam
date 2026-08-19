import React, { useState, useEffect } from 'react';
import { CATEGORIES, INITIAL_WORKERS } from './data/mockData';
import { AuthPage } from './components/auth/AuthPage';
import { ClientOnboardingWizard } from './components/onboarding/ClientOnboardingWizard';
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
  UserCheck,
  User,
  Trash2,
  AlertTriangle,
  Edit,
  Save,
  Building,
  Lock,
  IdCard
} from 'lucide-react';

const INDIAN_STATES = [
  "Uttar Pradesh",
  "Delhi NCR",
  "Haryana",
  "Punjab",
  "Maharashtra",
  "Karnataka",
  "Tamil Nadu",
  "West Bengal",
  "Rajasthan",
  "Gujarat",
  "Bihar",
  "Madhya Pradesh",
  "Kerala",
  "Telangana",
  "Andhra Pradesh",
  "Assam",
  "Odisha",
  "Jharkhand",
  "Chhattisgarh",
  "Himachal Pradesh",
  "Uttarakhand",
  "Goa"
];

const ICON_MAP = { Wrench, Droplets, Zap, HardHat, Paintbrush, Hammer, Grid, Flame, Sparkles };
const API_URL = 'http://localhost:5050/api/jobs';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kaam_client_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Edit Profile Modal State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    secondaryPhone: user?.secondaryPhone || '',
    locality: user?.locality || '',
    landmark: user?.landmark || '',
    state: user?.state || 'Uttar Pradesh',
    pincode: user?.pincode || '',
    address: user?.address || ''
  });

  // Sync profileForm when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || user.full_name || '',
        phone: user.phone || '',
        secondaryPhone: user.secondaryPhone || user.secondary_phone || '',
        locality: user.locality || '',
        landmark: user.landmark || '',
        state: user.state || 'Uttar Pradesh',
        pincode: user.pincode || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleOpenProfileModal = async () => {
    setProfileMessage('');
    setShowEditProfileModal(true);

    if (user?.id) {
      try {
        const res = await fetch(`http://localhost:5050/api/admin/clients/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.client) {
            const freshUser = {
              ...user,
              formattedClientId: data.client.formattedClientId || '001',
              fullName: data.client.fullName || user.fullName,
              phone: data.client.phone || user.phone,
              secondaryPhone: data.client.secondaryPhone === 'None' ? '' : (data.client.secondaryPhone || ''),
              locality: data.client.locality || '',
              landmark: data.client.landmark || '',
              state: data.client.state || 'Uttar Pradesh',
              pincode: data.client.pincode || '',
              address: data.client.address || '',
              onboardingCompleted: Boolean(data.client.onboardingCompleted)
            };
            setUser(freshUser);
            localStorage.setItem('kaam_client_user', JSON.stringify(freshUser));
            setProfileForm({
              fullName: freshUser.fullName,
              phone: freshUser.phone,
              secondaryPhone: freshUser.secondaryPhone,
              locality: freshUser.locality,
              landmark: freshUser.landmark,
              state: freshUser.state,
              pincode: freshUser.pincode,
              address: freshUser.address
            });
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to fetch fresh client data:', e);
      }
    }

    setProfileForm({
      fullName: user?.fullName || user?.full_name || '',
      phone: user?.phone || '',
      secondaryPhone: user?.secondaryPhone || user?.secondary_phone || '',
      locality: user?.locality || '',
      landmark: user?.landmark || '',
      state: user?.state || 'Uttar Pradesh',
      pincode: user?.pincode || '',
      address: user?.address || ''
    });
  };

  // Delete Account Modal State
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (!user) return false;
    return !user.onboardingCompleted;
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
    address: user?.address || 'Sector 63, Noida',
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

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (!userData.onboardingCompleted) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = (updatedUser) => {
    setUser(updatedUser);
    setShowOnboarding(false);
    setBookingForm((prev) => ({
      ...prev,
      name: updatedUser.fullName,
      phone: updatedUser.phone,
      address: updatedUser.address || prev.address,
    }));
  };

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

  const handleProfileFormChange = (e) => {
    setProfileForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setProfileMessage('');
  };

  const handleUpdateProfileSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage('');

    const fullAddr = `${profileForm.locality || ''}, near ${profileForm.landmark || ''}, ${profileForm.state || ''} - ${profileForm.pincode || ''}`;

    try {
      const res = await fetch('http://localhost:5050/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fullName: profileForm.fullName,
          phone: profileForm.phone,
          secondaryPhone: profileForm.secondaryPhone,
          locality: profileForm.locality,
          landmark: profileForm.landmark,
          state: profileForm.state,
          pincode: profileForm.pincode,
          address: fullAddr
        })
      });

      const data = await res.json();

      if (res.ok) {
        const updatedUser = {
          ...user,
          fullName: profileForm.fullName,
          phone: profileForm.phone,
          secondaryPhone: profileForm.secondaryPhone,
          locality: profileForm.locality,
          landmark: profileForm.landmark,
          state: profileForm.state,
          pincode: profileForm.pincode,
          address: fullAddr,
          onboardingCompleted: true
        };
        setUser(updatedUser);
        localStorage.setItem('kaam_client_user', JSON.stringify(updatedUser));
        setProfileMessage('✓ Profile details saved to server database successfully!');
        setTimeout(() => {
          setShowEditProfileModal(false);
          setProfileMessage('');
        }, 1200);
      } else {
        setProfileMessage(`Error: ${data.error || 'Failed to save profile.'}`);
      }
    } catch (err) {
      console.error('Profile update network note:', err);
      const updatedUser = {
        ...user,
        fullName: profileForm.fullName,
        phone: profileForm.phone,
        secondaryPhone: profileForm.secondaryPhone,
        locality: profileForm.locality,
        landmark: profileForm.landmark,
        state: profileForm.state,
        pincode: profileForm.pincode,
        address: fullAddr,
        onboardingCompleted: true
      };
      setUser(updatedUser);
      localStorage.setItem('kaam_client_user', JSON.stringify(updatedUser));
      setProfileMessage('✓ Profile updated locally!');
      setTimeout(() => {
        setShowEditProfileModal(false);
        setProfileMessage('');
      }, 1200);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleDeleteAccountSubmit = async () => {
    setIsDeletingAccount(true);
    setDeleteError('');

    try {
      const res = await fetch('http://localhost:5050/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.removeItem('kaam_client_user');
        setUser(null);
        setShowDeleteConfirmModal(false);
      } else {
        setDeleteError(data.error || 'Failed to delete account. Please try again.');
      }
    } catch (err) {
      console.error('Account deletion error:', err);
      setDeleteError('Connection error while deleting account.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (!user) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} isWorkerApp={false} />;
  }

  if (showOnboarding) {
    return <ClientOnboardingWizard user={user} onComplete={handleOnboardingComplete} />;
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
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-teal-950 font-black shadow-lg shadow-amber-500/30 shrink-0">
                <Wrench className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight">kaam Client</span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30 hidden sm:inline-block">
                    Port 5174
                  </span>
                </div>

                {/* UPPER LEFT CLIENT PROFILE SECTION BUTTON */}
                <button
                  type="button"
                  onClick={handleOpenProfileModal}
                  className="mt-0.5 px-3 py-1 rounded-full bg-teal-500/20 hover:bg-teal-500/30 text-amber-300 border border-teal-500/40 text-[11px] font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                  title="Click to edit profile & address details on server"
                >
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>{user?.fullName || user?.full_name || 'My Profile'}</span>
                  <Edit className="w-3 h-3 text-teal-300 ml-1" />
                </button>
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
                  onClick={() => setShowDeleteConfirmModal(true)}
                  title="Delete Account"
                  className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span className="hidden md:inline">Delete Account</span>
                </button>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
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

      {/* UPPER LEFT CLIENT PROFILE EDIT MODAL */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="bg-slate-900 border border-teal-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative overflow-hidden text-white my-8">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-teal-950 flex items-center justify-center font-black">
                  <User className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black font-['Outfit'] text-white">Client Profile & Settings</h3>
                  <p className="text-xs text-amber-300 font-medium">Update contact & location details on server</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {profileMessage && (
              <div className={`p-3.5 rounded-2xl text-xs font-bold ${
                profileMessage.startsWith('✓') 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                {profileMessage}
              </div>
            )}

            <form onSubmit={handleUpdateProfileSubmit} className="space-y-4 text-xs">
              
              {/* READ-ONLY OFFICIAL CLIENT ID HELPDESK CARD */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-teal-500/30 space-y-2 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                      <IdCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Official Client ID (Helpdesk Support)</span>
                      <span className="font-mono text-amber-400 font-black text-base tracking-wider">
                        Client ID: {user?.formattedClientId || '001'}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" /> Non-Editable
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Database Ref: <span className="font-mono text-slate-300 font-bold">{user?.id || 'u-001'}</span></span>
                  <span className="text-[10px] text-teal-400 font-medium">✓ Registered on KAAM Server</span>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 ml-2">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-teal-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="Enter Full Name"
                    value={profileForm.fullName}
                    onChange={handleProfileFormChange}
                    className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Primary Phone & Alternate Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 ml-2">Primary Phone *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-amber-400 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      name="phone"
                      required
                      placeholder="+91 98111 00223"
                      value={profileForm.phone}
                      onChange={handleProfileFormChange}
                      className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">Alt Phone (Optional)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      name="secondaryPhone"
                      placeholder="Alternate phone"
                      value={profileForm.secondaryPhone}
                      onChange={handleProfileFormChange}
                      className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Locality & Landmark */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 ml-2">Locality / Sector *</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-teal-400 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      name="locality"
                      required
                      placeholder="e.g. Sector 63"
                      value={profileForm.locality}
                      onChange={handleProfileFormChange}
                      className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 ml-2">Landmark *</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-teal-400 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      name="landmark"
                      required
                      placeholder="e.g. Near Metro Station"
                      value={profileForm.landmark}
                      onChange={handleProfileFormChange}
                      className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* State & Pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 ml-2">State *</label>
                  <select
                    name="state"
                    value={profileForm.state}
                    onChange={handleProfileFormChange}
                    className="w-full px-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-teal-500"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 ml-2">Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    required
                    maxLength={6}
                    placeholder="e.g. 201301"
                    value={profileForm.pincode}
                    onChange={handleProfileFormChange}
                    className="w-full px-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-5 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-teal-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isUpdatingProfile ? 'Saving to Server...' : 'Save & Update Profile'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* PERMANENT ACCOUNT DELETION CONFIRMATION MODAL */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative overflow-hidden">
            
            {/* Top Warning Accent Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 absolute top-0 left-0"></div>

            <div className="flex items-center gap-3 text-red-400">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white font-['Outfit']">Delete Client Account</h3>
                <p className="text-xs text-red-300 font-medium">Permanent Database Wipe</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/20 text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-red-200">
                Are you sure you want to delete your account <span className="font-mono font-bold text-white">({user.email || user.fullName})</span>?
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-1 text-[11px]">
                <li>Your profile & contact details will be deleted.</li>
                <li>Your account will be removed from Admin Panel immediately.</li>
                <li>This action <strong>cannot be undone</strong>.</li>
              </ul>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold">
                {deleteError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setDeleteError('');
                }}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Cancel / Keep Account
              </button>

              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={handleDeleteAccountSubmit}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black shadow-lg shadow-red-950/60 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingAccount ? 'Deleting...' : 'Yes, Delete Account'}</span>
              </button>
            </div>

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
