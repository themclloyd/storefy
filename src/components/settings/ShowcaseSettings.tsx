import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Store, Palette, Eye, ExternalLink, Copy, Settings, Image, Phone, Mail, MapPin } from "lucide-react";
import { useCurrentStore, useStoreStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateShowcaseUrl, generateUniqueSlug, updateStoreSlug } from "@/lib/showcase-utils";
import {
  useSettingsStore,
  useShowcaseSettings,
  useShowcaseTheme,
  useShowcaseAnalytics,
  useShowcaseLoading,
  useShowcaseSaving
} from "@/stores/settingsStore";

interface ShowcaseTheme {
  primaryColor: string;
  secondaryColor: string;
  layout: 'grid' | 'list' | 'masonry';
}

interface ContactInfo {
  showPhone: boolean;
  showEmail: boolean;
  showAddress: boolean;
}

interface ShowcaseSettingsProps {
  onShowcaseStatusChange?: (enabled: boolean) => void;
}

export function ShowcaseSettings({ onShowcaseStatusChange }: ShowcaseSettingsProps = {}) {
  const currentStore = useCurrentStore();
  const user = useUser();
  const { updateCurrentStore } = useStoreStore();

  // Use Zustand store for showcase settings
  const showcaseSettings = useShowcaseSettings();
  const showcaseTheme = useShowcaseTheme();
  const showcaseAnalytics = useShowcaseAnalytics();
  const showcaseLoading = useShowcaseLoading();
  const showcaseSaving = useShowcaseSaving();
  const setShowcaseSettings = useSettingsStore(state => state.setShowcaseSettings);
  const loadShowcaseSettings = useSettingsStore(state => state.loadShowcaseSettings);
  const saveShowcaseSettings = useSettingsStore(state => state.saveShowcaseSettings);
  const loadShowcaseAnalytics = useSettingsStore(state => state.loadShowcaseAnalytics);
  const updateShowcaseTheme = useSettingsStore(state => state.updateShowcaseTheme);
  const resetShowcaseSettings = useSettingsStore(state => state.resetShowcaseSettings);

  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  useEffect(() => {
    if (currentStore?.id) {
      loadShowcaseSettings(currentStore.id);
      if (showcaseSettings.enableShowcase) {
        loadShowcaseAnalytics(currentStore.id);
      }
    }
  }, [currentStore?.id, loadShowcaseSettings, loadShowcaseAnalytics, showcaseSettings.enableShowcase]);



  const handleSaveShowcaseSettings = async () => {
    if (!currentStore?.id) return;
    await saveShowcaseSettings(currentStore.id);

  };

  const getShowcaseUrl = () => {
    if (!currentStore) return '';
    return generateShowcaseUrl({
      showcase_slug: showcaseSettings.showcaseSlug,
      store_code: currentStore.store_code,
      id: currentStore.id
    });
  };

  const getStoreCodeUrl = () => {
    if (!currentStore?.store_code) return '';
    return `${window.location.origin}/store/${currentStore.store_code}/catalog`;
  };

  const generateSlug = async () => {
    if (!currentStore) return;

    try {
      const newSlug = await generateUniqueSlug(currentStore.name);
      const success = await updateStoreSlug(currentStore.id, newSlug);

      if (success) {
        setShowcaseSettings({ showcaseSlug: newSlug });
        toast.success('Showcase slug generated successfully!');
      } else {
        toast.error('Failed to generate slug');
      }
    } catch (error) {
      console.error('Error generating slug:', error);
      toast.error('Failed to generate slug');
    }
  };

  const copyShowcaseUrl = () => {
    const url = getShowcaseUrl();
    navigator.clipboard.writeText(url);
    toast.success('Showcase URL copied to clipboard!');
  };

  const openShowcasePreview = () => {
    if (showcaseSettings.enableShowcase) {
      window.open(getShowcaseUrl(), '_blank');
    } else {
      setPreviewDialogOpen(true);
    }
  };

  if (showcaseLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Showcase Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Showcase Appearance & Settings
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Customize how your public showcase looks and what information to display
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Showcase Status Info */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium">
                  Showcase Status
                </Label>
                <Badge variant={showcaseSettings.enableShowcase ? "default" : "secondary"}>
                  {showcaseSettings.enableShowcase ? "Active" : "Disabled"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {showcaseSettings.enableShowcase
                  ? "Your showcase is live and customers can view your products"
                  : "Enable showcase from the Showcase page to start sharing your products"
                }
              </p>
            </div>
            {!showcaseSettings.enableShowcase && (
              <Button
                variant="outline"
                onClick={() => window.location.href = '/showcase'}
                className="flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                Go to Showcase
              </Button>
            )}
          </div>



          {/* URL Management */}
          {showcaseSettings.enableShowcase && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Showcase URLs & Links</h3>

              {/* Primary Showcase URL */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-foreground">Your Public Store Catalog</h4>
                    <p className="text-sm text-muted-foreground">Share this link with customers to showcase your products</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={getShowcaseUrl()}
                      readOnly
                      className="font-mono text-sm bg-background"
                    />
                    <Button
                      variant="outline"
                      onClick={copyShowcaseUrl}
                      className="flex-shrink-0"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => window.open(getShowcaseUrl(), '_blank')}
                      className="flex items-center gap-2"
                      style={{ backgroundColor: showcaseSettings.theme.primaryColor }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visit Your Store Catalog
                    </Button>
                    <Button
                      variant="outline"
                      onClick={openShowcasePreview}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </Button>
                  </div>
                </div>
              </div>

              {/* Custom Slug Management */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold">Custom Short URL</h4>
                </div>

                <div className="space-y-2">
                  <Label>Custom URL Slug</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="flex">
                        <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 border-input rounded-l-md">
                          /shop/
                        </span>
                        <Input
                          value={showcaseSettings.showcaseSlug}
                          onChange={(e) => setShowcaseSettings({ showcaseSlug: e.target.value })}
                          placeholder="your-store-name"
                          className="rounded-l-none"
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={generateSlug}
                      className="flex items-center gap-2"
                    >
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Create a memorable, short URL for your store showcase
                  </p>
                </div>
              </div>

              {/* Additional URLs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Primary Showcase URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getShowcaseUrl()}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyShowcaseUrl}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {currentStore?.store_code && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Store Code URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={getStoreCodeUrl()}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(getStoreCodeUrl());
                          toast.success('Store code URL copied!');
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Showcase Analytics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Showcase Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total Views</p>
                          <p className="text-2xl font-bold">{showcaseAnalytics.totalViews}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Unique Visitors</p>
                          <p className="text-2xl font-bold">{showcaseAnalytics.uniqueVisitors}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Last Visited</p>
                          <p className="text-sm font-medium">
                            {showcaseAnalytics.lastVisited
                              ? new Date(showcaseAnalytics.lastVisited).toLocaleDateString()
                              : 'Never'
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {showcaseAnalytics.popularProducts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Popular Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {showcaseAnalytics.popularProducts.map((product, index) => (
                          <div key={product.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{index + 1}</Badge>
                              <span className="font-medium">{product.name}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{product.views} views</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Configuration Tabs */}
          {showcaseSettings.enableShowcase && (
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-4">


                  <div className="space-y-2">
                    <Label htmlFor="showcase-description">Store Description</Label>
                    <Textarea
                      id="showcase-description"
                      placeholder="Describe your store for customers..."
                      value={showcaseSettings.showcaseDescription}
                      onChange={(e) => setShowcaseSettings({ showcaseDescription: e.target.value })}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be displayed on your public showcase page
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="showcase-logo">Logo URL</Label>
                    <Input
                      id="showcase-logo"
                      placeholder="https://example.com/logo.png"
                      value={showcaseSettings.showcaseLogoUrl}
                      onChange={(e) => setShowcaseSettings({ showcaseLogoUrl: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="showcase-banner">Banner Image URL</Label>
                    <Input
                      id="showcase-banner"
                      placeholder="https://example.com/banner.jpg"
                      value={showcaseSettings.showcaseBannerUrl}
                      onChange={(e) => setShowcaseSettings({ showcaseBannerUrl: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Appearance Tab */}
              <TabsContent value="appearance" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Layout Style</Label>
                    <Select value={showcaseSettings.theme.layout} onValueChange={(value: 'grid' | 'list' | 'masonry') => updateShowcaseTheme({ layout: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid Layout</SelectItem>
                        <SelectItem value="list">List Layout</SelectItem>
                        <SelectItem value="masonry">Masonry Layout</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary-color">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primary-color"
                          type="color"
                          value={showcaseSettings.theme.primaryColor}
                          onChange={(e) => updateShowcaseTheme({ primaryColor: e.target.value })}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={showcaseSettings.theme.primaryColor}
                          onChange={(e) => updateShowcaseTheme({ primaryColor: e.target.value })}
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="secondary-color">Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondary-color"
                          type="color"
                          value={showcaseSettings.theme.secondaryColor}
                          onChange={(e) => updateShowcaseTheme({ secondaryColor: e.target.value })}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={showcaseSettings.theme.secondaryColor}
                          onChange={(e) => updateShowcaseTheme({ secondaryColor: e.target.value })}
                          placeholder="#1e40af"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Contact Information Tab */}
              <TabsContent value="contact" className="space-y-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Choose which contact information to display on your public showcase
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <Label>Show Phone Number</Label>
                      </div>
                      <Switch
                        checked={showcaseSettings.contactInfo.showPhone}
                        onCheckedChange={(checked) => setShowcaseSettings({ contactInfo: { ...showcaseSettings.contactInfo, showPhone: checked } })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <Label>Show Email Address</Label>
                      </div>
                      <Switch
                        checked={showcaseSettings.contactInfo.showEmail}
                        onCheckedChange={(checked) => setShowcaseSettings({ contactInfo: { ...showcaseSettings.contactInfo, showEmail: checked } })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <Label>Show Address</Label>
                      </div>
                      <Switch
                        checked={showcaseSettings.contactInfo.showAddress}
                        onCheckedChange={(checked) => setShowcaseSettings({ contactInfo: { ...showcaseSettings.contactInfo, showAddress: checked } })}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* SEO Tab */}
              <TabsContent value="seo" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="seo-title">SEO Title</Label>
                    <Input
                      id="seo-title"
                      placeholder="Your Store Name - Product Catalog"
                      value={showcaseSettings.seoTitle}
                      onChange={(e) => setShowcaseSettings({ seoTitle: e.target.value })}
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground">
                      {showcaseSettings.seoTitle.length}/60 characters (recommended)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="seo-description">SEO Description</Label>
                    <Textarea
                      id="seo-description"
                      placeholder="Browse our collection of products..."
                      value={showcaseSettings.seoDescription}
                      onChange={(e) => setShowcaseSettings({ seoDescription: e.target.value })}
                      maxLength={160}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      {showcaseSettings.seoDescription.length}/160 characters (recommended)
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Save & Reset Buttons */}
          <div className="border-t pt-4 flex flex-col md:flex-row gap-3">
            <Button
              onClick={handleSaveShowcaseSettings}
              disabled={showcaseSaving}
              className="flex-1 md:flex-none"
            >
              {showcaseSaving ? 'Saving...' : 'Save Showcase Settings'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                resetShowcaseSettings();
                toast.success('Showcase settings reset to defaults');
              }}
              disabled={showcaseSaving}
              className="flex-1 md:flex-none"
            >
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Showcase First</DialogTitle>
            <DialogDescription>
              You need to enable the public showcase feature before you can preview it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setShowcaseSettings({ enableShowcase: true });
                setPreviewDialogOpen(false);
              }}
              className="flex-1"
            >
              Enable Showcase
            </Button>
            <Button
              variant="outline"
              onClick={() => setPreviewDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
