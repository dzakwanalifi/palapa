/**
 * Test script for OpenWeatherMap Weather API Client
 * Tests weather forecasting, caching, and itinerary recommendations
 */

import { OpenWeatherMapClient } from '../lib/weather';

// Mock API key for testing - replace with actual key in production
const TEST_API_KEY = process.env.OPENWEATHER_API_KEY || 'demo_key_for_testing';

async function testCurrentWeather() {
  console.log('🧪 Testing current weather API...');

  const client = new OpenWeatherMapClient(TEST_API_KEY);

  // Test coordinates (Yogyakarta)
  const lat = -7.7956;
  const lon = 110.3695;

  try {
    const current = await client.getCurrentWeather(lat, lon, 'metric');

    console.log('✅ Current weather test passed');
    console.log(`📍 Location: ${current.name}, ${current.sys.country}`);
    console.log(`🌤️ Weather: ${current.weather[0]?.description}`);
    console.log(`🌡️ Temperature: ${current.main.temp}°C (feels like ${current.main.feels_like}°C)`);
    console.log(`💨 Wind: ${current.wind.speed} m/s`);
    console.log(`💧 Humidity: ${current.main.humidity}%`);
    console.log(`☁️ Clouds: ${current.clouds.all}%`);

  } catch (error) {
    console.error('❌ Current weather test failed:', error.message);
    if (error.message.includes('API key')) {
      console.log('💡 Note: Set OPENWEATHER_API_KEY environment variable for actual API testing');
    }
  }
}

async function testWeatherForecast() {
  console.log('\n🧪 Testing 5-day weather forecast...');

  const client = new OpenWeatherMapClient(TEST_API_KEY);

  const lat = -7.7956;
  const lon = 110.3695;

  try {
    const forecast = await client.getForecast(lat, lon, 'metric');

    console.log('✅ Weather forecast test passed');
    console.log(`📍 City: ${forecast.city.name}, ${forecast.city.country}`);
    console.log(`📅 Forecast entries: ${forecast.list.length} (3-hour intervals)`);
    console.log(`📅 Days covered: ${Math.ceil(forecast.list.length / 8)} days`);

    if (forecast.list.length > 0) {
      const firstEntry = forecast.list[0];
      console.log(`🌤️ Next forecast: ${firstEntry.weather[0].description}`);
      console.log(`🌡️ Temperature: ${firstEntry.main.temp}°C`);
      console.log(`💨 Wind: ${firstEntry.wind.speed} m/s`);
      console.log(`📅 Time: ${new Date(firstEntry.dt * 1000).toLocaleString()}`);
    }

  } catch (error) {
    console.error('❌ Weather forecast test failed:', error.message);
    if (error.message.includes('API key')) {
      console.log('💡 Note: Set OPENWEATHER_API_KEY environment variable for actual API testing');
    }
  }
}

async function testItineraryWeather() {
  console.log('\n🧪 Testing itinerary weather...');

  const client = new OpenWeatherMapClient(TEST_API_KEY);

  const lat = -7.7956;
  const lon = 110.3695;

  try {
    const itineraryWeather = await client.getItineraryWeather(lat, lon, 3);

    console.log('✅ Itinerary weather test passed');
    console.log(`📍 Location: ${itineraryWeather.location.name}, ${itineraryWeather.location.country}`);
    console.log(`🌤️ Current: ${itineraryWeather.current.weather[0].description}, ${itineraryWeather.current.main.temp}°C`);
    console.log(`📅 Forecast entries: ${itineraryWeather.forecast['5day'].length}`);

  } catch (error) {
    console.error('❌ Itinerary weather test failed:', error.message);
    if (error.message.includes('API key')) {
      console.log('💡 Note: Set OPENWEATHER_API_KEY environment variable for actual API testing');
    }
  }
}

async function testWeatherRecommendations() {
  console.log('\n🧪 Testing weather recommendations...');

  const client = new OpenWeatherMapClient(TEST_API_KEY);

  // Sample destinations
  const destinations = [
    { lat: -7.7956, lon: 110.3695, name: 'Yogyakarta City' },
    { lat: -7.7525, lon: 110.4915, name: 'Borobudur Temple' }
  ];

  try {
    const recommendations = await client.getItineraryWeatherRecommendations(destinations);

    console.log('✅ Weather recommendations test passed');
    recommendations.forEach((rec, index) => {
      console.log(`\n📍 ${rec.destination}:`);
      console.log(`📅 Date: ${rec.date}`);

      if (rec.weather) {
        console.log(`🌡️ Temp: ${rec.weather.main.temp}°C`);
        console.log(`🌤️ Weather: ${rec.weather.weather[0].description}`);
        console.log(`💨 Wind: ${rec.weather.wind.speed} m/s`);
      } else {
        console.log('❌ No weather data available');
      }

      if (rec.overview) {
        console.log(`📝 Overview: ${rec.overview}`);
      }

      if (rec.suitability) {
        console.log(`✅ Suitable: ${rec.suitability.suitable ? 'Yes' : 'No'} (${rec.suitability.score}/100)`);
        console.log(`💡 Notes: ${rec.suitability.reasons.join(', ')}`);
      }
    });

  } catch (error) {
    console.error('❌ Weather recommendations test failed:', error.message);
    if (error.message.includes('API key')) {
      console.log('💡 Note: Set OPENWEATHER_API_KEY environment variable for actual API testing');
    }
  }
}

async function testCachingMechanism() {
  console.log('\n🧪 Testing caching mechanism...');

  const client = new OpenWeatherMapClient(TEST_API_KEY, 1); // 1 minute cache for testing

  const lat = -7.7956;
  const lon = 110.3695;

  try {
    console.log('📊 Cache stats before:', client.getCacheStats());

    // First call
    const start1 = Date.now();
    await client.getCurrentWeather(lat, lon);
    const time1 = Date.now() - start1;

    // Second call (should be cached)
    const start2 = Date.now();
    await client.getCurrentWeather(lat, lon);
    const time2 = Date.now() - start2;

    console.log('📊 Cache stats after:', client.getCacheStats());
    console.log(`⏱️ First call: ${time1}ms, Second call: ${time2}ms`);

    if (time2 < time1) {
      console.log('✅ Caching is working!');
    } else {
      console.log('⚠️ Cache may not be working as expected');
    }

    // Clear cache
    client.clearCache();
    console.log('🧹 Cache cleared, stats:', client.getCacheStats());

  } catch (error) {
    console.error('❌ Caching test failed:', error.message);
  }
}

async function testWeatherSuitability() {
  console.log('\n🧪 Testing weather suitability assessment...');

  const client = new OpenWeatherMapClient(TEST_API_KEY);

  // Mock weather data for testing suitability function (free plan format)
  const mockGoodWeather = {
    dt: Date.now() / 1000,
    main: {
      temp: 24,
      feels_like: 26,
      temp_min: 20,
      temp_max: 28,
      pressure: 1013,
      humidity: 65
    },
    weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
    clouds: { all: 10 },
    wind: { speed: 5, deg: 180 },
    visibility: 10000,
    dt_txt: new Date().toISOString()
  } as any;

  const mockBadWeather = {
    dt: Date.now() / 1000,
    main: {
      temp: 8,
      feels_like: 5,
      temp_min: 5,
      temp_max: 12,
      pressure: 1005,
      humidity: 90
    },
    weather: [{ id: 501, main: 'Rain', description: 'moderate rain', icon: '10d' }],
    clouds: { all: 90 },
    wind: { speed: 20, deg: 270 },
    visibility: 5000,
    rain: { '3h': 8 },
    dt_txt: new Date().toISOString()
  } as any;

  try {
    const goodAssessment = client.isGoodWeatherForActivities(mockGoodWeather);
    const badAssessment = client.isGoodWeatherForActivities(mockBadWeather);

    console.log('✅ Weather suitability test passed');
    console.log(`🌤️ Good weather score: ${goodAssessment.score}/100 (${goodAssessment.reasons.join(', ')})`);
    console.log(`🌧️ Bad weather score: ${badAssessment.score}/100 (${badAssessment.reasons.join(', ')})`);

  } catch (error) {
    console.error('❌ Weather suitability test failed:', error);
  }
}

async function runAllTests() {
  console.log('🚀 Starting OpenWeatherMap Weather API Tests (Free Plan)\n');

  try {
    await testCurrentWeather();
    await testWeatherForecast();
    await testItineraryWeather();
    await testWeatherRecommendations();
    await testCachingMechanism();
    await testWeatherSuitability();

    console.log('\n🎉 All weather tests completed!');
    console.log('💡 Note: Some tests may show API errors if OPENWEATHER_API_KEY is not set');
    console.log('💡 Note: Using Free Plan APIs (5-day forecast, no AI summaries)');

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
