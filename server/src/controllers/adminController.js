import db from '../config/database.js';
import { ensureVerifiedPartnersSeeded } from '../constants/verifiedPartners.js';
import { dispatchEmail, emailDispatchLogs } from '../services/emailOtpService.js';
import { isMongoConnected, getLastMongoError, forceMongoReconnect, hydrateFromAtlasToSQLite, getMongoDb } from '../config/mongoose.js';
import net from 'net';
import nodemailer from 'nodemailer';

// Get All Users List (Clients & Workers)
export const getAllUsers = (req, res) => {
  db.all(
    `SELECT u.id, u.phone, u.secondary_phone, u.email, u.role, u.full_name, u.is_active, u.created_at,
            u.locality, u.landmark, u.state, u.pincode, u.address, u.onboarding_completed,
            wp.id as worker_profile_id, wp.trade_title, wp.trade_category, wp.daily_rate, wp.locality as worker_locality, wp.kyc_status, wp.is_account_locked
     FROM users u
     LEFT JOIN worker_profiles wp ON u.id = wp.user_id
     ORDER BY u.created_at DESC`,
    [],
    (err, users) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ count: users.length, users });
    }
  );
};

// Toggle User Lock Status (Freeze / Unlock Account)
export const toggleUserLock = (req, res) => {
  const { userId } = req.params;

  db.get(`SELECT user_id, is_account_locked FROM worker_profiles WHERE user_id = ? OR id = ?`, [userId, userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    const newLockState = row && row.is_account_locked ? 0 : 1;
    const targetUserId = row ? row.user_id : userId;

    db.run(`UPDATE worker_profiles SET is_account_locked = ? WHERE user_id = ?`, [newLockState, targetUserId], function (uErr) {
      db.run(`UPDATE users SET is_active = ? WHERE id = ?`, [newLockState ? 0 : 1, targetUserId], function (usErr) {
        res.json({ message: `User account ${newLockState ? 'LOCKED' : 'UNLOCKED'} successfully.`, isLocked: newLockState });
      });
    });
  });
};

// Toggle User Active Status (Block / Activate)
export const toggleUserStatus = (req, res) => {
  const { userId } = req.params;

  db.get(`SELECT id, is_active FROM users WHERE id = ?`, [userId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newStatus = user.is_active ? 0 : 1;

    db.run(`UPDATE users SET is_active = ? WHERE id = ?`, [newStatus, userId], function (uErr) {
      if (uErr) return res.status(500).json({ error: uErr.message });
      res.json({ message: `User status changed to ${newStatus ? 'ACTIVE' : 'DEACTIVATED'}.`, isActive: newStatus });
    });
  });
};

export const getPendingKycQueue = (req, res) => {
  db.all(
    `SELECT k.*, wp.trade_category, wp.trade_title, wp.kyc_status, u.full_name as worker_name, u.phone as worker_phone
     FROM worker_bank_kyc k
     JOIN worker_profiles wp ON k.worker_id = wp.id
     JOIN users u ON wp.user_id = u.id
     ORDER BY k.id DESC`,
    [],
    (err, queue) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ count: queue.length, queue });
    }
  );
};

export const approveKyc = (req, res) => {
  const { workerId } = req.params;
  const nowISO = new Date().toISOString();

  db.run(`UPDATE worker_profiles SET kyc_status = 'VERIFIED' WHERE id = ? OR user_id = ?`, [workerId, workerId], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    db.run(`UPDATE worker_bank_kyc SET verified_at = ? WHERE worker_id = ?`, [nowISO, workerId]);

    res.json({ message: `Worker ID '${workerId}' KYC approved & verified.` });
  });
};

export const rejectKyc = (req, res) => {
  const { workerId } = req.params;
  const { reason } = req.body || {};

  db.run(`UPDATE worker_profiles SET kyc_status = 'REJECTED' WHERE id = ? OR user_id = ?`, [workerId, workerId], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    db.run(`UPDATE worker_bank_kyc SET rejection_reason = ? WHERE worker_id = ?`, [reason || 'Document unreadable', workerId]);

    res.json({ message: `Worker ID '${workerId}' KYC rejected.` });
  });
};

export const getDuesAudit = (req, res) => {
  db.all(
    `SELECT cd.*, u.full_name as worker_name, u.phone as worker_phone, wp.trade_title, j.agreed_total_fee
     FROM commission_dues_36h cd
     JOIN worker_profiles wp ON cd.worker_id = wp.id
     JOIN users u ON wp.user_id = u.id
     JOIN job_requests j ON cd.job_id = j.id
     ORDER BY cd.due_expires_at ASC`,
    [],
    (err, dues) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ count: dues.length, dues });
    }
  );
};

export const getPlatformStats = (req, res) => {
  db.get(
    `SELECT 
       COALESCE(SUM(agreed_total_fee), 0) as gross_volume,
       COALESCE(SUM(platform_fee_amount), 0) as total_commission
     FROM job_requests`,
    [],
    (err, jobStats) => {
      if (err) return res.status(500).json({ error: err.message });

      db.get(
        `SELECT COALESCE(SUM(amount_due), 0) as pending_dues FROM commission_dues_36h WHERE status = 'PENDING'`,
        [],
        (dErr, dueStats) => {
          db.get(
            `SELECT COUNT(*) as total_workers, SUM(CASE WHEN kyc_status = 'VERIFIED' THEN 1 ELSE 0 END) as verified_workers FROM worker_profiles`,
            [],
            (wErr, workerStats) => {
              db.get(
                `SELECT COUNT(*) as total_clients FROM users WHERE role = 'CLIENT'`,
                [],
                (cErr, clientStats) => {
                  res.json({
                    grossVolume: jobStats ? jobStats.gross_volume : 0,
                    totalCommission: jobStats ? jobStats.total_commission : 0,
                    pendingDues: dueStats ? dueStats.pending_dues : 0,
                    totalWorkers: workerStats ? workerStats.total_workers : 0,
                    verifiedWorkers: workerStats ? workerStats.verified_workers : 0,
                    totalClients: clientStats ? clientStats.total_clients : 0,
                  });
                }
              );
            }
          );
        }
      );
    }
  );
};

// Get Detailed Client Profile & Job History for Admin View Modal
export const getClientDetails = (req, res) => {
  const { clientId } = req.params;

  db.get(
    `SELECT id, phone, secondary_phone, email, role, full_name, is_active, created_at,
            locality, landmark, state, pincode, address, onboarding_completed
     FROM users 
     WHERE id = ? OR email = ?`,
    [clientId, clientId],
    (err, client) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!client) return res.status(404).json({ error: 'Client account not found.' });

      db.all(`SELECT id, created_at FROM users WHERE UPPER(role) = 'CLIENT' ORDER BY created_at ASC`, [], (cErr, allClients) => {
        let formattedClientId = '001';
        if (allClients && allClients.length > 0) {
          const clientIndex = allClients.findIndex(c => c.id === client.id);
          if (clientIndex !== -1) {
            formattedClientId = String(clientIndex + 1).padStart(3, '0');
          } else {
            formattedClientId = String(allClients.length + 1).padStart(3, '0');
          }
        }

        db.all(
          `SELECT j.*, wp.trade_title, u.full_name as worker_name
           FROM jobs j
           LEFT JOIN worker_profiles wp ON j.worker_id = wp.id
           LEFT JOIN users u ON wp.user_id = u.id
           WHERE j.client_id = ? OR j.client_phone = ?
           ORDER BY j.created_at DESC`,
          [client.id, client.phone],
          (jErr, jobs) => {
            res.json({
              client: {
                id: client.id,
                formattedClientId,
                fullName: client.full_name,
                email: client.email,
                phone: client.phone,
                secondaryPhone: client.secondary_phone || 'None',
                locality: client.locality || 'Sector 63',
                landmark: client.landmark || 'Noida',
                state: client.state || 'Uttar Pradesh',
                pincode: client.pincode || '201301',
                address: client.address || `${client.locality || 'Sector 63'}, Noida`,
                onboardingCompleted: Boolean(client.onboarding_completed),
                isActive: Boolean(client.is_active),
                createdAt: client.created_at,
                totalJobs: jobs ? jobs.length : 0,
                jobHistory: jobs || []
              }
            });
          }
        );
      });
    }
  );
};

// Admin self-healing maintenance endpoint to guarantee verified partner visibility
export const repairPartners = async (req, res) => {
  try {
    await ensureVerifiedPartnersSeeded(db);
    db.all(
      `SELECT wp.id, wp.user_id, wp.trade_title, wp.trade_category, u.full_name, wp.locality
       FROM worker_profiles wp
       JOIN users u ON wp.user_id = u.id`,
      [],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          status: 'success',
          message: 'Verified partner profiles guaranteed and repaired.',
          count: rows ? rows.length : 0,
          workers: rows || []
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin diagnostic endpoint to test real email deliverability and SMTP TCP ports
export const testEmailDiagnostics = async (req, res) => {
  const targetEmail = req.query.email || 'sy623806@gmail.com';
  const results = {
    smtpUser: process.env.EMAIL_USER,
    hasPass: Boolean(process.env.EMAIL_PASS),
    passLength: (process.env.EMAIL_PASS || '').length,
    hasBrevoKey: Boolean(process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY),
    hasResendKey: Boolean(process.env.RESEND_API_KEY),
    port465Tcp: 'testing',
    port587Tcp: 'testing',
    dispatchResult: null
  };

  const testTcp = (port) => new Promise((resolve) => {
    const socket = net.createConnection({ host: 'smtp.hostinger.com', port, timeout: 3000 });
    socket.on('connect', () => {
      socket.destroy();
      resolve('CONNECTED');
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve('TIMEOUT_BLOCKED');
    });
    socket.on('error', (err) => {
      resolve(`ERROR: ${err.message}`);
    });
  });

  results.port465Tcp = await testTcp(465);
  results.port587Tcp = await testTcp(587);

  // Test full email dispatch (HTTP API + SMTP fallback)
  try {
    const outcome = await dispatchEmail({
      to: targetEmail,
      subject: `KAAM Email Diagnostics Test - ${new Date().toLocaleTimeString('en-IN')}`,
      text: `Hello,\n\nThis is a live test email from KAAM Server to verify real email delivery to ${targetEmail}.\nTimestamp: ${new Date().toISOString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0284c7; margin-top: 0;">KAAM Email Deliverability Test</h2>
          <p>This email confirms that the KAAM email notification system is working and successfully delivered to <strong>${targetEmail}</strong>.</p>
          <p style="font-size: 12px; color: #64748b;">Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
      senderName: 'KAAM Diagnostic'
    });
    results.dispatchResult = outcome;
  } catch (dErr) {
    results.dispatchResult = { success: false, error: dErr.message };
  }

  res.json(results);
};

// Admin diagnostic endpoint to trigger immediate MongoDB Atlas reconnect and SQLite hydration
export const reconnectMongo = async (req, res) => {
  try {
    await forceMongoReconnect();
    await hydrateFromAtlasToSQLite();
    const mongo = getMongoDb();
    let atlasBookingsCount = 0;
    if (mongo) {
      atlasBookingsCount = await mongo.collection('bookings').countDocuments();
    }
    db.get('SELECT COUNT(*) as count FROM job_requests', [], (err, row) => {
      res.json({
        success: isMongoConnected(),
        mongoConnected: isMongoConnected(),
        mongoError: getLastMongoError(),
        atlasBookingsCount,
        sqliteBookingsCount: row ? row.count : 0
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message, mongoError: getLastMongoError() });
  }
};

// Admin endpoint to view recent email dispatch logs and diagnostic status
export const getEmailLogsHandler = (req, res) => {
  res.json({
    count: emailDispatchLogs.length,
    hasBrevoKey: Boolean(process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY),
    hasResendKey: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_cDFX99ay_Ad3ij4KZ8hQhrSaSMrmEZuWR'),
    logs: emailDispatchLogs.slice(-50).reverse()
  });
};

// Admin endpoint to set/update Brevo or Resend key at runtime
export const setEmailKeyHandler = async (req, res) => {
  const { brevoApiKey, resendApiKey } = { ...(req.query || {}), ...(req.body || {}) };
  if (brevoApiKey) {
    process.env.BREVO_API_KEY = String(brevoApiKey).trim();
  }
  if (resendApiKey) {
    process.env.RESEND_API_KEY = String(resendApiKey).trim();
  }

  // Dual-sync to MongoDB Atlas system_settings
  try {
    const mongo = getMongoDb();
    if (mongo) {
      await mongo.collection('system_settings').updateOne(
        { key: 'email_settings' },
        {
          $set: {
            key: 'email_settings',
            ...(brevoApiKey ? { brevoApiKey: String(brevoApiKey).trim() } : {}),
            ...(resendApiKey ? { resendApiKey: String(resendApiKey).trim() } : {}),
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn('⚠️ [MongoDB Atlas Settings Save Notice]:', err.message);
  }

  res.json({
    success: true,
    message: 'Email credentials updated live in memory and persisted to MongoDB Atlas.',
    hasBrevoKey: Boolean(process.env.BREVO_API_KEY),
    hasResendKey: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_cDFX99ay_Ad3ij4KZ8hQhrSaSMrmEZuWR')
  });
};

