import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Globe, ExternalLink } from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { generateShowcaseUrl, generateUniqueSlug } from "@/lib/showcase-utils";
import { toast } from "sonner";
import {
  useSettingsStore,
  useShowcaseSettings
} from "@/stores/settingsStore";

export function ShowcaseBasicSettings() {
  const currentStore = useCurrentStore();
  
  // Use Zustand store state
  const showcaseSettings = useShowcaseSettings();
  const showcaseLoading = useSettingsStore(state => state.showcaseLoading);
  
  // Actions from Zustand
  const setShowcaseSettings = useSettingsStore(state => state.setShowcaseSettings);

  const generateSlug = async () => {
    if (!currentStore?.name) {
      toast.error('Store name is required to generate a slug');
      return;
    }

    try {
      const newSlug = await generateUniqueSlug(currentStore.name);
      setShowcaseSettings({ showcaseSlug: newSlug });
      toast.success('Unique slug generated successfully!');
    } catch (error) {
      console.error('Error generating slug:', error);
      toast.error('Failed to generate slug. Please try again.');
    }
  };

  const getShowcaseUrl = () => {
    if (!currentStore) return '';
    return generateShowcaseUrl({
      store_code: currentStore.store_code,
      showcase_slug: showcaseSettings.showcaseSlug,
    });
  };

  if (showcaseLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading showcase settings...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Basic Showcase Settings
          <Badge variant={showcaseSettings.enableShowcase ? "default" : "secondary"}>
            {showcaseSettings.enableShowcase ? "Active" : "Disabled"}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {showcaseSettings.enableShowcase
            ? "Your showcase is live and customers can view your products"
            : "Enable showcase from the Showcase page to start sharing your products"
          }
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!showcaseSettings.enableShowcase && (
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <p className="text-sm text-muted-foreground">
              Enable your public showcase to make these settings available. 
              Your showcase allows customers to browse your products online.
            </p>
          </div>
        )}

        {showcaseSettings.enableShowcase && (
          <>
            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Your showcase is live!
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Customers can now view your products at: {getShowcaseUrl()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getShowcaseUrl(), '_blank')}
                  className="border-green-200 dark:border-green-800"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Live
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="showcase-slug">Custom URL Slug</Label>
                <div className="flex gap-2">
                  <Input
                    id="showcase-slug"
                    placeholder="my-awesome-store"
                    value={showcaseSettings.showcaseSlug}
                    onChange={(e) => setShowcaseSettings({ showcaseSlug: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateSlug}
                    disabled={showcaseLoading}
                  >
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This will be part of your showcase URL. Leave empty to use your store code.
                </p>
                {showcaseSettings.showcaseSlug && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">Preview URL:</p>
                    <p className="text-sm font-mono break-all">{getShowcaseUrl()}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="showcase-description">Store Description</Label>
                <Textarea
                  id="showcase-description"
                  placeholder="Tell customers about your store..."
                  value={showcaseSettings.showcaseDescription}
                  onChange={(e) => setShowcaseSettings({ showcaseDescription: e.target.value })}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  This description will appear on your public showcase page.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="showcase-logo">Logo URL</Label>
                <Input
                  id="showcase-logo"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={showcaseSettings.showcaseLogoUrl}
                  onChange={(e) => setShowcaseSettings({ showcaseLogoUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  URL to your store logo image. Leave empty to use default.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="showcase-banner">Banner Image URL</Label>
                <Input
                  id="showcase-banner"
                  type="url"
                  placeholder="https://example.com/banner.jpg"
                  value={showcaseSettings.showcaseBannerUrl}
                  onChange={(e) => setShowcaseSettings({ showcaseBannerUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  URL to your store banner image. This will be displayed at the top of your showcase.
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
