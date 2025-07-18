import { sessionManager } from './sessionManager';

interface PageState {
  lastPage: string;
  userId?: string;
  storeId?: string;
  timestamp: number;
  sessionType: 'email' | 'pin';
}

/**
 * Manages page state persistence to restore users to their last active page
 * after refresh instead of redirecting to dashboard
 */
class PageStateManager {
  private static instance: PageStateManager;
  private readonly STORAGE_KEY = 'storefy_last_page';
  private readonly MAX_AGE_HOURS = 24; // Clear old page states after 24 hours
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeCleanup();
  }

  public static getInstance(): PageStateManager {
    if (!PageStateManager.instance) {
      PageStateManager.instance = new PageStateManager();
    }
    return PageStateManager.instance;
  }

  /**
   * Save the current page state
   */
  public saveCurrentPage(page: string, userId?: string, storeId?: string): void {
    try {
      // Don't save certain pages that shouldn't be restored
      const excludedPages = ['stores', 'auth', 'pin-login', 'landing'];
      if (excludedPages.includes(page)) {
        return;
      }

      // Determine session type
      const pinSession = sessionManager.getPinSession();
      const sessionType = pinSession ? 'pin' : 'email';

      const pageState: PageState = {
        lastPage: page,
        userId: userId || pinSession?.user_id || undefined,
        storeId: storeId || pinSession?.store_id || undefined,
        timestamp: Date.now(),
        sessionType
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pageState));
      
      console.log('📄 Page state saved:', pageState);
    } catch (error) {
      console.error('❌ Error saving page state:', error);
    }
  }

  /**
   * Get the last saved page for the current user/session
   */
  public getLastPage(currentUserId?: string, currentStoreId?: string): string | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        console.log('📭 No stored page state found');
        return null;
      }

      const pageState: PageState = JSON.parse(stored);
      
      // Check if the stored state is too old
      const ageHours = (Date.now() - pageState.timestamp) / (1000 * 60 * 60);
      if (ageHours > this.MAX_AGE_HOURS) {
        console.log('⏰ Stored page state is too old, clearing');
        this.clearPageState();
        return null;
      }

      // For PIN sessions, check if store matches
      const pinSession = sessionManager.getPinSession();
      if (pinSession) {
        if (pageState.sessionType === 'pin' && pageState.storeId === pinSession.store_id) {
          console.log('✅ Restored page for PIN session:', pageState.lastPage);
          return pageState.lastPage;
        } else {
          console.log('❌ PIN session store mismatch, clearing page state');
          this.clearPageState();
          return null;
        }
      }

      // For email sessions, check if user matches
      if (currentUserId && pageState.sessionType === 'email') {
        if (pageState.userId === currentUserId) {
          // Optionally check store match for email users too
          if (currentStoreId && pageState.storeId && pageState.storeId !== currentStoreId) {
            console.log('⚠️ Store changed for email user, but keeping page state');
            // Update the stored state with new store ID
            pageState.storeId = currentStoreId;
            pageState.timestamp = Date.now();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pageState));
          }
          
          console.log('✅ Restored page for email session:', pageState.lastPage);
          return pageState.lastPage;
        } else {
          console.log('❌ Email session user mismatch, clearing page state');
          this.clearPageState();
          return null;
        }
      }

      console.log('❌ Session type mismatch or invalid state, clearing');
      this.clearPageState();
      return null;
    } catch (error) {
      console.error('❌ Error reading page state:', error);
      this.clearPageState();
      return null;
    }
  }

  /**
   * Clear stored page state
   */
  public clearPageState(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🗑️ Page state cleared');
    } catch (error) {
      console.error('❌ Error clearing page state:', error);
    }
  }

  /**
   * Check if a page is valid for restoration
   */
  public isValidPage(page: string): boolean {
    const validPages = [
      'dashboard', 'pos', 'inventory', 'categories', 'suppliers',
      'expenses', 'layby', 'transactions', 'customers', 'reports',
      'settings', 'stores'
    ];
    return validPages.includes(page);
  }

  /**
   * Initialize cleanup of old page states
   */
  private initializeCleanup(): void {
    // Clean up on initialization
    this.cleanupOldStates();

    // Clear any existing interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Set up periodic cleanup (every hour)
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldStates();
    }, 60 * 60 * 1000);
  }

  /**
   * Clean up old page states
   */
  private cleanupOldStates(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const pageState: PageState = JSON.parse(stored);
      const ageHours = (Date.now() - pageState.timestamp) / (1000 * 60 * 60);
      
      if (ageHours > this.MAX_AGE_HOURS) {
        this.clearPageState();
        console.log('🧹 Cleaned up old page state');
      }
    } catch (error) {
      // If there's any error parsing, just clear it
      this.clearPageState();
    }
  }

  /**
   * Handle session changes - clear page state when sessions end
   */
  public onSessionChange(): void {
    // Check if we still have a valid session
    const pinSession = sessionManager.getPinSession();
    const hasValidSession = pinSession !== null;

    if (!hasValidSession) {
      // No valid session, clear page state
      this.clearPageState();
      console.log('🔄 Session ended, page state cleared');
    }
  }

  /**
   * Cleanup method to prevent memory leaks
   */
  public cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('🧹 PageStateManager cleanup completed');
    }
  }
}

// Export singleton instance
export const pageStateManager = PageStateManager.getInstance();

// Listen for session changes
if (typeof window !== 'undefined') {
  window.addEventListener('pin-session-changed', () => {
    pageStateManager.onSessionChange();
  });
}
