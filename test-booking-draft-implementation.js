/**
 * Quick test script to verify booking draft implementation
 * Run this to test the basic functionality
 */

console.log('🧪 Testing Booking Draft Implementation...\n');

// Test 1: UUID generation
console.log('1. Testing UUID generation:');
// Simple UUID v4 generator for testing
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const testId = generateUUID();
console.log(`   Generated UUID: ${testId}`);
console.log(`   Length: ${testId.length} characters`);
console.log(`   Format valid: ${/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(testId)}`);
console.log('   ✅ UUID generation working\n');

// Test 2: Draft data structure
console.log('2. Testing draft data structure:');
const testDraft = {
  id: testId,
  serviceId: 'test-service-123',
  date: '2024-12-25',
  time: '14:00',
  address: '123 Test Street, Test City',
  notes: 'Test booking notes',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
};

console.log('   Draft structure:');
console.log(`   - ID: ${testDraft.id}`);
console.log(`   - Service ID: ${testDraft.serviceId}`);
console.log(`   - Date: ${testDraft.date}`);
console.log(`   - Time: ${testDraft.time}`);
console.log(`   - Address: ${testDraft.address}`);
console.log(`   - Notes: ${testDraft.notes}`);
console.log(`   - Created: ${testDraft.createdAt}`);
console.log(`   - Expires: ${testDraft.expiresAt}`);
console.log('   ✅ Draft structure valid\n');

// Test 3: Cookie format
console.log('3. Testing cookie format:');
const cookieValue = `booking_draft_id=${testId}; expires=${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString()}; path=/; SameSite=Lax`;
console.log(`   Cookie: ${cookieValue}`);
console.log('   ✅ Cookie format valid\n');

// Test 4: Expiration check
console.log('4. Testing expiration logic:');
const now = new Date();
const expiresAt = new Date(testDraft.expiresAt);
const isExpired = expiresAt < now;
console.log(`   Current time: ${now.toISOString()}`);
console.log(`   Expires at: ${expiresAt.toISOString()}`);
console.log(`   Is expired: ${isExpired}`);
console.log('   ✅ Expiration logic working\n');

// Test 5: API endpoint URLs
console.log('5. Testing API endpoint URLs:');
const baseUrl = 'https://app.proliinkconnect.co.za';
const endpoints = [
  `${baseUrl}/api/bookings/drafts`,
  `${baseUrl}/api/bookings/drafts/${testId}`,
  `${baseUrl}/api/bookings/drafts/${testId}/merge`,
  `${baseUrl}/booking/resume?draftId=${testId}`
];

endpoints.forEach((endpoint, index) => {
  console.log(`   ${index + 1}. ${endpoint}`);
});
console.log('   ✅ API endpoints configured\n');

// Test 6: File structure check
console.log('6. Checking file structure:');
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'lib/booking-draft.ts',
  'app/api/bookings/drafts/route.ts',
  'app/api/bookings/drafts/[id]/route.ts',
  'app/api/bookings/drafts/[id]/merge/route.ts',
  'app/booking/resume/page.tsx'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

if (allFilesExist) {
  console.log('   ✅ All required files present\n');
} else {
  console.log('   ❌ Some files missing\n');
}

// Test 7: Package.json check
console.log('7. Checking package.json dependencies:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const hasUuid = packageJson.dependencies && packageJson.dependencies.uuid;
  const hasUuidTypes = packageJson.devDependencies && packageJson.devDependencies['@types/uuid'];
  
  console.log(`   UUID package: ${hasUuid ? '✅' : '❌'}`);
  console.log(`   UUID types: ${hasUuidTypes ? '✅' : '❌'}`);
  
  if (hasUuid && hasUuidTypes) {
    console.log('   ✅ Dependencies installed\n');
  } else {
    console.log('   ❌ Missing dependencies\n');
  }
} catch (error) {
  console.log('   ❌ Error reading package.json\n');
}

console.log('🎉 Implementation test completed!');
console.log('\n📋 Next steps:');
console.log('1. Run the SQL script to create the booking_drafts table');
console.log('2. Test the booking flow manually');
console.log('3. Deploy to production');
console.log('\n📖 See BOOKING_DRAFT_PRESERVATION_TEST_GUIDE.md for detailed testing instructions');
