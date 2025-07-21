import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useCurrentStore, useStoreStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import {
  useSettingsStore,
  useShowcaseSettings
} from "@/stores/settingsStore";

// Import refactored showcase components
import { ShowcaseBasicSettings } from "./showcase/ShowcaseBasicSettings";
import { ShowcaseThemeSettings } from "./showcase/ShowcaseThemeSettings";
import { ShowcaseSEOSettings } from "./showcase/ShowcaseSEOSettings";

export function ShowcaseSettings() {
  const currentStore = useCurrentStore();
  const user = useUser();
  const { updateCurrentStore } = useStoreStore();
  
  // Use Zustand store state
  const showcaseSettings = useShowcaseSettings();
  const showcaseLoading = useSettingsStore(state => state.showcaseLoading);
  const showcaseSaving = useSettingsStore(state => state.showcaseSaving);
  
  // Actions from Zustand
  const setShowcaseSettings = useSettingsStore(state => state.setShowcaseSettings);
  const loadShowcaseSettings = useSettingsStore(state => state.loadShowcaseSettings);
  const saveShowcaseSettings = useSettingsStore(state => state.saveShowcaseSettings);

  useEffect(() => {
    if (currentStore?.id) {
      loadShowcaseSettings(currentStore.id);
    }
  }, [currentStore?.id, loadShowcaseSettings]);

  const handleSaveShowcaseSettings = async () => {
    if (!currentStore?.id) return;
    await saveShowcaseSettings(currentStore.id);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Showcase Settings</h2>
          <p className="text-muted-foreground">
            Configure your public store showcase for customers to browse your products online
          </p>
        </div>
        {showcaseSettings.enableShowcase && (
          <Button
            onClick={handleSaveShowcaseSettings}
            disabled={showcaseSaving}
            className="min-w-[140px]"
          >
            {showcaseSaving ? 'Saving...' : 'Save Showcase Settings'}
          </Button>
        )}
      </div>

      <ShowcaseBasicSettings />
      
      {showcaseSettings.enableShowcase && (
        <>
          <ShowcaseThemeSettings />
          <ShowcaseSEOSettings />
        </>
      )}

      {showcaseSettings.enableShowcase && (
        <div className="flex justify-end pt-4 border-t border-border">
          <Button
            onClick={handleSaveShowcaseSettings}
            disabled={showcaseSaving}
            className="min-w-[140px]"
          >
            {showcaseSaving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      )}
    </div>
  );
}
