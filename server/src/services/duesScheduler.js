import db from '../config/database.js';

export const startDuesScheduler = () => {
  console.log('[kaam Dues Scheduler] Automated 36-hour commission monitor started.');

  // Run initial check and repeat every 60 seconds
  const checkOverdueDues = () => {
    const nowISO = new Date().toISOString();

    db.all(
      `SELECT * FROM commission_dues_36h WHERE status = 'PENDING' AND due_expires_at <= ?`,
      [nowISO],
      (err, rows) => {
        if (err) {
          console.error('[kaam Dues Scheduler Error]', err);
          return;
        }

        if (rows && rows.length > 0) {
          console.log(`[kaam Dues Scheduler] Found ${rows.length} overdue 36h commission dues. Locking worker profiles...`);

          rows.forEach((due) => {
            // Update dues status to OVERDUE & LOCK
            db.run(
              `UPDATE commission_dues_36h SET status = 'OVERDUE' WHERE id = ?`,
              [due.id]
            );

            // Lock worker profile
            db.run(
              `UPDATE worker_profiles SET is_account_locked = 1, is_available = 0 WHERE id = ?`,
              [due.worker_id]
            );

            console.log(`[kaam Dues Lock] Worker ID '${due.worker_id}' locked due to unpaid ₹${due.amount_due} fee.`);
          });
        }
      }
    );
  };

  // Run immediately and set interval
  checkOverdueDues();
  setInterval(checkOverdueDues, 60 * 1000);
};
