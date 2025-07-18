import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface HiddenAdminAccessProps {
  children: React.ReactNode;
}

export function HiddenAdminAccess({ children }: HiddenAdminAccessProps) {
  const navigate = useNavigate();
  const [keySequence, setKeySequence] = useState<string[]>([]);
  const [lastKeyTime, setLastKeyTime] = useState(0);

  // Secret key sequence: Ctrl+Shift+A, D, M, I, N
  const SECRET_SEQUENCE = ['KeyA', 'KeyD', 'KeyM', 'KeyI', 'KeyN'];
  const SEQUENCE_TIMEOUT = 2000; // 2 seconds between keys

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const now = Date.now();
      
      // Reset sequence if too much time has passed
      if (now - lastKeyTime > SEQUENCE_TIMEOUT) {
        setKeySequence([]);
      }
      
      // Check for Ctrl+Shift+A to start the sequence
      if (event.ctrlKey && event.shiftKey && event.code === 'KeyA') {
        event.preventDefault();
        setKeySequence(['KeyA']);
        setLastKeyTime(now);
        return;
      }
      
      // Continue sequence if we're in the middle of it
      if (keySequence.length > 0 && keySequence.length < SECRET_SEQUENCE.length) {
        const expectedKey = SECRET_SEQUENCE[keySequence.length];
        
        if (event.code === expectedKey) {
          event.preventDefault();
          const newSequence = [...keySequence, event.code];
          setKeySequence(newSequence);
          setLastKeyTime(now);
          
          // Check if sequence is complete
          if (newSequence.length === SECRET_SEQUENCE.length) {
            // Secret sequence completed!
            setKeySequence([]);
            toast.success('Admin access unlocked', {
              description: 'Redirecting to system administration...',
              duration: 2000,
            });
            
            // Small delay for user feedback
            setTimeout(() => {
              navigate('/system');
            }, 1000);
          }
        } else {
          // Wrong key, reset sequence
          setKeySequence([]);
        }
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [keySequence, lastKeyTime, navigate]);

  // Check for special URL patterns
  useEffect(() => {
    const checkSpecialUrls = () => {
      const currentUrl = window.location.href;
      const urlParams = new URLSearchParams(window.location.search);
      
      // Check for special URL patterns (more secure than simple parameters)
      const specialPatterns = [
        // Pattern 1: URL hash with encoded access
        () => window.location.hash === '#admin-access-2024',
        
        // Pattern 2: Specific URL parameter combination
        () => urlParams.get('debug') === 'true' && 
               urlParams.get('mode') === 'admin' && 
               urlParams.get('key') === btoa('storefy-admin'),
        
        // Pattern 3: URL path pattern
        () => currentUrl.includes('/dashboard') && 
               urlParams.get('admin_token') === btoa(new Date().toDateString()),
      ];
      
      // Check if any pattern matches
      if (specialPatterns.some(pattern => pattern())) {
        toast.success('Special admin access detected', {
          description: 'Redirecting to system administration...',
          duration: 2000,
        });
        
        setTimeout(() => {
          navigate('/system');
        }, 1000);
      }
    };
    
    checkSpecialUrls();
  }, [navigate]);

  return <>{children}</>;
}

// Utility function to generate today's admin token
export function getTodaysAdminToken(): string {
  return btoa(new Date().toDateString());
}

// Utility function to generate admin access URLs (for documentation)
export function generateAdminAccessMethods() {
  const baseUrl = window.location.origin;
  const todayToken = getTodaysAdminToken();
  
  return {
    keyboardShortcut: 'Ctrl+Shift+A, then type: ADMIN',
    hashUrl: `${baseUrl}/dashboard#admin-access-2024`,
    paramUrl: `${baseUrl}/dashboard?debug=true&mode=admin&key=${btoa('storefy-admin')}`,
    tokenUrl: `${baseUrl}/dashboard?admin_token=${todayToken}`,
  };
}

// Development helper (only available in dev mode)
if (import.meta.env.DEV) {
  (window as any).adminAccess = {
    generateUrls: generateAdminAccessMethods,
    showHelp: () => {
      const methods = generateAdminAccessMethods();
      console.group('🔐 Hidden Admin Access Methods');
      console.log('1. Keyboard Shortcut:', methods.keyboardShortcut);
      console.log('2. Hash URL:', methods.hashUrl);
      console.log('3. Parameter URL:', methods.paramUrl);
      console.log('4. Token URL (changes daily):', methods.tokenUrl);
      console.groupEnd();
    }
  };
  
  console.log('🔧 Admin access helper available: window.adminAccess.showHelp()');
}
