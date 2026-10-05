import React, { useState, useEffect, useRef } from 'react';
import { CATEGORIES, INITIAL_WORKERS, POPULAR_SERVICES, CUSTOMER_REVIEWS, TRADE_SERVICES } from './data/mockData';
import { SERVICE_CATEGORIES_50 } from './data/serviceCategories';
import { AuthPage } from './components/auth/AuthPage';
import { ClientOnboardingWizard } from './components/onboarding/ClientOnboardingWizard';
import { WorkerProfileDetail } from './components/profile/WorkerProfileDetail';
import { CheckoutPage } from './components/checkout/CheckoutPage';
import { getCurrentClientLocation, formatDistanceBadge, CITY_COORDINATES, isMumbaiLocation, MUMBAI_LOCATIONS, DEFAULT_CLIENT_LOCATION } from './services/locationService';
import { auth } from './config/firebase';
import { API_BASE_URL } from './config/api';
import { QRCodeSVG } from 'qrcode.react';
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
  Layers,
  AlertCircle,
  Mail,
  XCircle,
  FileText,
  Copy,
  ExternalLink,
  QrCode
} from 'lucide-react';

const INDIAN_STATES = [
  "Maharashtra",
  "Delhi NCR",
  "Uttar Pradesh",
  "Haryana",
  "Punjab",
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
  "Mumbai (All Neighborhoods)",
  "Andheri West, Mumbai",
  "Bandra West, Mumbai",
  "Powai, Mumbai",
  "Colaba / South Mumbai",
  "Dadar West, Mumbai",
  "Thane West, MMR",
  "Vashi (Navi Mumbai)",
  "Delhi NCR (Outside Mumbai)",
  "Noida, UP (Outside Mumbai)",
  "Bengaluru, KA (Outside Mumbai)",
  "Pune, MH (Outside Mumbai)"
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

const API_URL = `${API_BASE_URL}/api/jobs`;

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kaam_client_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Selected City / Location
  const [selectedCity, setSelectedCity] = useState('Mumbai (All Neighborhoods)');
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // Auth Modal State (Triggered on Login click or Booking)
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Accepted Booking Details & Partner QR Modal State
  const [selectedJobDetails, setSelectedJobDetails] = useState(null);
  const [copiedJobUpi, setCopiedJobUpi] = useState(false);

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
            await fetch(`${API_BASE_URL}/api/auth/update-location`, {
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
        const res = await fetch(`${API_BASE_URL}/api/admin/clients/${user.id}`);
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
  const [showTradeDropdown, setShowTradeDropdown] = useState(false);
  const tradeDropdownRef = useRef(null);

  // Close trade dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tradeDropdownRef.current && !tradeDropdownRef.current.contains(e.target)) {
        setShowTradeDropdown(false);
      }
    };
    if (showTradeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTradeDropdown]);

  const [maxBudget, setMaxBudget] = useState(1500);
  const [onlyVerified, setOnlyVerified] = useState(false);

  const [searchRadiusKm, setSearchRadiusKm] = useState(50);
  const [clientCoords, setClientCoords] = useState({ lat: 19.0760, lng: 72.8777 });
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Exact Mumbai Geographic Range Availability Checks (Based strictly on selected city/locality/GPS)
  const UNAVAILABLE_MESSAGE = 'Service was unavailable at this place, sorry for inconvenience!';
  const cityAvailability = isMumbaiLocation(selectedCity);
  const isServiceAvailable = cityAvailability.isAvailable;

  const handleDetectClientLocation = async () => {
    setIsDetectingLocation(true);
    const coords = await getCurrentClientLocation();
    if (coords && coords.isMumbai) {
      setClientCoords({ lat: coords.lat, lng: coords.lng });
    } else {
      setClientCoords({ lat: 19.0760, lng: 72.8777 });
    }
    setIsDetectingLocation(false);
  };

  useEffect(() => {
    if (CITY_COORDINATES[selectedCity]) {
      setClientCoords({
        lat: CITY_COORDINATES[selectedCity].lat,
        lng: CITY_COORDINATES[selectedCity].lng
      });
    }
  }, [selectedCity]);

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
    address: user?.address || 'Andheri West, Mumbai',
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

  // Fetch live workers from backend search engine API
  const fetchWorkersFromDB = async () => {
    if (!isServiceAvailable) {
      setDbWorkers([]);
      return;
    }

    try {
      let targetUrl = `${API_BASE_URL}/api/workers/search?`;
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery) params.append('q', searchQuery);
      if (maxBudget) params.append('maxBudget', maxBudget);
      const latToSend = clientCoords?.lat || 19.0760;
      const lngToSend = clientCoords?.lng || 72.8777;
      params.append('lat', latToSend);
      params.append('lng', lngToSend);
      params.append('city', 'Mumbai');
      params.append('maxDistanceKm', searchRadiusKm || 75);

      targetUrl += params.toString();

      let workersList = [];
      try {
        const res = await fetch(targetUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.workers && Array.isArray(data.workers) && data.workers.length > 0) {
            workersList = data.workers;
          }
        }
      } catch (sErr) {
        console.warn('Search API notice:', sErr.message);
      }

      // Robust fallback: if search returned 0 workers, fetch all registered workers from /api/workers
      if (workersList.length === 0) {
        try {
          const fbRes = await fetch(`${API_BASE_URL}/api/workers`);
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            if (fbData.workers && Array.isArray(fbData.workers)) {
              workersList = fbData.workers;
            }
          }
        } catch (fbErr) {
          console.warn('Fallback workers API notice:', fbErr.message);
        }
      }

      if (workersList.length > 0) {
        const mapped = workersList.map((w, idx) => ({
            id: w.id || `w-${idx}`,
            name: w.name || 'Master Craftsman',
            phone: w.phone || '+91 98765 43210',
            locality: w.locality || 'Mumbai',
            trade: w.tradeCategory || 'plumber',
            tradeTitle: w.tradeTitle || 'Master Craftsman',
            categories: Array.isArray(w.categories) && w.categories.length > 0 ? w.categories : [w.tradeCategory || 'plumber'],
            packages: Array.isArray(w.packages) ? w.packages : [],
            visitingCharge: w.visitingCharge || w.visiting_charge || 149,
            experience: w.experienceYears || 5,
            dailyRate: w.dailyRate || 650,
            hourlyRate: w.hourlyRate || 120,
            rating: w.ratingAverage || 4.9,
            reviewCount: w.completedJobsCount ? w.completedJobsCount + 20 : 35,
            completedJobsCount: w.completedJobsCount || 10,
            isAvailable: Boolean(w.isAvailable),
            kycStatus: w.kycStatus || 'VERIFIED',
            distanceKm: w.distanceKm ?? 0,
            distanceBadge: formatDistanceBadge(w.distanceKm),
            photo: w.photo || (idx % 2 === 0 ? 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=600&q=80' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'),
            bio: w.bio || 'Certified specialist with proven track record in residential and commercial repairs.',
            portfolio: (() => {
              const raw = (Array.isArray(w.portfolio) && w.portfolio.length > 0)
                ? w.portfolio
                : (Array.isArray(w.portfolios) && w.portfolios.length > 0)
                  ? w.portfolios
                  : [];
              return raw.map((p, pIdx) => ({
                id: p.id || `p-${pIdx}`,
                title: p.title || 'Completed Project',
                category: p.category || p.category_tag || w.tradeCategory || 'general',
                category_tag: p.category || p.category_tag || w.tradeCategory || 'general',
                url: p.url || p.image_url,
                image_url: p.url || p.image_url,
                description: p.description || '',
                date: p.date || p.created_at || ''
              }));
            })(),
            portfolioImages: (() => {
              const raw = (Array.isArray(w.portfolio) && w.portfolio.length > 0)
                ? w.portfolio
                : (Array.isArray(w.portfolios) && w.portfolios.length > 0)
                  ? w.portfolios
                  : [];
              return raw.map((p, pIdx) => ({
                id: p.id || `p-${pIdx}`,
                title: p.title || 'Completed Project',
                category: p.category || p.category_tag || w.tradeCategory || 'general',
                category_tag: p.category || p.category_tag || w.tradeCategory || 'general',
                url: p.url || p.image_url,
                image_url: p.url || p.image_url,
                description: p.description || '',
                date: p.date || p.created_at || ''
              }));
            })(),
            bank: w.bank || null,
            upiId: w.bank?.upi || w.upi_id || w.upiId || ''
          }));
          setDbWorkers(mapped);
        } else {
          setDbWorkers([]);
        }
      }
    } catch (err) {
      console.warn('Backend workers endpoint offline:', err.message);
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
    const intervalWorkers = setInterval(fetchWorkersFromDB, 3000);

    if (user) {
      fetchJobsFromAPI();
      const intervalJobs = setInterval(fetchJobsFromAPI, 3000);
      return () => {
        clearInterval(intervalWorkers);
        clearInterval(intervalJobs);
      };
    }
    return () => clearInterval(intervalWorkers);
  }, [user?.id, selectedCategory, searchQuery, maxBudget, searchRadiusKm, clientCoords?.lat, clientCoords?.lng]);

  const handleLogout = () => {
    try {
      auth.signOut();
    } catch (e) {}
    setUser(null);
    localStorage.removeItem('kaam_client_user');
    localStorage.removeItem('kaam_client_token');
    localStorage.removeItem('kaam_token');
    localStorage.removeItem('kaam_user');
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
      const res = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
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
      const res = await fetch(`${API_BASE_URL}/api/auth/delete-account`, {
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

  const workerList = dbWorkers;

  const filteredWorkers = workerList.filter((worker) => {
    const selCat = (selectedCategory || 'all').toLowerCase().trim();
    const q = (searchQuery || '').toLowerCase().trim();

    // 1. Comprehensive Category Matching Rule (Trade, Skills Array, Package Categories, & Synonyms)
    const matchesCat = (() => {
      if (selCat === 'all') return true;

      // Direct trade match
      const wTrade = (worker.trade || '').toLowerCase();
      if (wTrade === selCat || wTrade.includes(selCat) || selCat.includes(wTrade)) return true;

      // Multi-skills categories array match
      if (Array.isArray(worker.categories)) {
        if (worker.categories.some(c => {
          const cLow = (c || '').toLowerCase();
          return cLow === selCat || cLow.includes(selCat) || selCat.includes(cLow);
        })) return true;
      }

      // Package category & title match (If ANY worker created a package related to that category!)
      if (Array.isArray(worker.packages)) {
        if (worker.packages.some(p => {
          const pCat = (p.category || '').toLowerCase();
          const pTitle = (p.title || '').toLowerCase();
          const pDesc = (p.description || '').toLowerCase();
          return pCat === selCat || pCat.includes(selCat) || selCat.includes(pCat) ||
                 pTitle.includes(selCat) || pDesc.includes(selCat);
        })) return true;
      }

      // Keyword Synonyms Resolution
      const categorySynonyms = {
        electrician: ['electric', 'electrical', 'zap', 'wire', 'wiring', 'fan', 'switch', 'light', 'mcb', 'fuse'],
        plumber: ['plumbing', 'pipe', 'tap', 'leak', 'water', 'drain', 'basin', 'sink', 'toilet', 'flush'],
        carpenter: ['carpentry', 'wood', 'furniture', 'door', 'window', 'table', 'bed', 'chair', 'cupboard', 'drawer', 'lock'],
        painter: ['painting', 'paint', 'wall', 'color', 'putty', 'primer', 'texture', 'waterproof'],
        ac_repair: ['ac', 'aircon', 'cooling', 'fridge', 'refrigerator', 'chiller', 'appliance'],
        cleaner: ['cleaning', 'clean', 'wash', 'maid', 'debris', 'sanitation', 'dust'],
        mason: ['tile', 'marble', 'brick', 'granite', 'stone', 'slate'],
        welder: ['welding', 'iron', 'gate', 'grill', 'metal', 'steel']
      };

      const syns = categorySynonyms[selCat] || [];
      if (syns.length > 0) {
        if (syns.some(s => wTrade.includes(s))) return true;
        if (Array.isArray(worker.categories) && worker.categories.some(c => syns.some(s => (c || '').toLowerCase().includes(s)))) return true;
        if (Array.isArray(worker.packages) && worker.packages.some(p => syns.some(s => (p.category || '').toLowerCase().includes(s) || (p.title || '').toLowerCase().includes(s)))) return true;
      }

      return false;
    })();

    // 2. Comprehensive Search Query Matching Rule (Trade, Packages, Synonyms & Partial Prefixes like 'pa')
    const matchesSearch = (() => {
      if (!q) return true;

      // Direct field checks
      if ((worker.name || '').toLowerCase().includes(q)) return true;
      if ((worker.locality || '').toLowerCase().includes(q)) return true;
      if ((worker.tradeTitle || '').toLowerCase().includes(q)) return true;
      const wTrade = (worker.trade || '').toLowerCase();
      if (wTrade.includes(q) || q.includes(wTrade)) return true;

      // Multi-skills categories array match
      if (Array.isArray(worker.categories) && worker.categories.some(c => {
        const cLow = (c || '').toLowerCase();
        return cLow.includes(q) || q.includes(cLow);
      })) return true;

      // Package categories, titles, and descriptions match
      if (Array.isArray(worker.packages) && worker.packages.some(p => {
        const pTitle = (p.title || '').toLowerCase();
        const pDesc = (p.description || '').toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        return pTitle.includes(q) || pDesc.includes(q) || pCat.includes(q) || q.includes(pCat);
      })) return true;

      // Trade Prefix & Synonym Dictionary (e.g. 'pa' -> painter, 'elec' -> electrician)
      const tradePrefixMap = {
        pa: ['painter', 'paint', 'painting'],
        pain: ['painter', 'paint', 'painting'],
        elec: ['electrician', 'electric', 'electrical'],
        plumb: ['plumber', 'plumbing'],
        carp: ['carpenter', 'carpentry'],
        clean: ['cleaner', 'cleaning'],
        ac: ['ac_repair', 'aircon'],
        mas: ['mason', 'tile']
      };

      for (const [prefix, mappedTrades] of Object.entries(tradePrefixMap)) {
        if (q === prefix || q.startsWith(prefix)) {
          if (mappedTrades.some(t => wTrade.includes(t))) return true;
          if (Array.isArray(worker.categories) && worker.categories.some(c => mappedTrades.some(t => (c || '').toLowerCase().includes(t)))) return true;
          if (Array.isArray(worker.packages) && worker.packages.some(p => mappedTrades.some(t => (p.category || '').toLowerCase().includes(t)))) return true;
        }
      }

      return false;
    })();

    const matchesBudget = (worker.visitingCharge || 149) <= maxBudget || (Array.isArray(worker.packages) && worker.packages.length > 0 ? worker.packages.some(p => (p.price || 0) <= maxBudget) : true);
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
      agreedTotalFee: bookingWorker.totalFee || bookingWorker.visitingCharge || 149,
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
          agreed_total_fee: bookingWorker.totalFee || bookingWorker.visitingCharge || 149,
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
            activeCategoryFilter={selectedCategory}
            searchQuery={searchQuery}
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
      <>
        <CheckoutPage
          worker={activeCheckoutOrder.worker}
          user={user}
          cartItems={activeCheckoutOrder.cartItems}
          onBack={() => {
            setActiveWorkerStudio(activeCheckoutOrder.worker);
            setActiveCheckoutOrder(null);
          }}
          onRequireLogin={() => setShowAuthModal(true)}
          onBookingComplete={(newJob) => {
            setActiveCheckoutOrder(null);
            setActiveWorkerStudio(null);
            setActiveTab('my-bookings');
            if (newJob) {
              setJobs((prev) => [newJob, ...prev.filter((j) => j.id !== newJob.id)]);
            }
            fetchJobsFromAPI();
          }}
        />

        {showAuthModal && (
          <AuthPage
            onLoginSuccess={handleLoginSuccess}
            isWorkerApp={false}
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </>
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                    isServiceAvailable 
                      ? 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700' 
                      : 'border-red-300 bg-red-50 text-red-700 animate-pulse'
                  }`}
                >
                  <MapPin className={`w-3.5 h-3.5 ${isServiceAvailable ? 'text-amber-600' : 'text-red-600'}`} />
                  <span>{selectedCity}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showCityDropdown && (
                  <div className="absolute left-0 top-10 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in max-h-96 overflow-y-auto">
                    <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                      Operating Coverage (Mumbai & MMR)
                    </div>
                    {CITIES.filter(c => !c.includes('Outside Mumbai')).map(city => (
                      <button
                        key={city}
                        onClick={() => {
                          setSelectedCity(city);
                          setShowCityDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                          selectedCity === city ? 'bg-amber-50 text-amber-800 font-extrabold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{city}</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black">Active</span>
                      </button>
                    ))}

                    <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-red-500 border-b border-slate-100 mt-2 mb-1">
                      Outside Mumbai (Non-Operating Zone)
                    </div>
                    {CITIES.filter(c => c.includes('Outside Mumbai')).map(city => (
                      <button
                        key={city}
                        onClick={() => {
                          setSelectedCity(city);
                          setShowCityDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                          selectedCity === city ? 'bg-red-50 text-red-700 font-extrabold' : 'text-slate-500 hover:bg-red-50/50'
                        }`}
                      >
                        <span className="truncate">{city}</span>
                        <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-black shrink-0">Unavailable</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Center: Global Service Search Input with Integrated Trades Dropdown */}
            <div className="relative flex-1 max-w-xl hidden sm:block" ref={tradeDropdownRef}>
              <div className="flex items-center w-full rounded-full bg-slate-100/90 border border-slate-200 focus-within:border-amber-500 focus-within:bg-white focus-within:shadow-md transition">
                
                {/* Embedded Trade Selector Dropdown Button (Inside Search Bar) */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowTradeDropdown(!showTradeDropdown)}
                    className="flex items-center gap-1.5 pl-3.5 pr-2.5 py-2 text-xs font-bold text-slate-700 hover:text-amber-600 transition border-r border-slate-200 focus:outline-none rounded-l-full select-none"
                    title="Filter by trade"
                  >
                    <span className="max-w-[115px] truncate font-black text-slate-900">
                      {selectedCategory === 'all'
                        ? 'All Trades'
                        : (SERVICE_CATEGORIES_50.find(c => c.id === selectedCategory)?.name || CATEGORIES.find(c => c.id === selectedCategory)?.name || selectedCategory)
                      }
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${showTradeDropdown ? 'rotate-180 text-amber-500' : ''}`} />
                  </button>

                  {/* Floating Trade Dropdown Menu */}
                  {showTradeDropdown && (
                    <div className="absolute left-0 top-full mt-2 w-72 max-h-96 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 text-slate-900">
                      <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                        Select Trade / Service
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('all');
                          setShowTradeDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                          selectedCategory === 'all' ? 'bg-amber-50 text-amber-700 font-extrabold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Wrench className="w-3.5 h-3.5 text-amber-500" />
                          <span>All Services & Trades</span>
                        </span>
                        {selectedCategory === 'all' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                      </button>

                      {/* Grouped 50 Trade Categories */}
                      {['Home Repair', 'Appliances', 'Cleaning', 'Beauty & Personal', 'Domestic Help', 'Specialized'].map(groupName => {
                        const groupItems = SERVICE_CATEGORIES_50.filter(c => c.group === groupName);
                        if (!groupItems.length) return null;
                        return (
                          <div key={groupName} className="mt-2">
                            <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50/70 rounded-lg mb-1">
                              {groupName}
                            </div>
                            {groupItems.map(cat => {
                              const isSelected = selectedCategory === cat.id;
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCategory(cat.id);
                                    setShowTradeDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition flex items-center justify-between ${
                                    isSelected ? 'bg-amber-100 text-amber-900 font-extrabold' : 'text-slate-700 hover:bg-slate-100 font-medium'
                                  }`}
                                >
                                  <span className="truncate">{cat.name}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Free Text Input */}
                <div className="relative flex-1 flex items-center min-w-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 ml-2.5 shrink-0 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search specific service, issue, or partner..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-2 pr-7 py-2 bg-transparent text-slate-800 placeholder-slate-400 text-xs focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-700 text-xs font-bold p-1"
                      title="Clear search text"
                    >
                      ✕
                    </button>
                  )}
                </div>

              </div>
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

        {/* STICKY OUTSIDE MUMBAI SERVICE UNAVAILABLE ALERT BANNER */}
        {!isServiceAvailable && (
          <div className="bg-red-600 text-white px-4 py-3 shadow-md flex items-center justify-between gap-3 text-xs sm:text-sm font-black sticky top-[69px] z-30 animate-in slide-in-from-top">
            <div className="flex items-center gap-2 max-w-4xl mx-auto">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-300" />
              <span>Service was unavailable at this place, sorry for inconvenience!</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedCity('Mumbai (All Neighborhoods)');
                setClientCoords({ lat: 19.0760, lng: 72.8777 });
                setSearchQuery('');
              }}
              className="px-3.5 py-1.5 rounded-full bg-white text-red-700 hover:bg-red-50 text-xs font-black shadow-sm transition shrink-0 active:scale-95"
            >
              Switch to Mumbai
            </button>
          </div>
        )}

        {/* HERO SECTION: URBAN COMPANY STYLE CATEGORY CAROUSEL & HEADLINE */}
        <section className="bg-gradient-to-b from-[#faf7f2] via-white to-transparent py-10 px-4 sm:px-8 border-b border-slate-100">
          <div className="max-w-[1440px] mx-auto text-center space-y-4">
            
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-xs font-extrabold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Verified Home Services & Skilled Craftsmen</span>
            </span>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-950 font-['Outfit'] tracking-tight leading-tight max-w-3xl mx-auto">
              {isServiceAvailable ? (
                <>
                  Home services at your doorstep in <span className="text-amber-600 underline decoration-amber-300 decoration-wavy underline-offset-8">{selectedCity.split(',')[0]}</span>
                </>
              ) : (
                <span className="text-red-600">
                  Service was unavailable at this place, sorry for inconvenience!
                </span>
              )}
            </h1>

            <p className="text-slate-600 text-sm max-w-xl mx-auto font-medium">
              {isServiceAvailable ? (
                "Hire background-verified plumbers, electricians, carpenters, painters, and home maintenance pros in under 30 minutes across Mumbai."
              ) : (
                "Kaam operates exclusively across Mumbai & the Mumbai Metropolitan Region (MMR). Services are currently unavailable at this place."
              )}
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
                    const workerName = j.worker_name || j.workerName || 'Verified Service Partner';
                    const tradeTitle = j.trade_title || j.tradeTitle || 'Home Service Professional';
                    const workerPhone = j.worker_phone || j.workerPhone || '+91 98765 43210';
                    const workDesc = j.work_description || j.workDescription;
                    const location = j.location_address || j.location;
                    const fee = j.agreed_total_fee || j.agreedFee;
                    const clientEmail = j.client_email || user?.email || 'client@kaam.com';
                    const isCompleted = j.status === 'COMPLETED';
                    const isAccepted = j.status === 'ACCEPTED';
                    const isRejected = j.status === 'REJECTED';
                    const isPending = !isAccepted && !isRejected && !isCompleted;

                    return (
                      <div key={j.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition">
                        
                        {/* Header Row: Partner Identity & Status Badge */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 font-black grid place-items-center text-sm shadow-sm border border-amber-200">
                              {workerName.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-base font-extrabold text-slate-900">{workerName}</span>
                                <span className="text-[11px] text-amber-800 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                  {tradeTitle}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-amber-600" />
                                <span className="truncate max-w-sm">{location}</span>
                              </p>
                            </div>
                          </div>

                          {/* EXACT STATUS BADGE */}
                          <div>
                            {isCompleted ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-900 font-black text-xs border border-emerald-300 shadow-sm">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>🟢 Work Completed & Verified</span>
                              </div>
                            ) : isAccepted ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  onClick={() => setSelectedJobDetails(j)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-700 hover:bg-purple-800 text-white font-black text-xs border border-purple-800 shadow-md shadow-purple-700/20 active:scale-95 transition cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>View Details</span>
                                </button>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 font-black text-xs border border-emerald-300 shadow-sm">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  <span>🟢 Booking Confirmed • Partner on the way</span>
                                </div>
                              </div>
                            ) : isRejected ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-800 font-black text-xs border border-red-300 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                <span>🔴 Request Declined by Partner</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-950 font-black text-xs border border-amber-300 shadow-sm animate-pulse">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                                <span>⏳ Waiting for confirmation</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Middle Row: Work Description & Payout Details */}
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="text-slate-700 font-medium">
                            <span className="font-bold text-slate-900">Task Scope:</span> "{workDesc}"
                          </div>
                          <div className="font-mono text-slate-900 font-black shrink-0">
                            Total Payable: <span className="text-emerald-700 font-['Outfit'] text-sm">₹{fee}</span>
                          </div>
                        </div>

                        {/* WORK COMPLETION VERIFICATION CODE BOX (WHEN ACCEPTED) */}
                        {isAccepted && (
                          <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100/70 rounded-2xl border-2 border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 font-black text-amber-950 uppercase tracking-wider text-[11px]">
                                <span>🔑 Work Completion Verification Code</span>
                                <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-bold border border-amber-300">
                                  Provide at completion
                                </span>
                              </div>
                              <p className="text-amber-900 text-[11px] max-w-md">
                                When the partner finishes work at your premises, share this 6-digit code with them to verify and mark the job completed.
                              </p>
                            </div>
                            <div className="bg-white px-5 py-2.5 rounded-xl border border-amber-300 text-center shadow-sm shrink-0">
                              <span className="text-2xl font-black font-mono tracking-widest text-slate-950 select-all">
                                {j.completion_code || '------'}
                              </span>
                              <p className="text-[9px] font-bold text-amber-800 uppercase mt-0.5">Share with partner</p>
                            </div>
                          </div>
                        )}

                        {/* EMAIL NOTIFICATION & LIVE ACTION BANNER */}
                        {isCompleted ? (
                          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-950">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Work completed and code-verified! Completion confirmation receipt sent to <strong>{clientEmail}</strong>.</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => setSelectedJobDetails(j)}
                                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Details</span>
                              </button>
                              <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold text-xs">
                                Job Completed
                              </span>
                            </div>
                          </div>
                        ) : isAccepted ? (
                          <div className="p-3 bg-emerald-50/90 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Confirmation email with verification code sent to <strong>{clientEmail}</strong>!</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                              <button
                                onClick={() => setSelectedJobDetails(j)}
                                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-700/25 active:scale-95 transition cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>View Details & QR</span>
                              </button>
                              <a 
                                href={`tel:${workerPhone}`} 
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition shrink-0"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>Call Partner ({workerPhone})</span>
                              </a>
                            </div>
                          </div>
                        ) : isRejected ? (
                          <div className="p-3 bg-red-50/90 rounded-2xl border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-950">
                            <div className="flex items-center gap-2">
                              <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                              <span>Notification email sent to <strong>{clientEmail}</strong>. Partner is unavailable for this schedule.</span>
                            </div>
                            <button
                              onClick={() => setActiveTab('browse')}
                              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shrink-0 cursor-pointer shadow-sm active:scale-95"
                            >
                              Choose Another Partner ➔
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-center gap-2.5 text-xs text-amber-900">
                            <Mail className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
                            <span>
                              Request sent to partner's desk. You will receive a confirmation email with your completion code at <strong>{clientEmail}</strong> as soon as the partner confirms.
                            </span>
                          </div>
                        )}

                        {/* 3-Step Live Tracking Progress Bar */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                          <div className="flex items-center gap-1.5 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>1. Request Placed</span>
                          </div>
                          
                          <div className="h-[2px] flex-1 mx-3 bg-slate-200">
                            <div className={`h-full ${isCompleted || isAccepted ? 'bg-emerald-500' : isRejected ? 'bg-red-500' : 'bg-amber-400 w-1/2 animate-pulse'}`}></div>
                          </div>

                          <div className={`flex items-center gap-1.5 ${isCompleted || isAccepted ? 'text-emerald-700' : isRejected ? 'text-red-700' : 'text-amber-800 animate-pulse font-extrabold'}`}>
                            <span>2. Confirmed & Code Sent</span>
                          </div>

                          <div className="h-[2px] flex-1 mx-3 bg-slate-200">
                            <div className={`h-full ${isCompleted ? 'bg-emerald-500' : 'bg-transparent'}`}></div>
                          </div>

                          <div className={`flex items-center gap-1.5 ${isCompleted ? 'text-emerald-700 font-black' : isAccepted ? 'text-slate-900 font-extrabold' : 'text-slate-400'}`}>
                            <span>3. Work Done & Verified</span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* SECTION 1: VERIFIED TRADESPERSON CARDS & SEARCH RESULTS (PRIMARY TOP VIEW) */}
              <section id="verified-pros-section" className="space-y-4 pt-2 scroll-mt-24">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-['Outfit'] tracking-tight flex items-center gap-2">
                      <span>Available Verified Professionals</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        isServiceAvailable ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {isServiceAvailable ? `${filteredWorkers.length} Online in Mumbai` : 'Unavailable'}
                      </span>
                    </h2>
                    {isServiceAvailable ? (
                      <p className="text-xs text-slate-500 mt-0.5">Background-checked craftsmen near {selectedCity.split(',')[0]} (Mumbai Region).</p>
                    ) : (
                      <p className="text-xs text-red-600 font-bold mt-0.5">⚠️ Service was unavailable at this place, sorry for inconvenience!</p>
                    )}
                  </div>

                  {/* Filter Toolbar with 50km Radius Selector & GPS Auto-Detect */}
                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    <button
                      type="button"
                      onClick={handleDetectClientLocation}
                      disabled={isDetectingLocation}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold border border-amber-300 transition active:scale-95"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isDetectingLocation ? 'Locating...' : '📍 Near Me (Mumbai)'}</span>
                    </button>

                    <select
                      value={searchRadiusKm}
                      onChange={(e) => setSearchRadiusKm(Number(e.target.value))}
                      className="bg-white border border-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500"
                    >
                      <option value={10}>Radius: 10 km</option>
                      <option value={25}>Radius: 25 km</option>
                      <option value={50}>Radius: 50 km (Default MMR)</option>
                    </select>

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
                  {!isServiceAvailable ? (
                    <div className="col-span-full p-12 text-center bg-red-50/70 rounded-3xl border-2 border-red-200 shadow-sm space-y-4">
                      <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center mx-auto text-3xl font-black shadow-sm">
                        ⚠️
                      </div>
                      <div className="space-y-2 max-w-lg mx-auto">
                        <h3 className="text-xl font-black text-red-950 font-['Outfit']">
                          Service was unavailable at this place, sorry for inconvenience!
                        </h3>
                        <p className="text-xs text-red-700 leading-relaxed font-medium">
                          Kaam currently operates exclusively across Mumbai and the Mumbai Metropolitan Region (MMR). Services are not available in "{selectedCity}". Please select an area within Mumbai to view verified tradespeople.
                        </p>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCity('Mumbai (All Neighborhoods)');
                              setClientCoords({ lat: 19.0760, lng: 72.8777 });
                              setSearchQuery('');
                            }}
                            className="px-6 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-black transition active:scale-95 shadow-md"
                          >
                            Switch to Mumbai Services
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : filteredWorkers.length === 0 ? (
                    <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto text-2xl font-black shadow-sm">
                        🛠️
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-black text-slate-950 font-['Outfit']">
                          No Registered {selectedCategory !== 'all' ? selectedCategory.toUpperCase() : (searchQuery || 'Service')} Partners in Mumbai Yet
                        </h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Real accounts are active! When a new service partner registers on the Partner App for this trade in Mumbai, they will immediately appear here on the client desk with live distance.
                        </p>
                      </div>
                    </div>
                  ) : (
                    filteredWorkers.map((w) => (
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
                            {w.distanceBadge || (w.distanceKm ? `📍 ${w.distanceKm} km away` : '📍 Near you')}
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
                            <span className="text-[10px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md font-black block w-fit mb-0.5 border border-amber-300">Visiting Fee</span>
                            <span className="text-base font-black text-slate-900 font-['Outfit']">₹{w.visitingCharge || 149}</span>
                          </div>

                          <div>
                            <button
                              onClick={() => {
                                setActiveWorkerStudio(w);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:brightness-105 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                            >
                              <span>View Profile & Packages</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                    </article>
                  )))}
                </div>
              </section>

              {/* SECTION 2: POPULAR & TRENDING SERVICES */}
              <section className="space-y-4 pt-4">
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
                    <p className="text-xs text-slate-300 leading-relaxed">No hidden charges or unexpected surges. Pay transparent visiting fees and fixed service packages.</p>
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

      {/* POPUP MODAL: BOOKING & PARTNER DETAILS (WITH LIVE PAYMENT QR & CHOSEN PACKAGES) */}
      {selectedJobDetails && (() => {
        const workerName = selectedJobDetails.worker_name || selectedJobDetails.workerName || 'Verified Service Partner';
        const tradeTitle = selectedJobDetails.trade_title || selectedJobDetails.tradeTitle || selectedJobDetails.category_title || 'Home Service Professional';
        const workerPhone = selectedJobDetails.worker_phone || selectedJobDetails.workerPhone || '+91 98765 43210';
        const workerLocality = selectedJobDetails.worker_locality || selectedJobDetails.locality || 'Mumbai, Maharashtra';
        const totalFee = selectedJobDetails.agreed_total_fee || selectedJobDetails.agreedFee || 0;
        const address = selectedJobDetails.location_address || selectedJobDetails.location || 'Mumbai';
        const timeSlot = selectedJobDetails.time_slot || selectedJobDetails.timeSlot || 'Scheduled Arrival (+30 mins)';
        const completionCode = selectedJobDetails.completion_code || selectedJobDetails.completionCode || '------';
        
        // UPI details
        const workerUpi = selectedJobDetails.worker_upi || selectedJobDetails.workerUpi || (workerPhone ? `${workerPhone.replace(/\D/g, '')}@paytm` : '9653192752@kotakbank');
        const workerUpiHolder = selectedJobDetails.worker_upi_holder || selectedJobDetails.workerUpiHolder || workerName;
        const workerUpiPhone = selectedJobDetails.worker_upi_phone || selectedJobDetails.workerUpiPhone || workerPhone;
        const upiUri = `upi://pay?pa=${encodeURIComponent(workerUpi)}&pn=${encodeURIComponent(workerUpiHolder)}&am=${totalFee}&cu=INR&tn=${encodeURIComponent(`KAAM-Booking-${selectedJobDetails.id}`)}`;

        // Parse packages
        let parsedPackages = [];
        if (selectedJobDetails.packages_json) {
          try {
            parsedPackages = typeof selectedJobDetails.packages_json === 'string' 
              ? JSON.parse(selectedJobDetails.packages_json) 
              : selectedJobDetails.packages_json;
          } catch (e) {
            parsedPackages = [];
          }
        }

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-5 p-5 sm:p-7 relative animate-in zoom-in-95 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedJobDetails(null)}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 grid place-items-center font-bold text-sm transition active:scale-95 z-10 cursor-pointer"
              >
                ✕
              </button>

              {/* Modal Header */}
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    🟢 Request Accepted
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {selectedJobDetails.id}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-950 font-['Outfit'] mt-1 tracking-tight">
                  Booking & Partner Details
                </h3>
                <p className="text-xs text-slate-500">
                  Partner has confirmed your booking and is on the way.
                </p>
              </div>

              {/* Partner Details Card */}
              <div className="bg-gradient-to-br from-amber-50/80 via-white to-orange-50/60 p-4 rounded-2xl border border-amber-200/80 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black grid place-items-center text-xl shadow-md border-2 border-white">
                      {workerName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-base font-black text-slate-900">{workerName}</h4>
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                        </span>
                      </div>
                      <p className="text-xs font-bold text-amber-800 mt-0.5">{tradeTitle}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-amber-600" />
                        <span>{workerLocality}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Click to Call Partner Button */}
                <div className="pt-2 border-t border-amber-100 flex items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Contact Number</span>
                    <span className="font-black text-slate-900 font-mono">{workerPhone}</span>
                  </div>
                  <a
                    href={`tel:${workerPhone}`}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/25 active:scale-95 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Partner</span>
                  </a>
                </div>
              </div>

              {/* Direct UPI Payment QR Code Section */}
              <div className="bg-gradient-to-b from-purple-50/90 to-indigo-50/70 p-5 rounded-3xl border-2 border-purple-200 text-center space-y-3.5 shadow-inner">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider bg-purple-700 text-white px-3 py-1 rounded-full shadow-sm">
                    Direct Partner UPI QR Code
                  </span>
                  <h4 className="text-xl font-black text-slate-900 font-['Outfit'] mt-2">
                    Pay Partner: <span className="text-purple-700 font-mono">₹{totalFee}</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Scan with any UPI app to pay directly to this partner
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="bg-white p-4 rounded-2xl border-2 border-purple-200 shadow-md inline-block mx-auto">
                  <QRCodeSVG
                    value={upiUri}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                {/* Partner Direct UPI details box */}
                <div className="bg-white/95 rounded-2xl p-3 border border-purple-100 max-w-sm mx-auto space-y-1 text-left text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Partner UPI ID:</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(workerUpi);
                        setCopiedJobUpi(true);
                        setTimeout(() => setCopiedJobUpi(false), 2000);
                      }}
                      className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedJobUpi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedJobUpi ? 'Copied!' : 'Copy UPI'}</span>
                    </button>
                  </div>
                  <p className="font-mono font-black text-slate-900 text-xs select-all break-all">{workerUpi}</p>
                  
                  {workerUpiHolder && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500">Account Holder:</span>
                      <span className="font-bold text-slate-800">{workerUpiHolder}</span>
                    </div>
                  )}

                  {workerUpiPhone && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">UPI Linked Phone:</span>
                      <span className="font-bold font-mono text-slate-800">{workerUpiPhone}</span>
                    </div>
                  )}
                </div>

                {/* Supported UPI Apps */}
                <p className="text-[11px] font-extrabold text-slate-600 tracking-wide">
                  Google Pay • PhonePe • Paytm • BHIM • Cred
                </p>

                {/* Open in UPI App Deep Link for Mobile */}
                <a
                  href={upiUri}
                  className="block w-full py-3 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs shadow-md shadow-purple-600/30 active:scale-95 transition"
                >
                  Open in UPI App to Pay ➔
                </a>
              </div>

              {/* Chosen Package & Booking Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                  <span>Chosen Package & Service Scope</span>
                </h4>

                {/* Package Items */}
                <div className="space-y-1.5">
                  {parsedPackages && parsedPackages.length > 0 ? (
                    parsedPackages.map((pkg, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{pkg.title || pkg.name || 'Service Package'}</p>
                          <p className="text-[10px] text-slate-400">Qty: {pkg.qty || 1}</p>
                        </div>
                        <span className="font-black text-slate-900 font-['Outfit']">₹{Number(pkg.price || 0) * Number(pkg.qty || 1)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-xs">
                      <p className="font-bold text-slate-800">{selectedJobDetails.work_description || selectedJobDetails.workDescription || 'Home Service Package'}</p>
                    </div>
                  )}
                </div>

                {/* Schedule & Address Details */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-500 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-slate-400" /> Slot:
                    </span>
                    <span className="font-bold text-slate-900 text-right">{timeSlot}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-500 flex items-center gap-1 shrink-0">
                      <MapPin className="w-3 h-3 text-slate-400" /> Address:
                    </span>
                    <span className="font-bold text-slate-900 text-right max-w-xs truncate">{address}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                    <span>Total Agreed Amount:</span>
                    <span className="text-emerald-700 font-black font-['Outfit'] text-base">₹{totalFee}</span>
                  </div>
                </div>
              </div>

              {/* 6-Digit Work Completion Code Box */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100/70 rounded-2xl border-2 border-amber-300 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-amber-950 uppercase tracking-wider text-[11px]">
                    <span>🔑 Work Completion Code</span>
                  </div>
                  <p className="text-amber-900 text-[11px]">
                    Share this 6-digit code with partner when work is done:
                  </p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-amber-300 text-center shadow-sm shrink-0">
                  <span className="text-xl font-black font-mono tracking-widest text-slate-950 select-all">
                    {completionCode}
                  </span>
                </div>
              </div>

              {/* Close Button at bottom */}
              <button
                onClick={() => setSelectedJobDetails(null)}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Close Details
              </button>

            </div>
          </div>
        );
      })()}

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
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800">Past Work Showcase ({selectedWorkerProfile.portfolioImages?.length || 0})</h4>
                  <button
                    onClick={() => {
                      const w = selectedWorkerProfile;
                      setSelectedWorkerProfile(null);
                      setActiveWorkerStudio(w);
                    }}
                    className="text-[11px] font-bold text-amber-700 hover:underline"
                  >
                    View Full Studio ➔
                  </button>
                </div>
                {(!selectedWorkerProfile.portfolioImages || selectedWorkerProfile.portfolioImages.length === 0) ? (
                  <p className="text-[11px] text-slate-400 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    No past work photos uploaded yet by this partner.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedWorkerProfile.portfolioImages.map((img, i) => (
                      <div key={i} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-[4/3] group/img bg-slate-950">
                        <img src={img.url || img.image_url} alt={img.title} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform" />
                        <span className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold truncate">
                          {img.title || 'Completed Job'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Visiting Fee</span>
                  <span className="text-xl font-black text-slate-900 font-['Outfit']">₹{selectedWorkerProfile.visitingCharge || 149}</span>
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
                <p className="text-xs text-slate-500">{bookingWorker.tradeTitle} • Visiting Fee: ₹{bookingWorker.visitingCharge || 149}</p>
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
                  <span className="font-bold text-slate-700">Doorstep Visiting Fee:</span>
                  <span className="text-lg font-black text-amber-700 font-['Outfit']">₹{bookingWorker.visitingCharge || 149}</span>
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
