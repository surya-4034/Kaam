/**
 * 📍 Spatial Location Unit Routes
 * Dedicated REST API endpoints for real-time partner GPS updates
 * and 50km geospatial proximity querying.
 */

import express from 'express';
import { 
  calculateDistanceKm, 
  filterAndSortByDistance, 
  updatePartnerLocationInDB 
} from '../services/spatialLocationService.js';
import { getSQLiteDB } from '../config/database.js';
import { getPartnerDb, isPartnerDbConnected } from '../config/mongoose.js';
import WorkerProfile from '../models/WorkerProfile.js';

const router = express.Router();

/**
 * @route   POST /api/location/update-partner
 * @desc    Broadcast live GPS coordinates from Worker App
 * @access  Public
 */
router.post('/update-partner', async (req, res) => {
  try {
    const { partnerId, latitude, longitude, city, locality, isAvailable } = req.body;

    if (!partnerId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: partnerId, latitude, longitude' 
      });
    }

    const result = await updatePartnerLocationInDB({
      partnerId,
      latitude,
      longitude,
      city,
      locality,
      isAvailable
    });

    return res.status(200).json({
      success: true,
      message: 'Partner location updated successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ [Spatial Route Error] update-partner:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/location/nearby-partners
 * @desc    Fetch partners within specified distance radius (default 50km)
 * @access  Public
 */
router.get('/nearby-partners', async (req, res) => {
  try {
    const { lat, lng, category, maxDistanceKm = 50 } = req.query;
    const clientLat = Number(lat);
    const clientLng = Number(lng);
    const radiusKm = Number(maxDistanceKm) || 50;

    let rawWorkers = [];

    // Fetch candidate workers from MongoDB or SQLite
    if (isPartnerDbConnected()) {
      try {
        const partnerConn = getPartnerDb();
        const DynamicWorkerModel = partnerConn.model('WorkerProfile', WorkerProfile.schema);
        const query = category ? { trade_category: new RegExp(category, 'i') } : {};
        rawWorkers = await DynamicWorkerModel.find(query).lean();
      } catch (mongoErr) {
        console.warn('⚠️ [Spatial Route] Mongo fetch notice, using SQLite:', mongoErr.message);
      }
    }

    if (rawWorkers.length === 0) {
      const db = getSQLiteDB();
      rawWorkers = await new Promise((resolve) => {
        let sql = `SELECT * FROM worker_profiles`;
        let params = [];
        if (category) {
          sql += ` WHERE trade_category LIKE ?`;
          params.push(`%${category}%`);
        }
        db.all(sql, params, (err, rows) => {
          if (err) return resolve([]);
          resolve(rows || []);
        });
      });
    }

    // Apply 50km Haversine Filter & Proximity Ranking
    const filteredWorkers = filterAndSortByDistance(rawWorkers, clientLat, clientLng, radiusKm);

    return res.status(200).json({
      success: true,
      count: filteredWorkers.length,
      maxDistanceKm: radiusKm,
      clientCoordinates: { lat: clientLat, lng: clientLng },
      data: filteredWorkers
    });
  } catch (error) {
    console.error('❌ [Spatial Route Error] nearby-partners:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/location/haversine-calc
 * @desc    Utility endpoint to calculate distance between any 2 coordinates
 * @access  Public
 */
router.post('/haversine-calc', (req, res) => {
  const { lat1, lon1, lat2, lon2 } = req.body;
  const distanceKm = calculateDistanceKm(lat1, lon1, lat2, lon2);
  
  return res.status(200).json({
    success: true,
    distanceKm,
    isWithin50Km: distanceKm <= 50,
    unit: 'Kilometers'
  });
});

export default router;
