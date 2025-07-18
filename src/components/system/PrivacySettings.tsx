import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Eye, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Trash2,
  Download,
  Info
} from 'lucide-react';
import { 
  getPrivacySettings, 
  updatePrivacySettings, 
  clearAnalyticsData 
} from '@/lib/anonymousAnalytics';
import { toast } from 'sonner';

interface PrivacySettings {
  analyticsEnabled: boolean;
  performanceTracking: boolean;
  usageTracking: boolean;
  errorTracking: boolean;
  geographicTracking: boolean;
}

export function PrivacySettings() {
  const [settings, setSettings] = useState<PrivacySettings>({
    analyticsEnabled: true,
    performanceTracking: true,
    usageTracking: true,
    errorTracking: true,
    geographicTracking: false
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const currentSettings = getPrivacySettings();
    setSettings(currentSettings);
  };

  const handleSettingChange = (key: keyof PrivacySettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasChanges(true);
  };

  const saveSettings = () => {
    updatePrivacySettings(settings);
    setHasChanges(false);
    toast.success('Privacy settings updated');
  };

  const resetSettings = () => {
    const defaultSettings: PrivacySettings = {
      analyticsEnabled: true,
      performanceTracking: true,
      usageTracking: true,
      errorTracking: true,
      geographicTracking: false
    };
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all collected analytics data? This action cannot be undone.')) {
      clearAnalyticsData();
      toast.success('All analytics data cleared');
    }
  };

  const exportData = () => {
    const events = localStorage.getItem('anonymous_events');
    if (events) {
      const blob = new Blob([events], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `storefy-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Analytics data exported');
    } else {
      toast.info('No analytics data to export');
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy Overview */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-800">Privacy-First Analytics</h3>
          </div>
          <p className="text-sm text-green-700 mb-3">
            Storefy collects anonymous usage data to improve the platform. All data is anonymized, 
            aggregated, and contains no personally identifiable information.
          </p>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">GDPR & CCPA Compliant</span>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Analytics Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Analytics Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium">Enable Analytics Collection</h4>
              <p className="text-sm text-muted-foreground">
                Master switch for all anonymous data collection
              </p>
            </div>
            <Switch
              checked={settings.analyticsEnabled}
              onCheckedChange={(checked) => handleSettingChange('analyticsEnabled', checked)}
            />
          </div>

          {/* Individual Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium">Performance Tracking</h4>
                <p className="text-sm text-muted-foreground">
                  Track page load times, response times, and system performance
                </p>
                <Badge variant="outline" className="mt-1">No Personal Data</Badge>
              </div>
              <Switch
                checked={settings.performanceTracking && settings.analyticsEnabled}
                onCheckedChange={(checked) => handleSettingChange('performanceTracking', checked)}
                disabled={!settings.analyticsEnabled}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium">Feature Usage Tracking</h4>
                <p className="text-sm text-muted-foreground">
                  Track which features are used most to improve the platform
                </p>
                <Badge variant="outline" className="mt-1">Anonymous Events</Badge>
              </div>
              <Switch
                checked={settings.usageTracking && settings.analyticsEnabled}
                onCheckedChange={(checked) => handleSettingChange('usageTracking', checked)}
                disabled={!settings.analyticsEnabled}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium">Error Tracking</h4>
                <p className="text-sm text-muted-foreground">
                  Track errors and crashes to improve system stability
                </p>
                <Badge variant="outline" className="mt-1">Hashed Stack Traces</Badge>
              </div>
              <Switch
                checked={settings.errorTracking && settings.analyticsEnabled}
                onCheckedChange={(checked) => handleSettingChange('errorTracking', checked)}
                disabled={!settings.analyticsEnabled}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium">Geographic Analytics</h4>
                <p className="text-sm text-muted-foreground">
                  Track general geographic regions (country/state level only)
                </p>
                <Badge variant="secondary" className="mt-1">Optional</Badge>
              </div>
              <Switch
                checked={settings.geographicTracking && settings.analyticsEnabled}
                onCheckedChange={(checked) => handleSettingChange('geographicTracking', checked)}
                disabled={!settings.analyticsEnabled}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={saveSettings} 
              disabled={!hasChanges}
              className="flex-1"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
            <Button 
              variant="outline" 
              onClick={resetSettings}
            >
              Reset to Default
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You have full control over your analytics data. You can export or delete 
              all collected data at any time.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Export Analytics Data</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Download all collected anonymous analytics data in JSON format
                </p>
                <Button variant="outline" onClick={exportData} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Clear All Data</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Permanently delete all collected analytics data
                </p>
                <Button 
                  variant="destructive" 
                  onClick={clearAllData} 
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Information */}
      <Card>
        <CardHeader>
          <CardTitle>What Data We Collect</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-600 mb-2">✅ We DO Collect (Anonymous)</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Page views and navigation patterns</li>
                <li>• Feature usage statistics</li>
                <li>• Performance metrics (load times)</li>
                <li>• Error reports (anonymized)</li>
                <li>• Device type and browser info</li>
                <li>• General geographic region</li>
                <li>• Session duration and frequency</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-red-600 mb-2">❌ We DON'T Collect</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Personal information (names, emails)</li>
                <li>• Store-specific business data</li>
                <li>• Customer information</li>
                <li>• Financial transaction details</li>
                <li>• Exact IP addresses</li>
                <li>• Keystroke or mouse tracking</li>
                <li>• Screen recordings or screenshots</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <strong>Data Anonymization:</strong> All potentially identifying data is hashed 
                or removed before collection.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <strong>Local Storage:</strong> Data is stored locally in your browser and 
                only aggregated anonymously.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <strong>No Cross-Site Tracking:</strong> We don't track you across other websites 
                or applications.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <strong>Opt-Out Anytime:</strong> You can disable all tracking or delete 
                collected data at any time.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
