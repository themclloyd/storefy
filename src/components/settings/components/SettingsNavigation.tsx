import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Store, Globe, CreditCard, Bell, Activity, Copy } from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { generateShowcaseUrl } from "@/lib/showcase-utils";
import {
  useSettingsStore,
  useRoleStats
} from "@/stores/settingsStore";

interface SettingsNavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function SettingsNavigation({ currentTab, onTabChange }: SettingsNavigationProps) {
  const currentStore = useCurrentStore();
  const roleStats = useRoleStats();
  const showcaseSettings = useSettingsStore(state => state.showcaseSettings);

  const copyShowcaseUrl = async () => {
    if (!currentStore) return;
    
    const url = generateShowcaseUrl({
      store_code: currentStore.store_code,
      showcase_slug: showcaseSettings.showcaseSlug,
    });
    
    try {
      await navigator.clipboard.writeText(url);
      // Could add toast notification here
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
    <Tabs value={currentTab} onValueChange={onTabChange} className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
        <TabsTrigger value="team" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">Team</span>
          <Badge variant="secondary" className="ml-1 text-xs">
            {roleStats.total}
          </Badge>
        </TabsTrigger>

        <TabsTrigger value="store" className="flex items-center gap-2">
          <Store className="w-4 h-4" />
          <span className="hidden sm:inline">Store</span>
        </TabsTrigger>

        <TabsTrigger value="showcase" className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">Showcase</span>
          {showcaseSettings.enableShowcase && (
            <Badge variant="default" className="ml-1 text-xs">
              Live
            </Badge>
          )}
        </TabsTrigger>

        <TabsTrigger value="payments" className="flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          <span className="hidden sm:inline">Payments</span>
        </TabsTrigger>

        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <Bell className="w-4 h-4" />
          <span className="hidden sm:inline">Notifications</span>
        </TabsTrigger>

        <TabsTrigger value="activity" className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          <span className="hidden sm:inline">Activity</span>
        </TabsTrigger>
      </TabsList>

      {/* Showcase URL Display */}
      {showcaseSettings.enableShowcase && currentStore && (
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Your Public Showcase</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground cursor-help">
                    {showcaseSettings.enableShowcase ? 'View your public store catalog' : 'Enable showcase in settings to make your catalog public'}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This URL allows customers to browse your products online</p>
                </TooltipContent>
              </Tooltip>
            </div>
            {showcaseSettings.enableShowcase && (
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={copyShowcaseUrl}
                      className="p-2 hover:bg-muted rounded-md transition-colors"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy showcase URL</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      )}
    </Tabs>
  );
}
