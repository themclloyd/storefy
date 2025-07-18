/**
 * Test utilities for showcase functionality
 * This file can be used to test the new showcase features
 */

import { supabase } from '@/integrations/supabase/client';
import { generateUniqueSlug, generateShowcaseUrl } from '@/lib/showcase-utils';

/**
 * Test the slug generation functionality
 */
export async function testSlugGeneration() {
  console.log('🧪 Testing slug generation...');
  
  const testNames = [
    "John's Electronics & More!",
    "Mike's Café",
    "Best Buy Store",
    "Store",
    "123 Special Characters!@#$%",
    ""
  ];

  for (const name of testNames) {
    try {
      const slug = await generateUniqueSlug(name);
      console.log(`✅ "${name}" → "${slug}"`);
    } catch (error) {
      console.error(`❌ Failed to generate slug for "${name}":`, error);
    }
  }
}

/**
 * Test the database functions
 */
export async function testDatabaseFunctions() {
  console.log('🧪 Testing database functions...');
  
  try {
    // Test get_public_store_info with different identifiers
    const testIdentifiers = ['test-store', 'STOR123', '12345678-1234-1234-1234-123456789012'];
    
    for (const identifier of testIdentifiers) {
      const { data, error } = await supabase.rpc('get_public_store_info', {
        store_identifier: identifier
      });
      
      if (error) {
        console.log(`ℹ️ No store found for "${identifier}" (expected if store doesn't exist)`);
      } else {
        console.log(`✅ Found store for "${identifier}":`, data?.[0]?.store_name);
      }
    }
  } catch (error) {
    console.error('❌ Database function test failed:', error);
  }
}

/**
 * Test URL generation
 */
export function testUrlGeneration() {
  console.log('🧪 Testing URL generation...');
  
  const testStores = [
    { showcase_slug: 'johns-electronics', store_code: 'JOHN123', id: '12345678-1234-1234-1234-123456789012' },
    { store_code: 'MIKE456', id: '12345678-1234-1234-1234-123456789013' },
    { id: '12345678-1234-1234-1234-123456789014' }
  ];

  for (const store of testStores) {
    const url = generateShowcaseUrl(store);
    console.log(`✅ Store URL:`, url);
  }
}

/**
 * Run all tests
 */
export async function runAllShowcaseTests() {
  console.log('🚀 Running all showcase tests...');
  
  testUrlGeneration();
  await testSlugGeneration();
  await testDatabaseFunctions();
  
  console.log('✅ All tests completed!');
}

// Export for console testing
if (typeof window !== 'undefined') {
  (window as any).showcaseTests = {
    testSlugGeneration,
    testDatabaseFunctions,
    testUrlGeneration,
    runAllShowcaseTests
  };
  
  console.log('🔧 Showcase tests available at window.showcaseTests');
}
