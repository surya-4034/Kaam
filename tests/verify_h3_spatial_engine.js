/**
 * 🧪 Test Verification Script for Uber H3 Hexagonal & Redis Spatial Engine
 */

import { indexPartnerSpatialLocation, searchPartnersSpatial50Km, calculateHaversineKm } from '../server/src/services/redisSpatialService.js';

async function runSpatialTests() {
  console.log('🧪 Starting Uber H3 Hexagonal Spatial Search Engine Verification...\n');

  // Client Location: Noida (28.5355, 77.3910)
  const clientLat = 28.5355;
  const clientLng = 77.3910;

  // Simulated Partners
  const testPartners = [
    {
      id: 'w-noida-62',
      name: 'Ramesh Kumar (Plumber)',
      locality: 'Sector 62, Noida',
      latitude: 28.6280,
      longitude: 77.3769,
      is_available: true,
      rating_average: 4.8
    },
    {
      id: 'w-indirapuram',
      name: 'Aamir Khan (Electrician)',
      locality: 'Indirapuram, Ghaziabad',
      latitude: 28.6410,
      longitude: 77.3712,
      is_available: true,
      rating_average: 4.9
    },
    {
      id: 'w-mumbai',
      name: 'Sujal Yadav (Mumbai Partner)',
      locality: 'mumbai',
      latitude: 19.0760,
      longitude: 72.8777,
      is_available: true,
      rating_average: 5.0
    },
    {
      id: 'w-patna',
      name: 'Vikas Kumar (Patna Partner)',
      locality: 'Boring Road, Patna',
      latitude: 25.5941,
      longitude: 85.1376,
      is_available: true,
      rating_average: 4.7
    }
  ];

  // Index partners into H3 Spatial Grid
  for (const partner of testPartners) {
    await indexPartnerSpatialLocation({
      partnerId: partner.id,
      latitude: partner.latitude,
      longitude: partner.longitude,
      isAvailable: partner.is_available
    });
  }

  // Execute 50km Spatial Radius Search
  const results = await searchPartnersSpatial50Km({
    clientLat,
    clientLng,
    radiusKm: 50,
    candidatesList: testPartners
  });

  console.log(`🎯 Search Results for Client in Noida (28.5355, 77.3910) [50km Radius]:`);
  console.log(`Found ${results.length} partners strictly within 50km:\n`);

  results.forEach((p, idx) => {
    console.log(`  ${idx + 1}. [${p.name}] - Locality: ${p.locality}`);
    console.log(`     📍 Distance: ${p.distanceKm} km away (H3 Index: ${p.h3Index})`);
  });

  // Verification Assertions
  const foundMumbai = results.some(p => p.id === 'w-mumbai');
  const foundPatna = results.some(p => p.id === 'w-patna');
  const foundNoida = results.some(p => p.id === 'w-noida-62');
  const foundIndirapuram = results.some(p => p.id === 'w-indirapuram');

  console.log('\n----------------------------------------');
  if (!foundMumbai && !foundPatna && foundNoida && foundIndirapuram) {
    console.log('✅ PASSED! Mumbai & Patna partners (1000+ km away) were STRICTLY EXCLUDED.');
    console.log('✅ PASSED! Only nearby Noida & Indirapuram partners (< 50 km away) were returned.');
  } else {
    console.error('❌ FAILED spatial filtering assertions!');
  }
}

runSpatialTests().catch(console.error);
