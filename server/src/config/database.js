import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../kaam_database.sqlite');
const db = new sqlite3.Database(dbPath);

export const initDb = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Users Table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          phone TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE,
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
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Migration for existing databases: Add columns safely if not present
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

      // Seed Master Admin User: ID: Surya-4034, Email: kaamadmin@gmail.com, Key: Sujal957#
      const adminPassHash = bcrypt.hashSync('Sujal957#', 10);
      db.run(`
        INSERT OR REPLACE INTO users (id, phone, email, password_hash, role, full_name, is_active)
        VALUES ('Surya-4034', '+91 99999 40340', 'kaamadmin@gmail.com', '${adminPassHash}', 'ADMIN', 'Surya Master Admin', 1)
      `);

      // 2. Worker Profiles Table
      db.run(`
        CREATE TABLE IF NOT EXISTS worker_profiles (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          trade_category TEXT NOT NULL,
          trade_title TEXT NOT NULL,
          experience_years INTEGER DEFAULT 1,
          daily_rate REAL NOT NULL,
          hourly_rate REAL NOT NULL,
          locality TEXT NOT NULL,
          city TEXT DEFAULT 'Noida',
          bio TEXT,
          is_available INTEGER DEFAULT 1,
          is_account_locked INTEGER DEFAULT 0,
          kyc_status TEXT CHECK(kyc_status IN ('PENDING', 'VERIFIED', 'REJECTED')) DEFAULT 'PENDING',
          rating_average REAL DEFAULT 4.8,
          completed_jobs_count INTEGER DEFAULT 0,
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
          work_description TEXT NOT NULL,
          location_address TEXT NOT NULL,
          start_date TEXT NOT NULL,
          duration_days INTEGER DEFAULT 1,
          agreed_total_fee REAL NOT NULL,
          payment_mode TEXT CHECK(payment_mode IN ('DIRECT_CASH', 'PLATFORM_ESCROW')) NOT NULL,
          platform_fee_amount REAL NOT NULL,
          worker_net_payout REAL NOT NULL,
          status TEXT CHECK(status IN ('REQUESTED', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')) DEFAULT 'REQUESTED',
          completed_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(client_id) REFERENCES users(id),
          FOREIGN KEY(worker_id) REFERENCES worker_profiles(id)
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
          payment_transaction_ref TEXT,
          FOREIGN KEY(job_id) REFERENCES job_requests(id),
          FOREIGN KEY(worker_id) REFERENCES worker_profiles(id)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve(db);
      });
    });
  });
};

export default db;
