/**
 * Test script for OSRM Routing Library
 * Tests route optimization, distance matrix calculation, and TSP solving
 */

import { RouteOptimizer, TSPSolver } from '../lib/routing';
import type { Coordinate } from '../lib/routing';

async function testBasicRoute() {
  console.log('🧪 Testing basic route calculation...');

  const optimizer = new RouteOptimizer();

  // Sample destinations in Yogyakarta area
  const destinations = [
    { coordinate: { lat: -7.7956, lng: 110.3695 }, name: 'Malioboro Street' },
    { coordinate: { lat: -7.7924, lng: 110.3658 }, name: 'Keraton Yogyakarta' },
    { coordinate: { lat: -7.6051, lng: 110.2038 }, name: 'Candi Prambanan' },
    { coordinate: { lat: -7.7525, lng: 110.4915 }, name: 'Candi Borobudur' }
  ];

  try {
    const result = await optimizer.optimizeRoute(destinations, undefined, {
      method: 'none' // Direct route without optimization
    });

    console.log('✅ Basic route test passed');
    console.log(`📍 Total distance: ${(result.totalDistance / 1000).toFixed(2)} km`);
    console.log(`⏱️ Estimated time: ${(result.estimatedTime / 3600).toFixed(2)} hours`);
    console.log(`📍 Waypoints: ${result.waypoints.map(w => w.name).join(' → ')}`);

  } catch (error) {
    console.error('❌ Basic route test failed:', error);
  }
}

async function testRouteOptimization() {
  console.log('\n🧪 Testing route optimization with TSP...');

  const optimizer = new RouteOptimizer();

  // Sample destinations - more spread out
  const destinations = [
    { coordinate: { lat: -7.7956, lng: 110.3695 }, name: 'Malioboro Street' },
    { coordinate: { lat: -7.7924, lng: 110.3658 }, name: 'Keraton Yogyakarta' },
    { coordinate: { lat: -7.6051, lng: 110.2038 }, name: 'Candi Prambanan' },
    { coordinate: { lat: -7.7525, lng: 110.4915 }, name: 'Candi Borobudur' },
    { coordinate: { lat: -7.9666, lng: 110.3928 }, name: 'Parangtritis Beach' }
  ];

  try {
    // Test with optimization
    const optimizedResult = await optimizer.optimizeRoute(destinations, undefined, {
      method: 'nearest_neighbor'
    });

    console.log('✅ Route optimization test passed');
    console.log(`📍 Optimized distance: ${(optimizedResult.totalDistance / 1000).toFixed(2)} km`);
    console.log(`⏱️ Estimated time: ${(optimizedResult.estimatedTime / 3600).toFixed(2)} hours`);
    console.log(`📍 Optimized route: ${optimizedResult.waypoints.map(w => w.name).join(' → ')}`);
    console.log(`🎯 Optimization method: ${optimizedResult.optimizationMethod}`);

  } catch (error) {
    console.error('❌ Route optimization test failed:', error);
  }
}

async function testDistanceMatrix() {
  console.log('\n🧪 Testing distance matrix calculation...');

  const optimizer = new RouteOptimizer();

  // Sample coordinates
  const coordinates: Coordinate[] = [
    { lat: -7.7956, lng: 110.3695 }, // Malioboro
    { lat: -7.7924, lng: 110.3658 }, // Keraton
    { lat: -7.6051, lng: 110.2038 }  // Prambanan
  ];

  try {
    const distanceMatrix = await optimizer.getDistanceMatrix(coordinates);

    console.log('✅ Distance matrix test passed');
    console.log('📊 Distance Matrix (seconds):');
    distanceMatrix.forEach((row, i) => {
      console.log(`  From ${i}: ${row.map(d => Math.round(d)).join(', ')}`);
    });

    // Test TSP solver directly
    console.log('\n🧪 Testing TSP solver...');
    const { path, totalDistance } = TSPSolver.nearestNeighbor(distanceMatrix, 0);
    console.log(`🎯 TSP path: ${path.join(' → ')}`);
    console.log(`📏 TSP distance: ${Math.round(totalDistance)} seconds`);

    const { path: improvedPath, totalDistance: improvedDistance, improved } = TSPSolver.twoOpt(distanceMatrix, path, 100);
    console.log(`🎯 2-opt path: ${improvedPath.join(' → ')}`);
    console.log(`📏 2-opt distance: ${Math.round(improvedDistance)} seconds`);
    console.log(`📈 Improved: ${improved}`);

  } catch (error) {
    console.error('❌ Distance matrix test failed:', error);
  }
}

async function testRouteWithStartPoint() {
  console.log('\n🧪 Testing route with custom start point...');

  const optimizer = new RouteOptimizer();

  // Custom start point (hotel area)
  const startPoint: Coordinate = { lat: -7.7833, lng: 110.3667 }; // Near Adisucipto Airport area

  const destinations = [
    { coordinate: { lat: -7.7956, lng: 110.3695 }, name: 'Malioboro Street' },
    { coordinate: { lat: -7.7924, lng: 110.3658 }, name: 'Keraton Yogyakarta' },
    { coordinate: { lat: -7.6051, lng: 110.2038 }, name: 'Candi Prambanan' }
  ];

  try {
    const result = await optimizer.optimizeRoute(destinations, startPoint, {
      method: 'nearest_neighbor'
    });

    console.log('✅ Route with start point test passed');
    console.log(`📍 Total distance: ${(result.totalDistance / 1000).toFixed(2)} km`);
    console.log(`⏱️ Estimated time: ${(result.estimatedTime / 3600).toFixed(2)} hours`);
    console.log(`📍 Route: Start → ${result.waypoints.slice(1).map(w => w.name).join(' → ')}`);

  } catch (error) {
    console.error('❌ Route with start point test failed:', error);
  }
}

async function runAllTests() {
  console.log('🚀 Starting OSRM Routing Library Tests\n');

  try {
    await testBasicRoute();
    await testRouteOptimization();
    await testDistanceMatrix();
    await testRouteWithStartPoint();

    console.log('\n🎉 All routing tests completed!');

  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

export { runAllTests };
