import db from '../config/database.js';

// Get all jobs for cross-app real-time syncing
export const getAllJobs = (req, res) => {
  db.all(
    `SELECT j.*, 
            wp.trade_title, 
            u_worker.full_name as worker_name, 
            u_worker.phone as worker_phone,
            u_client.full_name as client_name,
            u_client.phone as client_phone
     FROM job_requests j
     LEFT JOIN worker_profiles wp ON j.worker_id = wp.id
     LEFT JOIN users u_worker ON wp.user_id = u_worker.id
     LEFT JOIN users u_client ON j.client_id = u_client.id
     ORDER BY j.created_at DESC`,
    [],
    (err, jobs) => {
      if (err) {
        // Fallback to simple query if joins fail
        db.all(`SELECT * FROM job_requests ORDER BY created_at DESC`, [], (err2, simpleJobs) => {
          if (err2) return res.status(500).json({ error: err2.message });
          return res.json({ count: simpleJobs.length, jobs: simpleJobs });
        });
      } else {
        res.json({ count: jobs.length, jobs });
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
    workerPhone,
    clientName,
    clientPhone,
    locationAddress,
    workDescription,
    agreedTotalFee,
    paymentMode
  } = req.body;

  if (!workerId || !workDescription || !locationAddress || !agreedTotalFee) {
    return res.status(400).json({ error: 'Missing required booking fields.' });
  }

  const jobId = `job-${Date.now()}`;
  const totalFee = Number(agreedTotalFee);
  const platformFee = Math.round(totalFee * 0.08); // 8% site fee
  const workerPayout = totalFee - platformFee;
  const nowISO = new Date().toISOString();

  db.run(
    `INSERT INTO job_requests 
     (id, client_id, worker_id, work_description, location_address, start_date, duration_days, agreed_total_fee, payment_mode, platform_fee_amount, worker_net_payout, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REQUESTED', ?)`,
    [
      jobId,
      'u-client-1',
      workerId,
      workDescription,
      locationAddress,
      nowISO.split('T')[0],
      1,
      totalFee,
      paymentMode || 'DIRECT_CASH',
      platformFee,
      workerPayout,
      nowISO
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      const newJob = {
        id: jobId,
        worker_id: workerId,
        worker_name: workerName || 'Ramesh Kumar Mistry',
        trade_title: tradeTitle || 'Master Plumber & Pipe Fitter',
        worker_phone: workerPhone || '+91 98765 43210',
        client_name: clientName || 'Verma Family (Homeowner)',
        client_phone: clientPhone || '+91 98111 00223',
        location_address: locationAddress,
        work_description: workDescription,
        agreed_total_fee: totalFee,
        payment_mode: paymentMode || 'DIRECT_CASH',
        platform_fee_amount: platformFee,
        status: 'REQUESTED',
        created_at: nowISO
      };

      res.status(201).json({
        message: 'Hire request created successfully in SQLite database.',
        job: newJob
      });
    }
  );
};

// Worker Accepts Job
export const acceptJob = (req, res) => {
  const { id } = req.params;

  db.run(`UPDATE job_requests SET status = 'ACCEPTED' WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Job accepted by worker.', jobId: id, status: 'ACCEPTED' });
  });
};

// Worker Rejects Job
export const rejectJob = (req, res) => {
  const { id } = req.params;

  db.run(`UPDATE job_requests SET status = 'REJECTED' WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Job rejected by worker.', jobId: id, status: 'REJECTED' });
  });
};

// Worker Completes Job
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

        if (job.payment_mode === 'DIRECT_CASH') {
          const dueId = `due-${Date.now()}`;
          const expiresAt = new Date(Date.now() + 36 * 3600 * 1000).toISOString();

          db.run(
            `INSERT INTO commission_dues_36h (id, job_id, worker_id, amount_due, due_expires_at, status)
             VALUES (?, ?, ?, ?, ?, 'PENDING')`,
            [dueId, job.id, job.worker_id, job.platform_fee_amount, expiresAt]
          );
        }

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
