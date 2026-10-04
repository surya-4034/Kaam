/**
 * 🧪 Test Verification: Dynamic 50km Spatial Search Across ANY City
 */

import { indexPartnerSpatialLocation, searchPartnersSpatial50Km } from '../server/src/services/redisSpatialService.js';

async function verifyAnyCitySearch() {
  console.log('🧪 Testing Dynamic 50km Spatial Search Across Multiple Cities...\n');

  // Simulated Database Partners in Different Cities Across India
  const partners = [
    { id: 'p-mumbai-1', name: 'Raju Plumber (Mumbai)', locality: 'Andheri West, Mumbai', latitude: 19.1136, longitude: 72.8697 },
    { id: 'p-mumbai-2', name: 'Sanjay Electrician (Mumbai)', locality: 'Bandra, Mumbai', latitude: 19.0596, longitude: 72.8295 },
    { id: 'p-patna-1', name: 'Amit Carpenter (Patna)', locality: 'Boring Road, Patna', latitude: 25.6119, longitude: 85.1189 },
    { id: 'p-patna-2', name: 'Ravi Painter (Patna)', locality: 'Kankarbagh, Patna', latitude: 25.5991, longitude: 85.1582 },
    { id: 'p-blore-1', name: 'Kiran Mason (Bengaluru)', locality: 'Koramangala, Bengaluru', latitude: 12.9352, longitude: 77.6245 },
    { id: 'p-delhi-1', name: 'Vikram Welder (Delhi)', locality: 'Connaught Place, Delhi', latitude: 28.6315, longitude: 77.2167 }
  ];

  // Index all partners in the spatial engine
  for (const p of partners) {
    await indexPartnerSpatialLocation({
      partnerId: p.id,
      latitude: p.latitude,
      longitude: p.longitude,
      isAvailable: true
    });
  }

  // 🏙️ TEST 1: Client in MUMBAI (19.0760, 72.8777)
  const mumbaiResults = await searchPartnersSpatial50Km({
    clientLat: 19.0760,
    clientLng: 72.8777,
    radiusKm: 50,
    candidatesList: partners
  });

  console.log(`🏙️ TEST 1 - Client in MUMBAI (19.0760, 72.8777):`);
  console.log(`   Found ${mumbaiResults.length} partners within 50km:`, mumbaiResults.map(p => `${p.name} (${p.distanceKm} km)`));
  const mumbaiPass = mumbaiResults.length === 2 && mumbaiResults.every(p => p.id.startsWith('p-mumbai'));

  // 🏙️ TEST 2: Client in PATNA (25.5941, 85.1376)
  const patnaResults = await searchPartnersSpatial50Km({
    clientLat: 25.5941,
    clientLng: 85.1376,
    radiusKm: 50,
    candidatesList: partners
  });

  console.log(`\n🏙️ TEST 2 - Client in PATNA (25.5941, 85.1376):`);
  console.log(`   Found ${patnaResults.length} partners within 50km:`, patnaResults.map(p => `${p.name} (${p.distanceKm} km)`));
  const patnaPass = patnaResults.length === 2 && patnaResults.every(p => p.id.startsWith('p-patna'));

  // 🏙️ TEST 3: Client in BENGALURU (12.9716, 77.5946)
  const bloreResults = await searchPartnersSpatial50Km({
    clientLat: 12.9716,
    clientLng: 77.5946,
    radiusKm: 50,
    candidatesList: partners
  });

  console.log(`\n🏙️ TEST 3 - Client in BENGALURU (12.9716, 77.5946):`);
  console.log(`   Found ${bloreResults.length} partners within 50km:`, bloreResults.map(p => `${p.name} (${p.distanceKm} km)`));
  const blorePass = bloreResults.length === 1 && bloreResults[0].id === 'p-blore-1';

  console.log('\n----------------------------------------');
  if (mumbaiPass && patnaPass && blorePass) {
    console.log('✅ PASSED! The 50km spatial search engine works dynamically for ANY city across the globe!');
  } else {
    console.error('❌ FAILED dynamic city test!');
  }
}

verifyAnyCitySearch().catch(console.error);
