/**
 * 📍 Spatial Location Unit Module
 * Handles Haversine spatial distance calculations, 50km radius filtering,
 * and dual-sync location updates across MongoDB Atlas & SQLite.
 */

import { getSQLiteDB } from '../config/database.js';
import { getPartnerDb, isPartnerDbConnected } from '../config/mongoose.js';
import WorkerProfile from '../models/WorkerProfile.js';
import { indexPartnerSpatialLocation, resolveWorkerCoordinates, isWithinMumbaiRange, MUMBAI_BOUNDING_BOX } from './redisSpatialService.js';

export { isWithinMumbaiRange, MUMBAI_BOUNDING_BOX };

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates the exact Haversine distance in Kilometers between two GPS coordinates
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in Kilometers
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return 0;
  }
  
  const p1 = Number(lat1);
  const l1 = Number(lon1);
  const p2 = Number(lat2);
  const l2 = Number(lon2);

  if (isNaN(p1) || isNaN(l1) || isNaN(p2) || isNaN(l2)) {
    return 0;
  }

  // Convert degrees to radians
  const dLat = (p2 - p1) * (Math.PI / 180);
  const dLon = (l2 - l1) * (Math.PI / 180);

  const radLat1 = p1 * (Math.PI / 180);
  const radLat2 = p2 * (Math.PI / 180);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(radLat1) * Math.cos(radLat2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  const distance = EARTH_RADIUS_KM * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place (e.g. 4.2 km)
};

/**
 * Filters list of partners by max distance radius (default 50km) and sorts by proximity
 * @param {Array} workers 
 * @param {number} clientLat 
 * @param {number} clientLng 
 * @param {number} maxDistanceKm - Default 50km
 * @returns {Array} Filtered and sorted partners with distanceKm property
 */
export const filterAndSortByDistance = (workers, clientLat, clientLng, maxDistanceKm = 50) => {
  if (!workers || !Array.isArray(workers)) return [];

  const parsedClientLat = Number(clientLat);
  const parsedClientLng = Number(clientLng);
  const parsedMaxDist = Number(maxDistanceKm) || 50;

  if (isNaN(parsedClientLat) || isNaN(parsedClientLng)) {
    return workers.map(w => ({
      ...w,
      distanceKm: 0,
      isWithinRadius: true
    }));
  }

  const results = [];

  for (const worker of workers) {
    const coords = resolveWorkerCoordinates(worker);

    // Skip un-geolocated workers (never assign dummy client coordinates!)
    if (!coords) continue;

    const wLat = coords.lat;
    const wLng = coords.lng;

    const dist = calculateDistanceKm(parsedClientLat, parsedClientLng, wLat, wLng);

    if (dist <= parsedMaxDist) {
      results.push({
        ...worker,
        latitude: wLat,
        longitude: wLng,
        distanceKm: dist,
        isWithinRadius: true,
        isRealGps: coords.isRealGps
      });
    }
  }

  return results.sort((a, b) => {
    // 1. Online / Available partners first
    const aAvail = (a.is_available === 1 || a.is_available === true) ? 1 : 0;
    const bAvail = (b.is_available === 1 || b.is_available === true) ? 1 : 0;
    if (bAvail !== aAvail) return bAvail - aAvail;

    // 2. Proximity (closest distance first)
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;

    // 3. Higher rating first
    const aRating = Number(a.rating_average || a.rating || 5);
    const bRating = Number(b.rating_average || b.rating || 5);
    return bRating - aRating;
  });
};

/**
 * Updates a partner's live GPS coordinates in both SQLite and MongoDB Atlas
 * @param {Object} locationPayload - { partnerId, latitude, longitude, city, locality, isAvailable }
 */
export const updatePartnerLocationInDB = async ({ partnerId, latitude, longitude, city, locality, isAvailable }) => {
  const db = getSQLiteDB();
  const lat = Number(latitude);
  const lng = Number(longitude);
  const now = new Date().toISOString();
  const availableVal = (isAvailable === true || isAvailable === 1 || isAvailable === '1') ? 1 : 0;

  // 1. Update SQLite worker_profiles
  await new Promise((resolve) => {
    db.run(
      `UPDATE worker_profiles 
       SET latitude = ?, longitude = ?, locality = COALESCE(?, locality), city = COALESCE(?, city), is_available = ?
       WHERE id = ? OR user_id = ?`,
      [lat, lng, locality || null, city || null, availableVal, partnerId, partnerId],
      (err) => {
        if (err) console.warn('⚠️ [Spatial Module] SQLite location update notice:', err.message);
        resolve();
      }
    );
  });

  // 2. Dual-Sync Update MongoDB Atlas (if connected)
  if (isPartnerDbConnected()) {
    try {
      const partnerConn = getPartnerDb();
      const DynamicWorkerModel = partnerConn.model('WorkerProfile', WorkerProfile.schema);
      
      await DynamicWorkerModel.updateOne(
        { $or: [{ id: partnerId }, { partner_id: partnerId }, { user_id: partnerId }] },
        {
          $set: {
            latitude: lat,
            longitude: lng,
            is_available: availableVal === 1,
            ...(city ? { city } : {}),
            ...(locality ? { locality } : {})
          }
        }
      );
    } catch (mongoErr) {
      console.warn('⚠️ [Spatial Module] MongoDB location update notice:', mongoErr.message);
    }
  }

  // 3. Index partner in Uber H3 Hexagonal Grid & Redis Spatial Store
  try {
    await indexPartnerSpatialLocation({
      partnerId,
      latitude: lat,
      longitude: lng,
      isAvailable: availableVal === 1
    });
  } catch (h3Err) {
    console.warn('⚠️ [Spatial H3 Index Note]', h3Err.message);
  }

  return {
    success: true,
    partnerId,
    latitude: lat,
    longitude: lng,
    isAvailable: availableVal === 1,
    timestamp: now
  };
};
