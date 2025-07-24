import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bell, Package, Clock, CheckCircle, MessageCircle, Eye, MarkAsRead } from 'lucide-react';
import { useCurrentStore } from '@/stores/storeStore';
import { useOrderNotificationStore, useUnreadOrderCount, useRecentOrderNotifications } from '@/stores/orderNotificationStore';
import { formatDistanceToNow } from 'date-fns';

export function OrderNotificationBell() {
  const currentStore = useCurrentStore();
  const unreadCount = useUnreadOrderCount();
  const recentNotifications = useRecentOrderNotifications(10);
  
  const {
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    subscribeToNotifications,
    unsubscribeFromNotifications
  } = useOrderNotificationStore();

  useEffect(() => {
    if (currentStore?.id) {
      loadNotifications(currentStore.id);
      subscribeToNotifications(currentStore.id);
    }

    return () => {
      unsubscribeFromNotifications();
    };
  }, [currentStore?.id, loadNotifications, subscribeToNotifications, unsubscribeFromNotifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order': return <Package className="w-4 h-4 text-blue-600" />;
      case 'order_update': return <Clock className="w-4 h-4 text-orange-600" />;
      case 'whatsapp_sent': return <MessageCircle className="w-4 h-4 text-green-600" />;
      default: return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(notificationId);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (currentStore?.id) {
      await markAllAsRead(currentStore.id);
    }
  };

  if (!currentStore) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-500"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Order Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <MarkAsRead className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <ScrollArea className="h-80">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="p-4 text-center">
              <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Order notifications will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {recentNotifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification.id, notification.is_read)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`text-sm font-medium truncate ${
                          !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {notification.order_code && (
                            <span className="font-mono bg-muted px-1 rounded">
                              {notification.order_code}
                            </span>
                          )}
                          {notification.customer_name && (
                            <span>{notification.customer_name}</span>
                          )}
                        </div>
                        
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {recentNotifications.length > 0 && (
          <div className="p-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                // Navigate to full notifications view - you can implement this
                console.log('Navigate to full notifications view');
              }}
            >
              <Eye className="w-3 h-3 mr-1" />
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
