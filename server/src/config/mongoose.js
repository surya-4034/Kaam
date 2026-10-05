import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import db from './database.js';

dotenv.config();

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

let mongoDbConnection = null;
let isConnected = false;
let isSyncing = false;

// 1. Primary connection to unified database 'kaam_db'
export const connectMongoDB = async () => {
  let envURI = process.env.MONGO_URI || "mongodb+srv://sujal:Sujal957@cluster0.0yxyzl6.mongodb.net/kaam_db?retryWrites=true&w=majority&appName=Cluster0";

  // Normalize URI to target kaam_db
  if (envURI.includes('/kaam_partner_db') || envURI.includes('/kaam_client_db')) {
    envURI = envURI.replace(/\/kaam_(partner|client)_db/, '/kaam_db');
  } else if (!envURI.includes('/kaam_db')) {
    envURI = envURI.replace('mongodb.net/', 'mongodb.net/kaam_db');
  }

  const connectionOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 2,
    bufferCommands: false
  };

  try {
    mongoDbConnection = await mongoose.createConnection(envURI, connectionOptions).asPromise();
    isConnected = true;
    console.log('🍃 [kaam MongoDB Atlas] Successfully connected to unified database: kaam_db');
    triggerBackgroundSync();
  } catch (err) {
    if (err.message.includes('querySrv') || err.message.includes('ECONNREFUSED')) {
      const fallbackURI = "mongodb://sujal:Sujal957@ac-kgra4ds-shard-00-00.0yxyzl6.mongodb.net:27017,ac-kgra4ds-shard-00-01.0yxyzl6.mongodb.net:27017,ac-kgra4ds-shard-00-02.0yxyzl6.mongodb.net:27017/kaam_db?ssl=true&authSource=admin&replicaSet=atlas-joqohk-shard-0";
      try {
        mongoDbConnection = await mongoose.createConnection(fallbackURI, connectionOptions).asPromise();
        isConnected = true;
        console.log('🍃 [kaam MongoDB Atlas] Connected to kaam_db via Direct Shard replicaSet');
        triggerBackgroundSync();
      } catch (fErr) {
        console.warn('⚠️ [kaam MongoDB Atlas Notice] Network access requires whitelisting your IP in Atlas:', fErr.message);
      }
    } else {
      console.warn('⚠️ [kaam MongoDB Atlas Notice] Network access requires whitelisting your IP in Atlas:', err.message);
    }
  }

  if (mongoDbConnection) {
    mongoDbConnection.on('disconnected', () => {
      isConnected = false;
      console.log('🍃 [kaam MongoDB Atlas] Connection disconnected.');
    });
    mongoDbConnection.on('reconnected', () => {
      isConnected = true;
      console.log('🍃 [kaam MongoDB Atlas] Reconnected to kaam_db.');
      triggerBackgroundSync();
    });
    mongoDbConnection.on('error', (e) => {
      isConnected = false;
    });
  }

  return { mongoDbConnection, partnerDbConnection: mongoDbConnection, clientDbConnection: mongoDbConnection };
};

export const getMongoDb = () => mongoDbConnection;
export const getPartnerDb = () => mongoDbConnection;
export const getClientDb = () => mongoDbConnection;

export const isMongoConnected = () => isConnected && mongoDbConnection && mongoDbConnection.readyState === 1;
export const isPartnerDbConnected = () => isMongoConnected();
export const isClientDbConnected = () => isMongoConnected();

const triggerBackgroundSync = () => {
  if (isSyncing) return;
  setTimeout(() => {
    syncAllToMongo().catch(err => {
      console.warn('⚠️ [kaam Dual-Sync Notice]', err.message);
    });
  }, 1000);
};

// 2. Comprehensive Dual-Sync from SQLite to MongoDB Atlas
export const syncAllToMongo = async () => {
  if (!isMongoConnected() || isSyncing) return;
  isSyncing = true;

  try {
    const mongo = getMongoDb();
    if (!mongo) return;
    const clientDb = mongo.useDb('kaam_client_db');
    const partnerDb = mongo.useDb('kaam_partner_db');

    // A. Sync Users across databases
    await new Promise((resolve) => {
      db.all(`SELECT * FROM users`, [], async (err, users) => {
        if (err || !users) return resolve();
        try {
          const usersCols = [mongo.collection('users'), clientDb.collection('users'), partnerDb.collection('users')];

          for (const col of usersCols) {
            for (const u of users) {
              await col.updateOne(
                { id: u.id },
                {
                  $set: {
                    id: u.id,
                    phone: u.phone,
                    email: u.email ? u.email.toLowerCase() : '',
                    role: u.role,
                    full_name: u.full_name,
                    secondary_phone: u.secondary_phone || '',
                    locality: u.locality || '',
                    landmark: u.landmark || '',
                    state: u.state || 'Maharashtra',
                    pincode: u.pincode || '',
                    address: u.address || '',
                    location: {
                      latitude: u.latitude || null,
                      longitude: u.longitude || null
                    },
                    onboarding_completed: Boolean(u.onboarding_completed),
                    is_active: Boolean(u.is_active),
                    created_at: u.created_at ? new Date(u.created_at) : new Date(),
                    updated_at: new Date()
                  }
                },
                { upsert: true }
              );
            }
          }
        } catch (e) {
          console.warn('[Sync Users Notice]', e.message);
        }
        resolve();
      });
    });

    // B. Sync Partners across databases
    await new Promise((resolve) => {
      db.all(`
        SELECT wp.*, u.full_name as user_name, u.phone as user_phone, u.email as user_email
        FROM worker_profiles wp
        LEFT JOIN users u ON wp.user_id = u.id
      `, [], async (err, workers) => {
        if (err || !workers) return resolve();
        try {
          const partnersCols = [mongo.collection('partners'), partnerDb.collection('partners')];

          for (const col of partnersCols) {
            for (const w of workers) {
              let packages = [];
              let categories = [w.trade_category || 'plumber'];
              try { if (w.packages_json) packages = JSON.parse(w.packages_json); } catch (e) {}
              try { if (w.categories_json) categories = JSON.parse(w.categories_json); } catch (e) {}

              // Get bank KYC info if present
              const bankRow = await new Promise((r) => {
                db.get(`SELECT * FROM worker_bank_kyc WHERE worker_id = ? OR worker_id = ?`, [w.id, w.user_id], (bErr, row) => r(row));
              });

              // Get portfolio items if present
              const portfolios = await new Promise((r) => {
                db.all(`SELECT * FROM worker_portfolios WHERE worker_id = ? OR worker_id = ?`, [w.id, w.user_id], (pErr, rows) => r(rows || []));
              });

              const partnerId = `KP-${(w.id || '').replace(/\D/g, '').slice(-4) || '8219'}`;

              await col.updateOne(
                { $or: [{ id: w.id }, { userId: w.user_id }] },
                {
                  $set: {
                    id: w.id,
                    partnerId,
                    userId: w.user_id,
                    name: w.user_name || 'Verified Partner',
                    phone: w.user_phone || '+91 98765 43210',
                    email: w.user_email || '',
                    tradeCategory: w.trade_category || 'plumber',
                    categories: Array.from(new Set(categories)).filter(Boolean),
                    tradeTitle: w.trade_title || 'Home Service Specialist',
                    locality: w.locality || 'Andheri West, Mumbai',
                    city: w.city || 'Mumbai',
                    experienceYears: w.experience_years || 1,
                    visitingCharge: w.visiting_charge || 149,
                    dailyRate: w.daily_rate || 650,
                    hourlyRate: w.hourly_rate || 120,
                    bio: w.bio || 'Skilled Mumbai partner on kaam.',
                    isAvailable: Boolean(w.is_available),
                    isAccountLocked: Boolean(w.is_account_locked),
                    completedJobsCount: w.completed_jobs_count || 0,
                    ratingAverage: w.rating_average || 5.0,
                    packages: Array.isArray(packages) ? packages : [],
                    bank: {
                      holder: bankRow?.account_holder_name || w.user_name || 'Verified Partner',
                      upi: bankRow?.upi_id || `${(w.user_phone || '9876543210').replace(/\D/g, '')}@paytm`,
                      upiPhone: bankRow?.upi_phone || w.user_phone || '',
                      payoutMode: 'UPI Instant Payout',
                      bankName: bankRow?.bank_name || 'UPI Direct',
                      accountNumber: bankRow?.account_number || '',
                      ifscCode: bankRow?.ifsc_code || ''
                    },
                    portfolio: portfolios.map(p => ({
                      id: p.id,
                      title: p.title,
                      category: p.category_tag,
                      url: p.image_url,
                      description: p.description
                    })),
                    location: {
                      latitude: w.latitude || 19.1363,
                      longitude: w.longitude || 72.8277
                    },
                    updatedAt: new Date()
                  }
                },
                { upsert: true }
              );
            }
          }
        } catch (e) {
          console.warn('[Sync Partners Notice]', e.message);
        }
        resolve();
      });
    });

    // C. Sync Clients & Prune Obsolete Clients across kaam_client_db & kaam_db
    await new Promise((resolve) => {
      db.all(`
        SELECT u.* 
        FROM users u 
        WHERE u.role = 'CLIENT' 
           OR (u.role != 'WORKER' AND u.role != 'ADMIN' AND u.id IN (SELECT DISTINCT client_id FROM job_requests))
      `, [], async (err, clientUsers) => {
        if (err || !clientUsers) return resolve();
        try {
          const clientsCols = [mongo.collection('clients'), clientDb.collection('clients')];
          const activeClientIds = [];

          for (const u of clientUsers) {
            const clientId = `KC-${(u.id || '').replace(/\D/g, '').slice(-4) || '1042'}`;
            activeClientIds.push(u.id);

            // Compute booking metrics for this client
            const stats = await new Promise((r) => {
              db.get(`
                SELECT 
                  COUNT(*) as total_bookings,
                  SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_bookings,
                  SUM(CASE WHEN status = 'COMPLETED' THEN agreed_total_fee ELSE 0 END) as total_spent
                FROM job_requests
                WHERE client_id = ? OR client_email = ?
              `, [u.id, u.email], (sErr, row) => r(row || {}));
            });

            // Get preferred categories
            const cats = await new Promise((r) => {
              db.all(`
                SELECT DISTINCT category_title 
                FROM job_requests 
                WHERE (client_id = ? OR client_email = ?) AND category_title IS NOT NULL
              `, [u.id, u.email], (cErr, rows) => r((rows || []).map(r => r.category_title)));
            });

            // Get saved addresses from bookings
            const addresses = await new Promise((r) => {
              db.all(`
                SELECT DISTINCT location_address 
                FROM job_requests 
                WHERE (client_id = ? OR client_email = ?) AND location_address IS NOT NULL
              `, [u.id, u.email], (aErr, rows) => r((rows || []).map(r => r.location_address)));
            });

            const savedAddresses = addresses.map((addr, idx) => ({
              label: idx === 0 ? 'Home' : 'Other',
              address: addr,
              locality: u.locality || 'Mumbai',
              city: 'Mumbai',
              state: u.state || 'Maharashtra',
              isDefault: idx === 0
            }));

            if (savedAddresses.length === 0 && u.address) {
              savedAddresses.push({
                label: 'Home',
                address: u.address,
                locality: u.locality || 'Mumbai',
                city: 'Mumbai',
                state: u.state || 'Maharashtra',
                isDefault: true
              });
            }

            const clientDoc = {
              id: u.id,
              clientId,
              userId: u.id,
              fullName: u.full_name,
              name: u.full_name,
              phone: u.phone,
              email: u.email ? u.email.toLowerCase() : '',
              secondaryPhone: u.secondary_phone || '',
              locality: u.locality || 'Mumbai',
              landmark: u.landmark || '',
              city: 'Mumbai',
              state: u.state || 'Maharashtra',
              pincode: u.pincode || '',
              address: u.address || (savedAddresses[0]?.address || 'Mumbai, Maharashtra'),
              location: {
                latitude: u.latitude || null,
                longitude: u.longitude || null
              },
              savedAddresses,
              totalBookingsCount: stats.total_bookings || 0,
              completedBookingsCount: stats.completed_bookings || 0,
              totalSpent: stats.total_spent || 0,
              preferredCategories: cats,
              ratingAverage: 5.0,
              onboardingCompleted: Boolean(u.onboarding_completed ?? true),
              isActive: Boolean(u.is_active ?? true),
              updatedAt: new Date()
            };

            for (const col of clientsCols) {
              await col.updateOne(
                { $or: [{ id: u.id }, { userId: u.id }, { email: u.email }] },
                { $set: clientDoc },
                { upsert: true }
              );
            }
          }
        } catch (e) {
          console.warn('[Sync Clients Notice]', e.message);
        }
        resolve();
      });
    });

    // D. Sync Bookings across kaam_client_db & kaam_db
    await new Promise((resolve) => {
      db.all(`SELECT * FROM job_requests`, [], async (err, jobs) => {
        if (err || !jobs) return resolve();
        try {
          const bookingsCols = [mongo.collection('bookings'), clientDb.collection('bookings')];

          for (const col of bookingsCols) {
            for (const j of jobs) {
              let packages = [];
              try { if (j.packages_json) packages = JSON.parse(j.packages_json); } catch (e) {}

              await col.updateOne(
                { id: j.id },
                {
                  $set: {
                    id: j.id,
                    jobId: j.id,
                    clientId: j.client_id,
                    clientName: j.client_name || 'Client',
                    clientPhone: j.client_phone || '',
                    clientEmail: j.client_email || '',
                    workerId: j.worker_id,
                    workerName: j.worker_name || 'Partner',
                    workerPhone: j.worker_phone || '',
                    tradeCategory: j.category_title || 'General Service',
                    categoryTitle: j.category_title || 'General Service',
                    workDescription: j.work_description || '',
                    locationAddress: j.location_address || '',
                    timeSlot: j.time_slot || '',
                    packages: Array.isArray(packages) ? packages : [],
                    agreedTotalFee: Number(j.agreed_total_fee || 0),
                    paymentMode: j.payment_mode || 'DIRECT_CASH',
                    paymentStatus: j.status === 'COMPLETED' ? 'PAID' : 'PENDING',
                    platformFeeAmount: Number(j.platform_fee_amount || 0),
                    workerNetPayout: Number(j.worker_net_payout || 0),
                    status: j.status || 'REQUESTED',
                    completionCode: j.completion_code || '',
                    completedAt: j.completed_at ? new Date(j.completed_at) : null,
                    workerUpi: j.worker_upi || '',
                    workerUpiPhone: j.worker_upi_phone || '',
                    workerUpiHolder: j.worker_upi_holder || '',
                    createdAt: j.created_at ? new Date(j.created_at) : new Date(),
                    updatedAt: new Date()
                  }
                },
                { upsert: true }
              );
            }
          }
        } catch (e) {
          console.warn('[Sync Bookings Notice]', e.message);
        }
        resolve();
      });
    });

    // E. Sync KYC Records across kaam_partner_db & kaam_db
    await new Promise((resolve) => {
      db.all(`SELECT * FROM worker_bank_kyc`, [], async (err, kycList) => {
        if (err || !kycList) return resolve();
        try {
          const kycCols = [mongo.collection('kyc_records'), partnerDb.collection('kyc_records')];

          for (const col of kycCols) {
            for (const k of kycList) {
              await col.updateOne(
                { id: k.id },
                {
                  $set: {
                    id: k.id,
                    workerId: k.worker_id,
                    accountHolderName: k.account_holder_name,
                    bankName: k.bank_name,
                    accountNumber: k.account_number,
                    ifscCode: k.ifsc_code,
                    upiId: k.upi_id,
                    upiPhone: k.upi_phone || '',
                    govtIdType: k.govt_id_type || 'AADHAAR',
                    govtIdNumber: k.govt_id_number,
                    aadhaarDocUrl: k.govt_id_document_url || '',
                    status: k.kyc_verified ? 'VERIFIED' : 'PENDING',
                    rejectionReason: k.rejection_reason || '',
                    verifiedAt: k.verified_at ? new Date(k.verified_at) : null,
                    updatedAt: new Date()
                  }
                },
                { upsert: true }
              );
            }
          }
        } catch (e) {
          console.warn('[Sync KYC Notice]', e.message);
        }
        resolve();
      });
    });

    // F. Sync Platform Dues across kaam_partner_db & kaam_db
    await new Promise((resolve) => {
      db.all(`SELECT * FROM commission_dues_36h`, [], async (err, dues) => {
        if (err || !dues) return resolve();
        try {
          const duesCols = [mongo.collection('platform_dues'), partnerDb.collection('platform_dues')];

          for (const col of duesCols) {
            for (const d of dues) {
              await col.updateOne(
                { id: d.id },
                {
                  $set: {
                    id: d.id,
                    jobId: d.job_id,
                    workerId: d.worker_id,
                    commissionAmount: Number(d.amount_due || 0),
                    dueDate: d.due_expires_at ? new Date(d.due_expires_at) : new Date(Date.now() + 36 * 3600 * 1000),
                    status: d.status || 'PENDING',
                    paidAt: d.paid_at ? new Date(d.paid_at) : null,
                    paymentTransactionRef: d.payment_transaction_ref || '',
                    updatedAt: new Date()
                  }
                },
                { upsert: true }
              );
            }
          }
        } catch (e) {
          console.warn('[Sync Dues Notice]', e.message);
        }
        resolve();
      });
    });

    // G. Two-Way Hydration: Pull any Atlas records into local SQLite if missing
    await hydrateFromAtlasToSQLite();

    console.log('🍃 [kaam MongoDB Atlas] Successfully synchronized real data to kaam_client_db, kaam_partner_db & kaam_db (users, partners, clients, bookings, kyc_records, platform_dues)');
  } catch (error) {
    console.warn('⚠️ [kaam MongoDB Atlas Sync Error]', error.message);
  } finally {
    isSyncing = false;
  }
};

/**
 * Hydrates cloud MongoDB Atlas records into local SQLite database.
 * Ensures new accounts created across different instances/sessions are never lost.
 */
export const hydrateFromAtlasToSQLite = async () => {
  if (!isMongoConnected()) return;
  try {
    const mongo = getMongoDb();
    if (!mongo) return;
    const partnerDb = mongo.useDb('kaam_partner_db');
    const clientDb = mongo.useDb('kaam_client_db');

    // 1. Hydrate Users from Atlas into SQLite
    const atlasUsers = await mongo.collection('users').find({}).toArray();
    for (const u of atlasUsers) {
      if (!u.id) continue;
      await new Promise(r => {
        db.run(
          `INSERT OR IGNORE INTO users (id, phone, email, password_hash, role, full_name, secondary_phone, locality, landmark, state, pincode, address, onboarding_completed, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            u.id,
            u.phone || '',
            (u.email || '').toLowerCase(),
            u.password_hash || `atlas-user-${u.id}`,
            u.role || 'CLIENT',
            u.full_name || u.name || 'User',
            u.secondary_phone || '',
            u.locality || '',
            u.landmark || '',
            u.state || 'Maharashtra',
            u.pincode || '',
            u.address || '',
            u.onboarding_completed ? 1 : 0,
            u.is_active !== false ? 1 : 0
          ],
          () => r()
        );
      });
    }

    // 2. Hydrate Partners from Atlas into SQLite
    const pCols = [partnerDb.collection('partners'), mongo.collection('partners')];
    const seenPartnerKeys = new Set();

    for (const pCol of pCols) {
      const atlasPartners = await pCol.find({}).toArray();
      for (const p of atlasPartners) {
        const partnerKey = p.id || p.partnerId;
        if (!partnerKey || seenPartnerKeys.has(partnerKey)) continue;
        seenPartnerKeys.add(partnerKey);

        const wId = p.id || `w-${p.partnerId || Date.now()}`;
        const uId = p.userId || wId;

        // Ensure user account exists
        await new Promise(r => {
          db.run(
            `INSERT OR IGNORE INTO users (id, phone, email, password_hash, role, full_name, locality)
             VALUES (?, ?, ?, ?, 'WORKER', ?, ?)`,
            [uId, p.phone || '', (p.email || '').toLowerCase(), `partner-pass-${wId}`, p.name || 'Partner', p.locality || 'Mumbai'],
            () => r()
          );
        });

        const pLat = Number(p.latitude || p.location?.latitude || 19.1363);
        const pLng = Number(p.longitude || p.location?.longitude || 72.8277);

        await new Promise(r => {
          db.run(
            `INSERT OR REPLACE INTO worker_profiles (id, user_id, trade_category, trade_title, daily_rate, hourly_rate, locality, city, bio, is_available, is_account_locked, kyc_status, rating_average, completed_jobs_count, latitude, longitude, packages_json, categories_json, visiting_charge, experience_years)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED', ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              wId,
              uId,
              p.tradeCategory || 'plumber',
              p.tradeTitle || 'Skilled Trade Specialist',
              Number(p.dailyRate || 650),
              Number(p.hourlyRate || 120),
              p.locality || 'Andheri West, Mumbai',
              p.city || 'Mumbai',
              p.bio || 'Skilled Mumbai partner on kaam.',
              p.isAvailable !== false ? 1 : 0,
              p.isAccountLocked ? 1 : 0,
              Number(p.ratingAverage || 5.0),
              Number(p.completedJobsCount || 0),
              pLat,
              pLng,
              JSON.stringify(Array.isArray(p.packages) ? p.packages : []),
              JSON.stringify(Array.isArray(p.categories) && p.categories.length > 0 ? p.categories : [p.tradeCategory || 'plumber']),
              Number(p.visitingCharge || 149),
              Number(p.experienceYears || 1)
            ],
            () => r()
          );
        });
      }
    }

    // 3. Hydrate Bookings from Atlas into SQLite (Never lose booking requests across Render restarts)
    const bCols = [mongo.collection('bookings'), clientDb.collection('bookings')];
    const seenBookingIds = new Set();

    for (const bCol of bCols) {
      const atlasBookings = await bCol.find({}).toArray();
      for (const b of atlasBookings) {
        const jobId = b.id || b.jobId;
        if (!jobId || seenBookingIds.has(jobId)) continue;
        seenBookingIds.add(jobId);

        await new Promise(r => {
          db.run(
            `INSERT OR IGNORE INTO job_requests 
             (id, client_id, worker_id, worker_name, worker_phone, category_title, client_email, client_name, client_phone, work_description, location_address, start_date, duration_days, agreed_total_fee, payment_mode, platform_fee_amount, worker_net_payout, status, completion_code, time_slot, packages_json, worker_upi, worker_upi_phone, worker_upi_holder, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              jobId,
              b.clientId || 'u-client-1042',
              b.workerId || 'w-1791107064294',
              b.workerName || 'Verified Partner',
              b.workerPhone || '+91 98765 43210',
              b.tradeCategory || b.categoryTitle || 'General Service',
              b.clientEmail || 'client@kaam.com',
              b.clientName || 'Customer',
              b.clientPhone || '',
              b.workDescription || 'Service Booking',
              b.locationAddress || 'Mumbai',
              b.startDate || (b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
              b.durationDays || 1,
              Number(b.agreedTotalFee || 500),
              b.paymentMode || 'DIRECT_CASH',
              Number(b.platformFeeAmount || Math.round((b.agreedTotalFee || 500) * 0.08)),
              Number(b.workerNetPayout || ((b.agreedTotalFee || 500) - Math.round((b.agreedTotalFee || 500) * 0.08))),
              b.status || 'REQUESTED',
              b.completionCode || '',
              b.timeSlot || null,
              JSON.stringify(Array.isArray(b.packages) ? b.packages : []),
              b.workerUpi || null,
              b.workerUpiPhone || null,
              b.workerUpiHolder || null,
              b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString()
            ],
            () => r()
          );
        });
      }
    }
  } catch (hErr) {
    console.warn('[Hydrate Atlas Notice]', hErr.message);
  }
};

// 3. Automated Server Auto-Update Scheduler (Every 30 seconds)
let autoSyncInterval = null;
export const startAutoSync = () => {
  if (autoSyncInterval) return;
  autoSyncInterval = setInterval(() => {
    if (isMongoConnected()) {
      syncAllToMongo().catch(() => {});
    }
  }, 30000);
  console.log('⚡ [kaam Dual-Sync Engine] Automated background database auto-update monitor started (30s interval).');
};

// 3. Real-time upsert helpers for controllers
export const upsertUserToMongo = async (userData) => {
  if (!isMongoConnected() || !userData?.id) return;
  try {
    const mongo = getMongoDb();
    if (!mongo) return;
    const clientDb = mongo.useDb('kaam_client_db');
    const partnerDb = mongo.useDb('kaam_partner_db');
    const cols = [mongo.collection('users'), clientDb.collection('users'), partnerDb.collection('users')];

    for (const col of cols) {
      await col.updateOne(
        { id: userData.id },
        {
          $set: {
            ...userData,
            updated_at: new Date()
          }
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn('⚠️ [Mongo User Upsert Notice]', err.message);
  }
};

export const upsertPartnerToMongo = async (partnerData) => {
  if (!isMongoConnected() || (!partnerData?.id && !partnerData?.userId)) return;
  try {
    const mongo = getMongoDb();
    if (!mongo) return;
    const partnerDb = mongo.useDb('kaam_partner_db');
    const cols = [mongo.collection('partners'), partnerDb.collection('partners')];
    const filter = partnerData.userId ? { userId: partnerData.userId } : { id: partnerData.id };

    for (const col of cols) {
      await col.updateOne(
        filter,
        {
          $set: {
            ...partnerData,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn('⚠️ [Mongo Partner Upsert Notice]', err.message);
  }
};

export const upsertClientToMongo = async (clientData) => {
  if (!isMongoConnected() || (!clientData?.id && !clientData?.userId)) return;
  try {
    const mongo = getMongoDb();
    if (!mongo) return;
    const clientDb = mongo.useDb('kaam_client_db');
    const cols = [mongo.collection('clients'), clientDb.collection('clients')];
    const filter = clientData.userId ? { userId: clientData.userId } : { id: clientData.id };
    const existing = await mongo.collection('clients').findOne(filter);
    const num = Math.floor(1000 + Math.random() * 9000);
    const clientId = clientData.clientId || existing?.clientId || `KC-${num}`;

    for (const col of cols) {
      await col.updateOne(
        filter,
        {
          $set: {
            ...clientData,
            clientId,
            updatedAt: new Date()
          },
          $setOnInsert: {
            totalBookingsCount: 0,
            completedBookingsCount: 0,
            totalSpent: 0,
            preferredCategories: [],
            ratingAverage: 5.0,
            isActive: true,
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn('⚠️ [Mongo Client Upsert Notice]', err.message);
  }
};

export const upsertBookingToMongo = async (bookingData) => {
  if (!isMongoConnected() || !bookingData?.id) return;
  try {
    const mongo = getMongoDb();
    if (!mongo) return;
    const clientDb = mongo.useDb('kaam_client_db');
    const cols = [mongo.collection('bookings'), clientDb.collection('bookings')];

    for (const col of cols) {
      await col.updateOne(
        { id: bookingData.id },
        {
          $set: {
            ...bookingData,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn('⚠️ [Mongo Booking Upsert Notice]', err.message);
  }
};

export const upsertKycToMongo = async (kycData) => {
  if (!isMongoConnected() || !kycData?.id) return;
  try {
    const mongo = getMongoDb();
    if (!mongo) return;
    const partnerDb = mongo.useDb('kaam_partner_db');
    const cols = [mongo.collection('kyc_records'), partnerDb.collection('kyc_records')];

    for (const col of cols) {
      await col.updateOne(
        { id: kycData.id },
        {
          $set: {
            ...kycData,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn('⚠️ [Mongo KYC Upsert Notice]', err.message);
  }
};

export const upsertDuesToMongo = async (duesData) => {
  if (!isMongoConnected() || !duesData?.id) return;
  try {
    const mongo = getMongoDb();
    if (!mongo) return;
    const partnerDb = mongo.useDb('kaam_partner_db');
    const cols = [mongo.collection('platform_dues'), partnerDb.collection('platform_dues')];

    for (const col of cols) {
      await col.updateOne(
        { id: duesData.id },
        {
          $set: {
            ...duesData,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn('⚠️ [Mongo Dues Upsert Notice]', err.message);
  }
};


