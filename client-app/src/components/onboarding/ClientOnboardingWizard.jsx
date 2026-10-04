import React, { useState } from 'react';
import { API_BASE_URL } from '../../config/api';
import { User, Phone, MapPin, Building, ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft, Home } from 'lucide-react';

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

export const ClientOnboardingWizard = ({ user, onComplete }) => {
  const [step, setStep] = useState(1); // 1: Page I (Contact), 2: Page II (Address), 3: Review & Summary
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    fullName: user?.fullName || user?.full_name || 'Client User',
    phone: user?.phone || '',
    secondaryPhone: user?.secondaryPhone || '',
    locality: user?.locality || '',
    landmark: user?.landmark || '',
    state: user?.state || 'Uttar Pradesh',
    pincode: user?.pincode || '',
    address: user?.address || ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage('');
  };

  const handleNextPage1 = (e) => {
    e.preventDefault();
    if (!formData.phone || formData.phone.trim().length < 10) {
      setErrorMessage('Please enter a valid 10-digit primary mobile number.');
      return;
    }
    setStep(2);
  };

  const handleNextPage2 = (e) => {
    e.preventDefault();
    if (!formData.locality || !formData.landmark || !formData.state || !formData.pincode) {
      setErrorMessage('Please fill all address fields (Locality, Landmark, State, Pincode).');
      return;
    }
    if (formData.pincode.trim().length < 6) {
      setErrorMessage('Please enter a valid 6-digit Pincode.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      address: `${prev.locality}, near ${prev.landmark}, ${prev.state} - ${prev.pincode}`
    }));
    setStep(3);
  };

  const handleSaveAndDone = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const fullAddress = `${formData.locality}, near ${formData.landmark}, ${formData.state} - ${formData.pincode}`;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          fullName: formData.fullName,
          phone: formData.phone,
          secondaryPhone: formData.secondaryPhone,
          address: fullAddress,
          locality: formData.locality,
          landmark: formData.landmark,
          state: formData.state,
          pincode: formData.pincode
        }),
      });

      const updatedUser = {
        ...user,
        fullName: formData.fullName,
        phone: formData.phone,
        secondaryPhone: formData.secondaryPhone,
        address: fullAddress,
        locality: formData.locality,
        landmark: formData.landmark,
        state: formData.state,
        pincode: formData.pincode,
        onboardingCompleted: true,
      };

      localStorage.setItem('kaam_client_user', JSON.stringify(updatedUser));
      onComplete(updatedUser);
    } catch (err) {
      console.warn('Network note, saving locally:', err);
      const updatedUser = {
        ...user,
        fullName: formData.fullName,
        phone: formData.phone,
        secondaryPhone: formData.secondaryPhone,
        address: fullAddress,
        locality: formData.locality,
        landmark: formData.landmark,
        state: formData.state,
        pincode: formData.pincode,
        onboardingCompleted: true,
      };
      localStorage.setItem('kaam_client_user', JSON.stringify(updatedUser));
      onComplete(updatedUser);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="relative w-full max-w-lg bg-slate-900 border border-teal-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-teal-950/80 space-y-6 text-white overflow-hidden">
        
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-teal-950 font-black shadow-lg shadow-amber-500/30">
              <Home className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-black font-['Outfit'] text-white">Client Account Onboarding</h2>
              <p className="text-xs text-amber-300 font-medium">Case I: New Account Setup • Page {step} of 3</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30 text-[11px] font-black uppercase tracking-wider">
            {step === 1 ? 'Page I: Contact' : step === 2 ? 'Page II: Address' : 'Summary & Save'}
          </span>
        </div>

        {/* Step Progress Line */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 h-full transition-all duration-500" 
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {/* PAGE I: CONTACT DETAILS (DIAGRAM SPEC: i. Name, ii. Mobile Primary, iii. Alternate Mobile) */}
        {step === 1 && (
          <form onSubmit={handleNextPage1} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Page I: Contact Details</span>
              </h3>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">New Account</span>
            </div>

            {/* (i) Name - Pre-filled from account creation */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">(i) Full Name (From Account Creation)</label>
              <div className="relative">
                <User className="w-4 h-4 text-teal-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  name="fullName"
                  readOnly
                  value={formData.fullName}
                  className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950/80 border border-slate-800 text-slate-300 text-xs font-bold cursor-not-allowed opacity-90"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1 ml-2">✓ Pre-filled as per account creation</p>
            </div>

            {/* (ii) Mobile Number - Primary */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 ml-2">(ii) Mobile Number - Primary *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-amber-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  name="phone"
                  required
                  placeholder="Enter 10-digit primary mobile number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* (iii) Alternate Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">(iii) Alternate Mobile Number (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                <input
                  type="text"
                  name="secondaryPhone"
                  placeholder="Enter alternate contact number"
                  value={formData.secondaryPhone}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-teal-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
              >
                <span>Continue to Page II (Address)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* PAGE II: ADDRESS DETAILS (DIAGRAM SPEC: i. Locality, ii. Landmark, iii. State Dropdown, iv. Pincode) */}
        {step === 2 && (
          <form onSubmit={handleNextPage2} className="space-y-4">
            <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-400" />
              <span>Page II: Address Details</span>
            </h3>

            {/* (i) Locality */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 ml-2">(i) Locality / Sector *</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-teal-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  name="locality"
                  required
                  placeholder="e.g. Sector 63, Indirapuram"
                  value={formData.locality}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* (ii) Landmark */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 ml-2">(ii) Landmark *</label>
              <div className="relative">
                <Building className="w-4 h-4 text-teal-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  name="landmark"
                  required
                  placeholder="e.g. Near Electronic City Metro Station"
                  value={formData.landmark}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* (iii) State - Dropdown list of States in India */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 ml-2">(iii) State (Dropdown) *</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500 font-semibold"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* (iv) Pincode */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 ml-2">(iv) Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  required
                  maxLength={6}
                  placeholder="e.g. 201301"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Page I
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-teal-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
              >
                <span>Save Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: REVIEW & DONE (DIAGRAM SPEC: "User Press Save" -> Shows Whole Details -> "User Press Done" -> Home Page) */}
        {step === 3 && (
          <form onSubmit={handleSaveAndDone} className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Review Filled Details</span>
            </h3>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs text-slate-300">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="font-bold text-white text-sm">{formData.fullName}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                  Verified Client
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Primary Contact Phone:</span>
                <span className="font-mono text-amber-400 font-bold text-sm">{formData.phone}</span>
              </div>

              {formData.secondaryPhone && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Alternate Phone:</span>
                  <span className="font-mono text-slate-200">{formData.secondaryPhone}</span>
                </div>
              )}

              <div>
                <span className="text-slate-400 block text-[11px]">Locality & Landmark:</span>
                <span className="font-semibold text-white">{formData.locality}, Near {formData.landmark}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-400 block text-[11px]">State:</span>
                  <span className="font-semibold text-teal-300">{formData.state}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Pincode:</span>
                  <span className="font-mono text-white font-bold">{formData.pincode}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Edit Address
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/60 flex items-center gap-2 hover:brightness-110 disabled:opacity-50 active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving Profile...' : 'Done (Proceed to Home Page)'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
