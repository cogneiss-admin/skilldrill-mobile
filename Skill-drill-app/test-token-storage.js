// Test script to verify token storage
const authService = require('./services/authService').default;

async function testTokenStorage() {
  console.log('🧪 Testing Token Storage...\n');

  // Test 1: Clear any existing tokens
  console.log('1. Clearing existing tokens...');
  await authService.clearAuthData();
  
  // Test 2: Check if tokens are cleared
  console.log('2. Checking if tokens are cleared...');
  const isAuthenticated = await authService.isAuthenticated();
  console.log(`   Is authenticated: ${isAuthenticated}`);
  
  // Test 3: Store test tokens
  console.log('3. Storing test tokens...');
  await authService.setAccessToken('test-access-token');
  await authService.setRefreshToken('test-refresh-token');
  
  // Test 4: Check if tokens are stored
  console.log('4. Checking if tokens are stored...');
  const accessToken = await authService.getAccessToken();
  const refreshToken = await authService.getRefreshToken();
  console.log(`   Access token: ${accessToken ? 'stored' : 'not stored'}`);
  console.log(`   Refresh token: ${refreshToken ? 'stored' : 'not stored'}`);
  
  // Test 5: Check authentication status
  console.log('5. Checking authentication status...');
  const isAuth = await authService.isAuthenticated();
  console.log(`   Is authenticated: ${isAuth}`);
  
  // Test 6: Clear tokens again
  console.log('6. Clearing tokens again...');
  await authService.clearAuthData();
  const isAuthAfterClear = await authService.isAuthenticated();
  console.log(`   Is authenticated after clear: ${isAuthAfterClear}`);

  console.log('\n✅ Token storage test completed!');
}

// Run the test
testTokenStorage().catch(console.error);
