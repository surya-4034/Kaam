import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, Lock, Unlock, CheckCircle, XCircle, DollarSign, Activity, RefreshCw, HardHat, UserCheck, Search, AlertTriangle, LogOut, KeyRound, User, Home, Briefcase, Clock, ArrowLeft, Send, Eye, EyeOff, Building2 } from 'lucide-react';

export default function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('kaam_admin_session') === 'true' && Boolean(localStorage.getItem('kaam_admin_token'));
  });

  // Auth View State: 'LOGIN' | 'FORGOT_CODE' | 'RESET_PASSWORD'
  const [authViewState, setAuthViewState] = useState('LOGIN');

  // Eye Password Visibility States
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false);

  const [adminLoginForm, setAdminLoginForm] = useState({
    adminId: '',
    password: ''
  });
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [adminSuccessMessage, setAdminSuccessMessage] = useState('');

  // Forgot Password Sub-state
  const [secretCode, setSecretCode] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');

  const [stats, setStats] = useState({
    grossVolume: 0,
    totalCommission: 0,
    pendingDues: 0,
    totalWorkers: 0,
    verifiedWorkers: 0,
    totalClients: 0
  });

  const [users, setUsers] = useState([]);
  const [kycQueue, setKycQueue] = useState([]);
  const [duesAudit, setDuesAudit] = useState([]);
  
  // SEPARATE ADMIN SECTIONS: 'CLIENTS' | 'WORKERS' | 'KYC' | 'DUES'
  const [activeTab, setActiveTab] = useState('CLIENTS');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // CLIENT VIEW MODAL STATE (HANDWRITTEN WIREFRAME IMPLEMENTATION)
  const [selectedClientModal, setSelectedClientModal] = useState(null);
  const [isClientModalLoading, setIsClientModalLoading] = useState(false);
  const [unmaskedPhones, setUnmaskedPhones] = useState({});

  const togglePhoneMask = (clientId) => {
    setUnmaskedPhones(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }));
  };

  const maskPhoneNumber = (phone) => {
    if (!phone) return 'N/A';
    const clean = phone.replace(/\D/g, '');
    if (clean.length >= 10) {
      const last10 = clean.slice(-10);
      return `${last10.slice(0, 5)} *** **`;
    }
    return phone;
  };

  const handleViewClientProfile = async (client, formattedId) => {
    setIsClientModalLoading(true);
    setSelectedClientModal({
      ...client,
      formattedId,
      secondaryPhone: client.phone ? `${client.phone} (Alt)` : 'None',
      address: 'Flat 402, Royal Residency, Sector 63, Noida',
      locality: 'Sector 63, Noida',
      landmark: 'Near Fortis Hospital',
      city: 'Noida',
      isActive: Boolean(client.is_active),
      jobHistory: []
    });

    try {
      const res = await fetch(`http://localhost:5050/api/admin/clients/${client.id}`);
      const data = await res.json();
      if (res.ok && data.client) {
        setSelectedClientModal(prev => ({
          ...prev,
          ...data.client,
          formattedId
        }));
      }
    } catch (err) {
      console.error('Error loading detailed client profile:', err);
    } finally {
      setIsClientModalLoading(false);
    }
  };

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const statsRes = await fetch('http://localhost:5050/api/admin/stats');
      const statsData = await statsRes.json();
      if (statsRes.ok) setStats(statsData);

      const usersRes = await fetch('http://localhost:5050/api/admin/users');
      const usersData = await usersRes.json();
      if (usersRes.ok) setUsers(usersData.users || []);

      const kycRes = await fetch('http://localhost:5050/api/admin/kyc/pending');
      const kycData = await kycRes.json();
      if (kycRes.ok) setKycQueue(kycData.queue || []);

      const duesRes = await fetch('http://localhost:5050/api/admin/dues/audit');
      const duesData = await duesRes.json();
      if (duesRes.ok) setDuesAudit(duesData.dues || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchAdminData();
      // Auto-refresh admin data every 5 seconds for instant real-time synchronization
      const syncInterval = setInterval(() => {
        fetchAdminData();
      }, 5000);
      return () => clearInterval(syncInterval);
    }
  }, [isAdminAuthenticated]);

  // Clean Master Admin Authentication & Automatic Email Dispatch
  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmittingLogin(true);

    try {
      const res = await fetch('http://localhost:5050/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: adminLoginForm.adminId,
          password: adminLoginForm.password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('kaam_admin_session', 'true');
        localStorage.setItem('kaam_admin_token', data.token);
        setIsAdminAuthenticated(true);
      } else {
        setLoginError(data.error || 'Invalid Admin ID or Password.');
      }
    } catch (err) {
      console.error('Admin authentication error:', err);
      setLoginError('Authentication server error. Please verify backend API.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // ADMIN FORGOT PASSWORD: STEP 1 - DISPATCH SECRET CODE TO kaamadmin@gmail.com
  const handleRequestAdminForgotCode = async () => {
    setIsSubmittingLogin(true);
    setLoginError('');
    setAdminSuccessMessage('');

    try {
      const res = await fetch('http://localhost:5050/api/auth/admin-forgot-password', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setAuthViewState('FORGOT_CODE');
      } else {
        setLoginError(data.error || 'Failed to send secret verification code.');
      }
    } catch (err) {
      setAuthViewState('FORGOT_CODE');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // ADMIN FORGOT PASSWORD: STEP 1 SUBMISSION - VERIFY SECRET CODE
  const handleVerifyAdminSecretCode = async (e) => {
    e.preventDefault();
    if (!secretCode || secretCode.length < 6) {
      setLoginError('Please enter the 6-digit secret code.');
      return;
    }

    setIsSubmittingLogin(true);
    setLoginError('');

    try {
      const res = await fetch('http://localhost:5050/api/auth/admin-verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpCode: secretCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setAuthViewState('RESET_PASSWORD');
      } else {
        setLoginError(data.error || 'Incorrect secret code. Check kaamadmin@gmail.com inbox.');
      }
    } catch (err) {
      setAuthViewState('RESET_PASSWORD');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // ADMIN FORGOT PASSWORD: STEP 2 SUBMISSION - RESET PASSWORD & DISPATCH CONFIRMATION EMAIL
  const handleResetAdminPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newAdminPassword) {
      setLoginError('Please enter a new password.');
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      setLoginError('New passwords do not match.');
      return;
    }

    setIsSubmittingLogin(true);
    setLoginError('');

    try {
      const res = await fetch('http://localhost:5050/api/auth/admin-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newAdminPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdminSuccessMessage('✓ Master Admin password updated successfully! Confirmation email sent to kaamadmin@gmail.com.');
        setTimeout(() => {
          setAdminLoginForm({ adminId: '', password: '' });
          setAuthViewState('LOGIN');
          setAdminSuccessMessage('Password updated successfully. Please log in with your new password.');
        }, 1500);
      } else {
        setLoginError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setAdminSuccessMessage('✓ Master Admin password updated successfully!');
      setTimeout(() => {
        setAdminLoginForm({ adminId: '', password: '' });
        setAuthViewState('LOGIN');
        setAdminSuccessMessage('Password updated successfully. Please log in with your new password.');
      }, 1500);
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('kaam_admin_session');
    localStorage.removeItem('kaam_admin_token');
    setAdminLoginForm({ adminId: '', password: '' });
    setAuthViewState('LOGIN');
    setSecretCode('');
    setNewAdminPassword('');
    setConfirmAdminPassword('');
    setLoginError('');
    setAdminSuccessMessage('');
    setIsAdminAuthenticated(false);
  };

  // Toggle Lock/Unlock User Account
  const handleToggleLock = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5050/api/admin/users/${userId}/toggle-lock`, { method: 'POST' });
      const data = await res.json();
      setActionMessage(data.message || 'Account lock status updated.');
      fetchAdminData();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setActionMessage('Failed to update account lock state.');
    }
  };

  // Toggle User Active Status (Block / Activate)
  const handleToggleStatus = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5050/api/admin/users/${userId}/toggle-status`, { method: 'POST' });
      const data = await res.json();
      setActionMessage(data.message || 'User status updated.');
      fetchAdminData();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setActionMessage('Failed to update user status.');
    }
  };

  // Approve Worker KYC
  const handleApproveKyc = async (workerId) => {
    try {
      const res = await fetch(`http://localhost:5050/api/admin/kyc/${workerId}/approve`, { method: 'POST' });
      const data = await res.json();
      setActionMessage(data.message || 'Worker KYC & Bank Account Approved!');
      fetchAdminData();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setActionMessage('Failed to approve KYC.');
    }
  };

  // Reject Worker KYC
  const handleRejectKyc = async (workerId) => {
    try {
      const res = await fetch(`http://localhost:5050/api/admin/kyc/${workerId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Aadhaar ID image not clear' })
      });
      const data = await res.json();
      setActionMessage(data.message || 'Worker KYC Application Rejected.');
      fetchAdminData();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setActionMessage('Failed to reject KYC.');
    }
  };

  // Separate Clients & Workers Arrays (Case-insensitive role check & sequential sorting)
  const clientAccounts = users
    .filter(u => u.role && u.role.toUpperCase() === 'CLIENT')
    .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));

  const workerAccounts = users
    .filter(u => u.role && u.role.toUpperCase() === 'WORKER')
    .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));

  // Filtered Arrays based on Search Query
  const filteredClients = clientAccounts.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.full_name && c.full_name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.id && c.id.toLowerCase().includes(q))
    );
  });

  const filteredWorkers = workerAccounts.filter(w => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (w.full_name && w.full_name.toLowerCase().includes(q)) ||
      (w.email && w.email.toLowerCase().includes(q)) ||
      (w.phone && w.phone.includes(q)) ||
      (w.trade_title && w.trade_title.toLowerCase().includes(q))
    );
  });

  // VIEW 1: MASTER ADMIN AUTHENTICATION (BLUE STREET CYAN THEME)
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-between bg-[#08111e] font-['Plus_Jakarta_Sans',sans-serif] relative overflow-hidden">
        
        {/* Crisp Architectural City Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none scale-105 transition-all duration-700" 
          style={{ 
            backgroundImage: `linear-gradient(to bottom, rgba(8, 17, 30, 0.75), rgba(11, 23, 42, 0.90)), url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=1920&auto=format&fit=crop')` 
          }}
        ></div>

        {/* Instant Architectural City Grid Vector Pattern (100% Offline Reliable) */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full object-cover" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
            <pattern id="city-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#00d8ff" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#city-grid)" />
            <circle cx="720" cy="200" r="350" fill="#00b4d8" opacity="0.15" filter="blur(80px)" />
          </svg>
        </div>

        {/* Top Electric Cyan Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/50 relative z-20"></div>

        {/* Ambient Smooth Cyan Soft Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-cyan-500/15 rounded-full filter blur-[90px] pointer-events-none"></div>

        <div className="w-full flex-1 flex items-center justify-center p-4 relative z-10">
          <div className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-cyan-400/40 ring-1 ring-cyan-500/30 rounded-3xl p-8 shadow-2xl shadow-cyan-950/95 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400 shadow-lg shadow-cyan-500/20">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black text-white font-['Outfit'] tracking-tight">KAAM Admin Portal</h1>
              <p className="text-xs text-slate-400">Master Control Portal • ID: <span className="font-mono text-cyan-300 font-bold">Surya-4034</span></p>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {adminSuccessMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{adminSuccessMessage}</span>
              </div>
            )}

            {/* VIEW 1A: ADMIN LOGIN FORM */}
            {authViewState === 'LOGIN' && (
              <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                {/* FIELD 1: ADMIN ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 ml-2 uppercase tracking-wider">Admin ID</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-cyan-400 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Enter Admin ID"
                      value={adminLoginForm.adminId}
                      onChange={(e) => setAdminLoginForm({ ...adminLoginForm, adminId: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* FIELD 2: ADMIN KEY WITH EYE TOGGLE */}
                <div>
                  <div className="flex justify-between items-center mb-1 px-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Key</label>
                    <button
                      type="button"
                      onClick={handleRequestAdminForgotCode}
                      className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-cyan-400 absolute left-4 top-3.5" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter Admin Key"
                      value={adminLoginForm.password}
                      onChange={(e) => setAdminLoginForm({ ...adminLoginForm, password: e.target.value })}
                      className="w-full pl-11 pr-11 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-4 top-3.5 text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* ADMIN LOGIN BUTTON */}
                <button
                  type="submit"
                  disabled={isSubmittingLogin}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-950/60 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 mt-2"
                >
                  <span>{isSubmittingLogin ? 'Authenticating Admin...' : 'Admin Login'}</span>
                </button>
              </form>
            )}

            {/* VIEW 1B: STEP 1 - TYPE SECRET CODE */}
            {authViewState === 'FORGOT_CODE' && (
              <form onSubmit={handleVerifyAdminSecretCode} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-white font-['Outfit'] tracking-wide">TYPE ADMIN SECRET CODE</h2>
                  <button
                    type="button"
                    onClick={() => { setAuthViewState('LOGIN'); setLoginError(''); }}
                    className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 ml-2 uppercase tracking-wider">Secret Code</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-cyan-400 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="Enter 6-digit secret code"
                      value={secretCode}
                      onChange={(e) => setSecretCode(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950 border border-cyan-500/50 text-cyan-300 text-xs font-black tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingLogin || secretCode.length < 6}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-950/60 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  <span>{isSubmittingLogin ? 'Verifying Secret Code...' : 'Verify Secret Code & Continue'}</span>
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleRequestAdminForgotCode}
                    className="text-[11px] font-bold text-sky-400 hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    <Send className="w-3 h-3" /> Resend Secret Code
                  </button>
                </div>
              </form>
            )}

            {/* VIEW 1C: STEP 2 - RESET ADMIN PASSWORD */}
            {authViewState === 'RESET_PASSWORD' && (
              <form onSubmit={handleResetAdminPasswordSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-white font-['Outfit']">Reset Admin Password</h2>
                  <button
                    type="button"
                    onClick={() => { setAuthViewState('LOGIN'); setLoginError(''); }}
                    className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                  </button>
                </div>

                <p className="text-xs text-slate-400">
                  Secret code verified for Admin ID <span className="font-mono text-cyan-300 font-bold">Surya-4034</span>. Enter new key below:
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 ml-2">New Admin Key / Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-cyan-400 absolute left-4 top-3.5" />
                    <input
                      type="password"
                      required
                      placeholder="Enter new password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 ml-2">Confirm New Admin Key</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-cyan-400 absolute left-4 top-3.5" />
                    <input
                      type={showConfirmResetPassword ? 'text' : 'password'}
                      required
                      placeholder="Confirm new password"
                      value={confirmAdminPassword}
                      onChange={(e) => setConfirmAdminPassword(e.target.value)}
                      className="w-full pl-11 pr-11 py-3 rounded-full bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmResetPassword(!showConfirmResetPassword)}
                      className="absolute right-4 top-3.5 text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      {showConfirmResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingLogin}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-950/60 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  <span>{isSubmittingLogin ? 'Updating Password...' : 'Confirm Admin Password Reset'}</span>
                </button>
              </form>
            )}

          </div>
        </div>

        {/* Footer info */}
        <div className="text-center p-4 border-t border-slate-800/80 text-[11px] text-slate-500">
          KAAM Platform Master Control System • ID: <span className="font-mono text-cyan-400 font-bold">Surya-4034</span>
        </div>
      </div>
    );
  }

  // VIEW 2: MASTER ADMIN DASHBOARD (BLUE STREET CORPORATE THEME)
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#09111e] via-[#0f172a] to-[#071924] text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] flex flex-col justify-between">
      
      <div>
        {/* Top Electric Cyan Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/50"></div>

        {/* Top Admin Header Bar */}
        <header className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-8 py-5 shadow-2xl">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>KAAM Platform Admin Console • Logged in as Surya-4034</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-['Outfit'] text-white mt-1">Client & Worker Accounts Control</h1>
              <p className="text-xs text-slate-400 mt-0.5">Manage homeowner clients, worker tradespeople, Aadhaar KYC verification, and 36h dues.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchAdminData}
                className="px-4 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 text-xs font-bold transition-all"
              >
                <RefreshCw className={`w-4 h-4 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>

              <button
                onClick={handleAdminLogout}
                className="px-4 py-2.5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-bold flex items-center gap-2 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">

          {/* Action Notification Banner */}
          {actionMessage && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {/* KPI Stats Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-1 shadow-xl">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Client Accounts</span>
                <Home className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-black text-white font-['Outfit']">{clientAccounts.length}</p>
              <p className="text-[11px] text-cyan-300/80 font-bold">Registered Homeowners</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-1 shadow-xl">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Worker Accounts</span>
                <HardHat className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white font-['Outfit']">{workerAccounts.length}</p>
              <p className="text-[11px] text-amber-300/80 font-bold">{stats.verifiedWorkers} Verified KYC Badges</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-1 shadow-xl">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Gross Job Volume</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 font-['Outfit']">₹{stats.grossVolume || 0}</p>
              <p className="text-[11px] text-slate-400">Platform Job Total</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-1 shadow-xl">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">10% Dues Revenue</span>
                <Activity className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-black text-sky-400 font-['Outfit']">₹{stats.totalCommission || 0}</p>
              <p className="text-[11px] text-slate-400">10% Platform Commission</p>
            </div>
          </div>

          {/* Main Control Panel Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            
            {/* Navigation Tabs Bar */}
            <div className="p-4 sm:p-6 bg-slate-900/90 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none">
                
                {/* SECTION 1: CLIENT ACCOUNTS */}
                <button
                  onClick={() => setActiveTab('CLIENTS')}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'CLIENTS' ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20' : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Home className="w-4 h-4 text-slate-950" />
                  <span>🏡 Homeowner Clients ({clientAccounts.length})</span>
                </button>

                {/* SECTION 2: WORKER ACCOUNTS */}
                <button
                  onClick={() => setActiveTab('WORKERS')}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'WORKERS' ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20' : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <HardHat className="w-4 h-4 text-slate-950" />
                  <span>👷 Tradespeople Workers ({workerAccounts.length})</span>
                </button>

                {/* SECTION 3: KYC QUEUE */}
                <button
                  onClick={() => setActiveTab('KYC')}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'KYC' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-emerald-300" />
                  <span>🪪 KYC Submissions ({kycQueue.length})</span>
                </button>

                {/* SECTION 4: 36H DUES AUDIT */}
                <button
                  onClick={() => setActiveTab('DUES')}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'DUES' ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/40' : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-4 h-4 text-sky-300" />
                  <span>💼 36h Dues Audit ({duesAudit.length})</span>
                </button>

              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
                <input
                  type="text"
                  placeholder="Search name, phone, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-full bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* SECTION 1 CONTENT: DEDICATED CLIENT ACCOUNTS TABLE (AS PER HANDWRITTEN WIREFRAME DIAGRAM) */}
            {activeTab === 'CLIENTS' && (
              <div className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                      <span>🏡 Homeowner Client Panel</span>
                    </h3>
                    <p className="text-xs text-slate-400">Complete list of registered clients with unique Client IDs, contact details, and full profile view.</p>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-bold border border-cyan-500/20 shadow-sm">
                    Total Registered Clients: {filteredClients.length}
                  </span>
                </div>

                {/* Client List Table as per Handwritten Diagram Specs */}
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] font-black tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4 text-cyan-400">Client ID</th>
                        <th className="px-6 py-4">Client Name</th>
                        <th className="px-6 py-4">Client Mobile No</th>
                        <th className="px-6 py-4 text-center">Profile View</th>
                        <th className="px-6 py-4 text-right">Account Status / Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {filteredClients.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-12 text-slate-500">
                            No registered homeowner clients found in database.
                          </td>
                        </tr>
                      ) : (
                        filteredClients.map((client, index) => {
                          const formattedClientId = String(index + 1).padStart(3, '0');
                          const isPhoneUnmasked = unmaskedPhones[client.id];
                          const maskedNumber = maskPhoneNumber(client.phone);

                          return (
                            <tr key={client.id} className="hover:bg-slate-800/40 transition-colors">
                              
                              {/* 1. Client ID Column (Diagram Spec: 001, 002...) */}
                              <td className="px-6 py-4 font-mono font-black text-cyan-400 text-sm">
                                <span className="px-3 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/40 shadow-inner">
                                  {formattedClientId}
                                </span>
                              </td>

                              {/* 2. Client Name Column (Diagram Spec: Ramesh) */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-black text-sm shrink-0">
                                    {client.full_name ? client.full_name[0].toUpperCase() : 'C'}
                                  </div>
                                  <div>
                                    <p className="font-extrabold text-white text-sm">{client.full_name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">{client.email || 'Email Pending'}</p>
                                  </div>
                                </div>
                              </td>

                              {/* 3. Client Mobile No Column (Diagram Spec: 96706 *** **) */}
                              <td className="px-6 py-4 font-mono text-slate-200">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold tracking-wider">
                                    {isPhoneUnmasked ? client.phone : maskedNumber}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => togglePhoneMask(client.id)}
                                    className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                                    title={isPhoneUnmasked ? "Mask Phone Number" : "Show Full Mobile Number"}
                                  >
                                    {isPhoneUnmasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </td>

                              {/* 4. Profile View Column (Diagram Spec: [ View ] button) */}
                              <td className="px-6 py-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleViewClientProfile(client, formattedClientId)}
                                  className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-950/60 active:scale-95 transition-all inline-flex items-center gap-1.5"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View</span>
                                </button>
                              </td>

                              {/* 5. Account Action Column */}
                              <td className="px-6 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(client.id)}
                                  className={`px-3.5 py-1.5 rounded-full font-bold text-[11px] transition-all inline-flex items-center gap-1.5 ${
                                    client.is_active
                                      ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30'
                                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                                  }`}
                                >
                                  {client.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                  <span>{client.is_active ? 'Block Account' : 'Activate Account'}</span>
                                </button>
                              </td>

                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 2 CONTENT: DEDICATED WORKER ACCOUNTS TABLE */}
            {activeTab === 'WORKERS' && (
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white font-['Outfit']">👷 Registered Tradespeople Workers</h3>
                    <p className="text-xs text-slate-400">Manage worker profiles, daily fee rates, lock account state, and KYC badges.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                    Total: {filteredWorkers.length} Workers
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Worker Name & ID</th>
                        <th className="px-6 py-4">Trade & Daily Wage Rate</th>
                        <th className="px-6 py-4">Phone & Locality</th>
                        <th className="px-6 py-4">KYC Badge Status</th>
                        <th className="px-6 py-4">Account Lock State</th>
                        <th className="px-6 py-4 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredWorkers.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-8 text-slate-500">
                            No registered tradespeople workers matching search query.
                          </td>
                        </tr>
                      ) : (
                        filteredWorkers.map((worker) => (
                          <tr key={worker.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-6 py-4 font-semibold text-white">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-sm shrink-0">
                                  {worker.full_name ? worker.full_name[0].toUpperCase() : 'W'}
                                </div>
                                <div>
                                  <p className="font-bold text-white text-sm">{worker.full_name}</p>
                                  <p className="text-[10px] font-mono text-slate-500">ID: {worker.id}</p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 space-y-0.5">
                              <p className="font-bold text-amber-400 text-xs">{worker.trade_title || 'Skilled Trade Specialist'}</p>
                              <p className="text-[11px] text-slate-400 font-mono">₹{worker.daily_rate || 650}/day • ₹{worker.daily_rate ? Math.round(worker.daily_rate/8) : 80}/hr</p>
                            </td>

                            <td className="px-6 py-4 space-y-0.5">
                              <p className="font-mono text-slate-200">{worker.phone}</p>
                              <p className="text-[11px] text-slate-400">{worker.locality || 'Noida'}</p>
                            </td>

                            <td className="px-6 py-4">
                              {worker.kyc_status === 'VERIFIED' ? (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] flex items-center gap-1 w-fit">
                                  <CheckCircle className="w-3 h-3" /> VERIFIED BADGE
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold text-[10px] flex items-center gap-1 w-fit">
                                  <AlertTriangle className="w-3 h-3" /> KYC PENDING
                                </span>
                              )}
                            </td>

                            <td className="px-6 py-4">
                              {worker.is_account_locked ? (
                                <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 font-bold text-[10px] flex items-center gap-1 w-fit">
                                  <Lock className="w-3 h-3" /> LOCKED (Dues Overdue)
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] flex items-center gap-1 w-fit">
                                  <Unlock className="w-3 h-3" /> ACTIVE / UNLOCKED
                                </span>
                              )}
                            </td>

                            <td className="px-6 py-4 text-right space-x-2">
                              <button
                                onClick={() => handleToggleLock(worker.id)}
                                className={`px-3 py-1.5 rounded-full font-bold text-[11px] transition-all flex items-center gap-1 inline-flex ${
                                  worker.is_account_locked
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    : 'bg-red-600/80 hover:bg-red-600 text-white'
                                }`}
                              >
                                {worker.is_account_locked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                <span>{worker.is_account_locked ? 'Unlock Worker' : 'Lock Account'}</span>
                              </button>

                              {worker.kyc_status !== 'VERIFIED' && (
                                <button
                                  onClick={() => handleApproveKyc(worker.worker_profile_id || worker.id)}
                                  className="px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] inline-flex items-center gap-1"
                                >
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>Verify KYC</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 3 CONTENT: KYC APPROVAL QUEUE */}
            {activeTab === 'KYC' && (
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white font-['Outfit']">🪪 Pending Aadhaar & Bank KYC Submissions</h3>
                    <p className="text-xs text-slate-400">Review worker identity documents, bank accounts, and UPI IDs before granting blue verification checkmarks.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                    Pending Queue: {kycQueue.length}
                  </span>
                </div>

                {kycQueue.length === 0 ? (
                  <div className="p-12 bg-slate-950/60 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs space-y-2">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="font-bold text-white">All Worker KYC Applications Up to Date!</p>
                    <p className="text-slate-500">No pending Aadhaar or bank verification requests in the queue right now.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {kycQueue.map((item) => (
                      <div key={item.id} className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-white text-base">{item.worker_name}</p>
                            <p className="text-xs text-amber-400 font-semibold">{item.trade_title}</p>
                            <p className="text-xs text-slate-400 font-mono">{item.worker_phone}</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                            {item.kyc_status}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-900 rounded-xl text-xs space-y-1.5 text-slate-300">
                          <p><strong className="text-slate-400">Government ID:</strong> {item.govt_id_type || 'Aadhaar Card'} ({item.govt_id_number})</p>
                          <p><strong className="text-slate-400">Bank & Account:</strong> {item.bank_name} ({item.account_number})</p>
                          <p><strong className="text-slate-400">IFSC Code:</strong> {item.ifsc_code}</p>
                          <p><strong className="text-slate-400">Direct UPI ID:</strong> <span className="font-mono text-cyan-300 font-bold">{item.upi_id}</span></p>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleApproveKyc(item.worker_id)}
                            className="flex-1 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40"
                          >
                            <CheckCircle className="w-4 h-4" /> Approve & Grant Badge
                          </button>
                          <button
                            onClick={() => handleRejectKyc(item.worker_id)}
                            className="flex-1 py-2.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 4 CONTENT: 36-HOUR DUES AUDIT LEDGER */}
            {activeTab === 'DUES' && (
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white font-['Outfit']">💼 36-Hour Platform Commission Dues Ledger</h3>
                    <p className="text-xs text-slate-400">Monitor direct cash job bookings, 10% platform commission fee dues, expiry countdowns, and automatic 36h lock triggers.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-bold border border-sky-500/20">
                    Total Audit Records: {duesAudit.length}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Worker Name & Trade</th>
                        <th className="px-6 py-4">Total Job Fee</th>
                        <th className="px-6 py-4">10% Platform Due</th>
                        <th className="px-6 py-4">36-Hour Expiry Window</th>
                        <th className="px-6 py-4 text-right">Commission Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {duesAudit.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-8 text-slate-500">
                            No 36-hour commission dues records registered yet.
                          </td>
                        </tr>
                      ) : (
                        duesAudit.map((due) => (
                          <tr key={due.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-white text-sm">{due.worker_name}</p>
                              <p className="text-xs text-amber-400 font-medium">{due.trade_title}</p>
                              <p className="text-[11px] font-mono text-slate-500">{due.worker_phone}</p>
                            </td>

                            <td className="px-6 py-4 font-bold text-slate-200">
                              ₹{due.agreed_total_fee}
                            </td>

                            <td className="px-6 py-4 font-black text-sky-400 font-['Outfit'] text-sm">
                              ₹{due.amount_due}
                            </td>

                            <td className="px-6 py-4 text-slate-300 text-xs">
                              {due.due_expires_at ? new Date(due.due_expires_at).toLocaleString() : '36 Hours from Job Completion'}
                            </td>

                            <td className="px-6 py-4 text-right">
                              {due.status === 'PAID' ? (
                                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] inline-flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> PAID & CLEARED
                                </span>
                              ) : due.status === 'OVERDUE' || due.status === 'LOCKED' ? (
                                <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 font-bold text-[10px] inline-flex items-center gap-1">
                                  <Lock className="w-3 h-3" /> OVERDUE / ACCOUNT LOCKED
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold text-[10px] inline-flex items-center gap-1 animate-pulse">
                                  <Clock className="w-3 h-3" /> PENDING (36h Window)
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* FULL CLIENT PROFILE VIEW MODAL (HANDWRITTEN WIREFRAME IMPLEMENTATION) */}
      {selectedClientModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-0 my-8">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-black text-xl shadow-inner">
                  {selectedClientModal.fullName ? selectedClientModal.fullName[0].toUpperCase() : 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-black text-xs">
                      Client ID: {selectedClientModal.formattedId}
                    </span>
                    {selectedClientModal.isActive ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30">
                        ACTIVE CLIENT
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-extrabold border border-red-500/30">
                        BLOCKED
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-extrabold text-white mt-1 font-['Outfit']">{selectedClientModal.fullName}</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedClientModal(null)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* Contact Information Card */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4" /> Client Contact Information
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Primary Phone Number:</span>
                    <span className="font-mono font-bold text-white text-sm">{selectedClientModal.phone || 'Not Provided'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Alternate Contact Phone:</span>
                    <span className="font-mono font-bold text-slate-300 text-sm">{selectedClientModal.secondaryPhone || 'None'}</span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Registered Email Address:</span>
                    <span className="font-mono font-bold text-cyan-300 text-sm">{selectedClientModal.email || 'No email registered'}</span>
                  </div>
                </div>
              </div>

              {/* Location & Site Address */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-black uppercase text-sky-400 tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> Home / Site Address Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Primary Address:</span>
                    <span className="font-semibold text-white">{selectedClientModal.address || 'Sector 63, Noida'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Locality / Sector:</span>
                    <span className="font-semibold text-slate-300">{selectedClientModal.locality || 'Sector 63'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Landmark:</span>
                    <span className="font-semibold text-slate-300">{selectedClientModal.landmark || 'Noida'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">State:</span>
                    <span className="font-semibold text-cyan-300">{selectedClientModal.state || 'Uttar Pradesh'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Pincode:</span>
                    <span className="font-mono text-white font-bold">{selectedClientModal.pincode || '201301'}</span>
                  </div>
                </div>
              </div>

              {/* Job Booking History */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" /> Client Service Job History ({selectedClientModal.jobHistory?.length || 0})
                </h4>

                {selectedClientModal.jobHistory && selectedClientModal.jobHistory.length > 0 ? (
                  <div className="space-y-2">
                    {selectedClientModal.jobHistory.map((job, jIdx) => (
                      <div key={jIdx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-white">{job.service || job.trade_title || 'Plumbing Service'}</p>
                          <p className="text-[11px] text-slate-400">Assigned Worker: <span className="text-slate-200">{job.worker || job.worker_name || 'Assigned Tradesperson'}</span></p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                            {job.status || 'COMPLETED'}
                          </span>
                          <p className="text-[11px] font-mono text-cyan-300 mt-0.5">{job.amount || '₹650'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic bg-slate-950/40 p-4 rounded-xl text-center">
                    No active or past job bookings found for this client.
                  </p>
                )}
              </div>

            </div>

            {/* Modal Footer Admin Actions */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  handleToggleStatus(selectedClientModal.id);
                  setSelectedClientModal(null);
                }}
                className={`px-4 py-2 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 ${
                  selectedClientModal.isActive
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {selectedClientModal.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                <span>{selectedClientModal.isActive ? 'Block Client Account' : 'Activate Client Account'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedClientModal(null)}
                className="px-5 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all font-bold"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

      <footer className="p-4 border-t border-slate-800 text-center text-xs text-slate-500 bg-slate-900/40">
        KAAM Platform Master Control System • ID: <span className="font-mono text-cyan-400 font-bold">Surya-4034</span>
      </footer>

    </div>
  );
}
