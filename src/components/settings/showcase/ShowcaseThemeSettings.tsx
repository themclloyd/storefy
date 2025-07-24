import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Palette } from "lucide-react";
import {
  useSettingsStore,
  useShowcaseSettings
} from "@/stores/settingsStore";

export function ShowcaseThemeSettings() {
  // Use Zustand store state
  const showcaseSettings = useShowcaseSettings();
  const showcaseLoading = useSettingsStore(state => state.showcaseLoading);
  
  // Actions from Zustand
  const setShowcaseSettings = useSettingsStore(state => state.setShowcaseSettings);

  if (showcaseLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading theme settings...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Theme & Appearance
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Customize the look and feel of your public showcase
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!showcaseSettings.enableShowcase ? (
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <p className="text-sm text-muted-foreground">
              Enable your public showcase to customize theme settings.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {/* Layout Style */}
              <div className="space-y-3">
                <Label htmlFor="layout-style" className="text-sm font-semibold">Layout Style</Label>
                <Select
                  value={showcaseSettings.theme.layout}
                  onValueChange={(value: 'grid' | 'list' | 'masonry') =>
                    setShowcaseSettings({
                      theme: { ...showcaseSettings.theme, layout: value }
                    })
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                          <div className="bg-blue-500 rounded-sm"></div>
                          <div className="bg-blue-500 rounded-sm"></div>
                          <div className="bg-blue-500 rounded-sm"></div>
                          <div className="bg-blue-500 rounded-sm"></div>
                        </div>
                        Grid Layout
                      </div>
                    </SelectItem>
                    <SelectItem value="list">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 flex flex-col gap-0.5">
                          <div className="bg-green-500 rounded-sm h-1"></div>
                          <div className="bg-green-500 rounded-sm h-1"></div>
                          <div className="bg-green-500 rounded-sm h-1"></div>
                        </div>
                        List Layout
                      </div>
                    </SelectItem>
                    <SelectItem value="masonry">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                          <div className="bg-purple-500 rounded-sm h-2"></div>
                          <div className="bg-purple-500 rounded-sm h-3"></div>
                          <div className="bg-purple-500 rounded-sm h-3"></div>
                          <div className="bg-purple-500 rounded-sm h-2"></div>
                        </div>
                        Masonry Layout
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose how your products will be displayed on the showcase
                </p>
              </div>

              {/* Theme Presets */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Theme Presets</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { name: 'Modern Blue', primary: '#3b82f6', secondary: '#1e40af', bg: 'bg-gradient-to-br from-blue-50 to-blue-100' },
                    { name: 'Elegant Purple', primary: '#8b5cf6', secondary: '#7c3aed', bg: 'bg-gradient-to-br from-purple-50 to-purple-100' },
                    { name: 'Fresh Green', primary: '#10b981', secondary: '#059669', bg: 'bg-gradient-to-br from-green-50 to-green-100' },
                    { name: 'Warm Orange', primary: '#f59e0b', secondary: '#d97706', bg: 'bg-gradient-to-br from-orange-50 to-orange-100' }
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setShowcaseSettings({
                        theme: {
                          ...showcaseSettings.theme,
                          primaryColor: preset.primary,
                          secondaryColor: preset.secondary
                        }
                      })}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${preset.bg} ${
                        showcaseSettings.theme.primaryColor === preset.primary
                          ? 'border-gray-900 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: preset.primary }}
                        ></div>
                        <div
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: preset.secondary }}
                        ></div>
                      </div>
                      <p className="text-xs font-medium text-gray-700">{preset.name}</p>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Quick preset themes to get started, or customize colors below
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2">
                    <input
                      id="primary-color"
                      type="color"
                      value={showcaseSettings.theme.primaryColor}
                      onChange={(e) => setShowcaseSettings({ 
                        theme: { ...showcaseSettings.theme, primaryColor: e.target.value } 
                      })}
                      className="w-12 h-10 rounded border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={showcaseSettings.theme.primaryColor}
                      onChange={(e) => setShowcaseSettings({ 
                        theme: { ...showcaseSettings.theme, primaryColor: e.target.value } 
                      })}
                      className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
                      placeholder="#3b82f6"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Main brand color for buttons and accents
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <input
                      id="secondary-color"
                      type="color"
                      value={showcaseSettings.theme.secondaryColor}
                      onChange={(e) => setShowcaseSettings({ 
                        theme: { ...showcaseSettings.theme, secondaryColor: e.target.value } 
                      })}
                      className="w-12 h-10 rounded border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={showcaseSettings.theme.secondaryColor}
                      onChange={(e) => setShowcaseSettings({ 
                        theme: { ...showcaseSettings.theme, secondaryColor: e.target.value } 
                      })}
                      className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
                      placeholder="#1e40af"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Secondary color for highlights and details
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">Contact Information Display</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-phone">Show Phone Number</Label>
                      <p className="text-xs text-muted-foreground">
                        Display your store's phone number on the showcase
                      </p>
                    </div>
                    <Switch
                      id="show-phone"
                      checked={showcaseSettings.contactInfo.showPhone}
                      onCheckedChange={(checked) => setShowcaseSettings({ 
                        contactInfo: { ...showcaseSettings.contactInfo, showPhone: checked } 
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-email">Show Email Address</Label>
                      <p className="text-xs text-muted-foreground">
                        Display your store's email address on the showcase
                      </p>
                    </div>
                    <Switch
                      id="show-email"
                      checked={showcaseSettings.contactInfo.showEmail}
                      onCheckedChange={(checked) => setShowcaseSettings({ 
                        contactInfo: { ...showcaseSettings.contactInfo, showEmail: checked } 
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-address">Show Address</Label>
                      <p className="text-xs text-muted-foreground">
                        Display your store's address on the showcase
                      </p>
                    </div>
                    <Switch
                      id="show-address"
                      checked={showcaseSettings.contactInfo.showAddress}
                      onCheckedChange={(checked) => setShowcaseSettings({ 
                        contactInfo: { ...showcaseSettings.contactInfo, showAddress: checked } 
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <h4 className="text-sm font-medium text-foreground mb-2">Theme Preview</h4>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: showcaseSettings.theme.primaryColor }}
                  />
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: showcaseSettings.theme.secondaryColor }}
                  />
                  <p className="text-sm text-muted-foreground">
                    Your color scheme preview
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
