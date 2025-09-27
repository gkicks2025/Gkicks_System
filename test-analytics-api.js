const https = require('https');
const http = require('http');

// The JWT token we just generated
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoiZ2tja3NkbW5AZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU4ODkyMzcwLCJleHAiOjE3NTg5Nzg3NzB9.YdKI2J6EtiS5F9gmkDQqUDCtrLf8m-FflFQybQI9RMw';

function testAnalyticsAPI() {
  console.log('🔍 Testing Analytics API endpoint...');
  
  const options = {
    hostname: '72.60.198.110',
    port: 3000,
    path: '/api/admin/analytics',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${JWT_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 10000
  };

  const req = http.request(options, (res) => {
    console.log(`📊 Status Code: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\n📄 Response Body:');
      try {
        const jsonData = JSON.parse(data);
        console.log(JSON.stringify(jsonData, null, 2));
        
        if (res.statusCode === 200) {
          console.log('\n✅ Analytics API is working correctly!');
          
          // Check if we have the expected data structure
          if (jsonData.totalRevenue !== undefined) {
            console.log(`💰 Total Revenue: $${jsonData.totalRevenue}`);
          }
          if (jsonData.totalOrders !== undefined) {
            console.log(`📦 Total Orders: ${jsonData.totalOrders}`);
          }
          if (jsonData.totalCustomers !== undefined) {
            console.log(`👥 Total Customers: ${jsonData.totalCustomers}`);
          }
        } else {
          console.log(`❌ API returned error status: ${res.statusCode}`);
        }
      } catch (parseError) {
        console.log('❌ Failed to parse JSON response:');
        console.log(data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
  });

  req.on('timeout', () => {
    console.error('❌ Request timed out');
    req.destroy();
  });

  req.end();
}

// Also test if the server is responding at all
function testServerHealth() {
  console.log('🏥 Testing server health...');
  
  const options = {
    hostname: '72.60.198.110',
    port: 3000,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`🏥 Health check status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`🏥 Health response: ${data}`);
      
      // Now test analytics API
      setTimeout(() => {
        testAnalyticsAPI();
      }, 1000);
    });
  });

  req.on('error', (error) => {
    console.error('❌ Health check failed:', error.message);
    console.log('🔄 Trying analytics API anyway...');
    
    // Try analytics API even if health check fails
    setTimeout(() => {
      testAnalyticsAPI();
    }, 1000);
  });

  req.on('timeout', () => {
    console.error('❌ Health check timed out');
    req.destroy();
    
    // Try analytics API anyway
    setTimeout(() => {
      testAnalyticsAPI();
    }, 1000);
  });

  req.end();
}

console.log('🚀 Starting API tests...');
testServerHealth();