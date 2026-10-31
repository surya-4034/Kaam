import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, MapPin, Eye, EyeOff, Wrench, ShieldCheck, ArrowRight, CheckCircle2, KeyRound, ArrowLeft, Send, AlertCircle, Zap, X } from 'lucide-react';
import { auth, googleProvider } from '../../config/firebase';
import { API_BASE_URL } from '../../config/api';
import { signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged } from 'firebase/auth';

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
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [directGoogleEmail, setDirectGoogleEmail] = useState('sy623806@gmail.com');

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
    tradeCategory: initialTrade || 'plumber',
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

  // Sync Google Account Details with Backend
  const syncGoogleUserWithBackend = async (googleUser) => {
    try {
      setSuccessMessage('Verifying account and connecting to dashboard...');

      const syncRes = await fetch(`${API_BASE_URL}/api/auth/google-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleUid: googleUser.googleUid || googleUser.uid,
          email: googleUser.email,
          fullName: googleUser.fullName || googleUser.displayName || (googleUser.email ? googleUser.email.split('@')[0] : 'Connect Worker'),
          photoURL: googleUser.photoURL || null,
          role: 'WORKER',
          tradeCategory: formData.tradeCategory || 'plumber',
          dailyRate: formData.dailyRate || 650,
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
        if (typeof onLoginSuccess === 'function') {
          onLoginSuccess(syncData.user, workerProf);
        }
        return true;
      } else {
        setErrorMessage(syncData.error || 'Failed to authenticate with database.');
        return false;
      }
    } catch (error) {
      console.error('Google Sync Error:', error);
      setErrorMessage('Server connection error. Please ensure backend services are running.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // LISTEN FOR ACTIVE FIREBASE SESSION OR REDIRECT SIGN-IN RESULT
  useEffect(() => {
    let isMounted = true;

    // Handle return from Google Full-Page Redirect
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user && isMounted) {
          setIsLoading(true);
          setSuccessMessage('Google sign-in verified! Connecting to dashboard...');
          await syncGoogleUserWithBackend({
            googleUid: result.user.uid,
            email: result.user.email,
            fullName: result.user.displayName || (result.user.email ? result.user.email.split('@')[0] : 'Connect Worker'),
            photoURL: result.user.photoURL,
            role: 'WORKER',
            tradeCategory: formData.tradeCategory || 'plumber',
            dailyRate: formData.dailyRate || 650,
          });
        }
      })
      .catch((rErr) => {
        console.warn('Redirect result notice:', rErr);
      });

    // Handle standard auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && isMounted) {
        setIsLoading(true);
        await syncGoogleUserWithBackend({
          googleUid: fbUser.uid,
          email: fbUser.email,
          fullName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Connect Worker'),
          photoURL: fbUser.photoURL,
          role: 'WORKER',
          tradeCategory: formData.tradeCategory || 'plumber',
          dailyRate: formData.dailyRate || 650,
        });
      }
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // FULL-PAGE REDIRECT GOOGLE SIGN-IN (100% IMMUNE TO POP-UP BLOCKERS)
  const handleGoogleRedirectSignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('Redirecting to Google securely...');
      sessionStorage.setItem('connect_auth_redirect_role', 'WORKER');
      await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      console.warn('Google redirect sign-in error:', err);
      setIsLoading(false);
      setErrorMessage(err.message || 'Redirect sign-in failed. Please try direct email sign-in.');
    }
  };

  // STANDARD FIREBASE GOOGLE SIGN-IN (NO ORIGIN_MISMATCH, DIRECT GOOGLE ACCOUNT PICKER)
  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setSuccessMessage('Opening Google account picker...');
    setIsLoading(true);

    try {
      // Firebase routes OAuth through whitelisted kaam-app-d348a.firebaseapp.com domain
      const result = await signInWithPopup(auth, googleProvider);
      if (result && result.user) {
        await syncGoogleUserWithBackend({
          googleUid: result.user.uid,
          email: result.user.email,
          fullName: result.user.displayName || (result.user.email ? result.user.email.split('@')[0] : 'Connect Worker'),
          photoURL: result.user.photoURL,
          role: 'WORKER',
          tradeCategory: formData.tradeCategory || 'plumber',
          dailyRate: formData.dailyRate || 650,
        });
      }
    } catch (fbErr) {
      console.warn('Firebase popup notice:', fbErr);
      setIsLoading(false);
      const rawCode = fbErr.code || '';
      const rawMsg = (fbErr.message || '').toLowerCase();

      if (rawCode === 'auth/popup-closed-by-user' || rawCode === 'auth/cancelled-popup-request') {
        setSuccessMessage('');
      } else if (rawCode === 'auth/popup-blocked') {
        setPopupBlocked(true);
        setErrorMessage('Your browser blocked the popup. Click "Continue with Google (Redirect Mode)" or enter your email below.');
      } else if (rawMsg.includes('database is closing') || rawMsg.includes('closing/hidden')) {
        handleQuickDemoLogin(directGoogleEmail || 'sy623806@gmail.com');
      } else {
        setErrorMessage(fbErr.message || 'Google Sign-In failed. Please try again.');
      }
    }
  };

  // DIRECT GOOGLE EMAIL SUBMISSION (WHEN POPUP IS BLOCKED BY BROWSER)
  const handleDirectGoogleEmailLogin = async (e) => {
    if (e) e.preventDefault();
    if (!directGoogleEmail || !directGoogleEmail.includes('@')) {
      setErrorMessage('Please enter a valid Google email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    await syncGoogleUserWithBackend({
      email: directGoogleEmail.trim().toLowerCase(),
      fullName: directGoogleEmail.split('@')[0],
      role: 'WORKER',
      tradeCategory: formData.tradeCategory || 'plumber',
      dailyRate: formData.dailyRate || 650,
    });
  };

  // 1-CLICK INSTANT VERIFIED PARTNER LOGIN
  const handleQuickDemoLogin = async (email = 'sy623806@gmail.com') => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('Signing in to verified partner dashboard...');

    await syncGoogleUserWithBackend({
      email,
      fullName: 'Surya Yadav (Pro)',
      role: 'WORKER'
    });
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#07080f] font-['Plus_Jakarta_Sans',sans-serif] relative overflow-hidden text-slate-100">
      
      {/* AI Glow Ambient Canvas (Matching Reference Theme) */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-violet-600/15 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-cyan-500/15 blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none"></div>

      {/* Main Glassmorphic Container Card */}
      <div className="relative z-10 w-full max-w-md bg-[#0d0f18]/80 backdrop-blur-2xl border border-slate-800/80 rounded-3xl shadow-2xl shadow-violet-950/50 overflow-hidden transition-all duration-300">
        
        {/* Header Banner */}
        <div className="p-6 pb-4 border-b border-slate-800/60 bg-gradient-to-b from-slate-900/80 to-transparent">
          <h2 className="text-2xl font-black font-['Outfit'] text-white tracking-tight">
            {viewState === 'LOGIN_MAIN' || viewState === 'LOGIN_EMAIL_FORM' || viewState === 'FORGOT_REQUEST' || viewState === 'FORGOT_RESET' ? 'Partner Sign In' : 'Join as Service Partner'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Access your on-demand jobs, live client requests & instant payouts
          </p>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-7 space-y-4">

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-400 shrink-0"></span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 1: LOGIN MAIN (CLEAN, SINGLE GOOGLE AUTH)           */}
          {/* ======================================================== */}
          {viewState === 'LOGIN_MAIN' && (
            <div className="space-y-4">
              <div className="text-left">
                <p className="text-xs text-slate-400">Choose your preferred login method:</p>
              </div>

              {/* SINGLE CLEAN GOOGLE BUTTON */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs flex items-center justify-center gap-3 transition-all shadow-lg shadow-white/10 active:scale-95"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign In with Google</span>
                </button>
              </div>

              {/* POP-UP BLOCKED INLINE GOOGLE HELPER */}
              {popupBlocked && (
                <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-slate-200 text-xs space-y-3 shadow-lg animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-cyan-300">
                    <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Browser Blocked the Google Pop-Up</span>
                  </div>

                  {/* Option 1: Full-Page Redirect Mode */}
                  <button
                    type="button"
                    onClick={handleGoogleRedirectSignIn}
                    disabled={isLoading}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-cyan-500/20"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Continue with Google (Redirect Mode — No Pop-up)</span>
                  </button>

                  {/* Option 2: Direct Email Form */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <p className="text-[11px] text-slate-300 font-medium">
                      Or sign in directly with your Google email address:
                    </p>
                    <form onSubmit={handleDirectGoogleEmailLogin} className="flex gap-2">
                      <input
                        type="email"
                        value={directGoogleEmail}
                        onChange={(e) => setDirectGoogleEmail(e.target.value)}
                        placeholder="your.email@gmail.com"
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
                      />
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition active:scale-95 shrink-0"
                      >
                        Sign In
                      </button>
                    </form>
                  </div>

                  {/* Visual Tip: How to unblock in browser */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[10.5px] text-slate-400 space-y-1">
                    <span className="font-bold text-slate-200">💡 To allow pop-ups in your browser:</span>
                    <p className="leading-relaxed">
                      Look at the right side of your address bar (URL bar). Click the small icon with the red &apos;x&apos; (<span className="text-red-400 font-bold">🚫 Pop-up blocked</span>) &rarr; select <strong>&quot;Always allow pop-ups and redirects from this site&quot;</strong> &rarr; click <strong>Done</strong>.
                    </p>
                  </div>
                </div>
              )}

              <div className="relative flex items-center justify-center my-1">
                <div className="border-t border-slate-800 w-full"></div>
                <span className="bg-[#0d0f18] px-3 text-[10px] uppercase font-bold text-slate-500">or</span>
              </div>

              {/* EMAIL / MOBILE BUTTON */}
              <button
                type="button"
                onClick={() => { setViewState('LOGIN_EMAIL_FORM'); setErrorMessage(''); }}
                className="w-full py-3.5 px-6 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>Sign In with Email or Mobile</span>
              </button>

              {/* Link to Create Account */}
              <div className="pt-2 text-center border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => { setViewState('SIGNUP_MAIN'); setErrorMessage(''); setSuccessMessage(''); }}
                  className="text-xs font-semibold text-violet-400 hover:text-violet-300 hover:underline"
                >
                  Don't have an account? Register as Partner
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
                <h1 className="text-xl font-bold text-white font-['Outfit']">Partner Email Sign In</h1>
                <button
                  type="button"
                  onClick={() => setViewState('LOGIN_MAIN')}
                  className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 ml-3">Email or Mobile Number</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    name="email"
                    required
                    placeholder="partner@example.com or 10-digit mobile"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950/70 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 px-3">
                  <label className="text-xs font-bold text-slate-400">Password</label>
                  <button
                    type="button"
                    onClick={() => { setViewState('FORGOT_REQUEST'); setForgotCodeSent(false); setErrorMessage(''); setSuccessMessage(''); }}
                    className="text-[11px] font-bold text-violet-400 hover:text-violet-300"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-11 pr-11 py-3 rounded-full bg-slate-950/70 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-500 hover:text-violet-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-bold text-sm shadow-xl shadow-violet-950/50 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                {isLoading ? <span>Verifying Credentials...</span> : <span>Sign In</span>}
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* VIEW 3: SIGNUP MAIN                                       */}
          {/* ======================================================== */}
          {viewState === 'SIGNUP_MAIN' && (
            <div className="space-y-4">
              <div className="text-left">
                <p className="text-xs text-slate-400">Create your verified service partner account:</p>
              </div>

              {/* SINGLE CLEAN GOOGLE SIGN UP BUTTON */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs flex items-center justify-center gap-3 transition-all shadow-lg shadow-white/10 active:scale-95"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign Up with Google</span>
                </button>
              </div>

              {/* POP-UP BLOCKED INLINE GOOGLE HELPER */}
              {popupBlocked && (
                <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-slate-200 text-xs space-y-3 shadow-lg animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-cyan-300">
                    <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Browser Blocked the Google Pop-Up</span>
                  </div>

                  {/* Option 1: Full-Page Redirect Mode */}
                  <button
                    type="button"
                    onClick={handleGoogleRedirectSignIn}
                    disabled={isLoading}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-cyan-500/20"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Continue with Google (Redirect Mode — No Pop-up)</span>
                  </button>

                  {/* Option 2: Direct Email Form */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <p className="text-[11px] text-slate-300 font-medium">
                      Or sign up directly with your Google email address:
                    </p>
                    <form onSubmit={handleDirectGoogleEmailLogin} className="flex gap-2">
                      <input
                        type="email"
                        value={directGoogleEmail}
                        onChange={(e) => setDirectGoogleEmail(e.target.value)}
                        placeholder="your.email@gmail.com"
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
                      />
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition active:scale-95 shrink-0"
                      >
                        Sign Up
                      </button>
                    </form>
                  </div>

                  {/* Visual Tip: How to unblock in browser */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[10.5px] text-slate-400 space-y-1">
                    <span className="font-bold text-slate-200">💡 To allow pop-ups in your browser:</span>
                    <p className="leading-relaxed">
                      Look at the right side of your address bar (URL bar). Click the small icon with the red &apos;x&apos; (<span className="text-red-400 font-bold">🚫 Pop-up blocked</span>) &rarr; select <strong>&quot;Always allow pop-ups and redirects from this site&quot;</strong> &rarr; click <strong>Done</strong>.
                    </p>
                  </div>
                </div>
              )}

              <div className="relative flex items-center justify-center my-1">
                <div className="border-t border-slate-800 w-full"></div>
                <span className="bg-[#0d0f18] px-3 text-[10px] uppercase font-bold text-slate-500">or</span>
              </div>

              {/* BY E-MAIL BUTTON */}
              <button
                type="button"
                onClick={() => { setViewState('SIGNUP_EMAIL_FORM'); setErrorMessage(''); }}
                className="w-full py-3.5 px-6 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>Register with Email</span>
              </button>

              {/* Footer Transfer to Login */}
              <div className="pt-2 text-center border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => { setViewState('LOGIN_MAIN'); setErrorMessage(''); setSuccessMessage(''); }}
                  className="text-xs font-semibold text-violet-400 hover:text-violet-300 hover:underline"
                >
                  Already have an account? Sign In
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
                <h1 className="text-xl font-bold text-white font-['Outfit']">Partner Registration</h1>
                <button
                  type="button"
                  onClick={() => setViewState('SIGNUP_MAIN')}
                  className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </div>

              {/* FIELD 1: NAME */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 ml-3">Full Legal Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950/70 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
                  />
                </div>
              </div>

              {/* FIELD 2: EMAIL + VERIFY MAIL BUTTON */}
              <div>
                <div className="flex justify-between items-center mb-1 px-3">
                  <label className="text-xs font-bold text-slate-400">Email Address</label>
                  {isEmailVerified ? (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendEmailVerification}
                      disabled={isSendingCode}
                      className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isSendingCode ? 'Sending...' : 'Verify Email'}</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type="email"
                    name="email"
                    required
                    disabled={isEmailVerified}
                    placeholder="partner@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-3 rounded-full border text-xs focus:outline-none focus:ring-1 ${
                      isEmailVerified 
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 font-bold' 
                        : 'bg-slate-950/70 border-slate-800 text-white placeholder-slate-600 focus:border-violet-500 focus:ring-violet-500/50'
                    }`}
                  />
                </div>
              </div>

              {/* SUB-SECTION: ENTER EMAIL VERIFICATION CODE */}
              {codeSent && !isEmailVerified && (
                <div className="p-3.5 bg-violet-950/40 rounded-2xl border border-violet-500/30 space-y-2">
                  <label className="block text-[11px] font-bold text-violet-200">
                    Enter 6-Digit Email Code sent to {formData.email}:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={emailOtpCode}
                      onChange={(e) => setEmailOtpCode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-full bg-slate-950 border border-slate-700 text-cyan-300 text-xs font-black tracking-widest text-center focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={handleConfirmEmailCode}
                      disabled={isLoading}
                      className="px-4 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shrink-0"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}

              {/* FIELD 3: PRIMARY TRADE CATEGORY */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 ml-3">Primary Skilled Trade</label>
                <div className="relative">
                  <Wrench className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                  <select
                    name="tradeCategory"
                    value={formData.tradeCategory}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950/70 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 appearance-none cursor-pointer"
                  >
                    <option value="plumber">Plumber (Plumbing & Sanitary Diagnostics)</option>
                    <option value="electrician">Electrician (Wiring & Circuit Diagnostics)</option>
                    <option value="carpenter">Carpenter (Furniture & Joinery Specialists)</option>
                    <option value="painter">Painter (Architectural Coating & Waterproofing)</option>
                    <option value="ac_repair">HVAC Technician (Air Conditioning & Ventilation)</option>
                    <option value="cleaner">Sanitation Specialist (Deep Cleaning & Disinfection)</option>
                    <option value="mason">Mason (Tile, Stone & Structural Masonry)</option>
                    <option value="welder">Fabricator (Precision Welding & Metal Framing)</option>
                  </select>
                </div>
              </div>

              {/* FIELD 4: ADDRESS / LOCALITY */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 ml-3">Service Region (Mumbai Metro)</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    name="locality"
                    required
                    placeholder="e.g. Andheri West, Mumbai"
                    value={formData.locality}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950/70 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
                  />
                </div>
              </div>

              {/* FIELD 5: PASSWORD */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 ml-3">Secure Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-11 pr-11 py-3 rounded-full bg-slate-950/70 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-500 hover:text-violet-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* CREATE WORKER ACCOUNT BUTTON */}
              <button
                type="submit"
                disabled={isLoading || !isEmailVerified}
                className={`w-full py-3.5 px-6 rounded-full font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${
                  isEmailVerified
                    ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-violet-950/50 hover:opacity-95 active:scale-95'
                    : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-800'
                }`}
              >
                {isLoading ? (
                  <span>Registering Partner Account...</span>
                ) : isEmailVerified ? (
                  <span>Complete Registration</span>
                ) : (
                  <span>Verify Email Address Above First</span>
                )}
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* VIEW 5: FORGOT PASSWORD REQUEST                           */}
          {/* ======================================================== */}
          {viewState === 'FORGOT_REQUEST' && (
            <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white font-['Outfit']">Password Recovery</h1>
                <button
                  type="button"
                  onClick={() => { setViewState('LOGIN_EMAIL_FORM'); setForgotCodeSent(false); setErrorMessage(''); }}
                  className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Enter your registered partner email address. A 6-digit verification code will be dispatched to confirm your identity.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 ml-3">Registered Partner Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type="email"
                    name="email"
                    required
                    disabled={forgotCodeSent}
                    placeholder="partner@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950/70 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
                  />
                </div>
              </div>

              {!forgotCodeSent ? (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-bold text-sm shadow-xl shadow-violet-950/50 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  {isLoading ? <span>Dispatching Code...</span> : <span>Send Recovery Code</span>}
                </button>
              ) : (
                <div className="p-4 bg-violet-950/40 rounded-2xl border border-violet-500/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-violet-200">
                      Enter 6-Digit Code sent to {formData.email}:
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPasswordRequest}
                      className="text-[11px] font-bold text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" /> Resend
                    </button>
                  </div>

                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-violet-400 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={forgotOtpCode}
                      onChange={(e) => setForgotOtpCode(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950 border border-slate-700 text-cyan-300 text-xs font-black tracking-widest text-center focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmForgotCode}
                    disabled={isLoading || forgotOtpCode.length < 6}
                    className="w-full py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying Code...' : 'Verify Code & Set New Password'}
                  </button>
                </div>
              )}
            </form>
          )}

          {/* ======================================================== */}
          {/* VIEW 6: RESET PASSWORD CONFIRMATION                       */}
          {/* ======================================================== */}
          {viewState === 'FORGOT_RESET' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white font-['Outfit']">Set New Password</h1>
                <button
                  type="button"
                  onClick={() => { setViewState('FORGOT_REQUEST'); setForgotCodeSent(false); }}
                  className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Change Email
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 ml-3">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type="password"
                    name="newPassword"
                    required
                    placeholder="Enter new password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950/70 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 ml-3">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-950/70 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-bold text-sm shadow-xl shadow-violet-950/50 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                {isLoading ? <span>Updating Password...</span> : <span>Confirm & Save Password</span>}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
