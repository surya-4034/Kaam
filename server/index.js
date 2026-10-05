import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { initDb } from './src/config/database.js';
import { connectMongoDB, startAutoSync } from './src/config/mongoose.js';
import { seedSamplePartners } from './src/models/PartnerModel.js';
import { startDuesScheduler } from './src/services/duesScheduler.js';

// Ensure background asynchronous notices or network timeouts never bring down the server process
process.on('unhandledRejection', (reason) => {
  console.warn('⚠️ [Process Safety - Unhandled Rejection]', reason?.message || reason);
});
process.on('uncaughtException', (err) => {
  console.warn('⚠️ [Process Safety - Uncaught Exception]', err.message);
});

const PORT = process.env.PORT || 5050;

async function startServer() {
  try {
    // 1. Connect to MongoDB Atlas (kaam_db)
    await connectMongoDB();
    await seedSamplePartners();

    // 2. Initialize Local SQLite & Schema (Dual-sync engine)
    await initDb();
    console.log('[kaam Backend] Database engine initialized successfully.');

    // 3. Start Automated Database Auto-Update Monitor & 36-Hour Dues Monitor
    startAutoSync();
    startDuesScheduler();

    // 4. Start Express HTTP Server
    app.listen(PORT, () => {
      console.log(`[kaam Backend] Production API Server running on port ${PORT}`);
      console.log(`[kaam Backend] Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('[kaam Backend Initialization Failed]', err);
    process.exit(1);
  }
}

startServer();
