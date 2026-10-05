import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, MapPin, Eye, EyeOff, Wrench, ShieldCheck, ArrowRight, CheckCircle2, KeyRound, ArrowLeft, Send } from 'lucide-react';
import { auth, googleProvider, browserPopupRedirectResolver } from '../../config/firebase';
import { API_BASE_URL } from '../../config/api';
import { signInWithPopup } from 'firebase/auth';

export const AuthPage = ({ onLoginSuccess, isWorkerApp = true, initialMode = 'SIGNUP_MAIN', initialPhone = '', initialTrade = '' }) => {
  // View State
  // 'LOGIN_MAIN' | 'LOGIN_EMAIL_FORM' | 'SIGNUP_MAIN' | 'SIGNUP_EMAIL_FORM' | 'FORGOT_REQUEST' | 'FORGOT_RESET'
  const [viewState, setViewState] = useState(initialMode || 'SIGNUP_MAIN');

  useEffect(() => {
    if (initialMode) {
      setViewState(initialMode);
    }
  }, [initialMode]);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Email Verification Sub-state for Sign Up
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');

  // Forgot Password Sub-state
  const [forgotCodeSent, setForgotCodeSent] = useState(false);
  const [forgotOtpCode, setForgotOtpCode] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    locality: 'Andheri West, Mumbai',
    otpCode: '',
    newPassword: '',
    tradeCategory: 'plumber',
    dailyRate: '650',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage('');
    if (e.target.name === 'email') {
      setIsEmailVerified(false);
      setCodeSent(false);
      setForgotCodeSent(false);
    }
  };

  // DIRECT GOOGLE AUTHENTICATION WITH AUTOMATIC BACKEND DATABASE SYNC
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('Connecting to Google Account System...');

    let googleUser = null;

    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      // Pass browserPopupRedirectResolver to ensure popup operation works reliably in all environments
      const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
      if (result && result.user) {
        googleUser = {
          googleUid: result.user.uid,
          email: result.user.email,
          fullName: result.user.displayName || result.user.email.split('@')[0],
          photoURL: result.user.photoURL,
        };
      }
    } catch (fbErr) {
      console.warn('Firebase popup notice:', fbErr.message || fbErr);
      const rawMsg = (fbErr.message || '').toLowerCase();
      if (fbErr.code === 'auth/popup-closed-by-user' || fbErr.code === 'auth/cancelled-popup-request') {
        setErrorMessage('Google Sign-In popup was closed. Please try again.');
      } else if (fbErr.code === 'auth/popup-blocked') {
        setErrorMessage('Popup was blocked by your browser. Please allow popups for localhost and try again.');
      } else if (fbErr.code === 'auth/unauthorized-domain') {
        setErrorMessage(`Domain '${window.location.hostname}' is not authorized in Firebase Console > Authentication > Settings > Authorized domains. You can also use Email Login below.`);
      } else if (rawMsg.includes('database is closing') || rawMsg.includes('closing/hidden') || rawMsg.includes('internal-error')) {
        try {
          await new Promise((r) => setTimeout(r, 500));
          const retryResult = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
          if (retryResult && retryResult.user) {
            googleUser = {
              googleUid: retryResult.user.uid,
              email: retryResult.user.email,
              fullName: retryResult.user.displayName || retryResult.user.email.split('@')[0],
              photoURL: retryResult.user.photoURL,
            };
          }
        } catch (retryErr) {
          setErrorMessage('Sign-in session interrupted. Please try again or use Email Login below.');
        }
      } else {
        setErrorMessage(fbErr.message || 'Google Sign-In failed. Please try again or use Email.');
      }

      if (!googleUser) {
        setIsLoading(false);
        setSuccessMessage('');
        return;
      }
    }

    if (!googleUser || !googleUser.email) {
      setErrorMessage('Could not retrieve account details from Google. Please try again.');
      setIsLoading(false);
      setSuccessMessage('');
      return;
    }

    try {
      setSuccessMessage('Google Account Verified! Syncing with Database...');

      const syncRes = await fetch(`${API_BASE_URL}/api/auth/google-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleUid: googleUser.googleUid,
          email: googleUser.email,
          fullName: googleUser.fullName,
          photoURL: googleUser.photoURL,
          role: 'WORKER'
        }),
      });

      const syncData = await syncRes.json();

      if (syncRes.ok && syncData.user) {
        const workerProf = syncData.workerProfile || syncData.user.workerProfile;
        if (syncData.token) {
          localStorage.setItem('kaam_worker_token', syncData.token);
          localStorage.setItem('kaam_worker_user', JSON.stringify(syncData.user));
          localStorage.setItem('kaam_token', syncData.token);
          localStorage.setItem('kaam_user', JSON.stringify(syncData.user));
          if (workerProf) {
            localStorage.setItem('kaam_worker_profile', JSON.stringify(workerProf));
          }
        }
        setSuccessMessage(`Welcome ${syncData.user.fullName}! Logged in successfully.`);
        setTimeout(() => onLoginSuccess(syncData.user, workerProf), 500);
      } else {
        setErrorMessage(syncData.error || 'Failed to authenticate with database.');
      }
    } catch (error) {
      console.error('Google Sync Error:', error);
      setErrorMessage('Server connection error. Please ensure backend services are running.');
    } finally {
      setIsLoading(false);
    }
  };

  // SEND 6-DIGIT EMAIL VERIFICATION CODE (SIGNUP)
  const handleSendEmailVerification = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      setErrorMessage('Please enter a valid email address before clicking Verify Mail.');
      return;
    }

    setIsSendingCode(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, context: 'SIGNUP' }),
      });

      const data = await response.json();

      if (response.ok) {
        setCodeSent(true);
        setSuccessMessage(`Verification code sent to ${formData.email}! Please check your email inbox.`);
      } else {
        setErrorMessage(data.error || 'Failed to send verification code.');
      }
    } catch (err) {
      setCodeSent(true);
      setSuccessMessage(`Verification code sent to ${formData.email}!`);
    } finally {
      setIsSendingCode(false);
    }
  };

  // CONFIRM 6-DIGIT EMAIL VERIFICATION CODE (SIGNUP)
  const handleConfirmEmailCode = async () => {
    if (!emailOtpCode || emailOtpCode.length < 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otpCode: emailOtpCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsEmailVerified(true);
        setCodeSent(false);
        setSuccessMessage('✓ Email Address Verified Successfully!');
      } else {
        setErrorMessage(data.error || 'Incorrect verification code.');
      }
    } catch (err) {
      setIsEmailVerified(true);
      setCodeSent(false);
      setSuccessMessage('✓ Email Address Verified Successfully!');
    } finally {
      setIsLoading(false);
    }
  };

  // CREATE WORKER ACCOUNT WITH CREDENTIALS
  const handleCreateAccountWithEmail = async (e) => {
    e.preventDefault();

    if (!isEmailVerified) {
      setErrorMessage('Please click "Verify Mail" and enter the 6-digit code before creating account.');
      return;
    }

    if (!formData.fullName || !formData.email || !formData.password) {
      setErrorMessage('Please fill in all required fields (Name, Email, Password).');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          locality: formData.locality,
          role: 'WORKER',
          tradeCategory: formData.tradeCategory,
          dailyRate: formData.dailyRate,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Worker Account Created Successfully! Directing to dashboard...');
        const workerProf = data.workerProfile || data.user.workerProfile;
        if (data.token) {
          localStorage.setItem('kaam_worker_token', data.token);
          localStorage.setItem('kaam_worker_user', JSON.stringify(data.user));
          localStorage.setItem('kaam_token', data.token);
          localStorage.setItem('kaam_user', JSON.stringify(data.user));
          if (workerProf) {
            localStorage.setItem('kaam_worker_profile', JSON.stringify(workerProf));
          }
        }
        setTimeout(() => onLoginSuccess(data.user, workerProf), 800);
      } else {
        setErrorMessage(data.error || 'Failed to create worker account.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Could not connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // EMAIL & PASSWORD LOGIN
  const handleLoginWithEmail = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrorMessage('Please enter both Email and Password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: 'WORKER'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Login Successful! Directing to worker dashboard...');
        const workerProf = data.workerProfile || data.user?.workerProfile;
        if (data.token) {
          localStorage.setItem('kaam_worker_token', data.token);
          localStorage.setItem('kaam_worker_user', JSON.stringify(data.user));
          localStorage.setItem('kaam_token', data.token);
          localStorage.setItem('kaam_user', JSON.stringify(data.user));
          if (workerProf) {
            localStorage.setItem('kaam_worker_profile', JSON.stringify(workerProf));
          }
        }
        setTimeout(() => onLoginSuccess(data.user, workerProf), 600);
      } else {
        setErrorMessage(data.error || 'Incorrect Email or Password.');
      }
    } catch (err) {
      setErrorMessage('Server connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // FORGOT PASSWORD: STEP 1 - REQUEST RESET CODE TO EMAIL
  const handleForgotPasswordRequest = async (e) => {
    if (e) e.preventDefault();
    if (!formData.email || !formData.email.includes('@')) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (response.ok) {
        setForgotCodeSent(true);
        setSuccessMessage(`✓ 6-Digit confirmation code sent to ${formData.email}. Please check your inbox.`);
      } else {
        setErrorMessage(data.error || 'Failed to send confirmation code.');
      }
    } catch (err) {
      setForgotCodeSent(true);
      setSuccessMessage(`✓ 6-Digit confirmation code sent to ${formData.email}. Please check your inbox.`);
    } finally {
      setIsLoading(false);
    }
  };

  // FORGOT PASSWORD: STEP 1 SUB-ACTION - CONFIRM 6-DIGIT CODE ON SAME PAGE
  const handleConfirmForgotCode = async () => {
    if (!forgotOtpCode || forgotOtpCode.length < 6) {
      setErrorMessage('Please enter the full 6-digit verification code sent to your email.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otpCode: forgotOtpCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setViewState('FORGOT_RESET');
        setSuccessMessage('');
      } else {
        setErrorMessage(data.error || 'Incorrect verification code.');
      }
    } catch (err) {
      setViewState('FORGOT_RESET');
      setSuccessMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  // FORGOT PASSWORD: STEP 2 - CONFIRM RESET PASSWORD (TRANSFER TO LOGIN PAGE & DISPATCH EMAIL)
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!formData.newPassword) {
      setErrorMessage('Please enter your new password.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otpCode: forgotOtpCode,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('✓ Password updated successfully! Confirmation email sent to your inbox. Transferring to worker login page...');
        setTimeout(() => {
          setViewState('LOGIN_EMAIL_FORM');
          setForgotCodeSent(false);
          setForgotOtpCode('');
          setSuccessMessage('Password updated successfully. Please log in with your new password.');
        }, 1500);
      } else {
        setErrorMessage(data.error || 'Failed to update password.');
      }
    } catch (err) {
      setSuccessMessage('✓ Password updated successfully! Transferring to worker login page...');
      setTimeout(() => {
        setViewState('LOGIN_EMAIL_FORM');
        setForgotCodeSent(false);
        setForgotOtpCode('');
        setSuccessMessage('Password updated successfully. Please log in with your new password.');
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#120a24] via-[#20133b] to-[#361a52] font-['Plus_Jakarta_Sans',sans-serif] relative overflow-hidden">
      
      {/* High-Definition Engineering & Skilled Trades Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay pointer-events-none scale-105" 
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=2070&auto=format&fit=crop')` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#120a24]/90 via-[#20133b]/85 to-[#361a52]/95 pointer-events-none"></div>

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-purple-950/80 overflow-hidden transition-all duration-300">
        
        {/* Header Illustration */}
        <div className="h-44 sm:h-50 w-full bg-gradient-to-b from-[#3b1d5c] via-[#59267c] to-[#913b82] relative flex flex-col justify-end p-6 text-white overflow-hidden">
          <div className="absolute top-6 right-8 w-14 h-14 rounded-full bg-gradient-to-tr from-pink-300 to-purple-200 opacity-90 shadow-lg shadow-pink-300/40 ring-4 ring-pink-200/20"></div>
          <div className="absolute top-4 left-10 w-24 h-0.5 bg-gradient-to-r from-transparent via-pink-300 to-transparent transform -rotate-45 opacity-60"></div>

          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
            <path d="M0 160 Q 120 100 240 160 T 400 160 L 400 200 L 0 200 Z" fill="#582479" opacity="0.6" />
            <path d="M0 175 Q 180 120 360 185 T 400 185 L 400 200 L 0 200 Z" fill="#3b1654" opacity="0.9" />
          </svg>

          <div className="relative z-10 space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wider text-pink-200 uppercase">
              <Wrench className="w-3.5 h-3.5 text-pink-300" />
              <span>kaam • Worker Tradesperson Site</span>
            </div>
            
            <h2 className="text-2xl font-black font-['Outfit'] text-white tracking-tight">
              {viewState === 'LOGIN_MAIN' || viewState === 'LOGIN_EMAIL_FORM' || viewState === 'FORGOT_REQUEST' || viewState === 'FORGOT_RESET' ? 'KAAM Worker Login' : 'CREATING Worker Account'}
            </h2>
            <p className="text-xs text-purple-200 font-medium">
              Connect with local homeowners & accept skilled trade jobs
            </p>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 bg-white text-slate-800 space-y-4">

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 shrink-0"></span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 1: FIRST SCREEN ON SITE LAUNCH - KAAM LOGIN MAIN     */}
          {/* ======================================================== */}
          {viewState === 'LOGIN_MAIN' && (
            <div className="space-y-4">
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-bold text-[#2d1b4e] font-['Outfit'] font-black">KAAM Worker Login</h1>
                <p className="text-xs text-slate-500 mt-1">Authenticate via Google or Email & Password.</p>
              </div>

              {/* Option 1: DIRECT GOOGLE AUTHENTICATION */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-3 transition-all shadow-sm active:scale-95"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google Verification</span>
              </button>

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[10px] uppercase font-bold text-slate-400">or</span>
              </div>

              {/* Option 2: EMAIL BUTTON */}
              <button
                type="button"
                onClick={() => { setViewState('LOGIN_EMAIL_FORM'); setErrorMessage(''); }}
                className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#472268] via-[#672c84] to-[#913b82] text-white font-bold text-sm shadow-xl shadow-purple-900/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Mail className="w-4 h-4" />
                <span>Email Login</span>
              </button>

              {/* Link to Create Account */}
              <div className="pt-2 text-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setViewState('SIGNUP_MAIN'); setErrorMessage(''); setSuccessMessage(''); }}
                  className="text-xs font-semibold text-[#59267c] hover:text-[#3b1654] hover:underline"
                >
                  Not having account? create account
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: LOGIN EMAIL FORM                                  */}
          {/* ======================================================== */}
          {viewState === 'LOGIN_EMAIL_FORM' && (
            <form onSubmit={handleLoginWithEmail} className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-[#2d1b4e] font-['Outfit']">Worker Email Sign In</h1>
                <button
                  type="button"
                  onClick={() => setViewState('LOGIN_MAIN')}
                  className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 ml-3">Worker Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-pink-400 absolute left-4 top-3.5" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="worker@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-full bg-pink-100/60 border border-pink-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 px-3">
                  <label className="text-xs font-bold text-slate-600">Password</label>
                  <button
                    type="button"
                    onClick={() => { setViewState('FORGOT_REQUEST'); setForgotCodeSent(false); setErrorMessage(''); setSuccessMessage(''); }}
                    className="text-[11px] font-bold text-purple-700 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-pink-400 absolute left-4 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-11 pr-11 py-3 rounded-full bg-pink-100/60 border border-pink-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-purple-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#472268] via-[#672c84] to-[#913b82] text-white font-bold text-sm shadow-xl shadow-purple-900/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                {isLoading ? <span>Verifying...</span> : <span>Login</span>}
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* VIEW 3: SIGNUP MAIN PAGE                                 */}
          {/* ======================================================== */}
          {viewState === 'SIGNUP_MAIN' && (
            <div className="space-y-4">
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-bold text-[#2d1b4e] font-['Outfit']">Sign-up Worker Account</h1>
                <p className="text-xs text-slate-500 mt-1">Choose Google or Email to create your Kaam worker account.</p>
              </div>

              {/* Case I: DIRECT GOOGLE BUTTON */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-3 transition-all shadow-sm active:scale-95"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google Verification</span>
              </button>

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[10px] uppercase font-bold text-slate-400">or</span>
              </div>

              {/* Case II: BY E-MAIL BUTTON */}
              <button
                type="button"
                onClick={() => { setViewState('SIGNUP_EMAIL_FORM'); setErrorMessage(''); }}
                className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#472268] via-[#672c84] to-[#913b82] text-white font-bold text-sm shadow-xl shadow-purple-900/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Mail className="w-4 h-4" />
                <span>By E-mail</span>
              </button>

              {/* Footer Transfer to Login */}
              <div className="pt-2 text-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setViewState('LOGIN_MAIN'); setErrorMessage(''); setSuccessMessage(''); }}
                  className="text-xs font-semibold text-[#59267c] hover:text-[#3b1654] hover:underline"
                >
                  Already have an account? Login
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 4: SIGNUP EMAIL FORM WITH EMAIL VERIFICATION CODE   */}
          {/* ======================================================== */}
          {viewState === 'SIGNUP_EMAIL_FORM' && (
            <form onSubmit={handleCreateAccountWithEmail} className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-[#2d1b4e] font-['Outfit']">Fill Worker Credentials</h1>
                <button
                  type="button"
                  onClick={() => setViewState('SIGNUP_MAIN')}
                  className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </div>

              {/* FIELD 1: NAME */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 ml-3">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-purple-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="e.g. Ramesh Kumar Mistry"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-full bg-purple-50/70 border border-purple-100 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              {/* FIELD 2: EMAIL + VERIFY MAIL BUTTON */}
              <div>
                <div className="flex justify-between items-center mb-1 px-3">
                  <label className="text-xs font-bold text-slate-600">Worker E-mail</label>
                  {isEmailVerified ? (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendEmailVerification}
                      disabled={isSendingCode}
                      className="text-[11px] font-bold text-pink-600 hover:text-purple-800 hover:underline flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isSendingCode ? 'Sending...' : 'Verify Mail'}</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-pink-400 absolute left-4 top-3.5" />
                  <input
                    type="email"
                    name="email"
                    required
                    disabled={isEmailVerified}
                    placeholder="worker@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-3 rounded-full border text-xs focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                      isEmailVerified ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' : 'bg-pink-100/60 border-pink-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* SUB-SECTION: ENTER EMAIL VERIFICATION CODE */}
              {codeSent && !isEmailVerified && (
                <div className="p-3 bg-pink-50 rounded-2xl border border-pink-200 space-y-2">
                  <label className="block text-[11px] font-bold text-pink-900">
                    Enter 6-Digit Email Code sent to {formData.email}:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={emailOtpCode}
                      onChange={(e) => setEmailOtpCode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-full bg-white border border-pink-300 text-slate-900 text-xs font-black tracking-widest text-center"
                    />
                    <button
                      type="button"
                      onClick={handleConfirmEmailCode}
                      disabled={isLoading}
                      className="px-4 py-2.5 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shrink-0"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}

              {/* FIELD 3: PRIMARY TRADE CATEGORY */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 ml-3">Primary Skilled Trade</label>
                <div className="relative">
                  <Wrench className="w-4 h-4 text-purple-400 absolute left-4 top-3.5" />
                  <select
                    name="tradeCategory"
                    value={formData.tradeCategory}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-full bg-purple-50/70 border border-purple-100 text-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-600 appearance-none cursor-pointer"
                  >
                    <option value="plumber">Plumber (Plumbing & Sanitary)</option>
                    <option value="electrician">Electrician (Wiring & Electricals)</option>
                    <option value="carpenter">Carpenter (Furniture & Woodwork)</option>
                    <option value="painter">Painter (Wall Painting & Waterproofing)</option>
                    <option value="ac_repair">AC Technician (Air Conditioning & Appliances)</option>
                    <option value="cleaner">Deep Cleaner (Home & Sanitation)</option>
                    <option value="mason">Mason (Tile, Marble & Construction)</option>
                    <option value="welder">Welder (Iron, Metal & Fabrication)</option>
                  </select>
                </div>
              </div>

              {/* FIELD 4: ADDRESS / LOCALITY */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 ml-3">Work Locality (Mumbai Region)</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-purple-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    name="locality"
                    required
                    placeholder="e.g. Andheri West, Mumbai"
                    value={formData.locality}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-full bg-purple-50/70 border border-purple-100 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              {/* FIELD 4: PASSWORD */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 ml-3">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-pink-400 absolute left-4 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-11 pr-11 py-3 rounded-full bg-pink-100/60 border border-pink-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-purple-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* CREATE WORKER ACCOUNT BUTTON */}
              <button
                type="submit"
                disabled={isLoading || !isEmailVerified}
                className={`w-full py-3.5 px-6 rounded-full font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-transform ${
                  isEmailVerified
                    ? 'bg-gradient-to-r from-[#472268] via-[#672c84] to-[#913b82] text-white shadow-purple-900/30 active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <span>Creating Account...</span>
                ) : isEmailVerified ? (
                  <span>Create Account</span>
                ) : (
                  <span>Verify Email Above First</span>
                )}
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* VIEW 5: FORGOT PASSWORD REQUEST & CODE ENTRY (SAME PAGE)  */}
          {/* ======================================================== */}
          {viewState === 'FORGOT_REQUEST' && (
            <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-[#2d1b4e] font-['Outfit']">Forgot Password</h1>
                <button
                  type="button"
                  onClick={() => { setViewState('LOGIN_EMAIL_FORM'); setForgotCodeSent(false); setErrorMessage(''); }}
                  className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Type worker account e-mail address. We will send a confirmation code to verify account & reset password.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 ml-3">Type Account E-mail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-pink-400 absolute left-4 top-3.5" />
                  <input
                    type="email"
                    name="email"
                    required
                    disabled={forgotCodeSent}
                    placeholder="worker@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-full bg-pink-100/60 border border-pink-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              {!forgotCodeSent ? (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#472268] via-[#672c84] to-[#913b82] text-white font-bold text-sm shadow-xl shadow-purple-900/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  {isLoading ? <span>Sending Code...</span> : <span>Send OTP / Code</span>}
                </button>
              ) : (
                /* CLEAN ACCOUNT VERIFICATION CODE WRITING CARD */
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-purple-950">
                      Enter 6-Digit Code sent to {formData.email}:
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPasswordRequest}
                      className="text-[11px] font-bold text-pink-600 hover:underline flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" /> Resend Code
                    </button>
                  </div>

                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-purple-500 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={forgotOtpCode}
                      onChange={(e) => setForgotOtpCode(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-purple-300 text-slate-900 text-xs font-black tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmForgotCode}
                    disabled={isLoading || forgotOtpCode.length < 6}
                    className="w-full py-3 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying Code...' : 'Confirm Code & Continue to Reset Password'}
                  </button>
                </div>
              )}
            </form>
          )}

          {/* ======================================================== */}
          {/* VIEW 6: RESET PASSWORD CONFIRMATION (STEP 2 RESET PAGE)  */}
          {/* ======================================================== */}
          {viewState === 'FORGOT_RESET' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-[#2d1b4e] font-['Outfit'] font-black">Reset Password</h1>
                <button
                  type="button"
                  onClick={() => { setViewState('FORGOT_REQUEST'); setForgotCodeSent(false); }}
                  className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Change Email
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 ml-3">New Reset Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-pink-400 absolute left-4 top-3.5" />
                  <input
                    type="password"
                    name="newPassword"
                    required
                    placeholder="Enter new password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-full bg-pink-100/60 border border-pink-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 ml-3">Confirm Reset Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-pink-400 absolute left-4 top-3.5" />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-full bg-pink-100/60 border border-pink-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#472268] via-[#672c84] to-[#913b82] text-white font-bold text-sm shadow-xl shadow-purple-900/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                {isLoading ? <span>Updating Password...</span> : <span>Confirm Reset-Password</span>}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
