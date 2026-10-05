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
              db.run('PRAGMA foreign_keys = ON');
            });
          }
        }
      });

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
          visiting_charge REAL DEFAULT 149,
          locality TEXT NOT NULL,
          city TEXT,
          bio TEXT,
          is_available INTEGER DEFAULT 1,
          is_account_locked INTEGER DEFAULT 0,
          kyc_status TEXT CHECK(kyc_status IN ('PENDING', 'VERIFIED', 'REJECTED')) DEFAULT 'PENDING',
          rating_average REAL DEFAULT 5.0,
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
          category_title TEXT,
          client_email TEXT,
          client_name TEXT,
          client_phone TEXT,
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
        if (err) return reject(err);

        // Ensure real platform verified workers exist on fresh cloud deployments
        db.get('SELECT COUNT(*) as count FROM worker_profiles', (wErr, row) => {
          if (!wErr && row && row.count === 0) {
            console.log('⚡ [kaam Dual Engine] Initializing real verified platform accounts for fresh deployment...');
            
            // 1. Real Users
            db.run(`INSERT OR IGNORE INTO users (id, phone, email, password_hash, role, full_name, onboarding_completed, is_active) VALUES
              ('QaUznFo8r3edJql6dQn9ACwFIcZ2', '+91 91111 22222', 'sy191101400@gmail.com', 'google-oauth-QaUznFo8r3edJql6dQn9ACwFIcZ2', 'WORKER', 'S. Yadav (Updated)', 1, 1),
              ('g-user-1791107064285', '+91 98765 00000', 'sy623806@gmail.com', 'google-oauth-g-user-1791107064285', 'WORKER', 'Surya Yadav (Pro)', 1, 1),
              ('u-1791124150235', '+91 9653192752', 'ysujal26@gmail.com', '$2a$10$a0sJcufIb4h9PbEfIrZToejjiGJ35s6Fk8.nQq1.5FeZdEBUD.sNi', 'WORKER', 'sujal yadav', 1, 1)
            `);

            // 2. Real Worker Profiles
            const suryaPackages = JSON.stringify([
              { id: 'pkg-1-1791107075606', title: 'Plumber / Pipe Fitter - Basic Inspection & Diagnosis', description: 'Includes doorstep visit, problem diagnosis, and minor fixes up to 30 mins.', price: 100, duration: '30 mins', category: 'plumber' },
              { id: 'pkg-2-1791107075606', title: 'Standard Plumber / Pipe Fitter Service Package', description: 'Complete standard repair, fitting, and testing work at home.', price: 630, duration: '1-2 hours', category: 'plumber' },
              { id: 'pkg-1791107127085', title: 'Full home wiring', description: 'Includes doorstep inspection, diagnostic & complete service.', price: 356, duration: '45 mins', category: 'electrician' }
            ]);
            const suryaCategories = JSON.stringify(['electrician', 'locksmith', 'plumber', 'salon_men']);

            const sujalPackages = JSON.stringify([
              { id: 'pkg-1791124192423', title: 'wall repair,', description: 'Complete doorstep service & diagnosis.', price: 2999, duration: '1 hour', category: 'painter' }
            ]);
            const sujalCategories = JSON.stringify(['plumber', 'painter']);

            const syadavPackages = JSON.stringify([
              { id: 'pkg-acc1-1', title: 'Plumbing Inspection', price: 199, duration: '30 mins', category: 'plumber' }
            ]);
            const syadavCategories = JSON.stringify(['plumber']);

            db.run(`INSERT OR IGNORE INTO worker_profiles 
              (id, user_id, trade_category, trade_title, experience_years, daily_rate, hourly_rate, visiting_charge, locality, city, bio, is_available, is_account_locked, kyc_status, rating_average, completed_jobs_count, packages_json, categories_json, latitude, longitude)
              VALUES
              ('w-1791107064294', 'g-user-1791107064285', 'electrician', 'Master Electrician & Plumber Pro', 5, 650, 120, 149, 'Andheri West, Mumbai', 'Mumbai', 'Experienced professional with certified skills.', 1, 0, 'VERIFIED', 5.0, 15, '${suryaPackages.replace(/'/g, "''")}', '${suryaCategories}', 19.1363, 72.8277),
              ('w-1791124150328', 'u-1791124150235', 'plumber', 'Skilled Trade Specialist', 3, 600, 110, 149, 'g.n.rd,thane', 'Mumbai', 'Expert in plumbing and painting.', 1, 0, 'VERIFIED', 4.9, 8, '${sujalPackages.replace(/'/g, "''")}', '${sujalCategories}', 19.2183, 72.9781),
              ('w-1791044807171', 'QaUznFo8r3edJql6dQn9ACwFIcZ2', 'plumber', 'Master Plumbing & Leak Specialist', 4, 700, 130, 199, 'Andheri West, Mumbai', 'Mumbai', 'Master sanitary & leakage expert.', 1, 0, 'VERIFIED', 5.0, 12, '${syadavPackages.replace(/'/g, "''")}', '${syadavCategories}', 19.1136, 72.8697)
            `);

            // 3. Real KYC Records
            db.run(`INSERT OR IGNORE INTO worker_bank_kyc 
              (id, worker_id, account_holder_name, account_number, ifsc_code, upi_id, bank_name, govt_id_type, govt_id_number, upi_phone, kyc_verified)
              VALUES 
              ('kyc-w-1791107064294', 'w-1791107064294', 'Surya Yadav', '39182746102', 'SBIN0001823', '9876500000@paytm', 'State Bank of India', 'Aadhaar Card', '7234-8910-1123', '+91 98765 00000', 1),
              ('kyc-w-1791044807171', 'w-1791044807171', 'S. Yadav', '50100293847', 'HDFC0000240', '9111122222@paytm', 'HDFC Bank', 'Aadhaar Card', '6123-4567-8901', '+91 91111 22222', 1),
              ('kyc-w-1791124150328', 'w-1791124150328', 'sujal yadav', '965319275201', 'KKBK0000671', '9653192752@kotakbank', 'Kotak Mahindra Bank', 'Aadhaar Card', '4591-2830-1928', '+91 9653192752', 1)
            `);
          }
          resolve(db);
        });
      });
    });
  });
};

export const getSQLiteDB = () => db;

export default db;

