import db from '../config/database.js';
import { sendJobStatusEmail, sendPartnerNewJobRequestEmail } from '../services/emailOtpService.js';
import { isPartnerDbConnected, getMongoDb, upsertBookingToMongo, upsertDuesToMongo, upsertClientToMongo } from '../config/mongoose.js';
import { getPartnerModel } from '../models/PartnerModel.js';
import { isWithinMumbaiRange } from '../services/redisSpatialService.js';
import { CANONICAL_VERIFIED_PARTNERS } from '../constants/verifiedPartners.js';


// Get all jobs for cross-app real-time syncing (with optional client/worker filters)
export const getAllJobs = (req, res) => {
  const { clientId, clientEmail, clientPhone, workerId } = req.query;

  let query = `
    SELECT j.*, 
            COALESCE(j.category_title, wp.trade_title, 'Home Service') as trade_title, 
            COALESCE(j.worker_name, u_worker.full_name, 'Verified Service Partner') as worker_name, 
            COALESCE(j.worker_phone, u_worker.phone, 'Available on App') as worker_phone,
            COALESCE(j.client_name, u_client.full_name, 'Homeowner') as client_name,
            COALESCE(j.client_phone, u_client.phone) as client_phone,
            COALESCE(j.category_title, wp.trade_title, 'Home Service') as category_title,
            COALESCE(j.worker_upi, wbk.upi_id, '') as worker_upi,
            COALESCE(j.worker_upi_phone, wbk.upi_phone, '') as worker_upi_phone,
            COALESCE(j.worker_upi_holder, wbk.account_holder_name, j.worker_name, u_worker.full_name, 'Verified Partner') as worker_upi_holder,
            COALESCE(wp.locality, 'Mumbai') as worker_locality,
            COALESCE(wp.rating_average, 5.0) as worker_rating
     FROM job_requests j
     LEFT JOIN worker_profiles wp ON (j.worker_id = wp.id OR j.worker_id = wp.user_id)
     LEFT JOIN users u_worker ON (wp.user_id = u_worker.id OR j.worker_id = u_worker.id)
     LEFT JOIN users u_client ON j.client_id = u_client.id
     LEFT JOIN worker_bank_kyc wbk ON (j.worker_id = wbk.worker_id OR wp.id = wbk.worker_id OR wp.user_id = wbk.worker_id)
  `;

  const whereParts = [];
  const params = [];

  if (clientId) {
    whereParts.push('(j.client_id = ? OR u_client.id = ?)');
    params.push(String(clientId).trim(), String(clientId).trim());
  }
  if (clientEmail) {
    whereParts.push('(LOWER(j.client_email) = LOWER(?) OR LOWER(u_client.email) = LOWER(?))');
    params.push(String(clientEmail).trim(), String(clientEmail).trim());
  }
  if (clientPhone) {
    const digits = String(clientPhone).replace(/\D/g, '');
    if (digits) {
      whereParts.push('(j.client_phone LIKE ? OR u_client.phone LIKE ?)');
      params.push(`%${digits}%`, `%${digits}%`);
    }
  }
  if (workerId) {
    whereParts.push('(j.worker_id = ? OR wp.id = ? OR wp.user_id = ?)');
    params.push(String(workerId).trim(), String(workerId).trim(), String(workerId).trim());
  }

  if (whereParts.length > 0) {
    query += ` WHERE ${whereParts.join(' OR ')}`;
  }

  query += ` ORDER BY j.created_at DESC`;

  db.all(query, params, async (err, jobs) => {
    if (!err && jobs && jobs.length > 0) {
      return res.json({ count: jobs.length, jobs });
    }

    // Direct MongoDB Atlas fallback if SQLite returned 0 jobs
    if (isPartnerDbConnected()) {
      try {
        const mongo = getMongoDb();
        if (mongo) {
          const mQuery = {};
          if (clientId) mQuery.$or = [{ clientId }, { id: clientId }];
          if (clientEmail) mQuery.clientEmail = new RegExp(clientEmail, 'i');
          if (workerId) mQuery.$or = [{ workerId }, { worker_id: workerId }];

          const mBookings = await mongo.collection('bookings').find(mQuery).sort({ createdAt: -1 }).toArray();
          if (mBookings && mBookings.length > 0) {
            const mapped = mBookings.map(b => ({
              id: b.id || b.jobId,
              client_id: b.clientId,
              worker_id: b.workerId,
              worker_name: b.workerName || 'Verified Partner',
              worker_phone: b.workerPhone || '+91 98765 43210',
              client_name: b.clientName || 'Customer',
              client_email: b.clientEmail || '',
              client_phone: b.clientPhone || '',
              category_title: b.categoryTitle || b.tradeCategory || 'Home Service',
              work_description: b.workDescription || '',
              location_address: b.locationAddress || 'Mumbai',
              agreed_total_fee: Number(b.agreedTotalFee || 500),
              payment_mode: b.paymentMode || 'DIRECT_CASH',
              status: b.status || 'REQUESTED',
              completion_code: b.completionCode || '',
              created_at: b.createdAt
            }));
            return res.json({ count: mapped.length, jobs: mapped });
          }
        }
      } catch (mErr) {
        console.warn('MongoDB fallback notice in getAllJobs:', mErr.message);
      }
    }

    if (err) {
      db.all(`SELECT * FROM job_requests ORDER BY created_at DESC`, [], (err2, simpleJobs) => {
        if (err2) return res.status(500).json({ error: err2.message });
        return res.json({ count: simpleJobs.length, jobs: simpleJobs });
      });
    } else {
      res.json({ count: 0, jobs: [] });
    }
  });
};

// Get jobs specifically for a worker by ID/userID/partnerId/phone
export const getJobsByWorker = async (req, res) => {
  const { workerId } = req.params;
  const targetId = String(workerId || '').trim();
  const digitsOnly = targetId.replace(/\D/g, '');

  const equivalentIds = new Set([targetId, `w-${targetId}`, `u-${targetId}`]);
  if (digitsOnly) {
    equivalentIds.add(digitsOnly);
    equivalentIds.add(`+91${digitsOnly}`);
  }

  // Canonical Alias Expansion for Surya Yadav (links both Surya partner profiles)
  const isSurya = 
    targetId.toLowerCase().includes('surya') ||
    targetId === 'w-1791107064294' ||
    targetId === 'w-1791044807171' ||
    targetId === 'g-user-1791107064285' ||
    targetId === 'QaUznFo8r3edJql6dQn9ACwFIcZ2' ||
    targetId === 'KP-4294' ||
    targetId === 'KP-0717' ||
    targetId === 'sy623806@gmail.com' ||
    targetId === 'sy191101400@gmail.com' ||
    digitsOnly.includes('9372639131') ||
    digitsOnly.includes('9876500000') ||
    digitsOnly.includes('9111122222');

  // Canonical Alias Expansion for Sujal Yadav
  const isSujal = 
    targetId.toLowerCase().includes('sujal') ||
    targetId === 'w-1791124150328' ||
    targetId === 'u-1791124150235' ||
    targetId === 'KP-0328' ||
    targetId === 'ysujal26@gmail.com' ||
    digitsOnly.includes('9653192752');

  if (isSurya) {
    [
      'w-1791107064294',
      'w-1791044807171',
      'g-user-1791107064285',
      'QaUznFo8r3edJql6dQn9ACwFIcZ2',
      'KP-4294',
      'KP-0717',
      '9372639131',
      '+91 9372639131',
      '+919372639131',
      '9876500000',
      '+91 98765 00000',
      '+919876500000',
      '9111122222',
      '+91 91111 22222',
      '+919111122222'
    ].forEach(id => equivalentIds.add(id));
  }

  if (isSujal) {
    [
      'w-1791124150328',
      'u-1791124150235',
      'KP-0328',
      '9653192752',
      '+91 9653192752',
      '+919653192752'
    ].forEach(id => equivalentIds.add(id));
  }

  // Lookup in MongoDB Atlas if connected
  if (isPartnerDbConnected()) {
    try {
      const Partner = getPartnerModel();
      const partner = await Partner.findOne({
        $or: [
          { id: targetId },
          { userId: targetId },
          { partnerId: targetId },
          { phone: new RegExp(digitsOnly, 'i') }
        ]
      }).lean();

      if (partner) {
        if (partner.id) equivalentIds.add(String(partner.id));
        if (partner.userId) equivalentIds.add(String(partner.userId));
        if (partner.partnerId) equivalentIds.add(String(partner.partnerId));
        if (partner.phone) equivalentIds.add(String(partner.phone));
      }
    } catch (err) {
      console.warn('MongoDB partner lookup notice in getJobsByWorker:', err.message);
    }
  }

  const idsArray = Array.from(equivalentIds);
  const placeholders = idsArray.map(() => '?').join(',');
  const suryaNameCondition = isSurya ? "OR LOWER(j.worker_name) LIKE '%surya%' OR LOWER(j.worker_name) LIKE '%s. yadav%' OR LOWER(j.worker_name) LIKE '%s.yadav%'" : "";
  const sujalNameCondition = isSujal ? "OR LOWER(j.worker_name) LIKE '%sujal%'" : "";

  db.all(
    `SELECT j.*, 
            COALESCE(j.category_title, wp.trade_title, 'Home Service') as trade_title, 
            COALESCE(j.worker_name, u_worker.full_name, 'Verified Service Partner') as worker_name, 
            COALESCE(j.worker_phone, u_worker.phone, 'Available on App') as worker_phone,
            COALESCE(j.client_name, u_client.full_name, 'Homeowner') as client_name,
            COALESCE(j.client_phone, u_client.phone) as client_phone,
            COALESCE(j.category_title, wp.trade_title, 'Home Service') as category_title,
            COALESCE(j.worker_upi, wbk.upi_id, '') as worker_upi,
            COALESCE(j.worker_upi_phone, wbk.upi_phone, '') as worker_upi_phone,
            COALESCE(j.worker_upi_holder, wbk.account_holder_name, j.worker_name, u_worker.full_name, 'Verified Partner') as worker_upi_holder,
            COALESCE(wp.locality, 'Mumbai') as worker_locality,
            COALESCE(wp.rating_average, 5.0) as worker_rating
     FROM job_requests j
     LEFT JOIN worker_profiles wp ON (j.worker_id = wp.id OR j.worker_id = wp.user_id)
     LEFT JOIN users u_worker ON (wp.user_id = u_worker.id OR j.worker_id = u_worker.id)
     LEFT JOIN users u_client ON j.client_id = u_client.id
     LEFT JOIN worker_bank_kyc wbk ON (j.worker_id = wbk.worker_id OR wp.id = wbk.worker_id OR wp.user_id = wbk.worker_id)
     WHERE j.worker_id IN (${placeholders}) 
        OR wp.user_id IN (${placeholders})
        OR wp.id IN (${placeholders})
        ${suryaNameCondition}
        ${sujalNameCondition}
     ORDER BY j.created_at DESC`,
    [...idsArray, ...idsArray, ...idsArray],
    async (err, jobs) => {
      if (!err && jobs && jobs.length > 0) {
        return res.json({ count: jobs.length, jobs });
      }

      // Direct MongoDB Atlas fallback if SQLite returned 0 jobs
      if (isPartnerDbConnected()) {
        try {
          const mongo = getMongoDb();
          if (mongo) {
            const mQuery = {
              $or: [
                { workerId: { $in: idsArray } },
                { worker_id: { $in: idsArray } },
                ...(isSurya ? [{ workerName: new RegExp('surya|s\\.?\\s*yadav', 'i') }] : []),
                ...(isSujal ? [{ workerName: new RegExp('sujal', 'i') }] : [])
              ]
            };
            const mJobs = await mongo.collection('bookings').find(mQuery).sort({ createdAt: -1 }).toArray();
            if (mJobs && mJobs.length > 0) {
              const mapped = mJobs.map(b => ({
                id: b.id || b.jobId,
                client_id: b.clientId,
                worker_id: b.workerId,
                worker_name: b.workerName || 'Verified Partner',
                worker_phone: b.workerPhone || '+91 98765 43210',
                client_name: b.clientName || 'Customer',
                client_email: b.clientEmail || '',
                client_phone: b.clientPhone || '',
                category_title: b.categoryTitle || b.tradeCategory || 'Home Service',
                work_description: b.workDescription || '',
                location_address: b.locationAddress || 'Mumbai',
                agreed_total_fee: Number(b.agreedTotalFee || 500),
                payment_mode: b.paymentMode || 'DIRECT_CASH',
                status: b.status || 'REQUESTED',
                completion_code: b.completionCode || '',
                created_at: b.createdAt
              }));
              return res.json({ count: mapped.length, jobs: mapped });
            }
          }
        } catch (mErr) {
          console.warn('MongoDB fallback notice in getJobsByWorker:', mErr.message);
        }
      }

      if (err) {
        // Fallback to simpler query
        db.all(
          `SELECT * FROM job_requests ORDER BY created_at DESC`,
          [],
          (err2, allJobs) => {
            if (err2) return res.status(500).json({ error: err2.message });
            const filtered = (allJobs || []).filter(j => 
              idsArray.includes(String(j.worker_id)) ||
              (isSurya && String(j.worker_name || '').toLowerCase().includes('surya')) ||
              (isSujal && String(j.worker_name || '').toLowerCase().includes('sujal'))
            );
            res.json({ count: filtered.length, jobs: filtered });
          }
        );
      } else {
        res.json({ count: 0, jobs: [] });
      }
    }
  );
};

// Create a new job (Public/Demo Endpoint)
export const createJobPublic = (req, res) => {
  const {
    workerId,
    workerName,
    tradeTitle,
    categoryTitle,
    category_title: reqCategoryTitle,
    workerPhone,
    workerUpi,
    workerUpiPhone,
    workerUpiHolder,
    clientName,
    clientEmail,
    client_email: reqClientEmail,
    clientPhone,
    locationAddress,
    workDescription,
    agreedTotalFee,
    paymentMode,
    timeSlot,
    packagesJson
  } = req.body;

  if (!workerId || !workDescription || !locationAddress || !agreedTotalFee) {
    return res.status(400).json({ error: 'Missing required booking fields.' });
  }

  // Enforce Mumbai Operating Range Constraint
  const coords = req.body.coordinates;
  const isMumbai = isWithinMumbaiRange(coords?.lat, coords?.lng, locationAddress);
  if (!isMumbai) {
    return res.status(400).json({
      status: 'unavailable',
      isMumbai: false,
      message: 'Service was unavailable at this place, sorry for inconvenience!'
    });
  }

  let normalizedPaymentMode = 'DIRECT_CASH';
  if (paymentMode === 'PLATFORM_ESCROW' || paymentMode === 'UPI_QR' || paymentMode === 'ONLINE' || paymentMode === 'CARD') {
    normalizedPaymentMode = 'PLATFORM_ESCROW';
  } else {
    normalizedPaymentMode = 'DIRECT_CASH';
  }

  const finalClientId = req.body.clientId || req.body.client_id || (req.user && req.user.id) || `u-client-${Date.now()}`;
  const finalCategoryTitle = categoryTitle || reqCategoryTitle || tradeTitle || 'General Service';
  const finalClientEmail = clientEmail || reqClientEmail || 'client@kaam.com';
  const finalClientName = clientName || 'Verma Family (Homeowner)';
  const finalClientPhone = clientPhone || '+91 98111 00223';

  // Ensure PRAGMA foreign_keys = OFF is set on this connection
  db.run('PRAGMA foreign_keys = OFF;');

  // 1. Auto-ensure client exists in SQLite users table
  db.run(
    `INSERT OR IGNORE INTO users 
     (id, phone, email, password_hash, role, full_name, address, locality, state, onboarding_completed, is_active)
     VALUES (?, ?, ?, 'CLIENT_GUEST', 'CLIENT', ?, ?, 'Mumbai', 'Maharashtra', 1, 1)`,
    [finalClientId, finalClientPhone, finalClientEmail, finalClientName, locationAddress]
  );

  // 2. Resolve Worker: Map input workerId (which might be user_id, profile id, phone, or 'w-direct') to canonical worker profile
  const inputWorkerId = String(workerId || '').trim();
  const digitsOnly = inputWorkerId.replace(/\D/g, '');

  db.get(
    `SELECT wp.id as profile_id, wp.user_id, wp.trade_title, wp.locality, u.full_name, u.phone, u.email 
     FROM worker_profiles wp 
     LEFT JOIN users u ON wp.user_id = u.id 
     WHERE wp.id = ? OR wp.user_id = ? OR wp.id = ? OR wp.user_id = ?
        OR (? != '' AND (u.phone LIKE ? OR wp.id LIKE ?))`,
    [
      inputWorkerId,
      inputWorkerId,
      `w-${inputWorkerId}`,
      `u-${inputWorkerId}`,
      digitsOnly,
      `%${digitsOnly}%`,
      `%${digitsOnly}%`
    ],
    (wErr, wpRow) => {
      let effectiveWorkerId = inputWorkerId;
      let finalWorkerName = workerName || 'Verified Service Partner';
      let finalWorkerPhone = workerPhone || '+91 98765 43210';
      let finalWorkerEmail = req.body.workerEmail || req.body.worker_email;

      if (wpRow && wpRow.profile_id) {
        effectiveWorkerId = wpRow.profile_id;
        if (wpRow.full_name && (!workerName || workerName === 'Partner' || workerName === 'Verified Service Partner')) {
          finalWorkerName = wpRow.full_name;
        }
        if (wpRow.phone && (!finalWorkerPhone || finalWorkerPhone.includes('98765 43210'))) {
          finalWorkerPhone = wpRow.phone;
        }
        if (wpRow.email) {
          finalWorkerEmail = wpRow.email;
        }
      } else {
        // Fallback match against canonical verified partners
        const canonical = CANONICAL_VERIFIED_PARTNERS.find(p => 
          p.id === inputWorkerId || 
          p.userId === inputWorkerId || 
          p.partnerId === inputWorkerId ||
          (digitsOnly && p.phone.replace(/\D/g, '') === digitsOnly) ||
          (workerName && p.name.toLowerCase() === workerName.toLowerCase())
        ) || CANONICAL_VERIFIED_PARTNERS[0];

        if (canonical) {
          effectiveWorkerId = canonical.id;
          finalWorkerName = workerName && workerName !== 'Partner' ? workerName : canonical.name;
          finalWorkerPhone = workerPhone && !workerPhone.includes('98765 43210') ? workerPhone : canonical.phone;
          if (canonical.email) {
            finalWorkerEmail = canonical.email;
          }

          // Ensure profile row exists in worker_profiles
          db.run(
            `INSERT OR IGNORE INTO worker_profiles 
             (id, user_id, trade_category, trade_title, daily_rate, hourly_rate, locality, city, bio, is_available, is_account_locked, kyc_status, rating_average, completed_jobs_count, latitude, longitude)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Mumbai', ?, 1, 0, 'VERIFIED', 5.0, ?, ?, ?)`,
            [
              canonical.id,
              canonical.userId,
              canonical.tradeCategory || 'electrician',
              canonical.tradeTitle || 'Master Pro',
              canonical.dailyRate || 650,
              canonical.hourlyRate || 120,
              canonical.locality || 'Andheri West, Mumbai',
              canonical.bio || 'Skilled Mumbai partner.',
              canonical.completedJobsCount || 10,
              canonical.latitude || 19.1363,
              canonical.longitude || 72.8277
            ]
          );
        }
      }

      const jobId = `job-${Date.now()}`;
      const totalFee = Number(agreedTotalFee);
      const platformFee = Math.round(totalFee * 0.08); // 8% site fee
      const workerPayout = totalFee - platformFee;
      const nowISO = new Date().toISOString();

      const respondWithCreatedJob = () => {
        const newJob = {
          id: jobId,
          client_id: finalClientId,
          worker_id: effectiveWorkerId,
          worker_name: finalWorkerName,
          trade_title: tradeTitle || finalCategoryTitle,
          category_title: finalCategoryTitle,
          worker_phone: finalWorkerPhone,
          client_name: finalClientName,
          client_email: finalClientEmail,
          client_phone: finalClientPhone,
          location_address: locationAddress,
          work_description: workDescription,
          agreed_total_fee: totalFee,
          payment_mode: normalizedPaymentMode,
          platform_fee_amount: platformFee,
          status: 'REQUESTED',
          created_at: nowISO,
          time_slot: timeSlot || null,
          packages_json: packagesJson || null,
          worker_upi: workerUpi || null,
          worker_upi_phone: workerUpiPhone || null,
          worker_upi_holder: workerUpiHolder || finalWorkerName
        };

        // Dual-sync to MongoDB Atlas bookings collection in kaam_db
        let parsedPackages = [];
        try { if (packagesJson) parsedPackages = JSON.parse(packagesJson); } catch (e) {}

        upsertBookingToMongo({
          id: jobId,
          jobId,
          clientId: finalClientId,
          clientName: finalClientName,
          clientPhone: finalClientPhone,
          clientEmail: finalClientEmail,
          workerId: effectiveWorkerId,
          workerName: finalWorkerName,
          workerPhone: finalWorkerPhone,
          tradeCategory: finalCategoryTitle,
          categoryTitle: finalCategoryTitle,
          workDescription,
          locationAddress,
          timeSlot: timeSlot || '',
          packages: Array.isArray(parsedPackages) ? parsedPackages : [],
          agreedTotalFee: totalFee,
          platformFeeAmount: platformFee,
          workerNetPayout: workerPayout,
          paymentMode: normalizedPaymentMode,
          paymentStatus: 'PENDING',
          workerUpi: workerUpi || '',
          workerUpiPhone: workerUpiPhone || '',
          workerUpiHolder: workerUpiHolder || finalWorkerName,
          status: 'REQUESTED',
          completionCode: '',
          createdAt: new Date()
        });

        // Dual-sync client record to MongoDB Atlas clients collection in kaam_db
        const clientGeneratedId = `KC-${(finalClientId || '').replace(/\D/g, '').slice(-4) || '1042'}`;
        upsertClientToMongo({
          id: finalClientId,
          clientId: clientGeneratedId,
          userId: finalClientId,
          fullName: finalClientName,
          name: finalClientName,
          phone: finalClientPhone,
          email: finalClientEmail,
          address: locationAddress,
          locality: 'Mumbai',
          city: 'Mumbai',
          state: 'Maharashtra',
          savedAddresses: [{ label: 'Home', address: locationAddress, isDefault: true }],
          isActive: true,
          onboardingCompleted: true
        });

        if (!finalWorkerEmail && finalWorkerName.toLowerCase().includes('surya')) {
          finalWorkerEmail = 'sy623806@gmail.com';
        }

        // 1. Dispatch booking request placed email to client asynchronously (fire-and-forget)
        sendJobStatusEmail(finalClientEmail, 'REQUESTED', newJob).catch(e => console.warn('Client email dispatch notice:', e));

        // 2. Dispatch booking request alert email to partner asynchronously
        if (finalWorkerEmail) {
          sendPartnerNewJobRequestEmail(finalWorkerEmail, newJob).catch(e => console.warn('Partner email dispatch notice:', e));
        }

        return res.status(201).json({
          message: 'Hire request created successfully.',
          job: newJob
        });
      };

      db.run(
        `INSERT INTO job_requests 
         (id, client_id, worker_id, worker_name, worker_phone, category_title, client_email, client_name, client_phone, work_description, location_address, start_date, duration_days, agreed_total_fee, payment_mode, platform_fee_amount, worker_net_payout, status, created_at, time_slot, packages_json, worker_upi, worker_upi_phone, worker_upi_holder)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REQUESTED', ?, ?, ?, ?, ?, ?)`,
        [
          jobId,
          finalClientId,
          effectiveWorkerId,
          finalWorkerName,
          finalWorkerPhone,
          finalCategoryTitle,
          finalClientEmail,
          finalClientName,
          finalClientPhone,
          workDescription,
          locationAddress,
          nowISO.split('T')[0],
          1,
          totalFee,
          normalizedPaymentMode,
          platformFee,
          workerPayout,
          nowISO,
          timeSlot || null,
          packagesJson || null,
          workerUpi || null,
          workerUpiPhone || null,
          workerUpiHolder || null
        ],
        function (err) {
          if (err) {
            console.warn('⚠️ [job_requests Primary Insert Warning]:', err.message);
            // Fallback insert with fewer columns
            db.run(
              `INSERT INTO job_requests 
               (id, client_id, worker_id, worker_name, worker_phone, category_title, client_email, client_name, client_phone, work_description, location_address, start_date, duration_days, agreed_total_fee, payment_mode, platform_fee_amount, worker_net_payout, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REQUESTED', ?)`,
              [
                jobId,
                finalClientId,
                effectiveWorkerId,
                finalWorkerName,
                finalWorkerPhone,
                finalCategoryTitle,
                finalClientEmail,
                finalClientName,
                finalClientPhone,
                workDescription,
                locationAddress,
                nowISO.split('T')[0],
                1,
                totalFee,
                normalizedPaymentMode,
                platformFee,
                workerPayout,
                nowISO
              ],
              function (fErr) {
                if (fErr) {
                  console.error('❌ [job_requests Fallback Insert Error]:', fErr.message);
                  return res.status(500).json({ error: fErr.message });
                }
                return respondWithCreatedJob();
              }
            );
            return;
          }
          return respondWithCreatedJob();
        }
      );
    }
  );
};

// Worker Accepts Job
export const acceptJob = (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT j.*, 
            COALESCE(j.category_title, wp.trade_title, 'Home Service') as trade_title, 
            COALESCE(j.worker_name, u_worker.full_name, 'Verified Service Partner') as worker_name, 
            COALESCE(j.worker_phone, u_worker.phone, 'Available on App') as worker_phone,
            COALESCE(j.worker_upi, wbk.upi_id, '') as worker_upi,
            COALESCE(j.worker_upi_phone, wbk.upi_phone, '') as worker_upi_phone,
            COALESCE(j.worker_upi_holder, wbk.account_holder_name, j.worker_name, u_worker.full_name, 'Verified Partner') as worker_upi_holder,
            COALESCE(wp.locality, 'Mumbai') as worker_locality,
            COALESCE(wp.rating_average, 5.0) as worker_rating
     FROM job_requests j
     LEFT JOIN worker_profiles wp ON (j.worker_id = wp.id OR j.worker_id = wp.user_id)
     LEFT JOIN users u_worker ON (wp.user_id = u_worker.id OR j.worker_id = u_worker.id)
     LEFT JOIN worker_bank_kyc wbk ON (j.worker_id = wbk.worker_id OR wp.id = wbk.worker_id OR wp.user_id = wbk.worker_id)
     WHERE j.id = ?`,
    [id],
    (err, job) => {
      if (err || !job) return res.status(404).json({ error: 'Job not found.' });

      // Generate 6-digit confirmation code
      const completionCode = Math.floor(100000 + Math.random() * 900000).toString();

      db.run(
        `UPDATE job_requests SET status = 'ACCEPTED', completion_code = ? WHERE id = ?`,
        [completionCode, id],
        function (uErr) {
          if (uErr) return res.status(500).json({ error: uErr.message });
          
          job.completion_code = completionCode;
          job.completionCode = completionCode;
          job.status = 'ACCEPTED';

          // Dual-sync to MongoDB Atlas bookings collection in kaam_db
          upsertBookingToMongo({
            id,
            status: 'ACCEPTED',
            completionCode
          });

          // Dispatch acceptance confirmation email to client WITH the completion code
          const clientEmail = job.client_email || 'client@kaam.com';
          sendJobStatusEmail(clientEmail, 'ACCEPTED', job).catch(e => console.warn('Email dispatch warning:', e));

          res.json({
            message: 'Job accepted by worker. Confirmation email with completion code sent to client.',
            jobId: id,
            status: 'ACCEPTED',
            completionCode
          });
        }
      );
    }
  );
};

// Worker Rejects Job
export const rejectJob = (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT j.*, 
            COALESCE(j.category_title, wp.trade_title, 'Home Service') as trade_title, 
            COALESCE(j.worker_name, u_worker.full_name, 'Verified Service Partner') as worker_name, 
            COALESCE(j.worker_phone, u_worker.phone, 'Available on App') as worker_phone
     FROM job_requests j
     LEFT JOIN worker_profiles wp ON (j.worker_id = wp.id OR j.worker_id = wp.user_id)
     LEFT JOIN users u_worker ON (wp.user_id = u_worker.id OR j.worker_id = u_worker.id)
     WHERE j.id = ?`,
    [id],
    (err, job) => {
      db.run(`UPDATE job_requests SET status = 'REJECTED' WHERE id = ?`, [id], function (uErr) {
        if (uErr) return res.status(500).json({ error: uErr.message });

        // Dual-sync to MongoDB Atlas bookings collection in kaam_db
        upsertBookingToMongo({
          id,
          status: 'REJECTED'
        });

        // Dispatch rejection notification email to client
        if (job) {
          const clientEmail = job.client_email || 'client@kaam.com';
          sendJobStatusEmail(clientEmail, 'REJECTED', job).catch(e => console.warn('Email dispatch warning:', e));
        }

        res.json({ message: 'Job rejected by worker. Notification email sent to client.', jobId: id, status: 'REJECTED' });
      });
    }
  );
};

// Worker Verifies Code & Completes Job
export const verifyAndCompleteJob = (req, res) => {
  const { id } = req.params;
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Please enter the 6-digit completion code provided by the client.' });
  }

  const cleanInputCode = String(code).trim();
  const nowISO = new Date().toISOString();

  db.get(
    `SELECT j.*, 
            COALESCE(j.category_title, wp.trade_title, 'Home Service') as trade_title, 
            COALESCE(j.worker_name, u_worker.full_name, 'Verified Service Partner') as worker_name, 
            COALESCE(j.worker_phone, u_worker.phone, 'Available on App') as worker_phone
     FROM job_requests j
     LEFT JOIN worker_profiles wp ON (j.worker_id = wp.id OR j.worker_id = wp.user_id)
     LEFT JOIN users u_worker ON (wp.user_id = u_worker.id OR j.worker_id = u_worker.id)
     WHERE j.id = ?`,
    [id],
    (err, job) => {
      if (err || !job) return res.status(404).json({ error: 'Job request not found.' });

      if (job.status === 'COMPLETED') {
        return res.status(400).json({ error: 'This job has already been verified and marked as completed.' });
      }

      const expectedCode = String(job.completion_code || '').trim();
      if (!expectedCode || expectedCode !== cleanInputCode) {
        return res.status(400).json({
          error: 'Incorrect verification code. Please ask the client for the 6-digit code received in their email.'
        });
      }

      db.run(
        `UPDATE job_requests SET status = 'COMPLETED', completed_at = ? WHERE id = ?`,
        [nowISO, id],
        function (uErr) {
          if (uErr) return res.status(500).json({ error: uErr.message });

          // Increment completed jobs count
          db.run(
            `UPDATE worker_profiles SET completed_jobs_count = completed_jobs_count + 1 WHERE id = ? OR user_id = ?`,
            [job.worker_id, job.worker_id]
          );

          // Dual-sync to MongoDB Atlas bookings collection in kaam_db
          upsertBookingToMongo({
            id,
            status: 'COMPLETED',
            completedAt: new Date(nowISO),
            paymentStatus: 'PAID'
          });

          if (job.payment_mode === 'DIRECT_CASH') {
            const dueId = `due-${Date.now()}`;
            const expiresAt = new Date(Date.now() + 36 * 3600 * 1000).toISOString();

            db.run('PRAGMA foreign_keys = OFF;');
            db.run(
              `INSERT INTO commission_dues_36h (id, job_id, worker_id, amount_due, due_expires_at, status)
               VALUES (?, ?, ?, ?, ?, 'PENDING')`,
              [dueId, job.id, job.worker_id, job.platform_fee_amount || Math.round((job.agreed_total_fee || 0) * 0.08), expiresAt],
              function(cErr) {
                if (cErr) console.warn('⚠️ [commission_dues_36h insert notice]:', cErr.message);
              }
            );

            // Dual-sync to MongoDB Atlas platform_dues collection in kaam_db
            upsertDuesToMongo({
              id: dueId,
              jobId: job.id,
              workerId: job.worker_id,
              commissionAmount: job.platform_fee_amount || Math.round((job.agreed_total_fee || 0) * 0.08),
              dueDate: new Date(Date.now() + 36 * 3600 * 1000),
              status: 'PENDING'
            });
          }

          job.status = 'COMPLETED';
          job.completed_at = nowISO;

          // Dispatch completion email to client
          const clientEmail = job.client_email || 'client@kaam.com';
          sendJobStatusEmail(clientEmail, 'COMPLETED', job).catch(e => console.warn('Completion email dispatch warning:', e));

          res.json({
            success: true,
            message: 'Work verified and completed successfully! Completion email dispatched to client.',
            jobId: id,
            status: 'COMPLETED'
          });
        }
      );
    }
  );
};

// Worker Completes Job (Direct Fallback)
export const completeJob = (req, res) => {
  const { id } = req.params;
  const nowISO = new Date().toISOString();

  db.get(`SELECT * FROM job_requests WHERE id = ?`, [id], (err, job) => {
    if (err || !job) return res.status(404).json({ error: 'Job request not found.' });

    db.run(
      `UPDATE job_requests SET status = 'COMPLETED', completed_at = ? WHERE id = ?`,
      [nowISO, id],
      function (uErr) {
        if (uErr) return res.status(500).json({ error: uErr.message });

        // Dual-sync to MongoDB Atlas bookings collection in kaam_db
        upsertBookingToMongo({
          id,
          status: 'COMPLETED',
          completedAt: new Date(nowISO),
          paymentStatus: 'PAID'
        });

        if (job.payment_mode === 'DIRECT_CASH') {
          const dueId = `due-${Date.now()}`;
          const expiresAt = new Date(Date.now() + 36 * 3600 * 1000).toISOString();

          db.run('PRAGMA foreign_keys = OFF;');
          db.run(
            `INSERT INTO commission_dues_36h (id, job_id, worker_id, amount_due, due_expires_at, status)
             VALUES (?, ?, ?, ?, ?, 'PENDING')`,
            [dueId, job.id, job.worker_id, job.platform_fee_amount || Math.round((job.agreed_total_fee || 0) * 0.08), expiresAt],
            function(cErr) {
              if (cErr) console.warn('⚠️ [commission_dues_36h insert notice]:', cErr.message);
            }
          );

          // Dual-sync to MongoDB Atlas platform_dues collection in kaam_db
          upsertDuesToMongo({
            id: dueId,
            jobId: job.id,
            workerId: job.worker_id,
            commissionAmount: job.platform_fee_amount || Math.round((job.agreed_total_fee || 0) * 0.08),
            dueDate: new Date(Date.now() + 36 * 3600 * 1000),
            status: 'PENDING'
          });
        }

        job.status = 'COMPLETED';
        job.completed_at = nowISO;

        const clientEmail = job.client_email || 'client@kaam.com';
        sendJobStatusEmail(clientEmail, 'COMPLETED', job).catch(e => console.warn('Completion email dispatch warning:', e));

        res.json({
          message: 'Job marked completed.',
          jobId: id,
          status: 'COMPLETED',
          paymentMode: job.payment_mode,
          platformFeeDue: job.payment_mode === 'DIRECT_CASH' ? job.platform_fee_amount : 0
        });
      }
    );
  });
};
