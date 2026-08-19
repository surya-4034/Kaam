import express from 'express';
import {
  register,
  login,
  adminLogin,
  googleSync,
  requestEmailOtp,
  verifyEmailOtpHandler,
  forgotPasswordRequest,
  resetPasswordHandler,
  adminForgotPasswordRequest,
  adminVerifySecretCode,
  adminResetPasswordHandler,
  updateUserProfile,
  updateUserLocation,
  deleteAccount,
  getMe,
} from '../controllers/authController.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminLogin);

// Profile Update, Location Sync & Delete Account Routes
router.put('/update-profile', updateUserProfile);
router.post('/update-location', updateUserLocation);
router.put('/update-location', updateUserLocation);
router.delete('/delete-account', deleteAccount);
router.post('/delete-account', deleteAccount);

// Google OAuth Persistence Route
router.post('/google-sync', googleSync);

// 6-Digit Email Verification Code Routes
router.post('/send-email-otp', requestEmailOtp);
router.post('/verify-email-otp', verifyEmailOtpHandler);

// Forgot Password & Reset Routes (User)
router.post('/forgot-password', forgotPasswordRequest);
router.post('/reset-password', resetPasswordHandler);

// Master Admin Forgot Password & Reset Routes
router.post('/admin-forgot-password', adminForgotPasswordRequest);
router.post('/admin-verify-code', adminVerifySecretCode);
router.post('/admin-reset-password', adminResetPasswordHandler);

router.get('/me', authRequired, getMe);

export default router;
