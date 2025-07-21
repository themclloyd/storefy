// Quick debug script to check stores in database
import { supabase } from './src/integrations/supabase/client.js';

async function debugStores() {
  try {
    console.log('🔍 Checking current user...');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('❌ User error:', userError);
      return;
    }
    
    if (!user) {
      console.log('❌ No user logged in');
      return;
    }
    
    console.log('✅ Current user:', user.id, user.email);
    
    // Check stores for this user
    console.log('🔍 Checking stores for user...');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', user.id);
    
    if (storesError) {
      console.error('❌ Stores error:', storesError);
      return;
    }
    
    console.log('📊 Found stores:', stores?.length || 0);
    if (stores && stores.length > 0) {
      stores.forEach((store, index) => {
        console.log(`🏪 Store ${index + 1}:`, {
          id: store.id,
          name: store.name,
          store_code: store.store_code,
          owner_id: store.owner_id,
          created_at: store.created_at
        });
      });
    } else {
      console.log('❌ No stores found for this user');
    }
    
    // Check if there are any stores at all
    console.log('🔍 Checking all stores in database...');
    const { data: allStores, error: allStoresError } = await supabase
      .from('stores')
      .select('id, name, owner_id, store_code')
      .limit(10);
    
    if (allStoresError) {
      console.error('❌ All stores error:', allStoresError);
    } else {
      console.log('📊 Total stores in database:', allStores?.length || 0);
      if (allStores && allStores.length > 0) {
        allStores.forEach((store, index) => {
          console.log(`🏪 Store ${index + 1}:`, {
            id: store.id,
            name: store.name,
            store_code: store.store_code,
            owner_id: store.owner_id,
            isCurrentUser: store.owner_id === user.id
          });
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug
debugStores();
