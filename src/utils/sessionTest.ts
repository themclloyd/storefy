/**
 * Session Management Testing Utilities
 * Use these functions to test session behavior in development
 */

import { sessionManager } from '@/lib/sessionManager';
import { getAuthState, hasValidAuth } from '@/lib/authUtils';

/**
 * Test session creation and validation
 */
export async function testSessionCreation() {
  console.log('🧪 Testing Session Creation...');
  
  // Create a test PIN session
  sessionManager.createPinSession({
    member_id: 'test-member-123',
    user_id: 'test-user-456',
    store_id: 'test-store-789',
    role: 'cashier',
    name: 'Test User',
    store_name: 'Test Store',
    login_time: new Date().toISOString()
  });
  
  // Verify session was created
  const pinSession = sessionManager.getPinSession();
  console.log('✅ PIN Session Created:', pinSession);
  
  // Check auth state
  const authState = await getAuthState();
  console.log('✅ Auth State:', authState);
  
  return pinSession !== null;
}

/**
 * Test session expiry behavior
 */
export function testSessionExpiry() {
  console.log('🧪 Testing Session Expiry...');
  
  // Create a session that expires in 1 minute for testing
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 1000); // 1 minute from now
  
  const testSession = {
    member_id: 'test-member-123',
    user_id: 'test-user-456',
    store_id: 'test-store-789',
    role: 'cashier',
    name: 'Test User',
    store_name: 'Test Store',
    login_time: now.toISOString(),
    last_activity: now.toISOString(),
    expires_at: expiresAt.toISOString()
  };
  
  localStorage.setItem('pin_session', JSON.stringify(testSession));
  
  console.log('✅ Test session created, expires in 1 minute');
  console.log('⏰ Session will expire at:', expiresAt.toLocaleTimeString());
  
  // Set up warning callback for testing
  sessionManager.onSessionWarning((minutesLeft) => {
    console.log(`⚠️ Session Warning: ${minutesLeft} minutes left`);
  });
  
  sessionManager.onSessionExpired(() => {
    console.log('❌ Session Expired!');
  });
  
  return true;
}

/**
 * Test activity tracking
 */
export function testActivityTracking() {
  console.log('🧪 Testing Activity Tracking...');
  
  const initialInfo = sessionManager.getSessionInfo();
  console.log('📊 Initial Session Info:', initialInfo);
  
  // Simulate activity
  sessionManager.refreshSession();
  
  const updatedInfo = sessionManager.getSessionInfo();
  console.log('📊 Updated Session Info:', updatedInfo);
  
  console.log('✅ Activity tracking test completed');
  return true;
}

/**
 * Test session validation
 */
export async function testSessionValidation() {
  console.log('🧪 Testing Session Validation...');
  
  // Test with valid session
  const hasAuth = await hasValidAuth();
  console.log('✅ Has Valid Auth:', hasAuth);
  
  // Test auth state
  const authState = await getAuthState();
  console.log('✅ Auth State:', authState);
  
  return hasAuth;
}

/**
 * Clean up test sessions
 */
export function cleanupTestSessions() {
  console.log('🧹 Cleaning up test sessions...');
  
  sessionManager.clearPinSession();
  console.log('✅ Test sessions cleaned up');
}

/**
 * Run all session tests
 */
export async function runAllSessionTests() {
  console.log('🚀 Running All Session Tests...');
  console.log('=====================================');
  
  try {
    // Test 1: Session Creation
    const creationTest = await testSessionCreation();
    console.log(`Test 1 - Session Creation: ${creationTest ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test 2: Session Validation
    const validationTest = await testSessionValidation();
    console.log(`Test 2 - Session Validation: ${validationTest ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test 3: Activity Tracking
    const activityTest = testActivityTracking();
    console.log(`Test 3 - Activity Tracking: ${activityTest ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test 4: Session Expiry (optional - takes time)
    console.log('Test 4 - Session Expiry: ⏳ Run testSessionExpiry() manually');
    
    console.log('=====================================');
    console.log('🎉 Session Tests Completed!');
    
    // Clean up
    setTimeout(() => {
      cleanupTestSessions();
    }, 2000);
    
    return {
      creation: creationTest,
      validation: validationTest,
      activity: activityTest
    };
    
  } catch (error) {
    console.error('❌ Session Test Error:', error);
    return false;
  }
}

/**
 * Quick session info display
 */
export function showSessionInfo() {
  const info = sessionManager.getSessionInfo();
  const pinSession = sessionManager.getPinSession();
  
  console.log('📊 Current Session Info:');
  console.log('========================');
  console.log('Has PIN Session:', info.hasPinSession);
  console.log('Last Activity:', info.lastActivity);
  
  if (info.pinExpiresAt) {
    console.log('Expires At:', new Date(info.pinExpiresAt).toLocaleString());
    console.log('Minutes Left:', info.minutesLeft);
  }
  
  if (pinSession) {
    console.log('Store:', pinSession.store_name);
    console.log('User:', pinSession.name);
    console.log('Role:', pinSession.role);
  }
  
  console.log('========================');
}

/**
 * Debug store selection issues
 */
export function debugStoreSelection() {
  const STORE_SELECTION_KEY = 'storefy_selected_store';

  console.log('🔍 Store Selection Debug Info:');
  console.log('==============================');

  // Check localStorage
  const stored = localStorage.getItem(STORE_SELECTION_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      console.log('Stored Selection:', parsed);
      console.log('Store ID:', parsed.storeId);
      console.log('User ID:', parsed.userId);
      console.log('Timestamp:', new Date(parsed.timestamp).toLocaleString());
    } catch (error) {
      console.log('Invalid stored data:', stored);
    }
  } else {
    console.log('No stored selection found');
  }

  // Check current auth state
  console.log('Current URL:', window.location.href);
  console.log('==============================');
}

// Make functions available globally for testing in browser console
if (typeof window !== 'undefined') {
  (window as any).sessionTest = {
    runAll: runAllSessionTests,
    creation: testSessionCreation,
    validation: testSessionValidation,
    activity: testActivityTracking,
    expiry: testSessionExpiry,
    cleanup: cleanupTestSessions,
    info: showSessionInfo,
    debugStore: debugStoreSelection
  };

  console.log('🔧 Session testing utilities available at window.sessionTest');
  console.log('   - runAll(): Run all tests');
  console.log('   - info(): Show current session info');
  console.log('   - expiry(): Test session expiry (1 minute)');
  console.log('   - cleanup(): Clean up test sessions');
  console.log('   - debugStore(): Debug store selection issues');
}
