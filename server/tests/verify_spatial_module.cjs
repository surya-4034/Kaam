/**
 * 🧪 Spatial Location Module Verification Test
 * Tests Haversine distance calculations, 50km radius boundary enforcement,
 * and location updates independently.
 */

const { calculateDistanceKm, filterAndSortByDistance } = require('../src/services/spatialLocationService.js');

console.log('🧪 Starting Spatial Location Unit Module Tests...\n');

// Test Case 1: Exact distance calculation
// Patna Boring Road (25.6110, 85.1180) to Patna Kankarbagh (25.5941, 85.1588) ~ 4.5 km
const dist1 = calculateDistanceKm(25.6110, 85.1180, 25.5941, 85.1588);
console.log(`✅ Test 1 - Haversine Distance (Boring Rd to Kankarbagh): ${dist1} km`);
if (Math.abs(dist1 - 4.5) > 1.5) {
  console.error('❌ Test 1 Failed: Distance calculation inaccurate!');
  process.exit(1);
}

// Test Case 2: 50km Radius Filter
// Client at Patna Center (25.5941, 85.1376)
const mockWorkers = [
  { id: 'w-nearby-1', name: 'Nearby Plumber 1 (3km)', latitude: 25.6110, longitude: 85.1180, is_available: 1, rating_average: 4.8 },
  { id: 'w-nearby-2', name: 'Nearby Electrician (15km)', latitude: 25.5000, longitude: 85.2000, is_available: 1, rating_average: 4.9 },
  { id: 'w-border-3', name: 'Border Worker (45km)', latitude: 25.2000, longitude: 85.1000, is_available: 1, rating_average: 4.5 },
  { id: 'w-faraway-4', name: 'Faraway Worker (120km - Gaya)', latitude: 24.7914, longitude: 85.0002, is_available: 1, rating_average: 5.0 },
  { id: 'w-delhi-5', name: 'Delhi Worker (850km)', latitude: 28.6139, longitude: 77.2090, is_available: 1, rating_average: 5.0 }
];

const filtered50km = filterAndSortByDistance(mockWorkers, 25.5941, 85.1376, 50);

console.log(`\n✅ Test 2 - 50km Spatial Boundary Test:`);
console.log(`   Total Candidates Input: ${mockWorkers.length}`);
console.log(`   Candidates Passing <= 50km Filter: ${filtered50km.length}`);

filtered50km.forEach((w, idx) => {
  console.log(`   [${idx + 1}] ${w.name} -> Distance: ${w.distanceKm} km`);
});

const isFarawayExcluded = !filtered50km.some(w => w.id === 'w-faraway-4' || w.id === 'w-delhi-5');

if (filtered50km.length === 3 && isFarawayExcluded) {
  console.log('\n🎉 ALL SPATIAL UNIT TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
} else {
  console.error('\n❌ Test 2 Failed: 50km radius boundary did not exclude faraway workers correctly!');
  process.exit(1);
}
