import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, UserPlus, Edit, Trash2, UserCheck } from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import {
  useSettingsStore,
  useActivityLogs
} from "@/stores/settingsStore";

export function ActivityLogs() {
  const currentStore = useCurrentStore();

  // Use Zustand store state
  const activityLogs = useActivityLogs();
  const loading = useSettingsStore(state => state.loading);
  
  // Actions from Zustand
  const fetchActivityLogs = useSettingsStore(state => state.fetchActivityLogs);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading activity logs...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentStore?.id) {
                  fetchActivityLogs(currentStore.id);
                }
              }}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Track all activities and changes in your store
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading activity logs...</span>
          </div>
        ) : activityLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No activity logs found</p>
            <p className="text-sm">Activity will appear here as you use the system</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activityLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {log.action_type?.includes('added') && <UserPlus className="w-4 h-4 text-green-600" />}
                  {log.action_type?.includes('updated') && <Edit className="w-4 h-4 text-blue-600" />}
                  {log.action_type?.includes('deleted') && <Trash2 className="w-4 h-4 text-red-600" />}
                  {log.action_type?.includes('login') && <UserCheck className="w-4 h-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{log.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {log.action_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown Action'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
            <div className="text-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => currentStore?.id && fetchActivityLogs(currentStore.id)}
                disabled={loading}
              >
                Refresh Logs
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
