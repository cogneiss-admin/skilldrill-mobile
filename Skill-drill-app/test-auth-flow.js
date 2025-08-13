// Test script to verify authentication flow
const authService = require('./services/authService').default;

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow...\n');

  // Test 1: Check if no token exists initially
  console.log('1. Testing initial state...');
  const isAuthenticated = await authService.isAuthenticated();
  console.log(`   Is authenticated: ${isAuthenticated}`);
  
  const userData = await authService.getUserData();
  console.log(`   User data: ${userData ? 'exists' : 'null'}`);
  
  // Test 2: Test token validation
  console.log('\n2. Testing token validation...');
  const validation = await authService.validateTokenAndGetUser();
  console.log(`   Token valid: ${validation.isValid}`);
  console.log(`   User: ${validation.user ? 'exists' : 'null'}`);

  // Test 3: Test clearing auth data
  console.log('\n3. Testing clear auth data...');
  await authService.clearAuthData();
  const isAuthenticatedAfterClear = await authService.isAuthenticated();
  console.log(`   Is authenticated after clear: ${isAuthenticatedAfterClear}`);

  console.log('\n✅ Auth flow test completed!');
}

// Run the test
testAuthFlow().catch(console.error);
