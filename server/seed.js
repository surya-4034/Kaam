import db, { initDb } from './src/config/database.js';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  await initDb();
  console.log('[kaam Seeder] Seeding initial users, workers, jobs, and bank KYC...');

  const passHash = bcrypt.hashSync('admin123', 10);
  const workerHash = bcrypt.hashSync('password123', 10);

  db.serialize(() => {
    // 1. Clear existing
    db.run(`DELETE FROM users`);
    db.run(`DELETE FROM worker_profiles`);
    db.run(`DELETE FROM worker_bank_kyc`);
    db.run(`DELETE FROM worker_portfolios`);
    db.run(`DELETE FROM job_requests`);
    db.run(`DELETE FROM commission_dues_36h`);

    // 2. Users (including admin sy623806@gmail.com / admin123)
    db.run(`INSERT INTO users (id, phone, email, password_hash, role, full_name) VALUES
      ('u-client-1', '+91 98111 00223', 'client@kaam.com', '${workerHash}', 'CLIENT', 'Verma Family (Homeowner)'),
      ('u-worker-1', '+91 98765 43210', 'ramesh@kaam.com', '${workerHash}', 'WORKER', 'Ramesh Kumar Mistry'),
      ('u-worker-2', '+91 98123 76543', 'sunil@kaam.com', '${workerHash}', 'WORKER', 'Sunil Sharma'),
      ('u-worker-3', '+91 98456 12389', 'vikram@kaam.com', '${workerHash}', 'WORKER', 'Vikram Singh Mistry'),
      ('u-worker-4', '+91 98234 56789', 'mohit@kaam.com', '${workerHash}', 'WORKER', 'Mohit Carpenter'),
      ('u-worker-5', '+91 98345 67890', 'rajesh@kaam.com', '${workerHash}', 'WORKER', 'Rajesh Painter'),
      ('u-admin-1', '+91 99999 00000', 'sy623806@gmail.com', '${passHash}', 'ADMIN', 'kaam Platform Administrator')
    `);

    // 3. Worker Profiles (All unlocked & active)
    db.run(`INSERT INTO worker_profiles (id, user_id, trade_category, trade_title, experience_years, daily_rate, hourly_rate, locality, bio, kyc_status, is_available, is_account_locked, rating_average, completed_jobs_count) VALUES
      ('w-1', 'u-worker-1', 'plumber', 'Master Plumber & Pipe Fitter', 8, 650, 120, 'Sector 62, Noida', '8 years heavy plumbing experience in CPVC pipe laying, bathroom fixtures, and tank connections.', 'VERIFIED', 1, 0, 4.9, 142),
      ('w-2', 'u-worker-2', 'electrician', 'Certified Senior Electrician', 10, 750, 150, 'Indirapuram & Vaishali', 'Specialist in 3-phase house wiring, MCB panel installation, inverter setups, and emergency fault repairs.', 'VERIFIED', 1, 0, 4.8, 98),
      ('w-3', 'u-worker-3', 'mistry', 'Civil Construction & Masonry Mistry', 12, 850, 160, 'Sector 18 & Atta, Noida', '12 years expertise in bricklaying, RCC slab casting, wall plastering, and home renovation.', 'VERIFIED', 1, 0, 5.0, 210),
      ('w-4', 'u-worker-4', 'carpenter', 'Modular Kitchen & Woodwork Carpenter', 7, 700, 130, 'Greater Noida West', 'Specialized in modular kitchen fitting, sliding door wardrobes, plywood partitioning, and furniture polishing.', 'VERIFIED', 1, 0, 4.7, 76),
      ('w-5', 'u-worker-5', 'painter', 'Interior & Exterior Texture Painter', 6, 600, 110, 'Sector 50, Noida', 'Expert in Asian Paints Royale luxury finishes, damp-proof waterproofing coats, and wood PU polishing.', 'VERIFIED', 1, 0, 4.9, 88)
    `);

    // 4. Worker Bank KYC
    db.run(`INSERT INTO worker_bank_kyc (id, worker_id, account_holder_name, account_number, ifsc_code, upi_id, bank_name, govt_id_type, govt_id_number) VALUES
      ('kyc-1', 'w-1', 'Ramesh Kumar', '481920412390', 'SBIN0004012', 'ramesh.plumber@okaxis', 'State Bank of India', 'Aadhaar Card', '9841-XXXX-2041'),
      ('kyc-2', 'w-2', 'Sunil Sharma', '910244108912', 'HDFC0001245', 'sunilelectrical@paytm', 'HDFC Bank', 'Aadhaar Card', '4410-XXXX-8912'),
      ('kyc-3', 'w-3', 'Vikram Singh', '309188234190', 'PUNB0241000', 'vikram.mistry@upi', 'Punjab National Bank', 'Aadhaar Card', '8812-XXXX-9901'),
      ('kyc-4', 'w-4', 'Mohit Saini', '109283746519', 'ICIC0000412', 'mohitcarpenter@icici', 'ICICI Bank', 'Aadhaar Card', '7712-XXXX-3341'),
      ('kyc-5', 'w-5', 'Rajesh Verma', '551928374610', 'BARB0NOIDAX', 'rajeshpainter@upi', 'Bank of Baroda', 'Aadhaar Card', '6610-XXXX-4412')
    `);

    // 5. Portfolios
    db.run(`INSERT INTO worker_portfolios (id, worker_id, title, category_tag, description, image_url) VALUES
      ('p-1', 'w-1', 'Bathroom Concealed CPVC Piping', 'Plumbing', 'Installed 32mm CPVC pipes and concealed shower valves.', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'),
      ('p-2', 'w-2', 'MCB Distribution Panel Setup', 'Electrical', 'Organized 12-way distribution box with surge protection.', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80'),
      ('p-3', 'w-3', 'Boundary Wall & RCC Column Casting', 'Construction', 'Reinforced concrete casting and fly-ash brick masonry.', 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f7?auto=format&fit=crop&w=800&q=80'),
      ('p-4', 'w-4', 'Modular Kitchen Laminate Cabinets', 'Carpentry', 'Marine ply modular kitchen cabinets with soft-close hinges.', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80'),
      ('p-5', 'w-5', 'Royale Texture Living Room Wall', 'Painting', 'Stencils & velvet texture wall painting with primer base.', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80')
    `);

    // 6. Initial Job Requests & Fresh Dues (Expires in 28 Hours)
    const nowISO = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 28 * 3600 * 1000).toISOString();

    db.run(`INSERT INTO job_requests (id, client_id, worker_id, work_description, location_address, start_date, duration_days, agreed_total_fee, payment_mode, platform_fee_amount, worker_net_payout, status, completed_at) VALUES
      ('job-101', 'u-client-1', 'w-1', 'Complete plumbing setup for bathroom and overhead tank connection.', 'Plot 42, Sector 63, Noida', '2026-08-16', 1, 4000, 'DIRECT_CASH', 320, 3680, 'COMPLETED', '${nowISO}'),
      ('job-102', 'u-client-1', 'w-2', 'Inverter wiring and 3-phase MCB fault inspection in villa.', 'B-12, Sector 62, Noida', '2026-08-18', 1, 750, 'PLATFORM_ESCROW', 60, 690, 'ACCEPTED', NULL)
    `);

    db.run(`INSERT INTO commission_dues_36h (id, job_id, worker_id, amount_due, due_expires_at, status) VALUES
      ('due-101', 'job-101', 'w-1', 320, '${expiresAt}', 'PENDING')
    `, () => {
      console.log('[kaam Seeder] Seed completed successfully with verified workers & Admin (sy623806@gmail.com)!');
    });
  });
}

seedDatabase();

