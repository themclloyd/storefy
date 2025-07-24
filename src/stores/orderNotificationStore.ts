import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OrderNotification {
  id: string;
  store_id: string;
  order_id: string;
  notification_type: 'new_order' | 'order_update' | 'whatsapp_sent';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  order_code?: string;
  customer_name?: string;
}

interface OrderNotificationState {
  notifications: OrderNotification[];
  unreadCount: number;
  loading: boolean;
  isSubscribed: boolean;
}

interface OrderNotificationActions {
  loadNotifications: (storeId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (storeId: string) => Promise<void>;
  subscribeToNotifications: (storeId: string) => void;
  unsubscribeFromNotifications: () => void;
  addNotification: (notification: OrderNotification) => void;
  clearNotifications: () => void;
}

type OrderNotificationStore = OrderNotificationState & OrderNotificationActions;

const initialState: OrderNotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  isSubscribed: false,
};

export const useOrderNotificationStore = create<OrderNotificationStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      loadNotifications: async (storeId: string) => {
        try {
          set({ loading: true }, false, 'loadNotifications:start');

          const { data, error } = await supabase
            .from('order_notifications')
            .select(`
              *,
              public_orders!inner (
                order_code,
                customer_name
              )
            `)
            .eq('store_id', storeId)
            .order('created_at', { ascending: false })
            .limit(50);

          if (error) throw error;

          const notifications: OrderNotification[] = (data || []).map(item => ({
            id: item.id,
            store_id: item.store_id,
            order_id: item.order_id,
            notification_type: item.notification_type,
            title: item.title,
            message: item.message,
            is_read: item.is_read,
            created_at: item.created_at,
            order_code: item.public_orders?.order_code,
            customer_name: item.public_orders?.customer_name,
          }));

          const unreadCount = notifications.filter(n => !n.is_read).length;

          set({
            notifications,
            unreadCount,
            loading: false
          }, false, 'loadNotifications:success');

        } catch (error) {
          console.error('Error loading notifications:', error);
          set({ loading: false }, false, 'loadNotifications:error');
        }
      },

      markAsRead: async (notificationId: string) => {
        try {
          const { error } = await supabase
            .from('order_notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

          if (error) throw error;

          set((state) => ({
            notifications: state.notifications.map(n =>
              n.id === notificationId ? { ...n, is_read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1)
          }), false, 'markAsRead');

        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      },

      markAllAsRead: async (storeId: string) => {
        try {
          const { error } = await supabase
            .from('order_notifications')
            .update({ is_read: true })
            .eq('store_id', storeId)
            .eq('is_read', false);

          if (error) throw error;

          set((state) => ({
            notifications: state.notifications.map(n => ({ ...n, is_read: true })),
            unreadCount: 0
          }), false, 'markAllAsRead');

        } catch (error) {
          console.error('Error marking all notifications as read:', error);
        }
      },

      subscribeToNotifications: (storeId: string) => {
        const { isSubscribed } = get();
        if (isSubscribed) return;

        // Subscribe to real-time notifications
        const subscription = supabase
          .channel(`order_notifications_${storeId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'order_notifications',
              filter: `store_id=eq.${storeId}`
            },
            async (payload) => {
              const newNotification = payload.new as any;
              
              // Get additional order details
              const { data: orderData } = await supabase
                .from('public_orders')
                .select('order_code, customer_name')
                .eq('id', newNotification.order_id)
                .single();

              const notification: OrderNotification = {
                id: newNotification.id,
                store_id: newNotification.store_id,
                order_id: newNotification.order_id,
                notification_type: newNotification.notification_type,
                title: newNotification.title,
                message: newNotification.message,
                is_read: newNotification.is_read,
                created_at: newNotification.created_at,
                order_code: orderData?.order_code,
                customer_name: orderData?.customer_name,
              };

              get().addNotification(notification);

              // Show toast notification
              if (newNotification.notification_type === 'new_order') {
                toast.success(`New order received: ${orderData?.order_code}`, {
                  description: `From ${orderData?.customer_name}`,
                  duration: 5000,
                });
              }
            }
          )
          .subscribe();

        set({ isSubscribed: true }, false, 'subscribeToNotifications');

        // Store subscription for cleanup
        (window as any).__orderNotificationSubscription = subscription;
      },

      unsubscribeFromNotifications: () => {
        const subscription = (window as any).__orderNotificationSubscription;
        if (subscription) {
          subscription.unsubscribe();
          delete (window as any).__orderNotificationSubscription;
        }
        set({ isSubscribed: false }, false, 'unsubscribeFromNotifications');
      },

      addNotification: (notification: OrderNotification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: notification.is_read ? state.unreadCount : state.unreadCount + 1
        }), false, 'addNotification');
      },

      clearNotifications: () => {
        set(initialState, false, 'clearNotifications');
      },
    }),
    { name: 'order-notification-store' }
  )
);

// Hook for easy access to notification count
export const useUnreadOrderCount = () => {
  return useOrderNotificationStore(state => state.unreadCount);
};

// Hook for easy access to recent notifications
export const useRecentOrderNotifications = (limit = 5) => {
  return useOrderNotificationStore(state => 
    state.notifications.slice(0, limit)
  );
};
