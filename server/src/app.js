import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import workerRoutes from './routes/workerRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import duesRoutes from './routes/duesRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import mapsRoutes from './routes/mapsRoutes.js';
import spatialRoutes from './routes/spatialRoutes.js';
import { isMongoConnected, getLastMongoError } from './config/mongoose.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// API Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/dues', duesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/location', spatialRoutes);


// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    platform: 'kaam Production API Server',
    version: '4.0.0',
    health: '/api/health',
    endpoints: {
      auth: '/api/auth',
      workers: '/api/workers',
      jobs: '/api/jobs',
      dues: '/api/dues',
      admin: '/api/admin',
      maps: '/api/maps',
      location: '/api/location'
    }
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'kaam API Backend',
    mongoConnected: isMongoConnected(),
    mongoError: getLastMongoError(),
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

export default app;
