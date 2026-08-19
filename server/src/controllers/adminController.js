import db from '../config/database.js';

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
