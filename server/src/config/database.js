import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { ensureVerifiedPartnersSeeded } from '../constants/verifiedPartners.js';
import { SEED_BOOKINGS } from '../constants/seedBookings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../kaam_database.sqlite');
const db = new sqlite3.Database(dbPath);
db.run('PRAGMA foreign_keys = OFF;');
db.on('error', (err) => {
  console.warn('⚠️ [SQLite Runtime Notice]', err.message);
});

export const initDb = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Users Table (Role-scoped accounts: allows separate Client and Worker accounts per email)
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          phone TEXT NOT NULL,
          email TEXT,
          password_hash TEXT NOT NULL,
          role TEXT CHECK(role IN ('CLIENT', 'WORKER', 'ADMIN')) NOT NULL,
          full_name TEXT NOT NULL,
          secondary_phone TEXT,
          locality TEXT,
          landmark TEXT,
          state TEXT,
          pincode TEXT,
          address TEXT,
          onboarding_completed INTEGER DEFAULT 0,
          is_active INTEGER DEFAULT 1,
          latitude REAL,
          longitude REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(email, role)
        )
      `);

      // Safe migration for existing databases with single-column unique constraint on email
      db.all("PRAGMA index_list('users')", (idxErr, indices) => {
        if (!idxErr && Array.isArray(indices)) {
          const hasSingleEmailUnique = indices.some(idx => idx.unique === 1 && idx.name.includes('autoindex_users_2'));
          // If legacy single-column unique index exists, migrate to composite UNIQUE(email, role)
          if (hasSingleEmailUnique) {
            db.serialize(() => {
              db.run('PRAGMA foreign_keys = OFF');
              db.run(`
                CREATE TABLE IF NOT EXISTS users_v2 (
                  id TEXT PRIMARY KEY,
                  phone TEXT NOT NULL,
                  email TEXT,
                  password_hash TEXT NOT NULL,
                  role TEXT CHECK(role IN ('CLIENT', 'WORKER', 'ADMIN')) NOT NULL,
                  full_name TEXT NOT NULL,
                  secondary_phone TEXT,
                  locality TEXT,
                  landmark TEXT,
                  state TEXT,
                  pincode TEXT,
                  address TEXT,
                  onboarding_completed INTEGER DEFAULT 0,
                  is_active INTEGER DEFAULT 1,
                  latitude REAL,
                  longitude REAL,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  UNIQUE(email, role)
                )
              `);
              db.run(`
                INSERT OR IGNORE INTO users_v2 
                SELECT id, phone, email, password_hash, role, full_name, secondary_phone, locality, landmark, state, pincode, address, onboarding_completed, is_active, latitude, longitude, created_at 
                FROM users
              `);
              db.run('DROP TABLE IF EXISTS users');
              db.run('ALTER TABLE users_v2 RENAME TO users');
              db.run('PRAGMA foreign_keys = OFF');
            });
          }
        }
      });

      // 2. Worker Profiles Table (Includes all columns so fresh deployments are complete immediately)
      db.run(`
        CREATE TABLE IF NOT EXISTS worker_profiles (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          trade_category TEXT NOT NULL,
          trade_title TEXT NOT NULL,
          experience_years INTEGER DEFAULT 1,
          daily_rate REAL NOT NULL,
          hourly_rate REAL NOT NULL,
          visiting_charge REAL DEFAULT 149,
          locality TEXT NOT NULL,
          city TEXT DEFAULT 'Mumbai',
          bio TEXT,
          is_available INTEGER DEFAULT 1,
          is_account_locked INTEGER DEFAULT 0,
          kyc_status TEXT CHECK(kyc_status IN ('PENDING', 'VERIFIED', 'REJECTED')) DEFAULT 'PENDING',
          rating_average REAL DEFAULT 5.0,
          completed_jobs_count INTEGER DEFAULT 0,
          latitude REAL,
          longitude REAL,
          packages_json TEXT,
          categories_json TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id)
        )
      `);

      // 3. Worker Bank KYC Table
      db.run(`
        CREATE TABLE IF NOT EXISTS worker_bank_kyc (
          id TEXT PRIMARY KEY,
          worker_id TEXT NOT NULL,
          account_holder_name TEXT NOT NULL,
          account_number TEXT NOT NULL,
          ifsc_code TEXT NOT NULL,
          upi_id TEXT NOT NULL,
          bank_name TEXT NOT NULL,
          govt_id_type TEXT DEFAULT 'Aadhaar Card',
          govt_id_number TEXT NOT NULL,
          govt_id_document_url TEXT,
          upi_phone TEXT,
          kyc_verified INTEGER DEFAULT 1,
          verified_at DATETIME,
          rejection_reason TEXT,
          FOREIGN KEY(worker_id) REFERENCES worker_profiles(id)
        )
      `);

      // 4. Worker Portfolios Table
      db.run(`
        CREATE TABLE IF NOT EXISTS worker_portfolios (
          id TEXT PRIMARY KEY,
          worker_id TEXT NOT NULL,
          title TEXT NOT NULL,
          category_tag TEXT NOT NULL,
          description TEXT,
          image_url TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(worker_id) REFERENCES worker_profiles(id)
        )
      `);

      // 5. Job Requests Table
      db.run(`
        CREATE TABLE IF NOT EXISTS job_requests (
          id TEXT PRIMARY KEY,
          client_id TEXT NOT NULL,
          worker_id TEXT NOT NULL,
          category_title TEXT,
          client_email TEXT,
          client_name TEXT,
          client_phone TEXT,
          worker_name TEXT,
          worker_phone TEXT,
          work_description TEXT NOT NULL,
          location_address TEXT NOT NULL,
          start_date TEXT NOT NULL,
          duration_days INTEGER DEFAULT 1,
          agreed_total_fee REAL NOT NULL,
          payment_mode TEXT CHECK(payment_mode IN ('DIRECT_CASH', 'PLATFORM_ESCROW')) NOT NULL,
          platform_fee_amount REAL NOT NULL,
          worker_net_payout REAL NOT NULL,
          status TEXT CHECK(status IN ('REQUESTED', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')) DEFAULT 'REQUESTED',
          completion_code TEXT,
          time_slot TEXT,
          packages_json TEXT,
          worker_upi TEXT,
          worker_upi_phone TEXT,
          worker_upi_holder TEXT,
          completed_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 6. 36-Hour Commission Dues Table
      db.run(`
        CREATE TABLE IF NOT EXISTS commission_dues_36h (
          id TEXT PRIMARY KEY,
          job_id TEXT NOT NULL,
          worker_id TEXT NOT NULL,
          amount_due REAL NOT NULL,
          due_expires_at DATETIME NOT NULL,
          status TEXT CHECK(status IN ('PENDING', 'PAID', 'OVERDUE', 'LOCKED')) DEFAULT 'PENDING',
          paid_at DATETIME,
          payment_transaction_ref TEXT
        )
      `);

      // Safe migrations for legacy databases (Runs after all tables exist)
      db.run(`ALTER TABLE users ADD COLUMN secondary_phone TEXT`, () => {});
      db.run(`ALTER TABLE users ADD COLUMN locality TEXT`, () => {});
      db.run(`ALTER TABLE users ADD COLUMN landmark TEXT`, () => {});
      db.run(`ALTER TABLE users ADD COLUMN state TEXT`, () => {});
      db.run(`ALTER TABLE users ADD COLUMN pincode TEXT`, () => {});
      db.run(`ALTER TABLE users ADD COLUMN address TEXT`, () => {});
      db.run(`ALTER TABLE users ADD COLUMN onboarding_completed INTEGER DEFAULT 0`, () => {});
      db.run(`ALTER TABLE users ADD COLUMN latitude REAL`, () => {});
      db.run(`ALTER TABLE users ADD COLUMN longitude REAL`, () => {});
      db.run(`ALTER TABLE worker_profiles ADD COLUMN latitude REAL`, () => {});
      db.run(`ALTER TABLE worker_profiles ADD COLUMN longitude REAL`, () => {});
      db.run(`ALTER TABLE worker_profiles ADD COLUMN packages_json TEXT`, () => {});
      db.run(`ALTER TABLE worker_profiles ADD COLUMN categories_json TEXT`, () => {});
      db.run(`ALTER TABLE worker_profiles ADD COLUMN visiting_charge REAL DEFAULT 149`, () => {});
      db.run(`ALTER TABLE job_requests ADD COLUMN category_title TEXT`, () => {});
      db.run(`ALTER TABLE job_requests ADD COLUMN client_email TEXT`, () => {});
      db.run(`ALTER TABLE job_requests ADD COLUMN client_name TEXT`, () => {});
      db.run(`ALTER TABLE job_requests ADD COLUMN client_phone TEXT`, () => {});
      db.run(`ALTER TABLE job_requests ADD COLUMN worker_name TEXT`, () => {});
      db.run(`ALTER TABLE job_requests ADD COLUMN worker_phone TEXT`, () => {});
      db.run(`ALTER TABLE job_requests ADD COLUMN completion_code TEXT`, () => {});
      db.run(`ALTER TABLE worker_bank_kyc ADD COLUMN upi_phone TEXT`, () => {});
      db.run(`ALTER TABLE worker_bank_kyc ADD COLUMN kyc_verified INTEGER DEFAULT 1`, () => {});
      db.run(`ALTER TABLE job_requests ADD COLUMN time_slot TEXT`, () => {});
      db.run(`ALTER TABLE job_requests ADD COLUMN packages_json TEXT`, () => {});
      db.run(`ALTER TABLE job_requests ADD COLUMN worker_upi TEXT`, () => {});
      db.run(`ALTER TABLE job_requests ADD COLUMN worker_upi_phone TEXT`, () => {});
      db.run(`ALTER TABLE job_requests ADD COLUMN worker_upi_holder TEXT`, () => {});

      // Seed Master Admin User: ID: Surya-4034, Email: kaamadmin@gmail.com, Key: Sujal957#
      const adminPassHash = bcrypt.hashSync('Sujal957#', 10);
      db.run(`
        INSERT OR REPLACE INTO users (id, phone, email, password_hash, role, full_name, onboarding_completed, is_active)
        VALUES ('Surya-4034', '+91 99999 40340', 'kaamadmin@gmail.com', '${adminPassHash}', 'ADMIN', 'Surya Master Admin', 1, 1)
      `);

      // Ensure real platform verified workers and seed bookings exist on all cloud deployments
      db.run("SELECT 1", async () => {
        try {
          await ensureVerifiedPartnersSeeded(db);
        } catch (sErr) {
          console.warn('⚠️ [Verified Partners Seed Warning]', sErr.message);
        }
        try {
          await ensureSeedBookingsSeeded(db);
        } catch (bErr) {
          console.warn('⚠️ [Seed Bookings Warning]', bErr.message);
        }
        resolve(db);
      });
    });
  });
};

export const ensureSeedBookingsSeeded = async (database) => {
  return new Promise((resolve) => {
    database.get('SELECT COUNT(*) as count FROM job_requests', [], (err, row) => {
      if (!err && row && row.count > 0) return resolve();
      
      const stmt = database.prepare(`
        INSERT OR IGNORE INTO job_requests 
        (id, client_id, worker_id, category_title, client_email, client_name, client_phone, worker_name, worker_phone, work_description, location_address, start_date, duration_days, agreed_total_fee, payment_mode, platform_fee_amount, worker_net_payout, status, completion_code, time_slot, packages_json, worker_upi, worker_upi_phone, worker_upi_holder, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const b of (SEED_BOOKINGS || [])) {
        stmt.run([
          b.id || b.jobId,
          b.clientId || 'u-client-1042',
          b.workerId || 'w-1791107064294',
          b.tradeCategory || b.categoryTitle || 'General Service',
          b.clientEmail || 'client@kaam.com',
          b.clientName || 'Customer',
          b.clientPhone || '',
          b.workerName || 'Verified Partner',
          b.workerPhone || '+91 98765 43210',
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
        ]);
      }
      stmt.finalize(() => resolve());
    });
  });
};

export const getSQLiteDB = () => db;

export default db;

