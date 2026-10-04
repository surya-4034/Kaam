import db, { initDb } from './src/config/database.js';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  await initDb();
  console.log('[kaam Seeder] Initializing real platform accounts...');

  const adminPassHash = bcrypt.hashSync('Sujal957#', 10);

  db.serialize(() => {
    // 1. Ensure Master Admin exists
    db.run(`
      INSERT OR REPLACE INTO users (id, phone, email, password_hash, role, full_name, onboarding_completed, is_active)
      VALUES ('Surya-4034', '+91 99999 40340', 'kaamadmin@gmail.com', '${adminPassHash}', 'ADMIN', 'Surya Master Admin', 1, 1)
    `);

    // 2. Ensure Real Worker Bank KYC exists
    db.run(`
      INSERT OR REPLACE INTO worker_bank_kyc 
      (id, worker_id, account_holder_name, account_number, ifsc_code, upi_id, bank_name, govt_id_type, govt_id_number, upi_phone, kyc_verified)
      VALUES 
      ('kyc-w-1791107064294', 'w-1791107064294', 'Surya Yadav', '39182746102', 'SBIN0001823', '9876500000@paytm', 'State Bank of India', 'Aadhaar Card', '7234-8910-1123', '+91 98765 00000', 1),
      ('kyc-w-1791044807171', 'w-1791044807171', 'S. Yadav', '50100293847', 'HDFC0000240', '9111122222@paytm', 'HDFC Bank', 'Aadhaar Card', '6123-4567-8901', '+91 91111 22222', 1),
      ('kyc-w-1791124150328', 'w-1791124150328', 'sujal yadav', '965319275201', 'KKBK0000671', '9653192752@kotakbank', 'Kotak Mahindra Bank', 'Aadhaar Card', '4591-2830-1928', '+91 9653192752', 1)
    `);

    console.log('[kaam Seeder] Real accounts initialized successfully.');
  });
}

seedDatabase();


