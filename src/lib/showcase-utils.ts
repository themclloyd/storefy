import { supabase } from '@/integrations/supabase/client';

/**
 * Generate a URL-friendly slug from a store name
 */
export function generateSlugFromName(storeName: string): string {
  return storeName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50) // Limit length
    .replace(/-$/, '') // Remove trailing hyphen if created by substring
    || 'store'; // Fallback if empty
}

/**
 * Generate a unique showcase slug using the database function
 */
export async function generateUniqueSlug(storeName: string): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('generate_showcase_slug', {
      store_name: storeName
    });

    if (error) {
      console.error('Error generating slug:', error);
      // Fallback to client-side generation
      return generateSlugFromName(storeName);
    }

    return data || generateSlugFromName(storeName);
  } catch (error) {
    console.error('Error calling generate_showcase_slug:', error);
    return generateSlugFromName(storeName);
  }
}

/**
 * Update a store's showcase slug
 */
export async function updateStoreSlug(storeId: string, slug: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('stores')
      .update({ showcase_slug: slug })
      .eq('id', storeId);

    if (error) {
      console.error('Error updating store slug:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating store slug:', error);
    return false;
  }
}

/**
 * Check if a slug is available
 */
export async function isSlugAvailable(slug: string, excludeStoreId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from('stores')
      .select('id')
      .eq('showcase_slug', slug);

    if (excludeStoreId) {
      query = query.neq('id', excludeStoreId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Error checking slug availability:', error);
      return false;
    }

    return !data; // Available if no store found
  } catch (error) {
    console.error('Error checking slug availability:', error);
    return false;
  }
}

/**
 * Generate showcase URL for a store
 */
export function generateShowcaseUrl(store: { showcase_slug?: string; store_code?: string; id: string }, baseUrl: string = window.location.origin): string {
  if (store.showcase_slug) {
    return `${baseUrl}/shop/${store.showcase_slug}`;
  }
  
  if (store.store_code) {
    return `${baseUrl}/store/${store.store_code}/catalog`;
  }
  
  // Fallback to UUID-based URL
  return `${baseUrl}/showcase/${store.id}`;
}

/**
 * Get the shortest available URL for a store
 */
export function getShortestStoreUrl(store: { showcase_slug?: string; store_code?: string; id: string }, baseUrl: string = window.location.origin): string {
  // Priority: slug > store_code > UUID
  return generateShowcaseUrl(store, baseUrl);
}

/**
 * URL patterns for different showcase URL types
 */
export const URL_PATTERNS = {
  SLUG: '/shop/:slug',
  STORE_CODE: '/store/:code/catalog',
  STORE_CODE_SHORT: '/store/:code',
  UUID: '/showcase/:id'
} as const;

/**
 * Extract store identifier from URL path
 */
export function extractStoreIdentifier(path: string): { type: 'slug' | 'code' | 'uuid'; value: string } | null {
  // Match /shop/slug-name
  const slugMatch = path.match(/^\/shop\/([a-z0-9-]+)$/);
  if (slugMatch) {
    return { type: 'slug', value: slugMatch[1] };
  }

  // Match /store/CODE123/catalog or /store/CODE123
  const codeMatch = path.match(/^\/store\/([A-Z0-9]+)(?:\/catalog)?$/);
  if (codeMatch) {
    return { type: 'code', value: codeMatch[1] };
  }

  // Match /showcase/uuid
  const uuidMatch = path.match(/^\/showcase\/([a-f0-9-]{36})$/);
  if (uuidMatch) {
    return { type: 'uuid', value: uuidMatch[1] };
  }

  return null;
}
