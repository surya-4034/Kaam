import React, { useState, useEffect } from 'react';
import {
  MapPin,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  Plus,
  Minus,
  Percent,
  Receipt,
  Heart,
  ArrowLeft,
  ShieldCheck,
  Phone,
  AlertCircle,
  Search,
  X,
  Smartphone,
  Copy,
  Check,
  Info
} from 'lucide-react';
import { AddressAndSlotWorkflow } from './AddressAndSlotWorkflow';
import { API_BASE_URL } from '../../config/api';
import { isMumbaiLocation } from '../../services/locationService';

export const CheckoutPage = ({
  worker,
  user,
  cartItems = [],
  onBack,
  onBookingComplete,
  onRequireLogin
}) => {
  // Address sanitization helper: cleans any legacy "near Noida" or stale placeholders
  const sanitizeAddressText = (raw) => {
    if (!raw || typeof raw !== 'string') return '';
    return raw
      .replace(/,\s*near\s+noida\b/gi, '')
      .replace(/\bnear\s+noida,?\s*/gi, '')
      .replace(/201301/g, '400001')
      .replace(/,\s*,/g, ',')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const initialUserAddr = sanitizeAddressText(user?.address);

  // Saved addresses list state (Defaulted to Mumbai Operating Region)
  const [savedAddresses, setSavedAddresses] = useState([
    {
      id: 'addr-home',
      label: 'Home (Mumbai)',
      details: initialUserAddr || 'Astavinayak Colony, Sangoda Rd, Mumbai Central, Mumbai, Maharashtra 400008',
      isDefault: true
    },
    {
      id: 'addr-work',
      label: 'Work / Office (Mumbai)',
      details: 'Unit 402, Trade World, C-Wing, Kamala Mills, Lower Parel, Mumbai, Maharashtra 400013',
      isDefault: false
    }
  ]);

  const [selectedAddressId, setSelectedAddressId] = useState('addr-home');
  const [selectedAddressCoordinates, setSelectedAddressCoordinates] = useState({ lat: 18.9690, lng: 72.8205 });
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [searchAddressQuery, setSearchAddressQuery] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('Home');
  const [newAddressText, setNewAddressText] = useState('');

  // Pre-cached verified Indian addresses & major landmarks
  const INDIAN_LOCATION_SUGGESTIONS = [
    {
      title: 'Mumbai Central',
      subtitle: 'Mumbai, Maharashtra, India',
      fullAddress: 'Mumbai Central, Mumbai, Maharashtra, 400008, India'
    },
    {
      title: 'Mumbai Central Railway Station Building',
      subtitle: 'Mumbai Central, Mumbai, Maharashtra, India',
      fullAddress: 'Dr Anandrao Nair Marg, Mumbai Central, Mumbai, Maharashtra, 400008, India'
    },
    {
      title: 'Chhatrapati Shivaji Maharaj International Airport Mumbai (BOM)',
      subtitle: 'Mumbai, Maharashtra, India',
      fullAddress: 'CSMIA Terminal 2, Navpada, Vile Parle East, Mumbai, Maharashtra, 400099, India'
    },
    {
      title: 'Mumbai T2 Airport',
      subtitle: 'Navpada, Vile Parle East, Vile Parle, Mumbai, Maharashtra, India',
      fullAddress: 'Terminal 2, Sahar Road, Vile Parle East, Mumbai, Maharashtra, 400099, India'
    },
    {
      title: 'Gateway of India',
      subtitle: 'Apollo Bandar, Colaba, Mumbai, Maharashtra, India',
      fullAddress: 'Apollo Bandar, Colaba, Mumbai, Maharashtra, 400001, India'
    },
    {
      title: 'Marine Drive Promenade',
      subtitle: 'Netaji Subhash Chandra Bose Road, Chowpatty, Mumbai, Maharashtra, India',
      fullAddress: 'Marine Drive, Chowpatty, Mumbai, Maharashtra, 400020, India'
    },
    {
      title: 'Bandra Kurla Complex (BKC)',
      subtitle: 'Bandra East, Mumbai, Maharashtra, India',
      fullAddress: 'G Block BKC, Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra, 400051, India'
    },
    {
      title: 'Andheri West Metro Station',
      subtitle: 'Andheri West, Mumbai, Maharashtra, India',
      fullAddress: 'Swami Vivekananda Rd, D.N. Nagar, Andheri West, Mumbai, Maharashtra, 400058, India'
    },
    {
      title: 'Phoenix Marketcity Kurla',
      subtitle: 'LBS Marg, Kurla West, Mumbai, Maharashtra, India',
      fullAddress: 'Lal Bahadur Shastri Rd, Kamani, Kurla West, Mumbai, Maharashtra, 400070, India'
    },
    {
      title: 'Dadar West (Shivaji Park)',
      subtitle: 'Dadar West, Mumbai, Maharashtra, India',
      fullAddress: 'Shivaji Park, Dadar West, Mumbai, Maharashtra, 400028, India'
    },
    {
      title: 'Cyber City Gurugram',
      subtitle: 'DLF Phase 2, Gurugram, Haryana, India',
      fullAddress: 'DLF Cyber City, Sector 24, Gurugram, Haryana, 122002, India'
    },
    {
      title: 'Indiranagar 100ft Road',
      subtitle: 'Bengaluru, Karnataka, India',
      fullAddress: '100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka, 560038, India'
    },
    {
      title: 'Koramangala 5th Block',
      subtitle: 'Bengaluru, Karnataka, India',
      fullAddress: 'Industrial Layout, Koramangala 5th Block, Bengaluru, Karnataka, 560095, India'
    },
    {
      title: 'Hinjewadi Phase 1 IT Park',
      subtitle: 'Pune, Maharashtra, India',
      fullAddress: 'Rajiv Gandhi Infotech Park, Hinjewadi Phase 1, Pune, Maharashtra, 411057, India'
    },
    {
      title: 'Hitec City Mindspace',
      subtitle: 'Madhapur, Hyderabad, Telangana, India',
      fullAddress: 'Mindspace Madhapur Rd, HITEC City, Hyderabad, Telangana, 500081, India'
    },
    {
      title: 'Connaught Place (CP)',
      subtitle: 'New Delhi, Delhi, India',
      fullAddress: 'Connaught Place, Radial Road 1, New Delhi, Delhi, 110001, India'
    },
    {
      title: 'Hazratganj Main Market',
      subtitle: 'Lucknow, Uttar Pradesh, India',
      fullAddress: 'Mahatma Gandhi Marg, Hazratganj, Lucknow, Uttar Pradesh, 226001, India'
    }
  ];

  // Dynamic filtered search results (Generates dynamic fallback landmarks for any custom query)
  const filteredLocationResults = (() => {
    const q = searchAddressQuery.trim();
    if (!q) {
      return [
        INDIAN_LOCATION_SUGGESTIONS[0],
        INDIAN_LOCATION_SUGGESTIONS[1],
        INDIAN_LOCATION_SUGGESTIONS[2],
        INDIAN_LOCATION_SUGGESTIONS[3]
      ];
    }

    const matched = INDIAN_LOCATION_SUGGESTIONS.filter(loc =>
      loc.title.toLowerCase().includes(q.toLowerCase()) ||
      loc.subtitle.toLowerCase().includes(q.toLowerCase()) ||
      loc.fullAddress.toLowerCase().includes(q.toLowerCase())
    );

    if (matched.length > 0) return matched;

    // Dynamic autocomplete generator for landmarks/streets entered by user
    return [
      {
        title: `${q} Main Road / Landmark`,
        subtitle: `Near ${q}, City Center, India`,
        fullAddress: `${q} Main Road, Opp. Market, Landmark Area, India`
      },
      {
        title: `${q} Metro Station / Junction`,
        subtitle: `${q}, Metropolitan Area, India`,
        fullAddress: `Metro Pillar No. 120, ${q} Junction, India`
      },
      {
        title: `${q} Residential Colony`,
        subtitle: `Sector / Phase 1, ${q}, India`,
        fullAddress: `Block B, ${q} Colony, Near Central Park, India`
      }
    ];
  })();

  // Address & contact step state
  const [phone, setPhone] = useState(user?.phone || '+91 9653192752');
  const activeAddressObj = savedAddresses.find(a => a.id === selectedAddressId) || savedAddresses[0];
  const [address, setAddress] = useState(sanitizeAddressText(activeAddressObj.details));
  const [addressSaved, setAddressSaved] = useState(true);
  const [avoidCalling, setAvoidCalling] = useState(false);

  // Mumbai boundary validation for chosen address
  const addressAvailability = isMumbaiLocation(address, selectedAddressCoordinates);
  const isAddressInMumbai = addressAvailability.isAvailable;

  // Service timing
  const [selectedSlot, setSelectedSlot] = useState('Immediate / On Demand');

  // Payment method step (Exclusively Pay After Service on Checkout)
  const [paymentMethod, setPaymentMethod] = useState('DIRECT_CASH');
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  const partnerUpi = worker?.bank?.upi || worker?.upiId || worker?.upi || (worker?.phone ? `${worker.phone.replace(/\D/g, '')}@paytm` : (import.meta.env.VITE_RECEIVER_UPI_ID || '9653192752@kotakbank'));
  const [receiverUpiId, setReceiverUpiId] = useState(partnerUpi);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [upiUtr, setUpiUtr] = useState('');

  useEffect(() => {
    const upi = worker?.bank?.upi || worker?.upiId || worker?.upi || (worker?.phone ? `${worker.phone.replace(/\D/g, '')}@paytm` : '');
    if (upi) setReceiverUpiId(upi);
  }, [worker]);

  // Tip selection
  const [selectedTip, setSelectedTip] = useState(75);
  const [customTip, setCustomTip] = useState('');
  const [isCustomTip, setIsCustomTip] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const visitingCharge = Number(worker?.visitingCharge || worker?.visiting_charge || 149);

  // Cart items state to allow increment/decrement directly in checkout
  const [items, setItems] = useState(
    cartItems.length > 0
      ? cartItems
      : [
          {
            id: 'visiting-charge-item',
            title: `Doorstep Visiting & Inspection Charge`,
            price: visitingCharge,
            qty: 1,
            isVisitingCharge: true,
            features: [
              'Mandatory partner doorstep visiting charge',
              'Problem diagnosis & quotation at your home',
              'Waived if you select a specific service package'
            ]
          }
        ]
  );

  const handleIncrement = (id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i));
  };

  const handleDecrement = (id) => {
    setItems(prev => {
      const target = prev.find(i => i.id === id);
      if (target && target.qty > 1) {
        return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  // Calculations
  const itemTotal = items.reduce((sum, i) => sum + (Number(i.price || 0) * Number(i.qty || 1)), 0);
  const taxesAndFees = Math.round(itemTotal * 0.05) + 15; // 5% GST + Convenience
  const tipAmount = isCustomTip ? (Number(customTip) || 0) : selectedTip;
  const finalPayable = itemTotal + taxesAndFees + tipAmount;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const submitBookingOrder = async () => {
    setIsSubmitting(true);

    const payload = {
      clientId: user?.id,
      workerId: worker?.id || 'w-direct',
      workerName: worker?.name || 'Partner',
      tradeTitle: worker?.tradeTitle || 'Specialist',
      categoryTitle: worker?.tradeTitle || 'General Service',
      workerPhone: worker?.phone || '',
      workerEmail: worker?.email || '',
      workerUpi: partnerUpi || worker?.bank?.upi || worker?.upiId || '',
      workerUpiPhone: worker?.bank?.upiPhone || worker?.phone || '',
      workerUpiHolder: worker?.bank?.holder || worker?.name || 'Connect Partner',
      clientName: user?.fullName || user?.full_name || 'Homeowner',
      clientEmail: user?.email || 'client@connect.com',
      clientPhone: phone,
      locationAddress: address,
      coordinates: selectedAddressCoordinates || null,
      workDescription: items.map(i => `${i.title} (x${i.qty || 1})`).join(', '),
      packagesJson: JSON.stringify(items),
      agreedTotalFee: finalPayable,
      paymentMode: paymentMethod,
      upiUtr: upiUtr || null,
      paymentStatus: 'PENDING_ON_ACCEPTANCE',
      timeSlot: selectedSlot,
      avoidCallingBeforeArrival: avoidCalling,
      tipAmount: tipAmount
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        onBookingComplete(data.job || payload);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || errData.message || 'Failed to place booking. Please try again.');
      }
    } catch (e) {
      console.warn('Job submission error:', e);
      alert('Unable to reach server. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToBook = () => {
    if (!user) {
      onRequireLogin();
      return;
    }

    if (!isAddressInMumbai) {
      alert('Service was unavailable at this place, sorry for inconvenience!');
      return;
    }

    // Direct submission & immediate redirect to My Requests
    submitBookingOrder();
  };

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-[#fcfbf9] text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] flex flex-col justify-center items-center p-6">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl border border-slate-200 shadow-2xl text-center space-y-5 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center mx-auto shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 font-['Outfit']">Booking Confirmed!</h2>
            <p className="text-xs text-slate-500 mt-1">Your request has been dispatched to {worker.name}.</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Service Pro:</span>
              <span className="font-bold text-slate-900">{worker.name} ({worker.tradeTitle})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Address:</span>
              <span className="font-bold text-slate-900 max-w-[200px] truncate">{address}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
              <span className="font-extrabold text-slate-900">Total Payable:</span>
              <span className="font-black font-['Outfit'] text-emerald-700">₹{finalPayable}</span>
            </div>
          </div>

          <button
            onClick={onBookingComplete}
            className="w-full py-3.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs shadow-lg shadow-purple-700/20 transition active:scale-95"
          >
            Track in My Requests ➔
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] pb-24 animate-in fade-in">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-8 py-4 shadow-sm">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-white font-black text-sm">
                K
              </span>
              <h1 className="text-xl font-black text-slate-900 font-['Outfit'] tracking-tight">
                Checkout
              </h1>
            </div>
          </div>
          
          <span className="text-xs text-slate-400 font-medium">100% Safe & Secure Checkout</span>
        </div>
      </header>

      {/* Main 2-Column Checkout Layout (Exact Image Match) */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: BOOKING DETAILS & ACCORDION CARDS          */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Send booking details to */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900">Send booking details to</h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono font-medium">{phone}</p>
                </div>
              </div>

              {/* Step 2: Address */}
              <div className="pt-4 border-t border-slate-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Address</h3>
                    {address && (
                      <button
                        onClick={() => setShowAddressModal(true)}
                        className="text-xs font-bold text-[#5932ea] hover:underline"
                      >
                        Change
                      </button>
                    )}
                  </div>

                  {address ? (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 leading-relaxed font-medium">
                        <span className="font-bold text-slate-900 block mb-0.5">{activeAddressObj?.label || 'Selected Location'}:</span>
                        {address}
                      </p>

                      {!isAddressInMumbai && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                          <span>Service was unavailable at this place, sorry for inconvenience!</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowAddressModal(true)}
                        className="w-full py-3.5 rounded-2xl bg-[#5932ea] hover:bg-[#4927cb] text-white font-bold text-xs shadow-md shadow-purple-600/20 active:scale-95 transition-all"
                      >
                        Select address
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddressModal(true)}
                      className="w-full py-3.5 rounded-2xl bg-[#5932ea] hover:bg-[#4927cb] text-white font-bold text-xs shadow-md shadow-purple-600/20 active:scale-95 transition-all"
                    >
                      Select address
                    </button>
                  )}
                </div>
              </div>

              {/* Step 3: Payment Method */}
              <div className="pt-4 border-t border-slate-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Receipt className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">Payment Method</h3>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide">
                        Selected
                      </span>
                    </div>
                  </div>

                  {/* Active Pay After Service Card */}
                  <div className="p-3.5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white grid place-items-center shrink-0 shadow-sm">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-black text-xs text-slate-900">Pay after service</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">Pay via Cash or UPI directly to worker after job completion</p>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>

                  {/* Notice: Other Payment Methods Coming Soon */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 text-slate-600">
                    <Info className="w-4 h-4 text-purple-600 shrink-0" />
                    <p className="text-[11px] leading-tight font-medium text-slate-600">
                      <strong className="text-slate-800 font-bold">Other payment methods will also be available soon</strong> (Online UPI QR, Cards & NetBanking).
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Cancellation Policy */}
            <div className="space-y-1.5 px-2">
              <h4 className="text-sm font-black text-slate-900 font-['Outfit'] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Cancellation & Service Policy</span>
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                100% Free cancellation anytime before job start. Protected by Connect Escrow Security, 30-Day Workmanship Warranty, and zero hidden charges.
              </p>
              <button
                type="button"
                onClick={() => setShowPolicyModal(true)}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer inline-flex items-center gap-1 transition"
              >
                <span>Read full policy & guarantees</span>
                <span>➔</span>
              </button>
            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: CART ITEMS, COUPONS, BILL & TIP BREAKUP     */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Main Order Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 font-['Outfit']">{worker?.name || 'Partner'}</h3>
                  <p className="text-xs text-amber-700 font-bold">{worker?.tradeTitle || 'Specialist'} • {worker?.locality || 'Mumbai'}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> CONNECT PARTNER
                </span>
              </div>

              {/* Service Items List */}
              <div className="space-y-4">
                {items.some(i => i.isVisitingCharge || i.id === 'visiting-charge-item') && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                    <p className="font-extrabold flex items-center gap-1.5 text-amber-900">
                      <span>⚠️ Mandatory Doorstep Visiting Fee: ₹{visitingCharge}</span>
                    </p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      You are booking without selecting a service package. The partner's visiting charge is mandatory for doorstep inspection and travel. If you choose a package instead, this visiting fee is waived.
                    </p>
                  </div>
                )}

                {items.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900">{item.title}</h4>
                          {(item.isVisitingCharge || item.id === 'visiting-charge-item') && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              Mandatory Fee
                            </span>
                          )}
                        </div>
                        <ul className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                          {(item.features || []).map((feat, fIdx) => (
                            <li key={fIdx} className="flex items-center gap-1.5">
                              <span className="h-1 w-1 rounded-full bg-slate-400"></span>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Quantity & Price */}
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl px-2 py-1">
                          <button
                            onClick={() => handleDecrement(item.id)}
                            className="w-5 h-5 rounded flex items-center justify-center hover:bg-purple-200 text-xs font-bold active:scale-95"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-black text-xs">{item.qty}</span>
                          <button
                            onClick={() => handleIncrement(item.id)}
                            className="w-5 h-5 rounded flex items-center justify-center hover:bg-purple-200 text-xs font-bold active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-sm font-black text-slate-900 font-['Outfit']">₹{item.price * item.qty}</span>
                      </div>
                    </div>

                    <button
                      onClick={onBack}
                      className="text-xs font-bold text-purple-700 hover:underline inline-block pt-1"
                    >
                      Edit package
                    </button>
                  </div>
                ))}
              </div>

              {/* Avoid calling checkbox */}
              <div className="pt-3 border-t border-slate-100">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 font-medium select-none">
                  <input
                    type="checkbox"
                    checked={avoidCalling}
                    onChange={(e) => setAvoidCalling(e.target.checked)}
                    className="w-4 h-4 rounded accent-purple-600"
                  />
                  <span>Avoid calling before reaching the location</span>
                </label>
              </div>

            </div>

            {/* Bill Summary Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-black text-slate-900 font-['Outfit']">Total bill ₹{finalPayable}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400">Incl. govt. taxes & charges</p>

              {/* Detailed Breakdown */}
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Item Total</span>
                  <span className="font-semibold text-slate-900">₹{itemTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes & Fee</span>
                  <span className="font-semibold text-slate-900">₹{taxesAndFees}</span>
                </div>
                {tipAmount > 0 && (
                  <div className="flex justify-between text-purple-700 font-bold">
                    <span>Tip to Professional</span>
                    <span>₹{tipAmount}</span>
                  </div>
                )}
              </div>

              {/* Add a Tip Section (Exact Image Match) */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                  <span className="text-xs font-extrabold text-slate-900">Add a tip to thank the Professional</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs">
                  {[50, 75, 100].map(tip => {
                    const isSelected = !isCustomTip && selectedTip === tip;
                    return (
                      <button
                        key={tip}
                        onClick={() => {
                          setIsCustomTip(false);
                          setSelectedTip(selectedTip === tip ? 0 : tip);
                        }}
                        className={`py-2.5 px-2 rounded-2xl border text-center transition flex flex-col items-center justify-center ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50 text-purple-900 font-black ring-2 ring-purple-600/20'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold'
                        }`}
                      >
                        <span>₹ {tip}</span>
                        {tip === 75 && (
                          <span className="text-[8px] font-black uppercase text-emerald-700 bg-emerald-100 px-1 rounded mt-0.5">
                            POPULAR
                          </span>
                        )}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setIsCustomTip(true)}
                    className={`py-2.5 px-2 rounded-2xl border text-center font-bold text-xs transition ${
                      isCustomTip
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-black'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Custom
                  </button>
                </div>

                {isCustomTip && (
                  <div className="pt-2">
                    <input
                      type="number"
                      placeholder="Enter custom tip amount (₹)"
                      value={customTip}
                      onChange={(e) => setCustomTip(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-purple-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                )}

                <p className="text-[10px] text-slate-400">100% of the tip goes to the professional.</p>
              </div>

              {/* Bottom Pay Action (Exact Image Match) */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Amount to pay</span>
                  <span className="text-xl font-black text-slate-900 font-['Outfit']">₹{finalPayable}</span>
                </div>

                <button
                  disabled={isSubmitting || !isAddressInMumbai}
                  onClick={handleProceedToBook}
                  className={`py-3.5 px-8 rounded-2xl text-white font-black text-xs shadow-lg active:scale-95 transition-all flex items-center gap-2 ${
                    isAddressInMumbai 
                      ? 'bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 hover:brightness-110 shadow-purple-600/30 cursor-pointer' 
                      : 'bg-red-600 hover:bg-red-700 opacity-90 cursor-not-allowed'
                  }`}
                >
                  <span>
                    {isSubmitting ? 'Please wait...' : !isAddressInMumbai ? 'Service was unavailable at this place, sorry for inconvenience!' : 'Proceed to book ➔'}
                  </span>
                </button>
              </div>

            </div>

          </div>

        </div>
      </main>

      {/* ======================================================== */}
      {/* SAVED ADDRESS POPUP MODAL (EXACT URBAN COMPANY SCREENSHOT) */}
      {/* ======================================================== */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 relative animate-in zoom-in-95">
            
            {/* Close Button (Exact circle X positioned top-right) */}
            <button
              onClick={() => {
                setShowAddressModal(false);
                setIsAddingNewAddress(false);
              }}
              className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-9 h-9 rounded-full bg-white text-slate-700 hover:text-slate-950 shadow-xl border border-slate-200 grid place-items-center font-bold text-sm transition active:scale-95 z-10"
            >
              ✕
            </button>

            {/* Modal Title */}
            <h2 className="text-xl font-black text-slate-900 font-['Outfit'] tracking-tight">
              Saved address
            </h2>

            {/* Add another address Action -> opens Google Places Search Modal */}
            <div>
              <button
                onClick={() => {
                  setShowAddressModal(false);
                  setIsSearchingLocation(true);
                }}
                className="flex items-center gap-2 text-xs font-black text-[#5932ea] hover:text-[#4927cb] transition"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add another address</span>
              </button>
            </div>

            {/* Radio List of Saved Addresses (Matching screenshot) */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {savedAddresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <label
                    key={addr.id}
                    onClick={() => {
                      setSelectedAddressId(addr.id);
                      setAddress(sanitizeAddressText(addr.details));
                    }}
                    className={`flex items-start justify-between gap-3 p-4 rounded-2xl border cursor-pointer transition select-none ${
                      isSelected
                        ? 'border-purple-500/80 bg-purple-50/40 shadow-sm'
                        : 'border-slate-100 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Radio Circle */}
                      <div className="pt-0.5">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                          isSelected ? 'border-purple-600 bg-purple-600' : 'border-slate-400'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                        </div>
                      </div>

                      {/* Address Text Content */}
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">{addr.label}</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-sm">
                          {sanitizeAddressText(addr.details)}
                        </p>
                      </div>
                    </div>

                    {/* Three-dots options */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddress(addr.details);
                      }}
                      className="text-slate-400 hover:text-slate-700 p-1 text-sm font-bold"
                    >
                      ⋮
                    </button>
                  </label>
                );
              })}
            </div>

            {/* Bottom Proceed Button (Exact match) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddressModal(false);
                  setAddressSaved(true);
                }}
                className="w-full py-4 rounded-2xl bg-slate-100 hover:bg-purple-700 hover:text-white text-slate-700 font-bold text-xs transition-all active:scale-95 shadow-sm"
              >
                Proceed
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4-STEP ADDRESS & SLOT WORKFLOW (MATCHING VIDEO RECORDING) */}
      {/* ======================================================== */}
      <AddressAndSlotWorkflow
        isOpen={isSearchingLocation}
        onClose={() => setIsSearchingLocation(false)}
        tradeTitle={worker?.tradeTitle || 'Service'}
        onComplete={(result) => {
          const newAddrId = `addr-${Date.now()}`;
          const newSavedAddr = {
            id: newAddrId,
            label: result.saveAs || 'Home',
            details: result.addressString,
            coordinates: result.coordinates,
            isDefault: true
          };

          // Append to saved addresses list
          setSavedAddresses(prev => [newSavedAddr, ...prev]);
          setSelectedAddressId(newAddrId);
          setAddress(result.addressString);
          setSelectedAddressCoordinates(result.coordinates);
          setSelectedSlot(result.slot);

          if (result.slotSurgeFee) {
            setSelectedTip(prev => prev + result.slotSurgeFee);
          }
          setAddressSaved(true);
          setIsSearchingLocation(false);
          setShowAddressModal(false);
        }}
      />

      {/* ======================================================== */}
      {/* COMPREHENSIVE SERVICE, CANCELLATION & ESCROW POLICY MODAL */}
      {/* ======================================================== */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-slate-950 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 grid place-items-center shadow-md">
                  <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black font-['Outfit'] tracking-tight">Connect Service & Cancellation Policy</h3>
                  <p className="text-xs text-slate-400">Official consumer protection, cancellation terms & workmanship guarantee</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white grid place-items-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-[13px] leading-relaxed">
              
              {/* Highlight summary badge */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-black text-xs uppercase tracking-wider text-amber-900">Zero-Penalty Guarantee</p>
                  <p className="text-xs text-amber-800 leading-normal">
                    You can cancel your booking request anytime before the partner starts the job without paying any cancellation penalty or fee. Your payments are protected in escrow until you release your 6-digit completion code.
                  </p>
                </div>
              </div>

              {/* SECTION 1 */}
              <div className="space-y-2 border-b border-slate-100 pb-5">
                <h4 className="text-sm font-black text-slate-900 font-['Outfit'] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 font-black text-xs grid place-items-center">1</span>
                  <span>100% Free Cancellation & Instant Release</span>
                </h4>
                <p>
                  At Connect, we prioritize customer autonomy. Homeowners may cancel active or pending booking requests through the Connect Client App at any time without incurring cancellation fees or penalty charges.
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li><strong>Instant Dual-Notification:</strong> When you click "Cancel Request" in your bookings panel, an automated email confirmation is immediately sent to your registered address and a real-time cancellation notice is dispatched to your assigned service partner.</li>
                  <li><strong>Immediate Schedule Clearing:</strong> The booking order is automatically unlinked and removed from the specialist's active schedule and inbox, ensuring their time is freed without administrative delays.</li>
                  <li><strong>In-Transit Cancellations:</strong> If you must cancel while the technician is already en route, the partner will be notified immediately to cease transit. No cancellation penalty will be applied to your account.</li>
                </ul>
              </div>

              {/* SECTION 2 */}
              <div className="space-y-2 border-b border-slate-100 pb-5">
                <h4 className="text-sm font-black text-slate-900 font-['Outfit'] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 font-black text-xs grid place-items-center">2</span>
                  <span>Escrow Security & 100% Refund Protocol</span>
                </h4>
                <p>
                  All transactions on Connect are safeguarded by our rigorous financial protection layer:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li><strong>Private 6-Digit Completion Code:</strong> For both safety and quality verification, technicians are never paid or marked completed until you physically share the secret 6-digit Completion Code generated in your booking modal once you are fully satisfied with the job.</li>
                  <li><strong>Full Refund on Cancellation:</strong> If you cancel a prepaid booking or if a partner declines your request, 100% of the funds are promptly refunded back to your original payment method / UPI ID with zero deduction.</li>
                  <li><strong>Pay After Service Protection:</strong> If you choose Cash / Pay After Service, you only pay the agreed amount directly to the specialist upon full physical inspection and job verification at your doorstep.</li>
                  <li><strong>No Hidden or Off-Platform Surcharges:</strong> Specialists are strictly prohibited from demanding extra unlisted charges, off-book travel premiums, or arbitrary inspection costs. The fee shown on your invoice is all-inclusive.</li>
                </ul>
              </div>

              {/* SECTION 3 */}
              <div className="space-y-2 border-b border-slate-100 pb-5">
                <h4 className="text-sm font-black text-slate-900 font-['Outfit'] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 font-black text-xs grid place-items-center">3</span>
                  <span>30-Day Workmanship Warranty & Quality Promise</span>
                </h4>
                <p>
                  Every verified repair and installation completed on the platform is backed by the Connect 30-Day Peace-of-Mind Guarantee:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li><strong>Free Re-Inspection & Rework:</strong> If any serviced equipment, plumbing joint, electrical board, or carpentry fitting develops an issue related to the work performed within 30 days of completion, our team will re-dispatch a qualified technician to inspect and fix it at no additional service cost.</li>
                  <li><strong>Material & Spares Transparency:</strong> Any replacement components or hardware items purchased by the specialist must be accompanied by a valid vendor bill and original manufacturer warranty.</li>
                  <li><strong>Property Damage Coverage:</strong> In the rare event of accidental physical damage occurring to your home fixtures during a scheduled job, Connect provides assistance and damage coverage up to standard liability limits.</li>
                </ul>
              </div>

              {/* SECTION 4 */}
              <div className="space-y-2 border-b border-slate-100 pb-5">
                <h4 className="text-sm font-black text-slate-900 font-['Outfit'] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 font-black text-xs grid place-items-center">4</span>
                  <span>Partner Verification & Doorstep Safety Standards</span>
                </h4>
                <p>
                  Your household's security is our highest priority:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li><strong>Government ID & Skill Verification:</strong> Every partner registered on Connect undergoes Aadhaar/PAN identity validation, bank account verification, and trade skill screening.</li>
                  <li><strong>Professional Conduct Code:</strong> Partners must wear identity credentials, maintain polite professional decorum, adhere to safety regulations, and leave work areas tidy.</li>
                  <li><strong>Safety First:</strong> You retain the right to deny entry or halt work at any moment if a partner fails to adhere to professional standards.</li>
                </ul>
              </div>

              {/* SECTION 5 */}
              <div className="space-y-2">
                <h4 className="text-sm font-black text-slate-900 font-['Outfit'] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 font-black text-xs grid place-items-center">5</span>
                  <span>Customer Support & 24/7 Dispute Redressal</span>
                </h4>
                <p>
                  Have questions, booking disputes, or feedback about a specialist? Our dedicated support grievance desk is available around the clock:
                </p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                  <div>
                    <p className="font-bold text-slate-900">Connect Grievance & Customer Helpdesk</p>
                    <p className="text-slate-500 font-mono">Email: kaam@yors.online • Mumbai, Maharashtra</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px] shrink-0">
                    SLA Response &lt; 4 Hours
                  </span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-slate-500 hidden sm:inline">Connect Consumer Trust & Safety Charter v2.4</span>
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer ml-auto"
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
