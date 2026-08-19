import React, { useState } from 'react';
import { HardHat, Wrench, DollarSign, MapPin, ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft, Building2, CreditCard, Image as ImageIcon, Sparkles } from 'lucide-react';

export const WorkerOnboardingWizard = ({ user, workerProfile, onComplete, onSkip }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    tradeCategory: workerProfile?.trade_category || 'plumber',
    tradeTitle: workerProfile?.trade_title || 'Senior CPVC & Drainage Master Plumber',
    dailyRate: workerProfile?.daily_rate || '650',
    hourlyRate: workerProfile?.hourly_rate || '80',
    experienceYears: '7',
    locality: workerProfile?.locality || 'Sector 62, Noida',
    bio: workerProfile?.bio || 'Certified tradesperson with 7+ years of experience in high-pressure plumbing, CPVC fitting, and bathroom leak repairs.',
    govtIdType: 'Aadhaar Card',
    govtIdNumber: '5421 8890 1204',
    accountHolderName: user?.fullName || 'Surya Kumar (Worker)',
    bankName: 'HDFC Bank',
    accountNumber: '5010023490112',
    ifscCode: 'HDFC0001245',
    upiId: 'surya.worker@paytm',
    portfolioTitle: 'Bathroom CPVC & Overhead Tank Fitting',
    portfolioUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800&auto=format&fit=crop',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage('');
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.tradeTitle || !formData.dailyRate || !formData.locality) {
        setErrorMessage('Please fill in your trade title, daily wage fee, and locality.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.accountNumber || !formData.ifscCode || !formData.upiId) {
        setErrorMessage('Please enter your bank account number, IFSC code, and direct UPI ID.');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Update Profile & Daily Rates
      await fetch('http://localhost:5050/api/workers/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          workerId: workerProfile?.id,
          tradeTitle: formData.tradeTitle,
          dailyRate: formData.dailyRate,
          hourlyRate: formData.hourlyRate,
          locality: formData.locality,
          bio: formData.bio,
        }),
      });

      // 2. Submit Aadhaar & Bank KYC Details
      await fetch('http://localhost:5050/api/workers/bank-kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          workerId: workerProfile?.id,
          accountHolderName: formData.accountHolderName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          upiId: formData.upiId,
          bankName: formData.bankName,
          govtIdType: formData.govtIdType,
          govtIdNumber: formData.govtIdNumber,
        }),
      });

      // 3. Optional Portfolio Image Add
      if (formData.portfolioUrl) {
        await fetch('http://localhost:5050/api/workers/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            title: formData.portfolioTitle,
            categoryTag: formData.tradeCategory,
            imageUrl: formData.portfolioUrl,
            description: 'Recent completed work project photo.',
          }),
        }).catch(e => console.warn('Portfolio photo add note:', e));
      }

      setSuccessMessage('✓ Worker Trade Profile & Aadhaar Bank KYC submitted for Admin verification!');
      const updatedProfile = {
        ...workerProfile,
        trade_title: formData.tradeTitle,
        daily_rate: formData.dailyRate,
        hourly_rate: formData.hourlyRate,
        locality: formData.locality,
        bio: formData.bio,
        kyc_status: 'PENDING',
        onboardingCompleted: true,
      };
      localStorage.setItem('kaam_worker_profile', JSON.stringify(updatedProfile));
      setTimeout(() => onComplete(updatedProfile), 1200);

    } catch (err) {
      setSuccessMessage('✓ Trade Profile saved locally!');
      const updatedProfile = {
        ...workerProfile,
        trade_title: formData.tradeTitle,
        daily_rate: formData.dailyRate,
        hourly_rate: formData.hourlyRate,
        locality: formData.locality,
        bio: formData.bio,
        onboardingCompleted: true,
      };
      localStorage.setItem('kaam_worker_profile', JSON.stringify(updatedProfile));
      setTimeout(() => onComplete(updatedProfile), 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="relative w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/80 space-y-6 text-white overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/30">
              <HardHat className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-black font-['Outfit'] text-white">Tradesperson Skill Onboarding</h2>
              <p className="text-xs text-amber-400 font-medium">Step {step} of 3 • Trade & KYC Setup</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-black uppercase tracking-wider">
            {step === 1 ? 'Trade & Fees' : step === 2 ? 'Bank & Aadhaar' : 'Portfolio Work'}
          </span>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 h-full transition-all duration-500" 
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            {successMessage}
          </div>
        )}

        {/* STEP 1: TRADE CATEGORY, TITLE & DAILY WAGE FEE */}
        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Select Primary Trade & Daily Rates</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">Primary Trade Category</label>
              <select
                name="tradeCategory"
                value={formData.tradeCategory}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="plumber">🚰 Plumber (CPVC, Leakages & Fitting)</option>
                <option value="electrician">⚡ Electrician (Wiring, Fuse & Appliance)</option>
                <option value="mistry">👷 Construction Mistry / Contractor</option>
                <option value="painter">🎨 Wall Painter & Emulsion Specialist</option>
                <option value="mason">🧱 Tile & Brick Mason</option>
                <option value="carpenter">🪚 Carpenter & Furniture Master</option>
                <option value="welder">🔥 Metal Welder & Fabrication</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">Specialist Title</label>
              <input
                type="text"
                name="tradeTitle"
                required
                placeholder="e.g. Senior CPVC & Overhead Tank Master Plumber"
                value={formData.tradeTitle}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">Daily Wage Fee (₹/day)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-amber-400 absolute left-4 top-3.5" />
                  <input
                    type="number"
                    name="dailyRate"
                    required
                    placeholder="650"
                    value={formData.dailyRate}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-amber-400 font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">Hourly Rate (₹/hr)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="number"
                    name="hourlyRate"
                    required
                    placeholder="80"
                    value={formData.hourlyRate}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-slate-300 font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">Locality / Base Area</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-amber-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  name="locality"
                  required
                  placeholder="e.g. Sector 62, Noida"
                  value={formData.locality}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onSkip}
                className="text-xs font-bold text-slate-400 hover:text-white"
              >
                Skip for now
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 hover:brightness-110"
              >
                <span>Continue to Bank & Aadhaar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: AADHAAR ID & BANK ACCOUNT / UPI DETAILS */}
        {step === 2 && (
          <form onSubmit={handleNext} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Aadhaar Identity & Bank Account Details</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">Govt ID Type</label>
                <input
                  type="text"
                  name="govtIdType"
                  value={formData.govtIdType}
                  readOnly
                  className="w-full px-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-slate-400 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">Aadhaar Number</label>
                <input
                  type="text"
                  name="govtIdNumber"
                  required
                  placeholder="5421 8890 1204"
                  value={formData.govtIdNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  required
                  placeholder="HDFC Bank"
                  value={formData.bankName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">IFSC Code</label>
                <input
                  type="text"
                  name="ifscCode"
                  required
                  placeholder="HDFC0001245"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs font-mono uppercase focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">Bank Account Number</label>
              <input
                type="text"
                name="accountNumber"
                required
                placeholder="5010023490112"
                value={formData.accountNumber}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">Direct UPI ID (For Direct Payments)</label>
              <input
                type="text"
                name="upiId"
                required
                placeholder="surya.worker@paytm / 9811100223@upi"
                value={formData.upiId}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-full bg-slate-950 border border-amber-500/40 text-amber-400 font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 hover:brightness-110"
              >
                <span>Continue to Work Portfolio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: WORK PORTFOLIO & BIO */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span>Bio & Recent Work Photo</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">Professional Bio</label>
              <textarea
                name="bio"
                rows={3}
                placeholder="Describe your trade experience and specialization..."
                value={formData.bio}
                onChange={handleChange}
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">Portfolio Project Title</label>
              <input
                type="text"
                name="portfolioTitle"
                placeholder="e.g. Bathroom CPVC & Overhead Tank Fitting"
                value={formData.portfolioTitle}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">Sample Work Photo Image URL</label>
              <input
                type="text"
                name="portfolioUrl"
                placeholder="https://images.unsplash.com/..."
                value={formData.portfolioUrl}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Edit Bank Details
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center gap-2 hover:brightness-110 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting to Admin...' : 'Submit Profile & Submit KYC'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
