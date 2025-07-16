import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConsentManager } from '@/utils/analytics';
import { X, Shield, BarChart3, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ConsentPreferences {
  analytics: boolean;
  performance: boolean;
  functional: boolean;
}

export const ConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    analytics: false,
    performance: false,
    functional: true, // Always enabled for core functionality
  });

  useEffect(() => {
    // Show banner if consent is required and not yet given
    if (ConsentManager.isConsentRequired() && !ConsentManager.hasConsent()) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    ConsentManager.grantConsent();
    setShowBanner(false);
    
    // Track consent granted (this will now work since consent is granted)
    setTimeout(() => {
      if (window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: 'granted',
          ad_storage: 'denied',
        });
      }
    }, 100);
  };

  const handleRejectAll = () => {
    ConsentManager.revokeConsent();
    setShowBanner(false);
    
    // Track consent denied
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
      });
    }
  };

  const handleSavePreferences = () => {
    if (preferences.analytics || preferences.performance) {
      ConsentManager.grantConsent();
    } else {
      ConsentManager.revokeConsent();
    }
    
    setShowBanner(false);
    setShowPreferences(false);
    
    // Update consent preferences
    localStorage.setItem('storefy_consent_preferences', JSON.stringify(preferences));
    
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: preferences.analytics ? 'granted' : 'denied',
        ad_storage: 'denied',
      });
    }
  };

  if (!showBanner) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Privacy & Analytics</h3>
                  <Badge variant="outline" className="text-xs">
                    GDPR Compliant
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We use analytics to improve your experience and help us understand how Storefy is used. 
                  This includes tracking page views, feature usage, and performance metrics. 
                  Your data is processed securely and never shared with third parties.
                </p>
                
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button onClick={handleAcceptAll} className="bg-primary hover:bg-primary/90">
                    Accept All
                  </Button>
                  
                  <Button variant="outline" onClick={handleRejectAll}>
                    Reject All
                  </Button>
                  
                  <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="gap-2">
                        <Settings className="w-4 h-4" />
                        Customize
                      </Button>
                    </DialogTrigger>
                    
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          Analytics Preferences
                        </DialogTitle>
                        <DialogDescription>
                          Choose which types of data collection you're comfortable with.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6 py-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label htmlFor="functional" className="text-sm font-medium">
                                Functional
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Required for core app functionality
                              </p>
                            </div>
                            <Switch
                              id="functional"
                              checked={preferences.functional}
                              disabled={true}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label htmlFor="analytics" className="text-sm font-medium">
                                Analytics
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Page views, feature usage, user behavior
                              </p>
                            </div>
                            <Switch
                              id="analytics"
                              checked={preferences.analytics}
                              onCheckedChange={(checked) =>
                                setPreferences(prev => ({ ...prev, analytics: checked }))
                              }
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label htmlFor="performance" className="text-sm font-medium">
                                Performance
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Load times, API response times, errors
                              </p>
                            </div>
                            <Switch
                              id="performance"
                              checked={preferences.performance}
                              onCheckedChange={(checked) =>
                                setPreferences(prev => ({ ...prev, performance: checked }))
                              }
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <Button onClick={handleSavePreferences} className="flex-1">
                            Save Preferences
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setShowPreferences(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBanner(false)}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

// Privacy settings component for settings page
export const PrivacySettings = () => {
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    analytics: ConsentManager.hasConsent(),
    performance: ConsentManager.hasConsent(),
    functional: true,
  });

  useEffect(() => {
    // Load saved preferences
    const saved = localStorage.getItem('storefy_consent_preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading consent preferences:', error);
      }
    }
  }, []);

  const handleSave = () => {
    if (preferences.analytics || preferences.performance) {
      ConsentManager.grantConsent();
    } else {
      ConsentManager.revokeConsent();
    }
    
    localStorage.setItem('storefy_consent_preferences', JSON.stringify(preferences));
    
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: preferences.analytics ? 'granted' : 'denied',
        ad_storage: 'denied',
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Privacy & Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Manage your data collection preferences. Changes take effect immediately.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="functional-settings" className="text-sm font-medium">
                  Functional Data
                </Label>
                <p className="text-xs text-muted-foreground">
                  Required for core app functionality and cannot be disabled
                </p>
              </div>
              <Switch
                id="functional-settings"
                checked={preferences.functional}
                disabled={true}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="analytics-settings" className="text-sm font-medium">
                  Analytics Data
                </Label>
                <p className="text-xs text-muted-foreground">
                  Page views, feature usage, and user behavior patterns
                </p>
              </div>
              <Switch
                id="analytics-settings"
                checked={preferences.analytics}
                onCheckedChange={(checked) => {
                  setPreferences(prev => ({ ...prev, analytics: checked }));
                  handleSave();
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="performance-settings" className="text-sm font-medium">
                  Performance Data
                </Label>
                <p className="text-xs text-muted-foreground">
                  Load times, API response times, and error tracking
                </p>
              </div>
              <Switch
                id="performance-settings"
                checked={preferences.performance}
                onCheckedChange={(checked) => {
                  setPreferences(prev => ({ ...prev, performance: checked }));
                  handleSave();
                }}
              />
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Your privacy is important to us. We only collect data that helps improve your experience 
              and never share personal information with third parties.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
