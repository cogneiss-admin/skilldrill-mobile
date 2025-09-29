// Test script for country utilities (Node.js compatible)
const fs = require('fs');
const path = require('path');

// Simple mock for Expo Localization
const mockLocalization = {
  locale: 'en-US'
};

// Read and evaluate countryUtils.ts as plain JavaScript
const countryUtilsPath = path.join(__dirname, 'utils', 'countryUtils.ts');
let countryUtilsContent = fs.readFileSync(countryUtilsPath, 'utf8');

// Remove TypeScript imports and exports for Node.js testing
countryUtilsContent = countryUtilsContent
  .replace(/import \* as Localization.*?;/, '')
  .replace(/export /g, '')
  .replace(': Country\[\]', '')
  .replace(': Country \| undefined', '')
  .replace(': Country', '')
  .replace(': boolean', '')
  .replace(': string', '')
  .replace(/Localization\./g, 'mockLocalization.');

// Create a test environment
const testEnv = {
  mockLocalization,
  console
};

// Evaluate the modified code
try {
  const evalCode = `
    const mockLocalization = ${JSON.stringify(mockLocalization)};
    ${countryUtilsContent}
    
    // Test Results
    const testResults = {
      totalCountries: COUNTRIES.length,
      defaultCountry: getDefaultCountry(),
      indiaFound: findCountryByCode('IN'),
      usFound: findCountryByCode('US'),
      phoneValidation: {
        validIndian: validatePhoneNumber('9876543210', findCountryByCode('IN')),
        invalidIndian: validatePhoneNumber('1234567890', findCountryByCode('IN')),
        validUS: validatePhoneNumber('5551234567', findCountryByCode('US')),
        invalidUS: validatePhoneNumber('1551234567', findCountryByCode('US'))
      },
      formatting: {
        indianFormatted: formatPhoneNumber('9876543210', findCountryByCode('IN')),
        usFormatted: formatPhoneNumber('5551234567', findCountryByCode('US'))
      },
      international: {
        indianIntl: getInternationalPhoneNumber('9876543210', findCountryByCode('IN')),
        usIntl: getInternationalPhoneNumber('5551234567', findCountryByCode('US'))
      }
    };
    
    testResults;
  `;
  
  const results = eval(evalCode);
  
  console.log('🧪 Country Utils Test Results:');
  console.log('================================');
  console.log(`📊 Total Countries: ${results.totalCountries}`);
  console.log(`🏠 Default Country: ${results.defaultCountry.name} (${results.defaultCountry.cca2})`);
  console.log(`🇮🇳 India Found: ${results.indiaFound ? '✅' : '❌'}`);
  console.log(`🇺🇸 US Found: ${results.usFound ? '✅' : '❌'}`);
  
  console.log('\n📞 Phone Validation Tests:');
  console.log(`🇮🇳 Valid Indian (9876543210): ${results.phoneValidation.validIndian ? '✅' : '❌'}`);
  console.log(`🇮🇳 Invalid Indian (1234567890): ${results.phoneValidation.invalidIndian ? '❌ (Expected)' : '✅ (Correctly rejected)'}`);
  console.log(`🇺🇸 Valid US (5551234567): ${results.phoneValidation.validUS ? '✅' : '❌'}`);
  console.log(`🇺🇸 Invalid US (1551234567): ${results.phoneValidation.invalidUS ? '❌ (Expected)' : '✅ (Correctly rejected)'}`);
  
  console.log('\n📱 Phone Formatting Tests:');
  console.log(`🇮🇳 Indian Format: ${results.formatting.indianFormatted}`);
  console.log(`🇺🇸 US Format: ${results.formatting.usFormatted}`);
  
  console.log('\n🌍 International Number Tests:');
  console.log(`🇮🇳 Indian International: ${results.international.indianIntl}`);
  console.log(`🇺🇸 US International: ${results.international.usIntl}`);
  
  // Validate critical test cases
  const criticalTests = [
    { test: 'Has 30+ countries', result: results.totalCountries >= 30 },
    { test: 'Default country is valid', result: results.defaultCountry && results.defaultCountry.cca2 },
    { test: 'India validation works', result: results.phoneValidation.validIndian },
    { test: 'US validation works', result: results.phoneValidation.validUS },
    { test: 'Invalid numbers rejected', result: !results.phoneValidation.invalidIndian && !results.phoneValidation.invalidUS },
    { test: 'International format works', result: results.international.indianIntl === '+919876543210' && results.international.usIntl === '+15551234567' }
  ];
  
  console.log('\n🎯 Critical Tests Summary:');
  console.log('==========================');
  
  let passedTests = 0;
  criticalTests.forEach(({ test, result }) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${test}`);
    if (result) passedTests++;
  });
  
  console.log(`\n📊 Overall: ${passedTests}/${criticalTests.length} tests passed`);
  
  if (passedTests === criticalTests.length) {
    console.log('🎉 ALL TESTS PASSED - Country utilities working correctly!');
  } else {
    console.log('⚠️ Some tests failed - review implementation');
  }
  
} catch (error) {
  console.error('❌ Test execution failed:', error.message);
  console.error('Stack:', error.stack);
}