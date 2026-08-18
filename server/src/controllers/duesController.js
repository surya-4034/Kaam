import db from '../config/database.js';

export const getMyDues = (req, res) => {
  const userId = req.user?.id || req.query.userId || req.query.workerId;

  db.get(`SELECT id FROM worker_profiles WHERE user_id = ? OR id = ?`, [userId, userId], (wErr, worker) => {
    if (wErr || !worker) return res.status(404).json({ error: 'Worker profile not found in database.' });

    db.all(
      `SELECT cd.*, j.agreed_total_fee, j.work_description, j.start_date
       FROM commission_dues_36h cd
       JOIN job_requests j ON cd.job_id = j.id
       WHERE cd.worker_id = ?
       ORDER BY cd.due_expires_at DESC`,
      [worker.id],
      (err, dues) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ count: dues.length, dues });
      }
    );
  });
};

export const payDues = (req, res) => {
  const { dueId, workerId, transactionRef } = req.body;
  const nowISO = new Date().toISOString();

  // If dueId provided or find pending due by workerId
  const query = dueId 
    ? `SELECT * FROM commission_dues_36h WHERE id = ?` 
    : `SELECT * FROM commission_dues_36h WHERE worker_id = ? AND status = 'PENDING' LIMIT 1`;
  const param = dueId || workerId;

  if (!param) return res.status(400).json({ error: 'dueId or workerId is required.' });

  db.get(query, [param], (err, due) => {
    if (err || !due) {
      // If no due record found, ensure worker profile is unlocked
      if (workerId) {
        db.run(`UPDATE worker_profiles SET is_account_locked = 0, is_available = 1 WHERE id = ? OR user_id = ?`, [workerId, workerId]);
      }
      return res.json({
        message: 'No pending dues found. Worker profile is 100% unlocked & active.',
        paidAmount: 0
      });
    }

    // Mark dues PAID
    db.run(
      `UPDATE commission_dues_36h SET status = 'PAID', paid_at = ?, payment_transaction_ref = ? WHERE id = ?`,
      [nowISO, transactionRef || `TXN-${Date.now()}`, due.id],
      function (uErr) {
        if (uErr) return res.status(500).json({ error: uErr.message });

        // Unlock worker account & restore availability
        db.run(
          `UPDATE worker_profiles SET is_account_locked = 0, is_available = 1 WHERE id = ?`,
          [due.worker_id]
        );

        res.json({
          message: 'Platform commission fee paid successfully. Your worker profile is 100% active & unlocked in SQLite DB!',
          transactionRef: transactionRef || `TXN-${Date.now()}`,
          paidAmount: due.amount_due,
          status: 'PAID'
        });
      }
    );
  });
};
