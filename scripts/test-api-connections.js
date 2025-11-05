// scripts/test-api-connections.js
// Test semua API connections

const https = require('https');
require('dotenv').config({ path: '.env.local' });

const tests = [];

// Test Gemini API
async function testGemini() {
  return new Promise((resolve) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      tests.push({ name: 'Gemini API', status: 'skipped', message: 'API key not set' });
      return resolve();
    }

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models?key=${apiKey}`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          tests.push({ name: 'Gemini API', status: 'success', message: 'Connected' });
        } else {
          tests.push({ name: 'Gemini API', status: 'failed', message: `Status: ${res.statusCode}` });
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      tests.push({ name: 'Gemini API', status: 'failed', message: error.message });
      resolve();
    });

    req.end();
  });
}

// Test Perplexity API
async function testPerplexity() {
  return new Promise((resolve) => {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      tests.push({ name: 'Perplexity API', status: 'skipped', message: 'API key not set' });
      return resolve();
    }

    const postData = JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [{ role: 'user', content: 'test' }]
    });

    const options = {
      hostname: 'api.perplexity.ai',
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 400) {
          tests.push({ name: 'Perplexity API', status: 'success', message: 'Connected' });
        } else {
          tests.push({ name: 'Perplexity API', status: 'failed', message: `Status: ${res.statusCode}` });
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      tests.push({ name: 'Perplexity API', status: 'failed', message: error.message });
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

// Test OpenWeatherMap API
async function testOpenWeatherMap() {
  return new Promise((resolve) => {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      tests.push({ name: 'OpenWeatherMap API', status: 'skipped', message: 'API key not set' });
      return resolve();
    }

    // Try multiple endpoints
    const endpoints = [
      `/data/2.5/weather?q=London&appid=${apiKey}`,
      `/data/2.5/weather?lat=51.5074&lon=-0.1278&appid=${apiKey}`,
      `/data/3.0/onecall?lat=51.5074&lon=-0.1278&appid=${apiKey}&exclude=minutely,hourly,daily`
    ];

    let attempts = 0;
    const maxAttempts = endpoints.length;

    function tryEndpoint(index) {
      if (index >= maxAttempts) {
        tests.push({ name: 'OpenWeatherMap API', status: 'failed', message: 'All endpoints failed' });
        return resolve();
      }

      const options = {
        hostname: 'api.openweathermap.org',
        path: endpoints[index],
        method: 'GET',
        timeout: 5000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            tests.push({ name: 'OpenWeatherMap API', status: 'success', message: `Connected (endpoint ${index + 1})` });
            resolve();
          } else if (res.statusCode === 401) {
            // Try next endpoint
            tryEndpoint(index + 1);
          } else {
            tests.push({ name: 'OpenWeatherMap API', status: 'failed', message: `Status: ${res.statusCode}` });
            resolve();
          }
        });
      });

      req.on('error', (error) => {
        if (index + 1 < maxAttempts) {
          tryEndpoint(index + 1);
        } else {
          tests.push({ name: 'OpenWeatherMap API', status: 'failed', message: error.message });
          resolve();
        }
      });

      req.on('timeout', () => {
        req.destroy();
        if (index + 1 < maxAttempts) {
          tryEndpoint(index + 1);
        } else {
          tests.push({ name: 'OpenWeatherMap API', status: 'failed', message: 'Connection timeout' });
          resolve();
        }
      });

      req.end();
    }

    tryEndpoint(0);
  });
}

// Test FAISS (no server needed, just check if index path exists)
async function testFAISS() {
  return new Promise((resolve) => {
    const fs = require('fs');
    const path = require('path');
    const indexPath = process.env.FAISS_INDEX_PATH || './faiss_index';
    
    try {
      // FAISS is used directly in code, no server needed
      // Just check if we can access the directory
      if (!fs.existsSync(indexPath)) {
        fs.mkdirSync(indexPath, { recursive: true });
      }
      tests.push({ name: 'FAISS Vector Store', status: 'success', message: 'Ready (local, no server needed)' });
    } catch (error) {
      tests.push({ name: 'FAISS Vector Store', status: 'failed', message: error.message });
    }
    resolve();
  });
}

// Test OSRM
async function testOSRM() {
  return new Promise((resolve) => {
    const osrmUrl = process.env.OSRM_URL || 'http://router.project-osrm.org';
    const http = require('http');
    
    const url = new URL(`${osrmUrl}/route/v1/driving/13.388860,52.517037;13.397634,52.529407`);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          tests.push({ name: 'OSRM', status: 'success', message: 'Connected' });
        } else {
          tests.push({ name: 'OSRM', status: 'failed', message: `Status: ${res.statusCode}` });
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      tests.push({ name: 'OSRM', status: 'failed', message: error.message });
      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
      tests.push({ name: 'OSRM', status: 'failed', message: 'Connection timeout' });
      resolve();
    });

    req.end();
  });
}

// Test Parlant Server
async function testParlant() {
  return new Promise((resolve) => {
    const parlantUrl = process.env.PARLANT_SERVER_URL || 'http://localhost:8800';
    const http = require('http');
    
    const url = new URL(`${parlantUrl}/health`);
    const options = {
      hostname: url.hostname,
      port: url.port || 8800,
      path: url.pathname,
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        tests.push({ name: 'Parlant Server', status: 'success', message: 'Connected' });
      } else {
        tests.push({ name: 'Parlant Server', status: 'failed', message: `Status: ${res.statusCode}` });
      }
      resolve();
    });

    req.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        tests.push({ name: 'Parlant Server', status: 'failed', message: 'Connection refused - Parlant server not running' });
      } else {
        tests.push({ name: 'Parlant Server', status: 'failed', message: error.message });
      }
      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
      tests.push({ name: 'Parlant Server', status: 'failed', message: 'Connection timeout' });
      resolve();
    });

    req.end();
  });
}

async function runAllTests() {
  console.log('🔍 Testing API connections...\n');

  await testGemini();
  await testPerplexity();
  await testOpenWeatherMap();
  await testFAISS();
  await testOSRM();
  await testParlant();

  console.log('📊 Test Results:\n');
  tests.forEach(test => {
    const icon = test.status === 'success' ? '✅' : test.status === 'failed' ? '❌' : '⚠️';
    console.log(`${icon} ${test.name}: ${test.status} - ${test.message}`);
  });

  const successCount = tests.filter(t => t.status === 'success').length;
  const totalCount = tests.length;
  console.log(`\n✅ ${successCount}/${totalCount} tests passed`);
  
  if (successCount < totalCount) {
    process.exit(1);
  }
}

runAllTests();

