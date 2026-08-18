import db from '../config/database.js';

export const getWorkers = (req, res) => {
  const { category, maxBudget, verifiedOnly, search } = req.query;

  let query = `
    SELECT wp.*, u.full_name as name, u.phone 
    FROM worker_profiles wp
    JOIN users u ON wp.user_id = u.id
    WHERE wp.is_account_locked = 0
  `;
  const params = [];

  if (category && category !== 'all') {
    query += ` AND LOWER(wp.trade_category) = LOWER(?)`;
    params.push(category);
  }

  if (maxBudget) {
    query += ` AND wp.daily_rate <= ?`;
    params.push(Number(maxBudget));
  }

  if (verifiedOnly === 'true') {
    query += ` AND wp.kyc_status = 'VERIFIED'`;
  }

  if (search) {
    query += ` AND (u.full_name LIKE ? OR wp.trade_title LIKE ? OR wp.locality LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += ` ORDER BY wp.rating_average DESC`;

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // Fetch portfolio photos for each worker
    const workerPromises = rows.map((w) => {
      return new Promise((resolve) => {
        db.all(`SELECT * FROM worker_portfolios WHERE worker_id = ?`, [w.id], (pErr, pRows) => {
          w.portfolioImages = pRows || [];
          resolve(w);
        });
      });
    });

    Promise.all(workerPromises).then((workers) => {
      res.json({ count: workers.length, workers });
    });
  });
};

export const getWorkerById = (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT wp.*, u.full_name as name, u.phone, u.email 
     FROM worker_profiles wp
     JOIN users u ON wp.user_id = u.id
     WHERE wp.id = ? OR wp.user_id = ?`,
    [id, id],
    (err, worker) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!worker) return res.status(404).json({ error: 'Worker profile not found in database.' });

      db.all(`SELECT * FROM worker_portfolios WHERE worker_id = ?`, [worker.id], (pErr, portfolio) => {
        worker.portfolioImages = (portfolio || []).map(p => ({
          id: p.id,
          title: p.title,
          category: p.category_tag,
          url: p.image_url,
          description: p.description,
          date: p.created_at
        }));

        db.get(`SELECT * FROM worker_bank_kyc WHERE worker_id = ?`, [worker.id], (kErr, kyc) => {
          worker.bankDetails = kyc ? {
            holder: kyc.account_holder_name,
            bankName: kyc.bank_name,
            account: kyc.account_number,
            ifsc: kyc.ifsc_code,
            upi: kyc.upi_id,
            govtIdType: kyc.govt_id_type,
            govtIdNumber: kyc.govt_id_number,
          } : null;

          db.get(`SELECT * FROM commission_dues_36h WHERE worker_id = ? AND status = 'PENDING'`, [worker.id], (dErr, dues) => {
            worker.dues = dues ? {
              id: dues.id,
              jobId: dues.job_id,
              pendingAmount: dues.amount_due,
              dueExpiresAt: dues.due_expires_at,
              status: dues.status
            } : null;

            res.json({ worker });
          });
        });
      });
    }
  );
};

export const getWorkerByUserId = (req, res) => {
  const { userId } = req.params;

  db.get(
    `SELECT wp.*, u.full_name as name, u.phone, u.email 
     FROM worker_profiles wp
     JOIN users u ON wp.user_id = u.id
     WHERE wp.user_id = ? OR wp.id = ?`,
    [userId, userId],
    (err, worker) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!worker) return res.status(404).json({ error: 'Worker profile not found in database.' });

      db.all(`SELECT * FROM worker_portfolios WHERE worker_id = ?`, [worker.id], (pErr, portfolio) => {
        worker.portfolio = (portfolio || []).map(p => ({
          id: p.id,
          title: p.title,
          category: p.category_tag,
          url: p.image_url,
          description: p.description,
          date: p.created_at
        }));

        db.get(`SELECT * FROM worker_bank_kyc WHERE worker_id = ?`, [worker.id], (kErr, kyc) => {
          worker.bank = kyc ? {
            holder: kyc.account_holder_name,
            bankName: kyc.bank_name,
            account: kyc.account_number,
            ifsc: kyc.ifsc_code,
            upi: kyc.upi_id,
            govtIdType: kyc.govt_id_type,
            govtIdNumber: kyc.govt_id_number,
          } : null;

          db.get(`SELECT * FROM commission_dues_36h WHERE worker_id = ? AND status = 'PENDING'`, [worker.id], (dErr, dues) => {
            worker.dues = dues ? {
              id: dues.id,
              jobId: dues.job_id,
              pendingAmount: dues.amount_due,
              dueExpiresAt: dues.due_expires_at,
              status: dues.status
            } : null;

            res.json({ worker });
          });
        });
      });
    }
  );
};

export const updateWorkerProfile = (req, res) => {
  const { dailyRate, hourlyRate, bio, locality, tradeTitle, isAvailable, workerId, userId: reqUserId } = req.body;
  const userId = req.user?.id || reqUserId;

  db.run(
    `UPDATE worker_profiles 
     SET daily_rate = COALESCE(?, daily_rate),
         hourly_rate = COALESCE(?, hourly_rate),
         bio = COALESCE(?, bio),
         locality = COALESCE(?, locality),
         trade_title = COALESCE(?, trade_title),
         is_available = COALESCE(?, is_available)
     WHERE user_id = ? OR id = ?`,
    [dailyRate, hourlyRate, bio, locality, tradeTitle, isAvailable !== undefined ? (isAvailable ? 1 : 0) : null, userId || '', workerId || ''],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Worker profile updated successfully in SQLite database.' });
    }
  );
};

export const toggleWorkerAvailability = (req, res) => {
  const { workerId, isAvailable } = req.body;

  db.run(
    `UPDATE worker_profiles SET is_available = ? WHERE id = ?`,
    [isAvailable ? 1 : 0, workerId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: `Worker availability updated to ${isAvailable ? 'AVAILABLE' : 'OFFLINE'}.`, isAvailable });
    }
  );
};

export const submitBankKyc = (req, res) => {
  const { accountHolderName, accountNumber, ifscCode, upiId, bankName, govtIdType, govtIdNumber, workerId: reqWorkerId, userId: reqUserId } = req.body;
  const targetId = req.user?.id || reqUserId || reqWorkerId;

  db.get(`SELECT id FROM worker_profiles WHERE user_id = ? OR id = ?`, [targetId, targetId], (err, worker) => {
    if (err || !worker) return res.status(404).json({ error: 'Worker profile not found in database.' });

    const kycId = `kyc-${Date.now()}`;

    db.run(
      `INSERT OR REPLACE INTO worker_bank_kyc 
       (id, worker_id, account_holder_name, account_number, ifsc_code, upi_id, bank_name, govt_id_type, govt_id_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [kycId, worker.id, accountHolderName, accountNumber, ifscCode, upiId, bankName, govtIdType || 'Aadhaar Card', govtIdNumber],
      function (kErr) {
        if (kErr) return res.status(500).json({ error: kErr.message });

        db.run(`UPDATE worker_profiles SET kyc_status = 'PENDING' WHERE id = ?`, [worker.id]);

        res.json({ message: 'Bank details & KYC submitted to database for admin review.', kycId });
      }
    );
  });
};

export const addPortfolioImage = (req, res) => {
  const { title, categoryTag, description, imageUrl, workerId: reqWorkerId, userId: reqUserId } = req.body;
  const targetId = req.user?.id || reqUserId || reqWorkerId;

  db.get(`SELECT id FROM worker_profiles WHERE user_id = ? OR id = ?`, [targetId, targetId], (err, worker) => {
    if (err || !worker) return res.status(404).json({ error: 'Worker profile not found in database.' });

    const pId = `p-${Date.now()}`;

    db.run(
      `INSERT INTO worker_portfolios (id, worker_id, title, category_tag, description, image_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [pId, worker.id, title, categoryTag || 'Plumbing', description || '', imageUrl],
      function (pErr) {
        if (pErr) return res.status(500).json({ error: pErr.message });
        res.status(201).json({ message: 'Portfolio photo added to database successfully.', portfolioId: pId });
      }
    );
  });
};
