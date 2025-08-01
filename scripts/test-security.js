#!/usr/bin/env node

/**
 * Security Test Script
 * Tests file access security measures
 */

import http from 'http';
import https from 'https';

// Test configuration
const TEST_CONFIG = {
  // Change this to your actual domain/localhost
  baseUrl: 'https://storefy.app',
  // Test paths that should be blocked
  blockedPaths: [
    '/src/App.tsx',
    '/src/components/ui/button.tsx',
    '/src/middleware/security.ts',
    '/src/utils/security.ts',
    '/package.json',
    '/tsconfig.json',
    '/vite.config.ts',
    '/.env',
    '/components.json',
    '/netlify.toml',
    '/assets/LandingPage-CzqXVIEw.js',
    '/assets/index-BwXkgQzN.js',
    '/assets/main.js',
    '/assets/app.js.map'
  ],
  // Test paths that should work
  allowedPaths: [
    '/',
    '/favicon.svg',
    '/robots.txt'
  ]
};

/**
 * Make HTTP request and return response details
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          data: data.substring(0, 200) // First 200 chars
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Test blocked paths
 */
async function testBlockedPaths() {
  console.log('\n🚨 Testing Blocked Paths (should return 403/404):');
  console.log('='.repeat(60));
  
  let passedTests = 0;
  let totalTests = TEST_CONFIG.blockedPaths.length;
  
  for (const path of TEST_CONFIG.blockedPaths) {
    const url = TEST_CONFIG.baseUrl + path;
    
    try {
      const response = await makeRequest(url);
      const isBlocked = response.statusCode === 403 || response.statusCode === 404;
      
      console.log(`${isBlocked ? '✅' : '❌'} ${path}`);
      console.log(`   Status: ${response.statusCode} ${response.statusMessage}`);
      
      if (isBlocked) {
        passedTests++;
      } else {
        console.log(`   ⚠️  SECURITY RISK: File accessible!`);
        if (response.data.includes('export') || response.data.includes('import')) {
          console.log(`   🚨 SOURCE CODE EXPOSED!`);
        }
      }
      
    } catch (error) {
      console.log(`❌ ${path}`);
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('');
  }
  
  return { passed: passedTests, total: totalTests };
}

/**
 * Test allowed paths
 */
async function testAllowedPaths() {
  console.log('\n✅ Testing Allowed Paths (should return 200):');
  console.log('='.repeat(60));
  
  let passedTests = 0;
  let totalTests = TEST_CONFIG.allowedPaths.length;
  
  for (const path of TEST_CONFIG.allowedPaths) {
    const url = TEST_CONFIG.baseUrl + path;
    
    try {
      const response = await makeRequest(url);
      const isAllowed = response.statusCode === 200;
      
      console.log(`${isAllowed ? '✅' : '❌'} ${path}`);
      console.log(`   Status: ${response.statusCode} ${response.statusMessage}`);
      
      if (isAllowed) {
        passedTests++;
      }
      
    } catch (error) {
      console.log(`❌ ${path}`);
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('');
  }
  
  return { passed: passedTests, total: totalTests };
}

/**
 * Test security headers
 */
async function testSecurityHeaders() {
  console.log('\n🔒 Testing Security Headers:');
  console.log('='.repeat(60));
  
  try {
    const response = await makeRequest(TEST_CONFIG.baseUrl + '/');
    const headers = response.headers;
    
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security',
      'referrer-policy'
    ];
    
    let headersPassed = 0;
    
    for (const header of securityHeaders) {
      const hasHeader = headers[header] !== undefined;
      console.log(`${hasHeader ? '✅' : '❌'} ${header}: ${headers[header] || 'Missing'}`);
      if (hasHeader) headersPassed++;
    }
    
    return { passed: headersPassed, total: securityHeaders.length };
    
  } catch (error) {
    console.log(`❌ Error testing headers: ${error.message}`);
    return { passed: 0, total: 5 };
  }
}

/**
 * Main test function
 */
async function runSecurityTests() {
  console.log('🔒 Storefy Security Test Suite');
  console.log('Testing URL:', TEST_CONFIG.baseUrl);
  console.log('='.repeat(60));
  
  try {
    // Test if server is running
    await makeRequest(TEST_CONFIG.baseUrl + '/');
    console.log('✅ Server is running');
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log('Please start the development server with: npm run dev');
    process.exit(1);
  }
  
  // Run tests
  const blockedResults = await testBlockedPaths();
  const allowedResults = await testAllowedPaths();
  const headerResults = await testSecurityHeaders();
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('='.repeat(60));
  console.log(`Blocked Paths: ${blockedResults.passed}/${blockedResults.total} passed`);
  console.log(`Allowed Paths: ${allowedResults.passed}/${allowedResults.total} passed`);
  console.log(`Security Headers: ${headerResults.passed}/${headerResults.total} passed`);
  
  const totalPassed = blockedResults.passed + allowedResults.passed + headerResults.passed;
  const totalTests = blockedResults.total + allowedResults.total + headerResults.total;
  
  console.log(`\nOverall: ${totalPassed}/${totalTests} tests passed`);
  
  if (totalPassed === totalTests) {
    console.log('🎉 All security tests passed!');
  } else {
    console.log('⚠️  Some security tests failed. Please review the results above.');
  }
}

// Run tests
runSecurityTests().catch(console.error);
