import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search } from "lucide-react";
import {
  useSettingsStore,
  useShowcaseSettings
} from "@/stores/settingsStore";

export function ShowcaseSEOSettings() {
  // Use Zustand store state
  const showcaseSettings = useShowcaseSettings();
  const showcaseLoading = useSettingsStore(state => state.showcaseLoading);
  
  // Actions from Zustand
  const setShowcaseSettings = useSettingsStore(state => state.setShowcaseSettings);

  if (showcaseLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading SEO settings...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          SEO Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Optimize your showcase for search engines and social media
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!showcaseSettings.enableShowcase ? (
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <p className="text-sm text-muted-foreground">
              Enable your public showcase to configure SEO settings.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seo-title">SEO Title</Label>
              <Input
                id="seo-title"
                placeholder="Your Store Name - Best Products Online"
                value={showcaseSettings.seoTitle}
                onChange={(e) => setShowcaseSettings({ seoTitle: e.target.value })}
                maxLength={60}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  This title appears in search results and browser tabs
                </p>
                <span className="text-xs text-muted-foreground">
                  {showcaseSettings.seoTitle.length}/60 characters (recommended)
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo-description">SEO Description</Label>
              <Textarea
                id="seo-description"
                placeholder="Discover amazing products at our store. Quality items, great prices, and excellent service."
                value={showcaseSettings.seoDescription}
                onChange={(e) => setShowcaseSettings({ seoDescription: e.target.value })}
                rows={3}
                maxLength={160}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  This description appears in search results
                </p>
                <span className="text-xs text-muted-foreground">
                  {showcaseSettings.seoDescription.length}/160 characters (recommended)
                </span>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                SEO Tips
              </h4>
              <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                <li>• Keep your title under 60 characters for best display in search results</li>
                <li>• Write a compelling description under 160 characters</li>
                <li>• Include relevant keywords that customers might search for</li>
                <li>• Make sure your title and description accurately describe your store</li>
              </ul>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-medium text-foreground mb-2">Search Result Preview</h4>
              <div className="space-y-1">
                <div className="text-blue-600 dark:text-blue-400 text-sm font-medium truncate">
                  {showcaseSettings.seoTitle || 'Your Store Title'}
                </div>
                <div className="text-green-600 dark:text-green-400 text-xs">
                  showcase.storefy.app/your-store-url
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                  {showcaseSettings.seoDescription || 'Your store description will appear here...'}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
