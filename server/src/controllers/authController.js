import db from '../config/database.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';
import { sendEmailOtp, verifyEmailOtp, sendAdminLoginAlertEmail, sendPasswordResetSuccessEmail, sendAdminForgotOtpEmail, sendAdminPasswordChangeConfirmationEmail } from '../services/emailOtpService.js';
import User from '../models/User.js';
import WorkerProfile from '../models/WorkerProfile.js';
import { getPartnerModel, generatePartnerId } from '../models/PartnerModel.js';
import { generateClientId } from '../models/ClientModel.js';
import { isPartnerDbConnected, upsertUserToMongo, upsertPartnerToMongo, upsertClientToMongo, getMongoDb } from '../config/mongoose.js';
import { resolveWorkerCoordinates } from '../services/redisSpatialService.js';

export const register = (req, res) => {
  const { phone, email, password, role, fullName, tradeCategory, tradeTitle, dailyRate, hourlyRate, locality, bio } = req.body;

  if (!email || !password || !role || !fullName) {
    return res.status(400).json({ error: 'Email, password, role, and full name are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();

  // Strict Unique Email Check
  db.get(`SELECT id, email FROM users WHERE email = ?`, [cleanEmail], (checkErr, existingUser) => {
    if (checkErr) return res.status(500).json({ error: checkErr.message });

    if (existingUser) {
      return res.status(409).json({
        error: `An account already exists with ${cleanEmail}. Please log in instead of creating a new account.`
      });
    }

    const userId = `u-${Date.now()}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const normalizedRole = role.toUpperCase();
    
    let userPhone = (phone || '').trim();
    if (userPhone) {
      const pDigits = userPhone.replace(/\D/g, '');
      if (pDigits.length === 10) {
        userPhone = `+91 ${pDigits}`;
      } else if (pDigits.length === 12 && pDigits.startsWith('91')) {
        userPhone = `+91 ${pDigits.slice(2)}`;
      }
    } else {
      userPhone = `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`;
    }

    db.run(
      `INSERT INTO users (id, phone, email, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, userPhone, cleanEmail, passwordHash, normalizedRole, fullName],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE') || err.message.includes('users.email')) {
            return res.status(409).json({ error: `An account already exists with ${cleanEmail}. Please log in instead.` });
          }
          return res.status(500).json({ error: err.message });
        }

        // Dual-sync user creation to MongoDB Atlas
        User.findOneAndUpdate(
          { id: userId },
          {
            id: userId,
            phone: userPhone,
            email: cleanEmail,
            password_hash: passwordHash,
            role: normalizedRole,
            full_name: fullName,
            is_active: true
          },
          { upsert: true, returnDocument: 'after' }
        ).catch(mErr => console.warn('[Mongo Sync Note]', mErr.message));

        if (normalizedRole === 'WORKER') {
          const workerId = `w-${Date.now()}`;
          const partnerId = generatePartnerId();
          const targetLocality = locality || 'Andheri West, Mumbai';
          const geo = resolveWorkerCoordinates({ locality: targetLocality, city: 'Mumbai' }) || { lat: 19.0760, lng: 72.8777 };

          db.run(
            `INSERT INTO worker_profiles (id, user_id, trade_category, trade_title, daily_rate, hourly_rate, locality, city, bio, is_available, is_account_locked, kyc_status, rating_average, completed_jobs_count, latitude, longitude)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Mumbai', ?, 1, 0, 'VERIFIED', 5.0, 0, ?, ?)`,
            [
              workerId,
              userId,
              tradeCategory || 'plumber',
              tradeTitle || 'Skilled Trade Specialist',
              Number(dailyRate || 650),
              Number(hourlyRate || 120),
              targetLocality,
              bio || 'Skilled Mumbai partner on kaam.',
              geo.lat,
              geo.lng
            ]
          );

          const newWorkerObj = {
            id: workerId,
            partnerId: partnerId,
            userId: userId,
            name: fullName,
            phone: userPhone,
            email: cleanEmail,
            tradeCategory: tradeCategory || 'plumber',
            tradeTitle: tradeTitle || 'Skilled Trade Specialist',
            categories: [tradeCategory || 'plumber'],
            locality: targetLocality,
            city: 'Mumbai',
            dailyRate: Number(dailyRate || 650),
            hourlyRate: Number(hourlyRate || 120),
            visitingCharge: 149,
            bio: bio || 'Skilled Mumbai partner on kaam.',
            isAvailable: true,
            isAccountLocked: false,
            completedJobsCount: 0,
            ratingAverage: 5.0,
            packages: [],
            bank: { holder: fullName, upi: `${userPhone}@paytm`, payoutMode: 'UPI Instant Payout' },
            latitude: geo.lat,
            longitude: geo.lng,
            location: { latitude: geo.lat, longitude: geo.lng },
            onboardingCompleted: false
          };

          if (isPartnerDbConnected()) {
            try {
              const Partner = getPartnerModel();
              Partner.findOneAndUpdate(
                { $or: [{ userId }, { email: cleanEmail }] },
                {
                  $set: {
                    id: workerId,
                    partnerId: partnerId,
                    userId: userId,
                    name: fullName,
                    phone: userPhone,
                    email: cleanEmail,
                    tradeCategory: tradeCategory || 'plumber',
                    tradeTitle: tradeTitle || 'Skilled Trade Specialist',
                    categories: [tradeCategory || 'plumber'],
                    locality: targetLocality,
                    city: 'Mumbai',
                    dailyRate: Number(dailyRate || 650),
                    hourlyRate: Number(hourlyRate || 120),
                    visitingCharge: 149,
                    onboardingCompleted: false,
                    isAvailable: true,
                    isAccountLocked: false,
                    completedJobsCount: 0,
                    ratingAverage: 5.0,
                    packages: [],
                    bank: { holder: fullName, upi: `${userPhone}@paytm`, payoutMode: 'UPI Instant Payout' },
                    latitude: geo.lat,
                    longitude: geo.lng,
                    location: { latitude: geo.lat, longitude: geo.lng }
                  }
                },
                { upsert: true, new: true }
              ).then(p => {
                console.log(`🍃 [kaam_db MongoDB Atlas] Registered new Partner ${fullName} (${partnerId}) into partners collection!`);
              }).catch(pErr => console.warn('[Partner Mongo Register Note]', pErr.message));
            } catch (pErr) {
              console.warn('[Partner Mongo Register Note]', pErr.message);
            }
          }

          const token = generateToken({ id: userId, phone: userPhone, email: cleanEmail, role: normalizedRole, fullName });

          return res.status(201).json({
            message: 'Account created successfully.',
            token,
            user: {
              id: userId,
              phone: userPhone,
              secondaryPhone: '',
              email: cleanEmail,
              role: normalizedRole,
              fullName,
              locality: targetLocality,
              landmark: '',
              state: 'Maharashtra',
              pincode: '',
              address: targetLocality,
              onboardingCompleted: false
            },
            workerProfile: newWorkerObj
          });
        } else if (normalizedRole === 'CLIENT') {
          const clientId = generateClientId();
          upsertClientToMongo({
            id: userId,
            clientId: clientId,
            userId: userId,
            fullName: fullName,
            name: fullName,
            phone: userPhone,
            email: cleanEmail,
            locality: locality || 'Mumbai',
            city: 'Mumbai',
            state: 'Maharashtra',
            onboardingCompleted: false
          });
          console.log(`🍃 [kaam_db MongoDB Atlas] Registered new Client ${fullName} (${clientId}) into clients collection!`);

          const token = generateToken({ id: userId, phone: userPhone, email: cleanEmail, role: normalizedRole, fullName });

          return res.status(201).json({
            message: 'Account created successfully.',
            token,
            user: {
              id: userId,
              phone: userPhone,
              secondaryPhone: '',
              email: cleanEmail,
              role: normalizedRole,
              fullName,
              locality: locality || 'Mumbai',
              landmark: '',
              state: 'Maharashtra',
              pincode: '',
              address: locality || 'Mumbai',
              onboardingCompleted: false
            }
          });
        }

        const token = generateToken({ id: userId, phone: userPhone, email: cleanEmail, role: normalizedRole, fullName });

        res.status(201).json({
          message: 'Account created successfully.',
          token,
          user: {
            id: userId,
            phone: userPhone,
            secondaryPhone: '',
            email: cleanEmail,
            role: normalizedRole,
            fullName,
            locality: '',
            landmark: '',
            state: 'Maharashtra',
            pincode: '',
            address: '',
            onboardingCompleted: false
          }
        });
      }
    );
  });
};

export const login = (req, res) => {
  const { username, email, password } = req.body;
  const rawEmail = (email || username || '').trim();

  if (!rawEmail || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = rawEmail.toLowerCase();

  const processUserLogin = (user) => {
    if (!user) {
      return res.status(404).json({ error: 'Account not found. Please check your email or register a new account.' });
    }

    const isGoogleAccount = (user.password_hash && user.password_hash.startsWith('google-')) ||
                            (user.id && user.id.length === 28);
    if (isGoogleAccount) {
      return res.status(400).json({
        error: "This account was created using Google Sign-In. Please click 'Sign in with Google'."
      });
    }

    let passwordValid = false;
    try {
      passwordValid = bcrypt.compareSync(password, user.password_hash);
    } catch (bErr) {
      console.warn('[Bcrypt verification note]', bErr.message);
    }

    if (!passwordValid) {
      return res.status(401).json({ error: 'Incorrect password. Please verify your password and try again.' });
    }

    const token = generateToken({
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    });

    const formattedUser = {
      id: user.id,
      fullName: user.full_name,
      phone: user.phone,
      secondaryPhone: user.secondary_phone || '',
      email: user.email,
      role: user.role,
      locality: user.locality || '',
      landmark: user.landmark || '',
      state: user.state || 'Maharashtra',
      pincode: user.pincode || '',
      address: user.address || '',
      onboardingCompleted: Boolean(user.onboarding_completed)
    };

    if (user.role === 'WORKER') {
      db.get(
        `SELECT * FROM worker_profiles WHERE user_id = ? OR id = ?`,
        [user.id, user.worker_profile_id || ''],
        async (wErr, wp) => {
          let targetWp = wp;

          if (!targetWp && isPartnerDbConnected()) {
            try {
              const Partner = getPartnerModel();
              const mPartner = await Partner.findOne({ $or: [{ userId: user.id }, { email: cleanEmail }] }).lean();
              if (mPartner) {
                const pLat = Number(mPartner.latitude || mPartner.location?.latitude || 19.1363);
                const pLng = Number(mPartner.longitude || mPartner.location?.longitude || 72.8277);
                await new Promise(r => {
                  db.run(
                    `INSERT OR REPLACE INTO worker_profiles (id, user_id, trade_category, trade_title, daily_rate, hourly_rate, locality, city, bio, is_available, is_account_locked, kyc_status, rating_average, completed_jobs_count, latitude, longitude, packages_json, categories_json, visiting_charge, experience_years)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED', ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      mPartner.id || `w-${Date.now()}`,
                      user.id,
                      mPartner.tradeCategory || 'plumber',
                      mPartner.tradeTitle || 'Skilled Trade Specialist',
                      Number(mPartner.dailyRate || 650),
                      Number(mPartner.hourlyRate || 120),
                      mPartner.locality || 'Andheri West, Mumbai',
                      mPartner.city || 'Mumbai',
                      mPartner.bio || 'Skilled Mumbai partner on kaam.',
                      mPartner.isAvailable !== false ? 1 : 0,
                      mPartner.isAccountLocked ? 1 : 0,
                      Number(mPartner.ratingAverage || 5.0),
                      Number(mPartner.completedJobsCount || 0),
                      pLat,
                      pLng,
                      JSON.stringify(Array.isArray(mPartner.packages) ? mPartner.packages : []),
                      JSON.stringify(Array.isArray(mPartner.categories) && mPartner.categories.length > 0 ? mPartner.categories : [mPartner.tradeCategory || 'plumber']),
                      Number(mPartner.visitingCharge || 149),
                      Number(mPartner.experienceYears || 1)
                    ],
                    () => r()
                  );
                });
                targetWp = {
                  ...mPartner,
                  trade_category: mPartner.tradeCategory,
                  trade_title: mPartner.tradeTitle,
                  daily_rate: mPartner.dailyRate,
                  hourly_rate: mPartner.hourlyRate,
                  visiting_charge: mPartner.visitingCharge || 149,
                  rating_average: mPartner.ratingAverage || 5.0,
                  completed_jobs_count: mPartner.completedJobsCount || 0,
                  is_available: mPartner.isAvailable !== false ? 1 : 0,
                  latitude: pLat,
                  longitude: pLng
                };
              }
            } catch (pRehydrateErr) {
              console.warn('[Login Partner Rehydrate Note]', pRehydrateErr.message);
            }
          }

          if (!targetWp) {
            return res.json({
              message: 'Login successful.',
              token,
              user: formattedUser
            });
          }

          db.get(`SELECT * FROM worker_bank_kyc WHERE worker_id = ?`, [targetWp.id], (kErr, kyc) => {
            db.all(`SELECT * FROM worker_portfolios WHERE worker_id = ?`, [targetWp.id], (pErr, portfolios) => {
              db.get(`SELECT * FROM commission_dues_36h WHERE worker_id = ? AND status = 'PENDING'`, [targetWp.id], (dErr, dues) => {
                let pkgs = [];
                let cats = [targetWp.trade_category || 'plumber'];
                try { if (targetWp.packages_json) pkgs = JSON.parse(targetWp.packages_json); } catch (e) {}
                try { if (targetWp.categories_json) cats = JSON.parse(targetWp.categories_json); } catch (e) {}
                if (Array.isArray(pkgs)) {
                  pkgs.forEach(p => {
                    if (p.category && !cats.includes(p.category.toLowerCase())) {
                      cats.push(p.category.toLowerCase());
                    }
                  });
                }
                const workerObj = {
                  id: targetWp.id,
                  userId: user.id,
                  name: user.full_name,
                  phone: user.phone,
                  email: user.email,
                  tradeCategory: targetWp.trade_category || 'plumber',
                  tradeTitle: targetWp.trade_title || 'Skilled Trade Specialist',
                  locality: targetWp.locality || 'Andheri West, Mumbai',
                  city: targetWp.city || 'Mumbai',
                  dailyRate: targetWp.daily_rate || 650,
                  hourlyRate: targetWp.hourly_rate || 120,
                  visitingCharge: targetWp.visiting_charge || 149,
                  bio: targetWp.bio || 'Skilled Mumbai partner on kaam.',
                  packages: pkgs,
                  categories: cats,
                  latitude: Number(targetWp.latitude || 19.1363),
                  longitude: Number(targetWp.longitude || 72.8277),
                  isAvailable: Boolean(targetWp.is_available),
                  isAccountLocked: Boolean(targetWp.is_account_locked),
                  kycStatus: targetWp.kyc_status || 'VERIFIED',
                  completedJobsCount: targetWp.completed_jobs_count || 0,
                  ratingAverage: targetWp.rating_average || 5.0,
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
                    commissionAmount: dues.commission_amount,
                    dueDate: dues.due_date,
                    paymentQrUrl: dues.payment_qr_url,
                    status: dues.status
                  } : null
                };

                res.json({
                  message: 'Login successful.',
                  token,
                  user: formattedUser,
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
        user: formattedUser
      });
    }
  };

  db.get(
    `SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR id = ? OR LOWER(full_name) = LOWER(?)`,
    [cleanEmail, rawEmail, cleanEmail],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (user) {
        return processUserLogin(user);
      }

      // MongoDB Atlas Fallback if not found in SQLite
      try {
        User.findOne({ $or: [{ email: cleanEmail }, { id: rawEmail }] }).then(mUser => {
          if (!mUser) {
            return res.status(404).json({ error: 'Account not found. Please check your email or register a new account.' });
          }
          // Rehydrate into SQLite
          db.run(
            `INSERT OR REPLACE INTO users (id, phone, email, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?, ?)`,
            [mUser.id, mUser.phone, mUser.email, mUser.password_hash, mUser.role, mUser.full_name],
            () => {
              processUserLogin({
                id: mUser.id,
                phone: mUser.phone,
                email: mUser.email,
                password_hash: mUser.password_hash,
                role: mUser.role,
                full_name: mUser.full_name,
                secondary_phone: mUser.secondary_phone,
                locality: mUser.locality,
                landmark: mUser.landmark,
                state: mUser.state,
                pincode: mUser.pincode,
                address: mUser.address,
                onboarding_completed: mUser.onboarding_completed
              });
            }
          );
        }).catch(() => {
          return res.status(404).json({ error: 'Account not found. Please check your credentials.' });
        });
      } catch (mErr) {
        return res.status(404).json({ error: 'Account not found. Please check your credentials.' });
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
        db.get(`SELECT * FROM worker_profiles WHERE user_id = ?`, [existingUser.id], async (wErr, wp) => {
          let targetWp = wp;

          if (!targetWp && isPartnerDbConnected()) {
            try {
              const Partner = getPartnerModel();
              const mPartner = await Partner.findOne({ $or: [{ userId: existingUser.id }, { email: cleanEmail }] }).lean();
              if (mPartner) {
                const pLat = Number(mPartner.latitude || mPartner.location?.latitude || 19.1363);
                const pLng = Number(mPartner.longitude || mPartner.location?.longitude || 72.8277);
                await new Promise(r => {
                  db.run(
                    `INSERT OR REPLACE INTO worker_profiles (id, user_id, trade_category, trade_title, daily_rate, hourly_rate, locality, city, bio, is_available, is_account_locked, kyc_status, rating_average, completed_jobs_count, latitude, longitude, packages_json, categories_json, visiting_charge, experience_years)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED', ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      mPartner.id || `w-${Date.now()}`,
                      existingUser.id,
                      mPartner.tradeCategory || 'plumber',
                      mPartner.tradeTitle || 'Skilled Trade Specialist',
                      Number(mPartner.dailyRate || 650),
                      Number(mPartner.hourlyRate || 120),
                      mPartner.locality || 'Andheri West, Mumbai',
                      mPartner.city || 'Mumbai',
                      mPartner.bio || 'Skilled Mumbai partner on kaam.',
                      mPartner.isAvailable !== false ? 1 : 0,
                      mPartner.isAccountLocked ? 1 : 0,
                      Number(mPartner.ratingAverage || 5.0),
                      Number(mPartner.completedJobsCount || 0),
                      pLat,
                      pLng,
                      JSON.stringify(Array.isArray(mPartner.packages) ? mPartner.packages : []),
                      JSON.stringify(Array.isArray(mPartner.categories) && mPartner.categories.length > 0 ? mPartner.categories : [mPartner.tradeCategory || 'plumber']),
                      Number(mPartner.visitingCharge || 149),
                      Number(mPartner.experienceYears || 1)
                    ],
                    () => r()
                  );
                });
                targetWp = {
                  ...mPartner,
                  trade_category: mPartner.tradeCategory,
                  trade_title: mPartner.tradeTitle,
                  daily_rate: mPartner.dailyRate,
                  hourly_rate: mPartner.hourlyRate,
                  visiting_charge: mPartner.visitingCharge || 149,
                  rating_average: mPartner.ratingAverage || 5.0,
                  completed_jobs_count: mPartner.completedJobsCount || 0,
                  is_available: mPartner.isAvailable !== false ? 1 : 0,
                  latitude: pLat,
                  longitude: pLng
                };
              }
            } catch (pRehydrateErr) {
              console.warn('[Google Sync Partner Rehydrate Note]', pRehydrateErr.message);
            }
          }

          let workerData = null;
          if (targetWp) {
            let pkgs = [];
            let cats = [targetWp.trade_category || 'plumber'];
            try { if (targetWp.packages_json) pkgs = JSON.parse(targetWp.packages_json); } catch (e) {}
            try { if (targetWp.categories_json) cats = JSON.parse(targetWp.categories_json); } catch (e) {}
            if (Array.isArray(pkgs)) {
              pkgs.forEach(p => {
                if (p.category && !cats.includes(p.category.toLowerCase())) {
                  cats.push(p.category.toLowerCase());
                }
              });
            }
            workerData = {
              ...targetWp,
              name: existingUser.full_name,
              phone: existingUser.phone,
              tradeCategory: targetWp.trade_category || 'plumber',
              tradeTitle: targetWp.trade_title || 'Skilled Trade Specialist',
              dailyRate: targetWp.daily_rate || 650,
              hourlyRate: targetWp.hourly_rate || 120,
              visitingCharge: targetWp.visiting_charge || 149,
              locality: targetWp.locality || 'Andheri West, Mumbai',
              city: targetWp.city || 'Mumbai',
              packages: pkgs,
              categories: cats,
              latitude: Number(targetWp.latitude || 19.1363),
              longitude: Number(targetWp.longitude || 72.8277),
              isAvailable: Boolean(targetWp.is_available),
              onboardingCompleted: true
            };
          }
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
              workerProfile: workerData
            },
            workerProfile: workerData
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
      // Create new user in SQLite and MongoDB Atlas
      const newUserId = googleUid || `u-${Date.now()}`;
      const defaultName = fullName || cleanEmail.split('@')[0];
      const uniquePhone = `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`;
      const randomPassHash = `google-oauth-${googleUid || Date.now()}`;

      db.run(
        `INSERT INTO users (id, phone, email, password_hash, role, full_name, locality, state) VALUES (?, ?, ?, ?, ?, ?, ?, 'Maharashtra')`,
        [newUserId, uniquePhone, cleanEmail, randomPassHash, userRole, defaultName, locality || 'Mumbai'],
        function (iErr) {
          if (iErr) {
            console.error('Google user creation DB error:', iErr);
            return res.status(500).json({ error: iErr.message });
          }

          // Dual-sync user creation to MongoDB Atlas
          User.findOneAndUpdate(
            { id: newUserId },
            {
              id: newUserId,
              phone: uniquePhone,
              email: cleanEmail,
              password_hash: randomPassHash,
              role: userRole,
              full_name: defaultName,
              locality: locality || 'Mumbai',
              state: 'Maharashtra',
              is_active: true
            },
            { upsert: true, returnDocument: 'after' }
          ).catch(mErr => console.warn('[Mongo Google User Sync Note]', mErr.message));

          let newWorkerObj = null;
          if (userRole === 'WORKER') {
            const workerId = `w-${Date.now()}`;
            const partnerId = generatePartnerId();
            const targetLocality = locality || 'Andheri West, Mumbai';
            const geo = resolveWorkerCoordinates({ locality: targetLocality, city: 'Mumbai' }) || { lat: 19.0760, lng: 72.8777 };

            newWorkerObj = {
              id: workerId,
              partnerId: partnerId,
              userId: newUserId,
              name: defaultName,
              phone: uniquePhone,
              email: cleanEmail,
              tradeCategory: tradeCategory || 'plumber',
              tradeTitle: tradeTitle || 'Google Verified Worker Specialist',
              dailyRate: Number(dailyRate || 650),
              hourlyRate: 120,
              visitingCharge: 149,
              locality: targetLocality,
              city: 'Mumbai',
              packages: [],
              categories: [tradeCategory || 'plumber'],
              isAvailable: true,
              isAccountLocked: false,
              completedJobsCount: 0,
              ratingAverage: 5.0,
              latitude: geo.lat,
              longitude: geo.lng,
              location: { latitude: geo.lat, longitude: geo.lng },
              onboardingCompleted: true
            };

            db.run(
              `INSERT INTO worker_profiles (id, user_id, trade_category, trade_title, daily_rate, hourly_rate, locality, city, bio, is_available, is_account_locked, kyc_status, rating_average, completed_jobs_count, latitude, longitude)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'Mumbai', ?, 1, 0, 'VERIFIED', 5.0, 0, ?, ?)`,
              [
                workerId,
                newUserId,
                tradeCategory || 'plumber',
                tradeTitle || 'Google Verified Worker Specialist',
                Number(dailyRate || 650),
                120,
                targetLocality,
                'Verified worker account via Google OAuth.',
                geo.lat,
                geo.lng
              ]
            );

            if (isPartnerDbConnected()) {
              try {
                const Partner = getPartnerModel();
                Partner.findOneAndUpdate(
                  { $or: [{ userId: newUserId }, { email: cleanEmail }] },
                  {
                    $set: {
                      id: workerId,
                      partnerId: partnerId,
                      userId: newUserId,
                      name: defaultName,
                      phone: uniquePhone,
                      email: cleanEmail,
                      tradeCategory: tradeCategory || 'plumber',
                      tradeTitle: tradeTitle || 'Google Verified Worker Specialist',
                      categories: [tradeCategory || 'plumber'],
                      locality: targetLocality,
                      city: 'Mumbai',
                      dailyRate: Number(dailyRate || 650),
                      hourlyRate: 120,
                      visitingCharge: 149,
                      onboardingCompleted: true,
                      isAvailable: true,
                      isAccountLocked: false,
                      completedJobsCount: 0,
                      ratingAverage: 5.0,
                      packages: [],
                      bank: { holder: defaultName, upi: `${cleanEmail.split('@')[0]}@paytm`, payoutMode: 'UPI Instant Payout' },
                      latitude: geo.lat,
                      longitude: geo.lng,
                      location: { latitude: geo.lat, longitude: geo.lng }
                    }
                  },
                  { upsert: true, new: true }
                ).then(p => {
                  console.log(`🍃 [kaam_db MongoDB Atlas] Google-synced new Partner ${defaultName} (${partnerId}) into partners collection!`);
                }).catch(pErr => console.warn('[Partner Mongo Google Sync Note]', pErr.message));
              } catch (pErr) {
                console.warn('[Partner Mongo Google Sync Note]', pErr.message);
              }
            }
          } else if (userRole === 'CLIENT') {
            const clientId = generateClientId();
            upsertClientToMongo({
              id: newUserId,
              clientId: clientId,
              userId: newUserId,
              fullName: defaultName,
              name: defaultName,
              phone: uniquePhone,
              email: cleanEmail,
              locality: locality || 'Mumbai',
              city: 'Mumbai',
              state: 'Maharashtra',
              onboardingCompleted: true
            });
            console.log(`🍃 [kaam_db MongoDB Atlas] Google-synced new Client ${defaultName} (${clientId}) into clients collection!`);
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
              photoURL: photoURL || null,
              workerProfile: newWorkerObj
            },
            workerProfile: newWorkerObj
          });
        }
      );
    }
  });
};

// Send 6-Digit Email Verification Code with Context
export const requestEmailOtp = async (req, res) => {
  const { email, context } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Please enter a valid email address.' });

  const cleanEmail = email.toLowerCase().trim();
  const emailContext = context || 'SIGNUP';

  if (emailContext === 'SIGNUP') {
    db.get(`SELECT id FROM users WHERE email = ?`, [cleanEmail], async (err, existingUser) => {
      if (err) return res.status(500).json({ error: err.message });
      if (existingUser) {
        return res.status(409).json({ error: `An account with ${cleanEmail} already exists. Please log in instead.` });
      }

      try {
        const result = await sendEmailOtp(cleanEmail, emailContext);
        res.json(result);
      } catch (sendErr) {
        res.status(400).json({ error: sendErr.message });
      }
    });
  } else if (emailContext === 'RESET_PASSWORD') {
    db.get(`SELECT id FROM users WHERE email = ?`, [cleanEmail], async (err, existingUser) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!existingUser) {
        return res.status(404).json({ error: `No kaam account found with ${cleanEmail}. Please create a new account first.` });
      }

      try {
        const result = await sendEmailOtp(cleanEmail, emailContext);
        res.json(result);
      } catch (sendErr) {
        res.status(400).json({ error: sendErr.message });
      }
    });
  } else {
    try {
      const result = await sendEmailOtp(cleanEmail, emailContext);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
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

// Forgot Password: Send Reset OTP Code to User Email (Only if Account Exists)
export const forgotPasswordRequest = async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const cleanEmail = email.toLowerCase().trim();

  // Strict Account Existence Check
  db.get(`SELECT id, full_name FROM users WHERE email = ?`, [cleanEmail], async (err, existingUser) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!existingUser) {
      return res.status(404).json({
        error: `No kaam account found with email address ${cleanEmail}. Please create a new account instead.`
      });
    }

    try {
      const result = await sendEmailOtp(cleanEmail, 'RESET_PASSWORD');
      res.json({
        success: true,
        message: `Password reset confirmation code sent to ${cleanEmail}.`
      });
    } catch (sendErr) {
      console.error('Forgot password send email error:', sendErr);
      res.status(500).json({ error: sendErr.message || 'Failed to dispatch verification email.' });
    }
  });
};

// Reset Password: Confirm OTP Code & Update Password (Only for Existing User)
export const resetPasswordHandler = (req, res) => {
  const { email, otpCode, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();

  // Strict Account Existence Check
  db.get(`SELECT id FROM users WHERE email = ?`, [cleanEmail], (userErr, existingUser) => {
    if (userErr) return res.status(500).json({ error: userErr.message });

    if (!existingUser) {
      return res.status(404).json({
        error: `No kaam account found with email address ${cleanEmail}. Please create a new account instead.`
      });
    }

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

// Update User Profile Details (Phone, Full Name, Secondary Phone, Locality, Landmark, State, Pincode, Address)
export const updateUserProfile = (req, res) => {
  const { userId, fullName, phone, secondaryPhone, locality, landmark, state, pincode, address } = req.body;
  const targetId = req.user?.id || userId;

  if (!targetId) return res.status(400).json({ error: 'User ID is required.' });

  const fullAddr = address || `${locality || ''}, near ${landmark || ''}, ${state || ''} - ${pincode || ''}`;

  db.run(
    `UPDATE users 
     SET full_name = COALESCE(?, full_name),
         phone = COALESCE(?, phone),
         secondary_phone = COALESCE(?, secondary_phone),
         locality = COALESCE(?, locality),
         landmark = COALESCE(?, landmark),
         state = COALESCE(?, state),
         pincode = COALESCE(?, pincode),
         address = COALESCE(?, address),
         onboarding_completed = 1
     WHERE id = ?`,
    [fullName, phone, secondaryPhone, locality, landmark, state, pincode, fullAddr, targetId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      db.get(`SELECT id, full_name, phone, secondary_phone, email, role, locality, landmark, state, pincode, address, onboarding_completed, latitude, longitude FROM users WHERE id = ?`, [targetId], (uErr, user) => {
        if (uErr || !user) return res.status(404).json({ error: 'User profile not found.' });

        // Auto-sync user update to MongoDB Atlas
        upsertUserToMongo({
          id: user.id,
          fullName: user.full_name,
          phone: user.phone,
          secondaryPhone: user.secondary_phone,
          email: user.email,
          role: user.role,
          locality: user.locality,
          landmark: user.landmark,
          state: user.state,
          pincode: user.pincode,
          address: user.address,
          onboardingCompleted: Boolean(user.onboarding_completed)
        });

        // Mirror to specialized client or partner collection
        if (user.role === 'CLIENT') {
          upsertClientToMongo({
            id: user.id,
            userId: user.id,
            fullName: user.full_name,
            name: user.full_name,
            phone: user.phone,
            secondaryPhone: user.secondary_phone,
            email: user.email,
            locality: user.locality || 'Mumbai',
            landmark: user.landmark || '',
            state: user.state || 'Maharashtra',
            pincode: user.pincode || '',
            address: user.address || '',
            savedAddresses: user.address ? [{
              label: 'Default Address',
              address: user.address,
              locality: user.locality || '',
              landmark: user.landmark || '',
              city: 'Mumbai',
              state: user.state || 'Maharashtra',
              pincode: user.pincode || '',
              isDefault: true,
              coordinates: (user.latitude && user.longitude) ? { lat: user.latitude, lng: user.longitude } : undefined
            }] : [],
            onboardingCompleted: Boolean(user.onboarding_completed)
          });
        } else if (user.role === 'WORKER') {
          upsertPartnerToMongo({
            userId: user.id,
            name: user.full_name,
            phone: user.phone,
            email: user.email,
            locality: user.locality,
            address: user.address
          });
        }

        res.json({
          message: 'Profile details updated successfully in database.',
          user: {
            id: user.id,
            fullName: user.full_name,
            phone: user.phone,
            secondaryPhone: user.secondary_phone,
            email: user.email,
            role: user.role,
            locality: user.locality,
            landmark: user.landmark,
            state: user.state,
            pincode: user.pincode,
            address: user.address,
            onboardingCompleted: Boolean(user.onboarding_completed)
          }
        });
      });
    }
  );
};

// Permanent Account Deletion Endpoint
export const deleteAccount = (req, res) => {
  const userId = req.user?.id || req.body?.userId;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required to process account deletion.' });
  }

  // Delete worker profile if worker
  db.run(`DELETE FROM worker_profiles WHERE user_id = ?`, [userId], (pErr) => {
    // Delete user from users table
    db.run(`DELETE FROM users WHERE id = ?`, [userId], function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Clean up from MongoDB Atlas collections
      try {
        const mongo = getMongoDb();
        if (mongo) {
          mongo.collection('users').deleteOne({ id: userId });
          mongo.collection('partners').deleteOne({ $or: [{ userId }, { id: userId }] });
          mongo.collection('clients').deleteOne({ $or: [{ userId }, { id: userId }] });
        }
      } catch (mDelErr) {
        console.warn('[Mongo Delete Sync Note]', mDelErr.message);
      }

      res.json({
        success: true,
        message: 'Your account has been permanently deleted from KAAM platform database.'
      });
    });
  });
};

// Silent Live Location Sync Endpoint (Captures coordinates once in background)
export const updateUserLocation = (req, res) => {
  const userId = req.user?.id || req.body?.userId;
  const { latitude, longitude } = req.body;

  if (!userId || latitude == null || longitude == null) {
    return res.status(400).json({ error: 'User ID, latitude, and longitude are required.' });
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  db.run(
    `UPDATE users SET latitude = ?, longitude = ? WHERE id = ?`,
    [lat, lng, userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // If user is a worker, also update worker_profiles table
      db.run(`UPDATE worker_profiles SET latitude = ?, longitude = ? WHERE user_id = ?`, [lat, lng, userId], () => {});

      // Sync updated coordinates to MongoDB Atlas
      db.get(`SELECT role FROM users WHERE id = ?`, [userId], (rErr, rRow) => {
        if (rRow?.role === 'CLIENT') {
          upsertClientToMongo({ userId, location: { latitude: lat, longitude: lng } });
        } else if (rRow?.role === 'WORKER') {
          upsertPartnerToMongo({ userId, location: { latitude: lat, longitude: lng } });
        }
      });

      res.json({
        success: true,
        message: 'Coordinates updated silently in background database.',
        location: { latitude: lat, longitude: lng }
      });
    }
  );
};


