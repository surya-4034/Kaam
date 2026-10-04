/**
 * 👷 Partner Location Broadcasting Unit Module
 * Handles HTML5 GPS tracking and periodic/event pings to backend for Worker App.
 */

import { API_BASE_URL } from '../config/api';

/**
 * Get current Partner GPS position and broadcast to backend
 * @param {string} partnerId 
 * @param {boolean} isAvailable 
 * @param {string} [city] 
 * @param {string} [locality] 
 * @returns {Promise<{success: boolean, latitude: number, longitude: number}>}
 */
export const broadcastPartnerLocation = async (partnerId, isAvailable = true, city = '', locality = '') => {
  return new Promise((resolve) => {
    if (!partnerId) {
      return resolve({ success: false, reason: 'Missing partnerId' });
    }

    if (!navigator.geolocation) {
      console.warn('⚠️ Partner device does not support Geolocation');
      return resolve({ success: false, reason: 'Geolocation unsupported' });
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          const response = await fetch(`${API_BASE_URL}/api/location/update-partner`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              partnerId,
              latitude,
              longitude,
              city,
              locality,
              isAvailable
            })
          });

          const data = await response.json();
          resolve({
            success: data.success,
            latitude,
            longitude,
            data
          });
        } catch (err) {
          console.error('❌ Failed to broadcast partner location:', err.message);
          resolve({ success: false, latitude, longitude, error: err.message });
        }
      },
      (error) => {
        console.warn('⚠️ Partner GPS location permission denied or error:', error.message);
        resolve({ success: false, reason: error.message });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  });
};
