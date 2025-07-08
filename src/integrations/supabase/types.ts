export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_type: string
          actor_id: string | null
          actor_name: string
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          store_id: string
          target_id: string | null
          target_name: string | null
          target_type: string
        }
        Insert: {
          action_type: string
          actor_id?: string | null
          actor_name: string
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          store_id: string
          target_id?: string | null
          target_name?: string | null
          target_type: string
        }
        Update: {
          action_type?: string
          actor_id?: string | null
          actor_name?: string
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          store_id?: string
          target_id?: string | null
          target_name?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          store_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          store_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          status: string | null
          store_id: string
          total_orders: number | null
          total_spent: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string | null
          store_id: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string | null
          store_id?: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      layby_history: {
        Row: {
          action_description: string
          action_type: string
          amount_involved: number | null
          id: string
          layby_order_id: string
          new_values: Json | null
          notes: string | null
          old_values: Json | null
          performed_at: string
          performed_by: string
        }
        Insert: {
          action_description: string
          action_type: string
          amount_involved?: number | null
          id?: string
          layby_order_id: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
          performed_at?: string
          performed_by: string
        }
        Update: {
          action_description?: string
          action_type?: string
          amount_involved?: number | null
          id?: string
          layby_order_id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
          performed_at?: string
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "layby_history_layby_order_id_fkey"
            columns: ["layby_order_id"]
            isOneToOne: false
            referencedRelation: "layby_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      layby_items: {
        Row: {
          created_at: string | null
          id: string
          layby_order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          layby_order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          layby_order_id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "layby_items_layby_order_id_fkey"
            columns: ["layby_order_id"]
            isOneToOne: false
            referencedRelation: "layby_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "layby_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      layby_notifications: {
        Row: {
          created_at: string
          created_by: string
          error_message: string | null
          id: string
          layby_order_id: string
          message: string
          notification_type: string
          recipient_email: string | null
          recipient_phone: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          error_message?: string | null
          id?: string
          layby_order_id: string
          message: string
          notification_type: string
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          error_message?: string | null
          id?: string
          layby_order_id?: string
          message?: string
          notification_type?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "layby_notifications_layby_order_id_fkey"
            columns: ["layby_order_id"]
            isOneToOne: false
            referencedRelation: "layby_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      layby_orders: {
        Row: {
          balance_remaining: number
          cancellation_reason: string | null
          completion_date: string | null
          created_at: string | null
          created_by: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          deposit_amount: number
          due_date: string | null
          id: string
          interest_amount: number | null
          interest_rate: number | null
          inventory_reserved: boolean | null
          last_reminder_sent: string | null
          layby_number: string
          notes: string | null
          payment_schedule: string | null
          payment_schedule_type: string | null
          priority_level: string | null
          refund_amount: number | null
          reminder_count: number | null
          restocking_fee: number | null
          status: string
          store_id: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          balance_remaining: number
          cancellation_reason?: string | null
          completion_date?: string | null
          created_at?: string | null
          created_by: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          deposit_amount: number
          due_date?: string | null
          id?: string
          interest_amount?: number | null
          interest_rate?: number | null
          inventory_reserved?: boolean | null
          last_reminder_sent?: string | null
          layby_number: string
          notes?: string | null
          payment_schedule?: string | null
          payment_schedule_type?: string | null
          priority_level?: string | null
          refund_amount?: number | null
          reminder_count?: number | null
          restocking_fee?: number | null
          status?: string
          store_id: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          balance_remaining?: number
          cancellation_reason?: string | null
          completion_date?: string | null
          created_at?: string | null
          created_by?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          deposit_amount?: number
          due_date?: string | null
          id?: string
          interest_amount?: number | null
          interest_rate?: number | null
          inventory_reserved?: boolean | null
          last_reminder_sent?: string | null
          layby_number?: string
          notes?: string | null
          payment_schedule?: string | null
          payment_schedule_type?: string | null
          priority_level?: string | null
          refund_amount?: number | null
          reminder_count?: number | null
          restocking_fee?: number | null
          status?: string
          store_id?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "layby_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "layby_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      layby_payment_schedules: {
        Row: {
          amount_due: number
          amount_paid: number | null
          created_at: string
          due_date: string
          id: string
          layby_order_id: string
          notes: string | null
          payment_number: number
          reminder_sent: boolean | null
          status: string | null
          updated_at: string
        }
        Insert: {
          amount_due: number
          amount_paid?: number | null
          created_at?: string
          due_date: string
          id?: string
          layby_order_id: string
          notes?: string | null
          payment_number: number
          reminder_sent?: boolean | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number | null
          created_at?: string
          due_date?: string
          id?: string
          layby_order_id?: string
          notes?: string | null
          payment_number?: number
          reminder_sent?: boolean | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "layby_payment_schedules_layby_order_id_fkey"
            columns: ["layby_order_id"]
            isOneToOne: false
            referencedRelation: "layby_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      layby_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          layby_order_id: string
          notes: string | null
          payment_method: string
          payment_reference: string | null
          processed_by: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          layby_order_id: string
          notes?: string | null
          payment_method?: string
          payment_reference?: string | null
          processed_by: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          layby_order_id?: string
          notes?: string | null
          payment_method?: string
          payment_reference?: string | null
          processed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "layby_payments_layby_order_id_fkey"
            columns: ["layby_order_id"]
            isOneToOne: false
            referencedRelation: "layby_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      layby_settings: {
        Row: {
          automatic_reminders_enabled: boolean | null
          created_at: string
          default_cancellation_fee_percent: number | null
          default_interest_rate: number | null
          id: string
          inventory_reservation_enabled: boolean | null
          max_layby_duration_days: number | null
          max_reminder_count: number | null
          overdue_grace_period_days: number | null
          reminder_frequency_days: number | null
          require_deposit_percent: number | null
          store_id: string
          updated_at: string
        }
        Insert: {
          automatic_reminders_enabled?: boolean | null
          created_at?: string
          default_cancellation_fee_percent?: number | null
          default_interest_rate?: number | null
          id?: string
          inventory_reservation_enabled?: boolean | null
          max_layby_duration_days?: number | null
          max_reminder_count?: number | null
          overdue_grace_period_days?: number | null
          reminder_frequency_days?: number | null
          require_deposit_percent?: number | null
          store_id: string
          updated_at?: string
        }
        Update: {
          automatic_reminders_enabled?: boolean | null
          created_at?: string
          default_cancellation_fee_percent?: number | null
          default_interest_rate?: number | null
          id?: string
          inventory_reservation_enabled?: boolean | null
          max_layby_duration_days?: number | null
          max_reminder_count?: number | null
          overdue_grace_period_days?: number | null
          reminder_frequency_days?: number | null
          require_deposit_percent?: number | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "layby_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cashier_id: string
          created_at: string
          customer_id: string | null
          discount_amount: number | null
          discount_code: string | null
          id: string
          order_number: string
          payment_method: string | null
          status: string | null
          store_id: string
          subtotal: number
          tax_amount: number | null
          total: number
        }
        Insert: {
          cashier_id: string
          created_at?: string
          customer_id?: string | null
          discount_amount?: number | null
          discount_code?: string | null
          id?: string
          order_number: string
          payment_method?: string | null
          status?: string | null
          store_id: string
          subtotal: number
          tax_amount?: number | null
          total: number
        }
        Update: {
          cashier_id?: string
          created_at?: string
          customer_id?: string | null
          discount_amount?: number | null
          discount_code?: string | null
          id?: string
          order_number?: string
          payment_method?: string | null
          status?: string | null
          store_id?: string
          subtotal?: number
          tax_amount?: number | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          account_number: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          provider: string
          store_id: string
          updated_at: string
        }
        Insert: {
          account_number: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          provider: string
          store_id: string
          updated_at?: string
        }
        Update: {
          account_number?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          provider?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          low_stock_threshold: number | null
          name: string
          price: number
          sku: string | null
          stock_quantity: number | null
          store_id: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number | null
          name: string
          price: number
          sku?: string | null
          stock_quantity?: number | null
          store_id: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number | null
          name?: string
          price?: number
          sku?: string | null
          stock_quantity?: number | null
          store_id?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_adjustments: {
        Row: {
          adjustment_type: string
          created_at: string
          id: string
          new_quantity: number
          previous_quantity: number
          product_id: string
          quantity_change: number
          reason: string | null
          reference_id: string | null
          store_id: string
          user_id: string
        }
        Insert: {
          adjustment_type: string
          created_at?: string
          id?: string
          new_quantity: number
          previous_quantity: number
          product_id: string
          quantity_change: number
          reason?: string | null
          reference_id?: string | null
          store_id: string
          user_id: string
        }
        Update: {
          adjustment_type?: string
          created_at?: string
          id?: string
          new_quantity?: number
          previous_quantity?: number
          product_id?: string
          quantity_change?: number
          reason?: string | null
          reference_id?: string | null
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_members: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string | null
          phone: string | null
          pin: string | null
          role: Database["public"]["Enums"]["store_role"]
          store_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          phone?: string | null
          pin?: string | null
          role?: Database["public"]["Enums"]["store_role"]
          store_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          phone?: string | null
          pin?: string | null
          role?: Database["public"]["Enums"]["store_role"]
          store_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_members_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          created_at: string
          currency: string | null
          email: string | null
          id: string
          name: string
          owner_id: string
          phone: string | null
          store_code: string
          tax_rate: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          name: string
          owner_id: string
          phone?: string | null
          store_code: string
          tax_rate?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          name?: string
          owner_id?: string
          phone?: string | null
          store_code?: string
          tax_rate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          store_id: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          store_id: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          store_id?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_history: {
        Row: {
          action_description: string | null
          action_type: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          performed_at: string
          performed_by: string
          transaction_id: string
          user_agent: string | null
        }
        Insert: {
          action_description?: string | null
          action_type: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string
          performed_by: string
          transaction_id: string
          user_agent?: string | null
        }
        Update: {
          action_description?: string | null
          action_type?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string
          performed_by?: string
          transaction_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_history_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          description: string | null
          id: string
          notes: string | null
          payment_method: string
          processed_by: string
          reference_id: string | null
          reference_type: string | null
          store_id: string
          transaction_number: string
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          processed_by: string
          reference_id?: string | null
          reference_type?: string | null
          store_id: string
          transaction_number: string
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          processed_by?: string
          reference_id?: string | null
          reference_type?: string | null
          store_id?: string
          transaction_number?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_layby_interest: {
        Args: { _layby_order_id: string }
        Returns: number
      }
      generate_layby_number: {
        Args: { store_id_param: string }
        Returns: string
      }
      generate_payment_schedule: {
        Args: {
          _layby_order_id: string
          _schedule_type: string
          _start_date: string
          _total_amount: number
          _deposit_amount: number
        }
        Returns: undefined
      }
      generate_transaction_number: {
        Args: { store_id_param: string }
        Returns: string
      }
      has_store_access: {
        Args: {
          _store_id: string
          _min_role?: Database["public"]["Enums"]["store_role"]
        }
        Returns: boolean
      }
      initialize_layby_settings: {
        Args: { _store_id: string }
        Returns: undefined
      }
      update_overdue_layby_orders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_overdue_laybys: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      user_can_access_store: {
        Args: { _store_id: string }
        Returns: boolean
      }
      user_owns_store: {
        Args: { _store_id: string }
        Returns: boolean
      }
    }
    Enums: {
      store_role: "owner" | "manager" | "cashier"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      store_role: ["owner", "manager", "cashier"],
    },
  },
} as const
