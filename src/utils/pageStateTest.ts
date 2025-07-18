import { pageStateManager } from '@/lib/pageStateManager';
import { sessionManager } from '@/lib/sessionManager';

/**
 * Test the page state manager functionality
 */
export function testPageStateManager() {
  console.log('🧪 Testing Page State Manager...');
  console.log('================================');

  // Test 1: Save and restore page state for email user
  console.log('\n📧 Test 1: Email User Page State');
  const testUserId = 'test-user-123';
  const testStoreId = 'test-store-456';
  
  // Save a page state
  pageStateManager.saveCurrentPage('inventory', testUserId, testStoreId);
  
  // Retrieve it
  const restoredPage = pageStateManager.getLastPage(testUserId, testStoreId);
  console.log('Saved: inventory, Restored:', restoredPage);
  console.log('✅ Email user test:', restoredPage === 'inventory' ? 'PASSED' : 'FAILED');

  // Test 2: Save and restore page state for PIN user
  console.log('\n📌 Test 2: PIN User Page State');
  
  // Create a mock PIN session
  sessionManager.createPinSession({
    member_id: 'test-member-789',
    user_id: 'test-user-pin-123',
    store_id: 'test-store-pin-456',
    role: 'cashier',
    name: 'Test PIN User',
    store_name: 'Test Store',
    login_time: new Date().toISOString()
  });
  
  // Save page state for PIN user
  pageStateManager.saveCurrentPage('pos');
  
  // Retrieve it
  const restoredPinPage = pageStateManager.getLastPage();
  console.log('Saved: pos, Restored:', restoredPinPage);
  console.log('✅ PIN user test:', restoredPinPage === 'pos' ? 'PASSED' : 'FAILED');

  // Test 3: Test invalid page filtering
  console.log('\n🚫 Test 3: Invalid Page Filtering');
  pageStateManager.saveCurrentPage('auth', testUserId, testStoreId);
  const invalidPageRestore = pageStateManager.getLastPage(testUserId, testStoreId);
  console.log('Saved: auth (should be ignored), Restored:', invalidPageRestore);
  console.log('✅ Invalid page test:', invalidPageRestore === 'pos' ? 'PASSED' : 'FAILED');

  // Test 4: Test user mismatch
  console.log('\n👤 Test 4: User Mismatch');
  pageStateManager.saveCurrentPage('reports', 'different-user-123', testStoreId);
  const mismatchRestore = pageStateManager.getLastPage(testUserId, testStoreId);
  console.log('Saved for different user, Restored for original user:', mismatchRestore);
  console.log('✅ User mismatch test:', mismatchRestore === null ? 'PASSED' : 'FAILED');

  // Test 5: Test page state clearing
  console.log('\n🗑️ Test 5: Page State Clearing');
  pageStateManager.saveCurrentPage('customers', testUserId, testStoreId);
  pageStateManager.clearPageState();
  const clearedRestore = pageStateManager.getLastPage(testUserId, testStoreId);
  console.log('Saved then cleared, Restored:', clearedRestore);
  console.log('✅ Clear test:', clearedRestore === null ? 'PASSED' : 'FAILED');

  // Test 6: Test valid page validation
  console.log('\n✅ Test 6: Page Validation');
  const validPages = ['dashboard', 'pos', 'inventory', 'settings'];
  const invalidPages = ['auth', 'pin-login', 'stores', 'unknown'];
  
  const validResults = validPages.map(page => pageStateManager.isValidPage(page));
  const invalidResults = invalidPages.map(page => pageStateManager.isValidPage(page));
  
  console.log('Valid pages test:', validResults.every(r => r) ? 'PASSED' : 'FAILED');
  console.log('Invalid pages test:', invalidResults.every(r => !r) ? 'PASSED' : 'FAILED');

  // Clean up
  sessionManager.clearPinSession();
  pageStateManager.clearPageState();
  
  console.log('\n🎉 Page State Manager Tests Complete!');
}

/**
 * Test page restoration scenarios
 */
export function testPageRestoration() {
  console.log('\n🔄 Testing Page Restoration Scenarios...');
  console.log('========================================');

  const testUserId = 'restoration-user-123';
  const testStoreId = 'restoration-store-456';

  // Scenario 1: User was on POS, refreshes page
  console.log('\n📱 Scenario 1: POS Page Refresh');
  pageStateManager.saveCurrentPage('pos', testUserId, testStoreId);
  
  // Simulate page refresh - check if POS is restored
  const restoredFromPOS = pageStateManager.getLastPage(testUserId, testStoreId);
  console.log('User was on POS, after refresh restored to:', restoredFromPOS);
  console.log('✅ POS refresh test:', restoredFromPOS === 'pos' ? 'PASSED' : 'FAILED');

  // Scenario 2: User was on inventory, switches stores
  console.log('\n🏪 Scenario 2: Store Switch');
  pageStateManager.saveCurrentPage('inventory', testUserId, testStoreId);
  
  // User switches to different store
  const newStoreId = 'new-store-789';
  const restoredAfterStoreSwitch = pageStateManager.getLastPage(testUserId, newStoreId);
  console.log('User switched stores, page restored to:', restoredAfterStoreSwitch);
  console.log('✅ Store switch test:', restoredAfterStoreSwitch === 'inventory' ? 'PASSED' : 'FAILED');

  // Scenario 3: PIN user session expires
  console.log('\n⏰ Scenario 3: PIN Session Expiry');
  
  // Create PIN session and save page
  sessionManager.createPinSession({
    member_id: 'expiry-test-member',
    user_id: 'expiry-test-user',
    store_id: 'expiry-test-store',
    role: 'cashier',
    name: 'Expiry Test User',
    store_name: 'Expiry Test Store',
    login_time: new Date().toISOString()
  });
  
  pageStateManager.saveCurrentPage('transactions');
  
  // Simulate session expiry
  sessionManager.clearPinSession();
  
  // Try to restore page after session expiry
  const restoredAfterExpiry = pageStateManager.getLastPage();
  console.log('After PIN session expiry, page restored to:', restoredAfterExpiry);
  console.log('✅ Session expiry test:', restoredAfterExpiry === null ? 'PASSED' : 'FAILED');

  console.log('\n🎯 Page Restoration Tests Complete!');
}

// Export a function to run all tests
export function runAllPageStateTests() {
  testPageStateManager();
  testPageRestoration();
}
