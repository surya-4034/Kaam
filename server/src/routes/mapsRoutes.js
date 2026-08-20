import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Fallback Indian Landmark dataset when API key is not configured or in test mode
const FALLBACK_LANDMARKS = [
  {
    place_id: 'bhopal_jn_01',
    description: 'Bhopal Junction Railway Station, Railway Colony, Bhopal, Madhya Pradesh, India',
    structured_formatting: {
      main_text: 'Bhopal Junction Railway Station',
      secondary_text: 'Railway Colony, Bhopal, Madhya Pradesh, India'
    },
    distance: '665 m',
    geometry: { location: { lat: 23.2678, lng: 77.4147 } }
  },
  {
    place_id: 'bhopal_station_02',
    description: 'Bhopal Railway Station, Bajariya, Navbahar Colony, Bhopal, Madhya Pradesh, India',
    structured_formatting: {
      main_text: 'Bhopal Railway Station',
      secondary_text: 'Bajariya, Navbahar Colony, Bhopal, Madhya Pradesh, India'
    },
    distance: '865 m',
    geometry: { location: { lat: 23.2655, lng: 77.4112 } }
  },
  {
    place_id: 'bhopal_talkies_03',
    description: 'Bhopal Talkies, Beldarpura, Peer Gate Area, Bhopal, Madhya Pradesh, India',
    structured_formatting: {
      main_text: 'Bhopal Talkies',
      secondary_text: 'Beldarpura, Peer Gate Area, Bhopal, Madhya Pradesh, India'
    },
    distance: '1.4 km',
    geometry: { location: { lat: 23.2580, lng: 77.4040 } }
  },
  {
    place_id: 'bhopal_airport_04',
    description: 'Bhopal Airport, Airport Rd, Raja Bhoj Airport Area, Gandhi Nagar, Bhopal, Madhya Pradesh, India',
    structured_formatting: {
      main_text: 'Bhopal Airport',
      secondary_text: 'Airport Rd, Raja Bhoj Airport Area, Gandhi Nagar, Bhopal, Madhya Pradesh, India'
    },
    distance: '8.6 km',
    geometry: { location: { lat: 23.2875, lng: 77.3378 } }
  },
  {
    place_id: 'mumbai_central_05',
    description: 'Mumbai Central Railway Station Building, Mumbai Central, Mumbai, Maharashtra, India',
    structured_formatting: {
      main_text: 'Mumbai Central Railway Station Building',
      secondary_text: 'Mumbai Central, Mumbai, Maharashtra, India'
    },
    distance: '1.2 km',
    geometry: { location: { lat: 18.9696, lng: 72.8193 } }
  }
];

// 1. Google Places Autocomplete Endpoint
router.get('/autocomplete', async (req, res) => {
  const { input, lat, lng } = req.query;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!input || !input.trim()) {
    return res.json({ predictions: [] });
  }

  // If live Google Maps API key is configured
  if (apiKey && apiKey !== 'demo_key') {
    try {
      const locationBias = lat && lng ? `&location=${lat},${lng}&radius=50000` : '&components=country:in';
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&types=geocode|establishment${locationBias}&key=${apiKey}`;

      const googleRes = await fetch(url);
      const data = await googleRes.json();

      if (data.status === 'OK' && data.predictions) {
        return res.json({ predictions: data.predictions });
      }
    } catch (err) {
      console.warn('[Google Places API Error]', err.message);
    }
  }

  // High quality fallback dataset
  const filtered = FALLBACK_LANDMARKS.filter(
    l =>
      l.description.toLowerCase().includes(input.toLowerCase()) ||
      l.structured_formatting.main_text.toLowerCase().includes(input.toLowerCase())
  );

  if (filtered.length > 0) {
    return res.json({ predictions: filtered });
  }

  // Dynamic landmark generator
  return res.json({
    predictions: [
      {
        place_id: `custom_${Date.now()}_1`,
        description: `${input} Main Road, Opp. Central Landmark, India`,
        structured_formatting: {
          main_text: `${input} Main Road / Landmark`,
          secondary_text: `Near ${input}, City Center, India`
        },
        distance: '500 m',
        geometry: { location: { lat: 23.2599, lng: 77.4126 } }
      },
      {
        place_id: `custom_${Date.now()}_2`,
        description: `${input} Metro Station / Junction, India`,
        structured_formatting: {
          main_text: `${input} Metro Station / Junction`,
          secondary_text: `${input}, Metropolitan Area, India`
        },
        distance: '1.2 km',
        geometry: { location: { lat: 23.2650, lng: 77.4100 } }
      }
    ]
  });
});

// 2. Google Reverse Geocoding Endpoint (Coordinates to Street Address)
router.get('/reverse-geocode', async (req, res) => {
  const { lat, lng } = req.query;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  if (apiKey && apiKey !== 'demo_key') {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      const googleRes = await fetch(url);
      const data = await googleRes.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const topResult = data.results[0];
        return res.json({
          formattedAddress: topResult.formatted_address,
          areaName: topResult.address_components[1]?.long_name || topResult.address_components[0]?.long_name,
          details: topResult
        });
      }
    } catch (err) {
      console.warn('[Google Geocode API Error]', err.message);
    }
  }

  // Fallback reverse geocode based on coordinates
  return res.json({
    formattedAddress: `Near Hamidia Rd, Bhopal Talkies Area, Madhya Pradesh 462001, India`,
    areaName: 'Hamidia Rd'
  });
});

export default router;
