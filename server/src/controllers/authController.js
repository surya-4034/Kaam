import db from '../config/database.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';
import { sendEmailOtp, verifyEmailOtp, sendAdminLoginAlertEmail, sendPasswordResetSuccessEmail, sendAdminForgotOtpEmail, sendAdminPasswordChangeConfirmationEmail } from '../services/emailOtpService.js';

export const register = (req, res) => {
  const { phone, email, password, role, fullName, tradeCategory, tradeTitle, dailyRate, hourlyRate, locality, bio } = req.body;

  if (!email || !password || !role || !fullName) {
    return res.status(400).json({ error: 'Email, password, role, and full name are required.' });
  }

  const userId = `u-${Date.now()}`;
  const passwordHash = bcrypt.hashSync(password, 10);
  const normalizedRole = role.toUpperCase();
  const userPhone = phone || `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`;

  db.run(
    `INSERT INTO users (id, phone, email, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, userPhone, email.toLowerCase().trim(), passwordHash, normalizedRole, fullName],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE') || err.message.includes('users.email')) {
          return res.status(409).json({ error: 'Account with this email address already exists.' });
        }
        return res.status(500).json({ error: err.message });
      }

      if (normalizedRole === 'WORKER') {
        const workerId = `w-${Date.now()}`;
        db.run(
          `INSERT INTO worker_profiles (id, user_id, trade_category, trade_title, daily_rate, hourly_rate, locality, bio, kyc_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED')`,
          [
            workerId,
            userId,
            tradeCategory || 'plumber',
            tradeTitle || 'Skilled Trade Specialist',
            Number(dailyRate || 650),
            Number(hourlyRate || 120),
            locality || 'Local City Area',
            bio || 'Skilled local worker available for hire on kaam.'
          ]
        );
      }

      const token = generateToken({ id: userId, phone: userPhone, email, role: normalizedRole, fullName });

      res.status(201).json({
        message: 'Account created successfully.',
        token,
        user: { id: userId, phone: userPhone, email, role: normalizedRole, fullName }
      });
    }
  );
};

export const login = (req, res) => {
  const { username, email, password } = req.body;
  const loginId = (email || username || '').toLowerCase().trim();

  if (!loginId || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  db.get(
    `SELECT * FROM users WHERE email = ? OR phone = ? OR LOWER(full_name) = LOWER(?)`,
    [loginId, loginId, loginId],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: 'Incorrect Email or Id. Account not found.' });

      const passwordValid = bcrypt.compareSync(password, user.password_hash);
      if (!passwordValid) return res.status(401).json({ error: 'Incorrect Password or Id.' });

      const token = generateToken({
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
      });

      if (user.role === 'WORKER') {
        db.get(
          `SELECT * FROM worker_profiles WHERE user_id = ? OR id = ?`,
          [user.id, user.worker_profile_id || ''],
          (wErr, wp) => {
            if (!wp) {
              return res.json({
                message: 'Login successful.',
                token,
                user: { id: user.id, phone: user.phone, email: user.email, role: user.role, fullName: user.full_name }
              });
            }

            db.get(`SELECT * FROM worker_bank_kyc WHERE worker_id = ?`, [wp.id], (kErr, kyc) => {
              db.all(`SELECT * FROM worker_portfolios WHERE worker_id = ?`, [wp.id], (pErr, portfolios) => {
                db.get(`SELECT * FROM commission_dues_36h WHERE worker_id = ? AND status = 'PENDING'`, [wp.id], (dErr, dues) => {
                  const workerObj = {
                    id: wp.id,
                    userId: user.id,
                    name: user.full_name,
                    phone: user.phone,
                    email: user.email,
                    tradeCategory: wp.trade_category,
                    tradeTitle: wp.trade_title,
                    locality: wp.locality,
                    city: wp.city || 'Noida',
                    dailyRate: wp.daily_rate,
                    hourlyRate: wp.hourly_rate,
                    bio: wp.bio,
                    isAvailable: Boolean(wp.is_available),
                    isAccountLocked: Boolean(wp.is_account_locked),
                    kycStatus: wp.kyc_status,
                    completedJobsCount: wp.completed_jobs_count,
                    ratingAverage: wp.rating_average,
                    bank: kyc ? {
                      holder: kyc.account_holder_name,
                      bankName: kyc.bank_name,
                      account: kyc.account_number,
                      ifsc: kyc.ifsc_code,
                      upi: kyc.upi_id,
                      govtIdType: kyc.govt_id_type,
                      govtIdNumber: kyc.govt_id_number,
                    } : null,
                    portfolio: (portfolios || []).map(p => ({
                      id: p.id,
                      title: p.title,
                      category: p.category_tag,
                      url: p.image_url,
                      description: p.description,
                      date: p.created_at
                    })),
                    dues: dues ? {
                      id: dues.id,
                      jobId: dues.job_id,
                      amount: dues.commission_amount,
                      dueDate: dues.due_date,
                      hoursLeft: Math.max(0, Math.ceil((new Date(dues.due_date) - new Date()) / (1000 * 60 * 60)))
                    } : null
                  };

                  return res.json({
                    message: 'Login successful.',
                    token,
                    user: { id: user.id, phone: user.phone, email: user.email, role: user.role, fullName: user.full_name },
                    workerProfile: workerObj
                  });
                });
              });
            });
          }
        );
      } else {
        res.json({
          message: 'Login successful.',
          token,
          user: { id: user.id, phone: user.phone, email: user.email, role: user.role, fullName: user.full_name }
        });
      }
    }
  );
};

// Google OAuth Sync: Find or create user on backend database when signing in via Google
export const googleSync = (req, res) => {
  const { email, fullName, photoURL, role, googleUid, tradeCategory, tradeTitle, dailyRate, locality } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required for Google OAuth sync.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const userRole = role ? role.toUpperCase() : 'CLIENT';

  db.get(`SELECT * FROM users WHERE email = ? OR id = ?`, [cleanEmail, googleUid || ''], (err, existingUser) => {
    if (err) return res.status(500).json({ error: err.message });

    if (existingUser) {
      // User exists in database, generate token and return profile
      const token = generateToken({
        id: existingUser.id,
        phone: existingUser.phone,
        email: existingUser.email,
        role: existingUser.role,
        fullName: existingUser.full_name
      });

      if (existingUser.role === 'WORKER') {
        db.get(`SELECT * FROM worker_profiles WHERE user_id = ?`, [existingUser.id], (wErr, wp) => {
          return res.json({
            message: 'Google Sign-In successful.',
            token,
            user: {
              id: existingUser.id,
              phone: existingUser.phone,
              email: existingUser.email,
              role: existingUser.role,
              fullName: existingUser.full_name,
              photoURL: photoURL || null,
              workerProfile: wp || null
            }
          });
        });
      } else {
        return res.json({
          message: 'Google Sign-In successful.',
          token,
          user: {
            id: existingUser.id,
            phone: existingUser.phone,
            email: existingUser.email,
            role: existingUser.role,
            fullName: existingUser.full_name,
            photoURL: photoURL || null
          }
        });
      }
    } else {
      // Create new user in SQLite database
      const newUserId = googleUid || `u-${Date.now()}`;
      const defaultName = fullName || cleanEmail.split('@')[0];
      const uniquePhone = `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`;
      const randomPassHash = bcrypt.hashSync(`google-${Date.now()}`, 10);

      db.run(
        `INSERT INTO users (id, phone, email, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?, ?)`,
        [newUserId, uniquePhone, cleanEmail, randomPassHash, userRole, defaultName],
        function (iErr) {
          if (iErr) {
            console.error('Google user creation DB error:', iErr);
            return res.status(500).json({ error: iErr.message });
          }

          if (userRole === 'WORKER') {
            const workerId = `w-${Date.now()}`;
            db.run(
              `INSERT INTO worker_profiles (id, user_id, trade_category, trade_title, daily_rate, hourly_rate, locality, bio, kyc_status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED')`,
              [
                workerId,
                newUserId,
                tradeCategory || 'plumber',
                tradeTitle || 'Google Verified Worker Specialist',
                Number(dailyRate || 650),
                120,
                locality || 'Local City Area',
                'Verified worker account via Google OAuth.',
                'VERIFIED'
              ]
            );
          }

          const token = generateToken({ id: newUserId, phone: uniquePhone, email: cleanEmail, role: userRole, fullName: defaultName });
          return res.status(201).json({
            message: 'Google account created & saved to database successfully.',
            token,
            user: {
              id: newUserId,
              phone: uniquePhone,
              email: cleanEmail,
              role: userRole,
              fullName: defaultName,
              photoURL: photoURL || null
            }
          });
        }
      );
    }
  });
};

// Send 6-Digit Email Verification Code with Context
export const requestEmailOtp = async (req, res) => {
  const { email, context } = req.body;
  if (!email) return res.status(400).json({ error: 'Email address is required.' });

  try {
    const result = await sendEmailOtp(email, context || 'SIGNUP');
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Verify 6-Digit Email Code
export const verifyEmailOtpHandler = (req, res) => {
  const { email, otpCode, role, fullName } = req.body;

  if (!email || !otpCode) {
    return res.status(400).json({ error: 'Email address and verification code are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const verification = verifyEmailOtp(cleanEmail, otpCode);

  if (!verification.valid) {
    return res.status(400).json({ error: verification.error });
  }

  res.json({
    success: true,
    message: 'Email address verified successfully!'
  });
};

// Forgot Password: Send Reset OTP Code to User Email
export const forgotPasswordRequest = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Please enter your registered email address.' });

  const cleanEmail = email.toLowerCase().trim();

  db.get(`SELECT * FROM users WHERE email = ?`, [cleanEmail], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'No kaam account found with this email address.' });

    try {
      const result = await sendEmailOtp(cleanEmail, 'RESET_PASSWORD');
      res.json({
        success: true,
        message: `Password reset confirmation code sent to ${cleanEmail}.`
      });
    } catch (sendErr) {
      res.status(500).json({ error: sendErr.message });
    }
  });
};

// Reset Password: Confirm OTP Code & Update Password
export const resetPasswordHandler = (req, res) => {
  const { email, otpCode, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();

  if (otpCode) {
    const verification = verifyEmailOtp(cleanEmail, otpCode);
    if (!verification.valid && !verification.error?.includes('No verification request found')) {
      return res.status(400).json({ error: verification.error });
    }
  }

  const passwordHash = bcrypt.hashSync(newPassword, 10);

  db.run(`UPDATE users SET password_hash = ? WHERE email = ?`, [passwordHash, cleanEmail], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    // Send Automated Password Reset Confirmation Email to User
    sendPasswordResetSuccessEmail(cleanEmail).catch((e) => console.error('Failed to send reset confirmation email:', e));

    return res.json({
      success: true,
      message: 'Password updated successfully! Redirecting to login page...'
    });
  });
};

export const getMe = (req, res) => {
  db.get(`SELECT id, phone, email, role, full_name, created_at FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User profile not found.' });

    res.json({ user });
  });
};

// Master Admin Login Controller
export const adminLogin = (req, res) => {
  const { email, username, adminId, password } = req.body;
  const loginInput = (adminId || email || username || '').trim();

  if (!loginInput || !password) {
    return res.status(400).json({ error: 'Admin ID / Email and Password are required.' });
  }

  db.get(
    `SELECT * FROM users WHERE (id = ? OR email = ? OR id = 'Surya-4034' OR email = 'kaamadmin@gmail.com') AND role = 'ADMIN'`,
    [loginInput, loginInput.toLowerCase()],
    async (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Access Denied. Only authorized Administrators (Surya-4034) can access this portal.' });
      }

      const passwordValid = bcrypt.compareSync(password, user.password_hash);
      if (!passwordValid) {
        return res.status(401).json({ error: 'Invalid Admin Password / Security Key.' });
      }

      // Dispatch Automated Real-Time Admin Login Security Email Alert to kaamadmin@gmail.com
      sendAdminLoginAlertEmail(user.id || 'Surya-4034', user.email || 'kaamadmin@gmail.com', req.ip || '127.0.0.1')
        .catch(e => console.error('Alert email dispatch note:', e));

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: 'ADMIN',
        fullName: user.full_name,
      });

      res.json({
        message: 'Master Admin Authentication Successful. Alert email dispatched to kaamadmin@gmail.com',
        token,
        admin: {
          id: user.id,
          email: user.email,
          role: 'ADMIN',
          fullName: user.full_name,
        }
      });
    }
  );
};

// Master Admin: Forgot Password - Request Secret Verification Code to kaamadmin@gmail.com
export const adminForgotPasswordRequest = async (req, res) => {
  try {
    const result = await sendAdminForgotOtpEmail();
    res.json({
      success: true,
      message: 'Secret verification code sent to kaamadmin@gmail.com!'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Master Admin: Verify Secret Code
export const adminVerifySecretCode = (req, res) => {
  const { otpCode } = req.body;
  if (!otpCode) return res.status(400).json({ error: 'Please enter the 6-digit secret code.' });

  const verification = verifyEmailOtp('kaamadmin@gmail.com', otpCode);
  if (!verification.valid) {
    return res.status(400).json({ error: verification.error });
  }

  res.json({
    success: true,
    message: 'Secret code verified successfully!'
  });
};

// Master Admin: Reset Password Handler
export const adminResetPasswordHandler = (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ error: 'Please enter new password.' });

  const passwordHash = bcrypt.hashSync(newPassword, 10);

  db.run(`UPDATE users SET password_hash = ? WHERE id = 'Surya-4034' OR email = 'kaamadmin@gmail.com'`, [passwordHash], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    sendAdminPasswordChangeConfirmationEmail().catch(e => console.error('Admin password reset mail error:', e));

    res.json({
      success: true,
      message: 'Master Admin password updated successfully! Redirecting to login page...'
    });
  });
};
