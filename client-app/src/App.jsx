import React, { useState, useEffect } from 'react';
import { CATEGORIES, INITIAL_WORKERS, POPULAR_SERVICES, CUSTOMER_REVIEWS, TRADE_SERVICES } from './data/mockData';
import { AuthPage } from './components/auth/AuthPage';
import { ClientOnboardingWizard } from './components/onboarding/ClientOnboardingWizard';
import { WorkerProfileDetail } from './components/profile/WorkerProfileDetail';
import { CheckoutPage } from './components/checkout/CheckoutPage';
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
  LogOut,
  User,
  Trash2,
  Briefcase,
  Star,
  Clock,
  ArrowRight,
  ChevronDown,
  CircleHelp,
  Check,
  Award,
  Shield,
  Layers
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

const CITIES = [
  "Mumbai, MH",
  "Delhi NCR",
  "Noida, UP",
  "Bengaluru, KA",
  "Pune, MH",
  "Hyderabad, TS",
  "Lucknow, UP",
  "Gurgaon, HR"
];

const ICON_MAP = {
  Wrench,
  Droplets,
  Zap,
  HardHat,
  Paintbrush,
  Hammer,
  Grid,
  Flame,
  Sparkles,
};

const API_URL = 'http://localhost:5050/api/jobs';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kaam_client_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Selected City / Location
  const [selectedCity, setSelectedCity] = useState('Mumbai, MH');
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // Auth Modal State (Triggered on Login click or Booking)
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  // 1-TIME SILENT LIVE GEOLOCATION CAPTURE
  useEffect(() => {
    if (!user?.id) return;
    const hasSynced = localStorage.getItem('kaam_geo_synced_v1');
    if (hasSynced) return;

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          localStorage.setItem('kaam_geo_synced_v1', 'true');
          localStorage.setItem('kaam_user_coords', JSON.stringify({ latitude, longitude }));

          try {
            await fetch('http://localhost:5050/api/auth/update-location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id, latitude, longitude })
            });
          } catch (e) {
            // Silently ignore network failures in background
          }
        },
        () => {
          localStorage.setItem('kaam_geo_synced_v1', 'true');
        },
        { timeout: 8000, maximumAge: 600000, enableHighAccuracy: false }
      );
    } else {
      localStorage.setItem('kaam_geo_synced_v1', 'true');
    }
  }, [user?.id]);

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
  };

  // Delete Account Modal State
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [showOnboarding, setShowOnboarding] = useState(false);

  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'my-bookings'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxBudget, setMaxBudget] = useState(1500);
  const [onlyVerified, setOnlyVerified] = useState(false);

  const [selectedWorkerProfile, setSelectedWorkerProfile] = useState(null);
  const [activeWorkerStudio, setActiveWorkerStudio] = useState(null);
  const [activeCheckoutOrder, setActiveCheckoutOrder] = useState(null);
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
    setShowAuthModal(false);
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
          const mapped = data.workers.map((w, idx) => ({
            id: w.id || `w-${idx}`,
            name: w.name || 'Master Craftsman',
            phone: w.phone || '+91 98765 43210',
            locality: w.locality || 'Sector 62, Noida',
            trade: w.tradeCategory || 'plumber',
            tradeTitle: w.tradeTitle || 'Trade Specialist',
            experience: w.experienceYears || 8,
            dailyRate: w.dailyRate || 650,
            hourlyRate: w.hourlyRate || 120,
            rating: w.ratingAverage || 4.9,
            reviewCount: w.completedJobsCount ? w.completedJobsCount + 40 : 118,
            completedJobsCount: w.completedJobsCount || 184,
            isAvailable: Boolean(w.isAvailable),
            kycStatus: w.kycStatus || 'VERIFIED',
            photo: w.photo || (idx % 2 === 0 ? 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=600&q=80' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'),
            bio: w.bio || 'Certified specialist with proven track record in residential and commercial repairs.',
            portfolioImages: w.portfolios && w.portfolios.length > 0 ? w.portfolios : [
              {
                id: 'p-default',
                title: 'Quality Execution',
                category: 'Home Service',
                url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
                date: 'Aug 2026',
                description: 'Professional grade installation and repair.'
              }
            ]
          }));
          setDbWorkers(mapped);
        }
      }
    } catch (err) {
      console.warn('Backend workers endpoint offline, using local benchmark data:', err.message);
    }
  };

  const fetchJobsFromAPI = async () => {
    if (!user) return;
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  useEffect(() => {
    fetchWorkersFromDB();
    if (user) {
      fetchJobsFromAPI();
      const interval = setInterval(fetchJobsFromAPI, 4000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('kaam_client_user');
    localStorage.removeItem('kaam_token');
    setActiveTab('browse');
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage('');

    const fullAddr = `${profileForm.locality}, near ${profileForm.landmark}, ${profileForm.state} - ${profileForm.pincode}`;

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

      if (res.ok && data.user) {
        const updatedUser = {
          ...user,
          ...data.user,
          formattedClientId: user.formattedClientId || '001',
          onboardingCompleted: true
        };
        setUser(updatedUser);
        localStorage.setItem('kaam_client_user', JSON.stringify(updatedUser));
        setProfileMessage('✓ Profile successfully updated in MongoDB & SQLite database!');
        setTimeout(() => {
          setShowEditProfileModal(false);
          setProfileMessage('');
        }, 1200);
      } else {
        setProfileMessage(data.error || 'Failed to update profile.');
      }
    } catch (err) {
      console.warn('Network error while updating profile:', err);
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

      if (res.ok) {
        localStorage.removeItem('kaam_client_user');
        setUser(null);
        setShowDeleteConfirmModal(false);
      } else {
        setDeleteError('Failed to delete account.');
      }
    } catch (err) {
      setDeleteError('Connection error.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const workerList = dbWorkers.length > 0 ? dbWorkers : INITIAL_WORKERS;

  const filteredWorkers = workerList.filter((worker) => {
    const matchesCat = selectedCategory === 'all' || worker.trade === selectedCategory;
    const matchesSearch =
      worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.tradeTitle.toLowerCase().includes(searchQuery.toLowerCase());
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
      clientName: user?.fullName || bookingForm.name,
      clientPhone: user?.phone || bookingForm.phone,
      locationAddress: bookingForm.address,
      workDescription: bookingForm.description,
      agreedTotalFee: bookingWorker.totalFee || bookingWorker.dailyRate,
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
          client_name: user?.fullName || bookingForm.name,
          client_phone: user?.phone || bookingForm.phone,
          location_address: bookingForm.address,
          work_description: bookingForm.description,
          agreed_total_fee: bookingWorker.totalFee || bookingWorker.dailyRate,
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

  const handleHireWorkerClick = (worker) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setBookingWorker(worker);
    setBookingSuccess(false);
  };

  if (showOnboarding) {
    return <ClientOnboardingWizard user={user} onComplete={handleOnboardingComplete} />;
  }

  // URBAN COMPANY WORKER PROFILE & SERVICES DETAIL STUDIO PAGE (EXACT IMAGE)
  if (activeWorkerStudio) {
    return (
      <div className="min-h-screen bg-[#fcfbf9] text-slate-900 flex flex-col justify-between font-['Plus_Jakarta_Sans',sans-serif]">
        <div>
          {/* Header */}
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-sm">
            <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
              
              <div className="flex items-center gap-6">
                <div 
                  onClick={() => setActiveWorkerStudio(null)}
                  className="flex items-center gap-2.5 cursor-pointer"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-400 text-[20px] font-black text-slate-950 shadow-md shadow-amber-500/20">
                    K
                  </span>
                  <span className="text-2xl font-black text-slate-900 font-['Outfit'] tracking-tight">
                    kaam
                  </span>
                </div>

                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>{selectedCity}</span>
                </div>
              </div>

              {/* Center search input */}
              <div className="relative flex-1 max-w-lg hidden sm:block">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder={`Search services inside ${activeWorkerStudio.name}'s packages...`}
                  className="w-full pl-11 pr-4 py-2.5 rounded-full bg-slate-100/90 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition"
                />
              </div>

              {/* Right User or Login */}
              <div className="flex items-center gap-3">
                {user ? (
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleOpenProfileModal}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100/80 border border-amber-200 text-slate-900 text-xs font-bold shadow-sm"
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] grid place-items-center">
                        {(user.fullName || 'U').charAt(0)}
                      </span>
                      <span className="max-w-[100px] truncate">{user.fullName || 'My Account'}</span>
                      <span className="text-[10px] text-amber-800 font-mono font-bold bg-amber-200 px-1.5 py-0.5 rounded">
                        ID: {user.formattedClientId || '001'}
                      </span>
                    </button>

                    <button
                      onClick={handleLogout}
                      title="Sign Out"
                      className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className="px-5 py-2.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-black shadow-md shadow-slate-900/10 flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Login / Sign Up</span>
                  </button>
                )}
              </div>

            </div>
          </header>

          {/* STUDIO DETAIL VIEW */}
          <WorkerProfileDetail
            worker={activeWorkerStudio}
            selectedCity={selectedCity}
            onBack={() => setActiveWorkerStudio(null)}
            onBookNow={(configuredWorker) => {
              setActiveCheckoutOrder({
                worker: configuredWorker,
                cartItems: configuredWorker.selectedCartItems || []
              });
              setActiveWorkerStudio(null);
            }}
          />
        </div>

        {/* Studio Footer */}
        <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 py-6 text-center text-xs">
          © 2026 KAAM Platform • Urban Company Studio Standard
        </footer>

        {/* Auth Modal if triggered in studio */}
        {showAuthModal && (
          <AuthPage
            onLoginSuccess={handleLoginSuccess}
            isWorkerApp={false}
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </div>
    );
  }

  // URBAN COMPANY CHECKOUT PAGE (EXACT IMAGE MATCH)
  if (activeCheckoutOrder) {
    return (
      <CheckoutPage
        worker={activeCheckoutOrder.worker}
        user={user}
        cartItems={activeCheckoutOrder.cartItems}
        onBack={() => {
          setActiveWorkerStudio(activeCheckoutOrder.worker);
          setActiveCheckoutOrder(null);
        }}
        onRequireLogin={() => setShowAuthModal(true)}
        onBookingComplete={() => {
          setActiveCheckoutOrder(null);
          setActiveTab('my-bookings');
          fetchJobsFromAPI();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-slate-900 selection:bg-amber-400 selection:text-slate-950 flex flex-col justify-between font-['Plus_Jakarta_Sans',sans-serif]">
      
      <div>
        {/* URBAN COMPANY BENCHMARK TOP HEADER */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-sm">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
            
            {/* Left: Brand Logo & Location Selector */}
            <div className="flex items-center gap-6">
              <div 
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); setActiveTab('browse'); }}
                className="flex items-center gap-2.5 cursor-pointer"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-400 text-[20px] font-black text-slate-950 shadow-md shadow-amber-500/20">
                  K
                </span>
                <span className="text-2xl font-black text-slate-900 font-['Outfit'] tracking-tight">
                  kaam
                </span>
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
                  <div className="absolute left-0 top-10 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 animate-in fade-in">
                    {CITIES.map(city => (
                      <button
                        key={city}
                        onClick={() => {
                          setSelectedCity(city);
                          setShowCityDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition ${selectedCity === city ? 'bg-amber-50 text-amber-700 font-extrabold' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Center: Global Service Search Input */}
            <div className="relative flex-1 max-w-lg hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search for 'plumber', 'electrician', 'tap leak', 'painting'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 rounded-full bg-slate-100/90 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-700 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Right: Authenticated User Actions OR [ Login / Sign Up ] Button */}
            <div className="flex items-center gap-3">
              <a
                href="http://localhost:5175"
                target="_blank"
                rel="noreferrer"
                className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-950 transition px-3 py-2 rounded-xl hover:bg-slate-100"
              >
                <HardHat className="w-4 h-4 text-amber-600" />
                <span>Register as a Worker</span>
              </a>

              {user ? (
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setActiveTab(activeTab === 'browse' ? 'my-bookings' : 'browse')}
                    className={`text-xs font-bold px-3.5 py-2 rounded-xl transition ${
                      activeTab === 'my-bookings' ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    My Requests ({jobs.length})
                  </button>

                  {/* Profile Button with Helpdesk Client ID */}
                  <button
                    type="button"
                    onClick={handleOpenProfileModal}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100/80 border border-amber-200 text-slate-900 text-xs font-bold shadow-sm hover:bg-amber-100 transition"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] grid place-items-center">
                      {(user.fullName || 'U').charAt(0)}
                    </span>
                    <span className="max-w-[100px] truncate">{user.fullName || 'My Account'}</span>
                    <span className="text-[10px] text-amber-800 font-mono font-bold bg-amber-200 px-1.5 py-0.5 rounded">
                      ID: {user.formattedClientId || '001'}
                    </span>
                  </button>

                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="px-5 py-2.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-black shadow-md shadow-slate-900/10 flex items-center gap-2 active:scale-95 transition-all"
                >
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Login / Sign Up</span>
                </button>
              )}
            </div>

          </div>
        </header>

        {/* HERO SECTION: URBAN COMPANY STYLE CATEGORY CAROUSEL & HEADLINE */}
        <section className="bg-gradient-to-b from-[#faf7f2] via-white to-transparent py-10 px-4 sm:px-8 border-b border-slate-100">
          <div className="max-w-[1440px] mx-auto text-center space-y-4">
            
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-xs font-extrabold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Verified Home Services & Skilled Craftsmen</span>
            </span>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-950 font-['Outfit'] tracking-tight leading-tight max-w-3xl mx-auto">
              Home services at your doorstep in <span className="text-amber-600 underline decoration-amber-300 decoration-wavy underline-offset-8">{selectedCity.split(',')[0]}</span>
            </h1>

            <p className="text-slate-600 text-sm max-w-xl mx-auto font-medium">
              Hire background-verified plumbers, electricians, carpenters, painters, and home maintenance pros in under 30 minutes.
            </p>

            {/* URBAN COMPANY CATEGORY TILES GRID */}
            <div className="pt-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-3 max-w-5xl mx-auto">
              {CATEGORIES.map((cat) => {
                const IconComp = ICON_MAP[cat.icon] || Wrench;
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      if (activeTab !== 'browse') setActiveTab('browse');
                    }}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-200 group ${
                      isSelected
                        ? 'bg-amber-400/20 border-amber-400 shadow-md shadow-amber-500/10 scale-105'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 ${
                      isSelected ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <IconComp className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <span className={`text-[11px] font-extrabold text-center leading-tight ${isSelected ? 'text-amber-900 font-black' : 'text-slate-700'}`}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>
        </section>

        {/* MAIN BODY AREA */}
        <main className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 space-y-12">
          
          {/* MY HIRE REQUESTS TAB (WHEN LOGGED IN) */}
          {activeTab === 'my-bookings' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 font-['Outfit']">My Booking Requests</h2>
                  <p className="text-xs text-slate-500 mt-1">Live tracking connected with SQLite & MongoDB database.</p>
                </div>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                >
                  ← Back to Home Services
                </button>
              </div>

              {jobs.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl text-center space-y-3 text-slate-400 border border-slate-200">
                  <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No active bookings yet.</p>
                  <p className="text-xs text-slate-500">Explore services and select a verified tradesperson to book.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((j) => {
                    const workerName = j.worker_name || j.workerName || 'Ramesh Kumar Mistry';
                    const tradeTitle = j.trade_title || j.tradeTitle || 'Master Plumber';
                    const workerPhone = j.worker_phone || j.workerPhone || '+91 98765 43210';
                    const workDesc = j.work_description || j.workDescription;
                    const location = j.location_address || j.location;
                    const fee = j.agreed_total_fee || j.agreedFee;

                    return (
                      <div key={j.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="text-base font-extrabold text-slate-900">{workerName}</span>
                            <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                              {tradeTitle}
                            </span>
                            {j.status === 'ACCEPTED' ? (
                              <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                                🟢 Worker On The Way
                              </span>
                            ) : j.status === 'REJECTED' ? (
                              <span className="text-xs bg-red-50 text-red-700 font-bold px-2.5 py-0.5 rounded-full border border-red-200">
                                🔴 Declined by Worker
                              </span>
                            ) : (
                              <span className="text-xs bg-amber-50 text-amber-700 font-bold px-2.5 py-0.5 rounded-full border border-amber-200 animate-pulse">
                                ⏳ Waiting for Worker...
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600">"{workDesc}"</p>
                          <p className="text-xs text-slate-400">Location: {location} • Total: ₹{fee}</p>
                        </div>

                        {j.status === 'ACCEPTED' && (
                          <a href={`tel:${workerPhone}`} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20">
                            <Phone className="w-4 h-4" />
                            <span>Call Worker ({workerPhone})</span>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* SECTION 1: POPULAR & TRENDING SERVICES (URBAN COMPANY BENCHMARK) */}
              <section className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-['Outfit'] tracking-tight">
                      Most Booked Home Services
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Fixed upfront pricing with 100% genuine workmanship guarantee.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {POPULAR_SERVICES.map((srv) => (
                    <div key={srv.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex gap-4">
                      <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                        <img src={srv.image} alt={srv.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded w-fit">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>{srv.rating} ({srv.reviews})</span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">{srv.title}</h3>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{srv.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="text-sm font-black text-slate-900 font-['Outfit']">₹{srv.price}</span>
                          <button
                            onClick={() => {
                              setSelectedCategory(srv.category);
                              const targetSection = document.getElementById('verified-pros-section');
                              if (targetSection) {
                                targetSection.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold transition active:scale-95 flex items-center gap-1 shadow-sm"
                          >
                            <span>Explore Pros</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 2: VERIFIED TRADESPERSON CARDS (PROFILES & BOOKING) */}
              <section id="verified-pros-section" className="space-y-4 pt-4 scroll-mt-24">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-['Outfit'] tracking-tight flex items-center gap-2">
                      <span>Available Verified Professionals</span>
                      <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                        {filteredWorkers.length} Online
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Background-checked craftsmen near {selectedCity.split(',')[0]}.</p>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                      <input
                        type="checkbox"
                        checked={onlyVerified}
                        onChange={(e) => setOnlyVerified(e.target.checked)}
                        className="accent-amber-500 rounded"
                      />
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-semibold text-slate-700">KYC Verified Only</span>
                    </label>
                  </div>
                </div>

                {/* Worker Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredWorkers.map((w) => (
                    <article key={w.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                      
                      {/* Photo & Badges */}
                      <div className="relative h-48 overflow-hidden bg-slate-950">
                        <img
                          src={w.photo}
                          alt={w.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                        
                        <div className="absolute left-3.5 top-3.5 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-950 text-[10px] font-black tracking-wide shadow-sm">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>KAAM VERIFIED</span>
                        </div>

                        <div className="absolute bottom-3 left-3.5 flex items-center gap-1.5 text-white">
                          <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[11px] font-bold border border-white/20 text-amber-300">
                            📍 {w.distance || 1.8} km away
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{w.name}</h3>
                              <p className="text-xs font-bold text-amber-700 mt-0.5">{w.tradeTitle} • <span className="text-slate-500 font-normal">{w.locality}</span></p>
                            </div>
                            
                            <div className="flex items-center gap-1 text-xs font-black text-amber-900 bg-amber-100 px-2 py-1 rounded-lg">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span>{w.rating}</span>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="font-semibold">{w.reviewCount} reviews</span>
                            <span>•</span>
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aadhaar & Bank KYC
                            </span>
                          </div>

                          <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            "{w.bio}"
                          </p>
                        </div>

                        {/* Bottom Pricing & Actions */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block font-bold">Standard Rate</span>
                            <span className="text-lg font-black text-slate-900 font-['Outfit']">₹{w.dailyRate}<span className="text-xs text-slate-400 font-normal">/day</span></span>
                          </div>

                          <div>
                            <button
                              onClick={() => {
                                setActiveWorkerStudio(w);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:brightness-105 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                            >
                              <span>View Profile & Packages</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                    </article>
                  ))}
                </div>
              </section>

              {/* SECTION 3: WHY CHOOSE KAAM (URBAN COMPANY TRUST BENCHMARK) */}
              <section className="bg-gradient-to-r from-[#042e2b] via-[#08453f] to-[#04332d] rounded-3xl p-8 sm:p-12 text-white space-y-8 shadow-xl">
                <div className="max-w-2xl">
                  <span className="text-xs font-black uppercase tracking-widest text-amber-400">Why Customers Trust KAAM</span>
                  <h2 className="text-2xl sm:text-4xl font-black font-['Outfit'] mt-1">
                    Quality service, transparent rates, zero guesswork.
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-2">
                    <Shield className="w-8 h-8 text-amber-400" />
                    <h3 className="text-base font-bold">100% Background Verified</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">Every professional goes through strict Aadhaar & criminal background authentication.</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-2">
                    <Award className="w-8 h-8 text-amber-400" />
                    <h3 className="text-base font-bold">Fixed Upfront Pricing</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">No hidden charges or unexpected surges. Pay standard agreed daily and hourly rates.</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-2">
                    <Clock className="w-8 h-8 text-amber-400" />
                    <h3 className="text-base font-bold">Doorstep in 30 Mins</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">Direct local dispatch ensures skilled craftsmen reach your locality promptly.</p>
                  </div>
                </div>
              </section>

              {/* SECTION 4: REAL CUSTOMER REVIEWS */}
              <section className="space-y-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-['Outfit']">Customer Stories & Ratings</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Real feedback from homeowners across India.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {CUSTOMER_REVIEWS.map((rev) => (
                    <div key={rev.id} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                      <div className="flex items-center gap-1 text-amber-500">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">"{rev.comment}"</p>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">{rev.clientName} ({rev.city})</span>
                        <span className="text-[11px] text-slate-400">{rev.tradeUsed}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

        </main>
      </div>

      {/* URBAN COMPANY COMPREHENSIVE FOOTER */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 pt-12 pb-8 px-4 sm:px-8 mt-12 text-xs">
        <div className="max-w-[1440px] mx-auto space-y-8">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 font-black grid place-items-center text-sm">K</span>
                <span className="text-xl font-black text-white font-['Outfit']">kaam</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                India's premier on-demand blue-collar tradesperson marketplace connecting homeowners with verified craftsmen.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-3">Popular Trades</h4>
              <ul className="space-y-2 text-[11px]">
                <li>Plumbing & Tap Repair</li>
                <li>Electrical & Wiring</li>
                <li>Carpentry & Furniture</li>
                <li>Wall Painting & Putty</li>
                <li>Tile & Masonry Works</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-3">Service Areas</h4>
              <ul className="space-y-2 text-[11px]">
                <li>Mumbai & Navi Mumbai</li>
                <li>Delhi NCR & Noida</li>
                <li>Bengaluru & Whitefield</li>
                <li>Pune & Hinjewadi</li>
                <li>Hyderabad & Gachibowli</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-3">Helpdesk & Support</h4>
              <p className="text-[11px] text-slate-400 mb-2">Have a question or need service assistance?</p>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1">
                <p className="text-white font-bold text-xs">Helpdesk ID: 001</p>
                <p className="text-[10px] text-amber-400">kaam@yors.online</p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 text-center text-[11px] text-slate-500">
            © 2026 KAAM Platform. All rights reserved. Urban Company Benchmark Standard.
          </div>

        </div>
      </footer>

      {/* POPUP MODAL 1: AUTHENTICATION MODAL (GOOGLE & EMAIL) */}
      {showAuthModal && (
        <AuthPage
          onLoginSuccess={handleLoginSuccess}
          isWorkerApp={false}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* POPUP MODAL 2: WORKER PROFILE VIEW */}
      {selectedWorkerProfile && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="relative h-48 bg-slate-950">
              <img src={selectedWorkerProfile.photo} alt={selectedWorkerProfile.name} className="w-full h-full object-cover" />
              <button
                onClick={() => setSelectedWorkerProfile(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 text-white grid place-items-center font-bold text-xs"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">{selectedWorkerProfile.name}</h3>
                <p className="text-xs font-bold text-amber-700">{selectedWorkerProfile.tradeTitle} • {selectedWorkerProfile.locality}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
                  <span className="font-bold flex items-center gap-1 text-amber-700">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> {selectedWorkerProfile.rating}
                  </span>
                  <span>•</span>
                  <span>{selectedWorkerProfile.experience} years experience</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold">KYC Verified</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                "{selectedWorkerProfile.bio}"
              </p>

              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">Past Work Gallery</h4>
                <div className="grid grid-cols-2 gap-2">
                  {(selectedWorkerProfile.portfolioImages || []).map((img, i) => (
                    <img key={i} src={img.url} alt={img.title} className="h-24 w-full object-cover rounded-xl border border-slate-200" />
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Daily Wage</span>
                  <span className="text-xl font-black text-slate-900 font-['Outfit']">₹{selectedWorkerProfile.dailyRate}</span>
                </div>

                <button
                  onClick={() => {
                    const w = selectedWorkerProfile;
                    setSelectedWorkerProfile(null);
                    handleHireWorkerClick(w);
                  }}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition"
                >
                  Hire This Worker ➔
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL 3: BOOKING FORM */}
      {bookingWorker && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Book {bookingWorker.name}</h3>
                <p className="text-xs text-slate-500">{bookingWorker.tradeTitle} • ₹{bookingWorker.dailyRate}/day</p>
              </div>
              <button
                onClick={() => setBookingWorker(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            {bookingSuccess ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold text-slate-900">Booking Sent to {bookingWorker.name}!</h4>
                <p className="text-xs text-slate-500">The worker has received your request. Check status in My Requests.</p>
                <button
                  onClick={() => {
                    setBookingWorker(null);
                    setActiveTab('my-bookings');
                  }}
                  className="px-6 py-2.5 rounded-full bg-slate-950 text-white text-xs font-bold"
                >
                  View My Requests
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateBooking} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Work Description *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe what needs to be fixed..."
                    value={bookingForm.description}
                    onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Service Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Your complete home address..."
                    value={bookingForm.address}
                    onChange={(e) => setBookingForm({ ...bookingForm, address: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="font-bold text-slate-700">Estimated Total:</span>
                  <span className="text-lg font-black text-slate-900 font-['Outfit']">₹{bookingWorker.dailyRate}</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs shadow-md active:scale-95 transition"
                >
                  {isSubmitting ? 'Sending Request...' : 'Confirm & Request Worker'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* POPUP MODAL 4: PROFILE EDIT */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">Edit Profile & Contact</h3>
              <button onClick={() => setShowEditProfileModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            {profileMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                {profileMessage}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    name="fullName"
                    value={profileForm.fullName}
                    onChange={handleProfileFormChange}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Primary Phone</label>
                  <input
                    type="text"
                    required
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileFormChange}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Locality & Landmark</label>
                <input
                  type="text"
                  required
                  name="locality"
                  value={profileForm.locality}
                  onChange={handleProfileFormChange}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-black"
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
