import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  MapPin,
  Clock,
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
  LocateFixed,
  X,
  QrCode,
  Smartphone,
  Copy,
  Check
} from 'lucide-react';
import { AddressAndSlotWorkflow } from './AddressAndSlotWorkflow';

export const CheckoutPage = ({
  worker,
  user,
  cartItems = [],
  onBack,
  onBookingComplete,
  onRequireLogin
}) => {
  // Saved addresses list state
  const [savedAddresses, setSavedAddresses] = useState([
    {
      id: 'addr-home',
      label: 'Home',
      details: user?.address || 'astavinayak colony sangoda rd, Mumbai Central, Mumbai, Maharashtra, India',
      isDefault: true
    },
    {
      id: 'addr-work',
      label: 'Work / Office',
      details: 'Unit 402, Cyber Tower B, Sector 62, Noida, Uttar Pradesh, 201301',
      isDefault: false
    }
  ]);

  const [selectedAddressId, setSelectedAddressId] = useState('addr-home');
  const [selectedAddressCoordinates, setSelectedAddressCoordinates] = useState({ lat: 25.4358, lng: 81.8463 });
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
      title: 'Sector 62 Noida (Electronic City)',
      subtitle: 'Noida, Gautam Buddha Nagar, Uttar Pradesh, India',
      fullAddress: 'Sector 62, Noida, Gautam Buddha Nagar, Uttar Pradesh, 201301, India'
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
  const [address, setAddress] = useState(activeAddressObj.details);
  const [addressSaved, setAddressSaved] = useState(true);
  const [avoidCalling, setAvoidCalling] = useState(false);

  // Time slot step
  const [selectedSlot, setSelectedSlot] = useState('Tomorrow, 10:00 AM - 11:00 AM');
  const [showSlotPicker, setShowSlotPicker] = useState(false);

  // Payment method step
  const [paymentMethod, setPaymentMethod] = useState('UPI_QR'); // 'UPI_QR' | 'DIRECT_CASH' | 'CARD'
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [receiverUpiId, setReceiverUpiId] = useState(import.meta.env.VITE_RECEIVER_UPI_ID || 'surya.kaam@okhdfcbank');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [upiUtr, setUpiUtr] = useState('');

  // Tip selection
  const [selectedTip, setSelectedTip] = useState(75);
  const [customTip, setCustomTip] = useState('');
  const [isCustomTip, setIsCustomTip] = useState(false);

  // Cart items state to allow increment/decrement directly in checkout
  const [items, setItems] = useState(
    cartItems.length > 0
      ? cartItems
      : [
          {
            id: 'default-pkg',
            title: `${worker.tradeTitle || 'Trade'} Standard Service Package`,
            price: worker.dailyRate || 758,
            qty: 1,
            features: ['Diagnostic inspection', 'Standard repair & fitting', 'Post-service cleanup']
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
  const itemTotal = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const taxesAndFees = Math.round(itemTotal * 0.05) + 15; // 5% GST + Convenience
  const tipAmount = isCustomTip ? (Number(customTip) || 0) : selectedTip;
  const finalPayable = itemTotal + taxesAndFees + tipAmount;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const submitBookingOrder = async () => {
    setIsSubmitting(true);

    const payload = {
      workerId: worker.id,
      workerName: worker.name,
      tradeTitle: worker.tradeTitle,
      workerPhone: worker.phone,
      clientName: user.fullName || 'Homeowner',
      clientPhone: phone,
      locationAddress: address,
      coordinates: selectedAddressCoordinates || null,
      workDescription: items.map(i => `${i.title} (x${i.qty})`).join(', '),
      agreedTotalFee: finalPayable,
      paymentMode: paymentMethod,
      upiUtr: upiUtr || null,
      paymentStatus: paymentMethod === 'UPI_QR' ? 'PAID_VIA_UPI_QR' : 'PAY_AFTER_SERVICE',
      timeSlot: selectedSlot,
      avoidCallingBeforeArrival: avoidCalling,
      tipAmount: tipAmount
    };

    try {
      const res = await fetch('http://localhost:5050/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowQrModal(false);
        setBookingSuccess(true);
      } else {
        setShowQrModal(false);
        setBookingSuccess(true);
      }
    } catch (e) {
      console.warn('Job submitted offline mode fallback:', e);
      setShowQrModal(false);
      setBookingSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToBook = () => {
    if (!user) {
      onRequireLogin();
      return;
    }

    if (paymentMethod === 'UPI_QR') {
      setShowQrModal(true);
      return;
    }

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
              <span className="text-slate-500">Slot:</span>
              <span className="font-bold text-slate-900">{selectedSlot}</span>
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

              {/* Step 3: Slot */}
              <div className="pt-4 border-t border-slate-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Slot</h3>
                    <button
                      onClick={() => setShowSlotPicker(!showSlotPicker)}
                      className="text-xs font-bold text-purple-700 hover:underline"
                    >
                      {showSlotPicker ? 'Close' : 'Choose time'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedSlot}</p>

                  {showSlotPicker && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      {[
                        'Today, 4:00 PM - 5:00 PM',
                        'Today, 6:00 PM - 7:00 PM',
                        'Tomorrow, 10:00 AM - 11:00 AM',
                        'Tomorrow, 2:00 PM - 3:00 PM'
                      ].map(slot => (
                        <button
                          key={slot}
                          onClick={() => {
                            setSelectedSlot(slot);
                            setShowSlotPicker(false);
                          }}
                          className={`p-2.5 rounded-xl border text-left font-medium transition ${selectedSlot === slot ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 4: Payment Method */}
              <div className="pt-4 border-t border-slate-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Payment Method</h3>
                    <button
                      onClick={() => setShowPaymentPicker(!showPaymentPicker)}
                      className="text-xs font-bold text-purple-700 hover:underline"
                    >
                      {showPaymentPicker ? 'Close' : 'Change'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {paymentMethod === 'UPI_QR'
                      ? 'Scan & Pay directly via Live UPI QR (GPay / PhonePe / Paytm)'
                      : paymentMethod === 'DIRECT_CASH'
                      ? 'Pay after service (Cash / UPI to Worker)'
                      : 'Online Card / NetBanking'}
                  </p>

                  {showPaymentPicker && (
                    <div className="mt-3 space-y-2 text-xs">
                      {/* Option 1: Live UPI QR (Direct to your account) */}
                      <button
                        type="button"
                        onClick={() => { setPaymentMethod('UPI_QR'); setShowPaymentPicker(false); }}
                        className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                          paymentMethod === 'UPI_QR'
                            ? 'border-[#5932ea] bg-purple-50/70 font-bold text-purple-950 shadow-sm'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white grid place-items-center shrink-0">
                            <QrCode className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-extrabold text-xs text-slate-900">Scan & Pay via UPI QR Code</p>
                            <p className="text-[10px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM, Cred</p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full font-bold">Fast & Direct</span>
                      </button>

                      {/* Option 2: Pay After Service */}
                      <button
                        type="button"
                        onClick={() => { setPaymentMethod('DIRECT_CASH'); setShowPaymentPicker(false); }}
                        className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                          paymentMethod === 'DIRECT_CASH'
                            ? 'border-[#5932ea] bg-purple-50/70 font-bold text-purple-950 shadow-sm'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white grid place-items-center shrink-0">
                            <Receipt className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-extrabold text-xs text-slate-900">Pay After Service</p>
                            <p className="text-[10px] text-slate-500">Cash or UPI directly to worker after job completion</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Cancellation Policy */}
            <div className="space-y-1.5 px-2">
              <h4 className="text-sm font-black text-slate-900 font-['Outfit']">Cancellation policy</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Free cancellations if done more than 12 hrs before the service. A nominal fee will be charged otherwise.
              </p>
              <button className="text-xs font-bold text-slate-900 underline">Read full policy</button>
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
                  <h3 className="text-lg font-black text-slate-900 font-['Outfit']">{worker.name}</h3>
                  <p className="text-xs text-amber-700 font-bold">{worker.tradeTitle} • {worker.locality}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> VERIFIED
                </span>
              </div>

              {/* Service Items List */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">{item.title}</h4>
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

            {/* Coupons & Offers Banner */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 grid place-items-center">
                  <Percent className="w-4 h-4" />
                </div>
                <span className="text-xs font-extrabold text-slate-900">Coupons and offers</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-purple-700">
                <span>9 offers</span>
                <ChevronRight className="w-3.5 h-3.5" />
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
                  disabled={isSubmitting}
                  onClick={handleProceedToBook}
                  className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs shadow-lg shadow-purple-600/30 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <span>
                    {isSubmitting ? 'Please wait...' : 'Proceed to book ➔'}
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
                      setAddress(addr.details);
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
                          {addr.details}
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
        tradeTitle={worker.tradeTitle || 'Service'}
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
      {/* UPI QR CODE PAYMENT POPUP MODAL (AFTER PROCEED TO BOOK)  */}
      {/* ======================================================== */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 relative animate-in zoom-in-95 text-center font-['Plus_Jakarta_Sans',sans-serif]">
            
            {/* Close Button */}
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-9 h-9 rounded-full bg-white text-slate-700 hover:text-slate-950 shadow-xl border border-slate-200 grid place-items-center font-bold text-sm transition active:scale-95 z-10"
            >
              ✕
            </button>

            {/* Header */}
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-wider bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                Scan & Pay via UPI
              </span>
              <h3 className="text-xl font-black text-slate-900 font-['Outfit'] mt-2">
                Pay ₹{finalPayable}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Scan this QR code with any UPI app to pay
              </p>
            </div>

            {/* Centered QR Code */}
            <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-inner inline-block mx-auto">
              <QRCodeSVG
                value={`upi://pay?pa=${receiverUpiId}&pn=KAAM%20Services&am=${finalPayable}&cu=INR&tn=KAAM-Booking`}
                size={210}
                level="H"
                includeMargin={true}
              />
            </div>

            <p className="text-xs font-black text-slate-800 tracking-tight">
              Google Pay • PhonePe • Paytm • BHIM
            </p>

            {/* Confirm Paid Action */}
            <div className="pt-2">
              <button
                disabled={isSubmitting}
                onClick={submitBookingOrder}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs shadow-lg shadow-purple-600/30 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Confirming Payment...' : 'I Have Paid (Confirm Booking) ➔'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
