import React, { useState } from 'react';
import { 
  Wrench, 
  DollarSign, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Building2, 
  CreditCard, 
  Sparkles,
  Plus,
  Trash2,
  Pencil,
  Search,
  Check,
  ShieldCheck,
  Package,
  Layers,
  Phone,
  UserCheck,
  Tag,
  X
} from 'lucide-react';
import { SERVICE_CATEGORIES_50 } from '../../data/serviceCategories';
import { API_BASE_URL } from '../../config/api';

export const WorkerOnboardingWizard = ({ user, workerProfile, onComplete, onCancel }) => {
  const [step, setStep] = useState(1); // Steps 1 to 3
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('All');

  // Step 1 State: Category & Basic Info
  const [partnerName, setPartnerName] = useState(user?.fullName || workerProfile?.name || '');
  const [partnerPhone, setPartnerPhone] = useState(user?.phone || workerProfile?.phone || '');
  const [partnerEmail, setPartnerEmail] = useState(user?.email || workerProfile?.email || '');
  const [selectedCategory, setSelectedCategory] = useState(
    SERVICE_CATEGORIES_50.find(c => c.id === workerProfile?.tradeCategory) || SERVICE_CATEGORIES_50[0]
  );
  const [tradeTitle, setTradeTitle] = useState(workerProfile?.tradeTitle || selectedCategory?.name || 'Service Partner');
  const [locality, setLocality] = useState(workerProfile?.locality || 'Andheri West, Mumbai');
  const [experienceYears, setExperienceYears] = useState('5');
  const [bio, setBio] = useState(
    workerProfile?.bio || `Professional ${selectedCategory.name} with 5+ years experience. Quality work guaranteed.`
  );
  const [visitingCharge, setVisitingCharge] = useState(
    workerProfile?.visitingCharge || workerProfile?.visiting_charge || 149
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(() => [selectedCategory.id]);

  // Packages initialization (Packages are managed in the Packages section)
  const getDefaultPackages = (cat) => [
    {
      id: `pkg-1-${Date.now()}`,
      title: `${cat.name} - Basic Inspection & Diagnosis`,
      description: `Includes doorstep visit, problem diagnosis, and minor fixes up to 30 mins.`,
      price: cat.baseRate || 299,
      duration: '30 mins',
      category: cat.id
    },
    {
      id: `pkg-2-${Date.now()}`,
      title: `Standard ${cat.name} Service Package`,
      description: `Complete standard repair, fitting, and testing work at home.`,
      price: Math.round((cat.baseRate || 350) * 1.8),
      duration: '1-2 hours',
      category: cat.id
    }
  ];

  const [packages, setPackages] = useState(() => 
    workerProfile?.packages?.length ? workerProfile.packages : getDefaultPackages(selectedCategory)
  );

  // Step 2 State: UPI & Payout Details
  const [upiId, setUpiId] = useState(workerProfile?.bank?.upi || `${user?.phone || '9876543210'}@paytm`);
  const [accountHolderName, setAccountHolderName] = useState(user?.fullName || workerProfile?.name || 'Ramesh Kumar');
  const [payoutMode, setPayoutMode] = useState('UPI Instant Payout');

  // Filter Categories by search & group
  const categoryGroups = ['All', 'Home Repair', 'Appliances', 'Cleaning', 'Beauty & Personal', 'Domestic Help', 'Specialized'];

  const filteredCategories = SERVICE_CATEGORIES_50.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cat.hindi.includes(searchQuery) ||
                          cat.id.includes(searchQuery.toLowerCase());
    const matchesGroup = activeGroup === 'All' || cat.group === activeGroup;
    return matchesSearch && matchesGroup;
  });

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    if (!selectedCategoryIds.includes(cat.id)) {
      setSelectedCategoryIds(prev => [...prev, cat.id]);
    }
    if (!tradeTitle || tradeTitle === selectedCategory.name || tradeTitle === 'Service Partner') {
      setTradeTitle(cat.name);
    }
    if (!workerProfile?.packages?.length) {
      setPackages(getDefaultPackages(cat));
    }
    setBio(`Professional ${cat.name} with ${experienceYears}+ years experience. High quality work guaranteed.`);
  };

  const handleNext = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (step === 1) {
      if (!selectedCategory || !locality) {
        setErrorMessage('Please select your work category and locality.');
        return;
      }
      if (!partnerName.trim()) {
        setErrorMessage('Please enter your Full Name or Business Name.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!upiId || !upiId.includes('@')) {
        setErrorMessage('Please enter a valid UPI ID (e.g. 9876543210@paytm or name@okaxis).');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmitFinal = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    const completedProfile = {
      ...workerProfile,
      id: workerProfile?.id || `w-${Date.now()}`,
      userId: user?.id || 'u-worker-1',
      name: partnerName.trim() || user?.fullName || workerProfile?.name || 'Partner',
      phone: partnerPhone.trim() || user?.phone || workerProfile?.phone,
      email: partnerEmail.trim() || user?.email || workerProfile?.email,
      tradeCategory: selectedCategory.id,
      categories: selectedCategoryIds,
      tradeTitle: tradeTitle.trim() || selectedCategory.name,
      hindiName: selectedCategory.hindi,
      locality: locality,
      city: 'Mumbai',
      bio: bio,
      experienceYears: experienceYears,
      dailyRate: selectedCategory.baseRate * 2 || 650,
      hourlyRate: Math.round((selectedCategory.baseRate || 350) / 3),
      visitingCharge: Number(visitingCharge) || 149,
      visiting_charge: Number(visitingCharge) || 149,
      packages: packages,
      bank: {
        holder: accountHolderName,
        upi: upiId,
        payoutMode: payoutMode,
      },
      isAvailable: true,
      onboardingCompleted: true,
    };

    try {
      // 1. Sync to SQLite REST API & MongoDB Atlas
      await fetch(`${API_BASE_URL}/api/workers/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          workerId: completedProfile.id,
          name: completedProfile.name,
          phone: completedProfile.phone,
          email: completedProfile.email,
          tradeTitle: completedProfile.tradeTitle,
          tradeCategory: selectedCategory.id,
          categories: selectedCategoryIds,
          hindiName: selectedCategory.hindi,
          locality: locality || 'Andheri West, Mumbai',
          city: 'Mumbai',
          bio: bio,
          dailyRate: completedProfile.dailyRate,
          hourlyRate: completedProfile.hourlyRate,
          visitingCharge: Number(visitingCharge) || 149,
          experienceYears: experienceYears,
          packages: packages,
          bank: completedProfile.bank,
          onboardingCompleted: true,
        }),
      }).catch(e => console.warn('API sync warning:', e));

      // 2. Submit UPI
      await fetch(`${API_BASE_URL}/api/workers/bank-kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          accountHolderName: accountHolderName,
          upiId: upiId,
          bankName: 'UPI Direct',
          govtIdType: 'Aadhaar',
          govtIdNumber: 'VERIFIED',
        }),
      }).catch(e => console.warn('UPI sync warning:', e));

    } catch (err) {
      console.warn('Local fallback save used:', err);
    } finally {
      if (user) {
        const updatedUser = {
          ...user,
          fullName: completedProfile.name,
          phone: completedProfile.phone,
          email: completedProfile.email
        };
        localStorage.setItem('kaam_worker_user', JSON.stringify(updatedUser));
      }
      localStorage.setItem('kaam_worker_profile', JSON.stringify(completedProfile));
      localStorage.setItem('kaam_onboarding_completed', 'true');
      setIsSubmitting(false);
      onComplete(completedProfile);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm font-['Outfit',sans-serif]">
      <div className="relative w-full max-w-2xl bg-[#fcfbf9] border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-slate-900">
        
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <Wrench className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">Partner Profile Setup</h2>
              <p className="text-xs text-slate-500 font-medium">Step {step} of 3 • {
                step === 1 ? 'Select Category & Work Locality' :
                step === 2 ? 'UPI Payout & Payment Method' : 'Review & Finish Setup'
              }</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full text-amber-800 text-xs font-bold">
            <span>Setup Progress</span>
            <span className="font-black text-amber-600">{Math.round((step / 3) * 100)}%</span>
          </div>
        </div>

        {/* Step Progress Line */}
        <div className="w-full bg-slate-100 h-1.5">
          <div 
            className="bg-gradient-to-r from-amber-500 to-amber-600 h-full transition-all duration-300"
            style={{ width: `${Math.round((step / 3) * 100)}%` }}
          ></div>
        </div>

        {/* Main Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* STEP 1: SELECT WORK CATEGORY (50+ LIST) */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-black text-slate-950 mb-1">Step 1: Partner Information & Service Trade</h3>
                <p className="text-xs text-slate-500">Enter your real profile details and select your primary trade</p>
              </div>

              {/* Partner Name, Phone, Email & Trade Title Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Your Full Name / Business Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Surya Yadav"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Contact Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={partnerPhone}
                    onChange={(e) => setPartnerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. partner@example.com"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Custom Trade Title (Shown to Clients)</label>
                  <input
                    type="text"
                    placeholder="e.g. Plumber & Electrician Specialist"
                    value={tradeTitle}
                    onChange={(e) => setTradeTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">Choose Your Primary Service Trade</label>
                <p className="text-[11px] text-slate-500 mb-2.5">Select what service you provide to home customers (50+ Categories Available)</p>
              </div>

              {/* Group Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {categoryGroups.map(grp => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setActiveGroup(grp)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      activeGroup === grp 
                        ? 'bg-slate-900 text-white shadow' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {grp}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search 50+ trades (e.g. Plumber, Beauty, AC Repair, Maid, EV Charger)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              {/* Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {filteredCategories.map(cat => {
                  const isSelected = selectedCategory.id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      className={`p-3 rounded-2xl border text-left flex items-start justify-between transition-all ${
                        isSelected 
                          ? 'bg-amber-500/10 border-amber-500 shadow-md ring-1 ring-amber-500' 
                          : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-950">{cat.name}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{cat.group}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Est. Base: ₹{cat.baseRate}/job</p>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Locality & Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Service Area / Locality in Mumbai</label>
                  <input
                    type="text"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g. Andheri West, Mumbai"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['Andheri West', 'Bandra West', 'Powai', 'Dadar West', 'Thane West', 'Vashi', 'Colaba'].map(loc => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setLocality(`${loc}, Mumbai`)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold transition ${
                          locality.includes(loc) ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Years of Experience</label>
                  <select
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="1">1 Year Experience</option>
                    <option value="3">3 Years Experience</option>
                    <option value="5">5+ Years Experience</option>
                    <option value="8">8+ Years Experience</option>
                    <option value="12">10+ Years Master</option>
                  </select>
                </div>
              </div>

              {/* Visiting Charge Field */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-900">
                    Visiting / Inspection Charge (₹)
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Mandatory if no package chosen
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={visitingCharge}
                    onChange={(e) => setVisitingCharge(e.target.value)}
                    placeholder="149"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500 shadow-sm"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  This fee is temporarily shown to clients on your profile. If they book without selecting any package, this visiting charge is mandatorily applied. When a client picks a package, this fee is waived.
                </p>
              </div>
            </div>
          )}


          {/* STEP 2: UPI PAYMENT DETAILS */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-black text-slate-950 mb-1">Step 2: Setup Direct UPI Payment Receiving</h3>
                <p className="text-xs text-slate-500">Enter your UPI details where customer online job payments will be transferred</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Direct UPI ID (PhonePe / Paytm / GPay / BHIM)</label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. 9876543210@paytm or ramesh@okaxis"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">100% direct payment on customer job completion.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Full Name</label>
                  <input
                    type="text"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="Full name as on UPI account"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Collection Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPayoutMode('UPI Instant Payout')}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                        payoutMode === 'UPI Instant Payout'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-900 font-black'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      📲 Online UPI QR
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutMode('Cash & UPI')}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                        payoutMode === 'Cash & UPI'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-900 font-black'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      💵 Cash + UPI Both
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & FINISH */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-black text-slate-950 mb-1">Step 3: Review & Confirm Profile Setup</h3>
                <p className="text-xs text-slate-500">Check your partner profile details before going live on the platform</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Partner Name</span>
                  <span className="text-xs font-bold text-slate-900">{partnerName}</span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Contact Phone</span>
                  <span className="text-xs font-bold text-slate-900">{partnerPhone}</span>
                </div>

                {partnerEmail && (
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Email</span>
                    <span className="text-xs font-bold text-slate-900">{partnerEmail}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Selected Trade Category</span>
                  <span className="text-xs font-black text-slate-950 bg-amber-100 text-amber-900 px-3 py-1 rounded-full">{selectedCategory.name}</span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Service Locality</span>
                  <span className="text-xs font-bold text-slate-900">{locality}</span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Visiting / Inspection Charge</span>
                  <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    ₹{visitingCharge} (Mandatory if no package chosen)
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Receiving UPI ID</span>
                  <span className="text-xs font-mono font-bold text-slate-900">{upiId}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <Package className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 font-medium leading-relaxed">
                  <span className="font-bold">Manage Packages in Dashboard:</span> Starter packages for {selectedCategory.name} have been assigned. You can create, edit, customize, or add new trade packages anytime exclusively in the <span className="font-bold underline">"My Packages"</span> tab on your dashboard.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 font-medium">
                  <span className="font-bold">Ready to Go Live!</span> Your partner profile will appear live on the Client site for homeowners searching for {selectedCategory.name} in {locality}.
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitFinal}
              className="px-7 py-2.5 rounded-xl bg-slate-950 text-white font-black text-xs hover:bg-slate-800 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Saving Setup...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Launch My Partner Dashboard</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
