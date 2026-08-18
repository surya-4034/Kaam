import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { initDb } from './src/config/database.js';
import { startDuesScheduler } from './src/services/duesScheduler.js';

const PORT = process.env.PORT || 5050;

async function startServer() {
  try {
    // 1. Initialize SQLite Database Schema
    await initDb();
    console.log('[kaam Backend] Database schema initialized successfully.');

    // 2. Start Automated 36-Hour Dues Monitor Cron Task
    startDuesScheduler();

    // 3. Start Express HTTP Server
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
