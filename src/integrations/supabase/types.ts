export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          badge: string | null
          created_at: string
          created_by: string | null
          id: string
          message: string
          target_course: string | null
          target_round_id: string | null
          title: string
          type: string | null
        }
        Insert: {
          badge?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          target_course?: string | null
          target_round_id?: string | null
          title: string
          type?: string | null
        }
        Update: {
          badge?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          target_course?: string | null
          target_round_id?: string | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_target_round_id_fkey"
            columns: ["target_round_id"]
            isOneToOne: false
            referencedRelation: "program_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      app_installations: {
        Row: {
          app_version: string | null
          created_at: string
          device_id: string
          id: string
          installed_at: string
          platform: string
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          device_id: string
          id?: string
          installed_at?: string
          platform?: string
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          created_at?: string
          device_id?: string
          id?: string
          installed_at?: string
          platform?: string
          user_id?: string | null
        }
        Relationships: []
      }
      audio_content: {
        Row: {
          category: Database["public"]["Enums"]["audio_category"]
          cover_image_url: string | null
          created_at: string
          description: string | null
          duration_seconds: number
          file_size_mb: number | null
          file_url: string
          id: string
          is_free: boolean
          metadata: Json | null
          program_slug: string | null
          published_at: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["audio_category"]
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_seconds: number
          file_size_mb?: number | null
          file_url: string
          id?: string
          is_free?: boolean
          metadata?: Json | null
          program_slug?: string | null
          published_at?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["audio_category"]
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number
          file_size_mb?: number | null
          file_url?: string
          id?: string
          is_free?: boolean
          metadata?: Json | null
          program_slug?: string | null
          published_at?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      audio_playlist_items: {
        Row: {
          audio_id: string
          created_at: string
          id: string
          playlist_id: string
          sort_order: number
        }
        Insert: {
          audio_id: string
          created_at?: string
          id?: string
          playlist_id: string
          sort_order?: number
        }
        Update: {
          audio_id?: string
          created_at?: string
          id?: string
          playlist_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "audio_playlist_items_audio_id_fkey"
            columns: ["audio_id"]
            isOneToOne: false
            referencedRelation: "audio_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "audio_playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_playlists: {
        Row: {
          category: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_free: boolean
          is_hidden: boolean
          name: string
          program_slug: string | null
          sort_order: number
        }
        Insert: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_free?: boolean
          is_hidden?: boolean
          name: string
          program_slug?: string | null
          sort_order?: number
        }
        Update: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_free?: boolean
          is_hidden?: boolean
          name?: string
          program_slug?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      audio_progress: {
        Row: {
          audio_id: string
          completed: boolean
          created_at: string
          current_position_seconds: number
          id: string
          last_played_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_id: string
          completed?: boolean
          created_at?: string
          current_position_seconds?: number
          id?: string
          last_played_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_id?: string
          completed?: boolean
          created_at?: string
          current_position_seconds?: number
          id?: string
          last_played_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_progress_audio_id_fkey"
            columns: ["audio_id"]
            isOneToOne: false
            referencedRelation: "audio_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_messages: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          link_text: string | null
          link_url: string | null
          send_email: boolean | null
          send_push: boolean | null
          sent_count: number | null
          target_course: string | null
          target_round_id: string | null
          target_type: string | null
          title: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          link_text?: string | null
          link_url?: string | null
          send_email?: boolean | null
          send_push?: boolean | null
          sent_count?: number | null
          target_course?: string | null
          target_round_id?: string | null
          target_type?: string | null
          title?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          link_text?: string | null
          link_url?: string | null
          send_email?: boolean | null
          send_push?: boolean | null
          sent_count?: number | null
          target_course?: string | null
          target_round_id?: string | null
          target_type?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_messages_target_round_id_fkey"
            columns: ["target_round_id"]
            isOneToOne: false
            referencedRelation: "program_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          status: string
          subject: string | null
          unread_count_admin: number
          unread_count_user: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string
          subject?: string | null
          unread_count_admin?: number
          unread_count_user?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string
          subject?: string | null
          unread_count_admin?: number
          unread_count_user?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          attachment_name: string | null
          attachment_size: number | null
          attachment_type: string | null
          attachment_url: string | null
          broadcast_id: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_broadcast: boolean | null
          is_read: boolean
          sender_id: string
          sender_type: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          broadcast_id?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_broadcast?: boolean | null
          is_read?: boolean
          sender_id: string
          sender_type: string
        }
        Update: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          broadcast_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_broadcast?: boolean | null
          is_read?: boolean
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          course_name: string
          enrolled_at: string
          id: string
          program_slug: string | null
          round_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          course_name: string
          enrolled_at?: string
          id?: string
          program_slug?: string | null
          round_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          course_name?: string
          enrolled_at?: string
          id?: string
          program_slug?: string | null
          round_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "program_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          admin_id: string | null
          amount: number
          created_at: string
          description: string | null
          id: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          announcement_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          recipient_email: string
          resend_id: string | null
          status: string
        }
        Insert: {
          announcement_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          recipient_email: string
          resend_id?: string | null
          status: string
        }
        Update: {
          announcement_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          recipient_email?: string
          resend_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          city: string
          email: string
          id: string
          ip_address: unknown
          mailchimp_error: string | null
          mailchimp_success: boolean | null
          name: string
          phone: string
          source: string | null
          submitted_at: string
          user_agent: string | null
        }
        Insert: {
          city: string
          email: string
          id?: string
          ip_address?: unknown
          mailchimp_error?: string | null
          mailchimp_success?: boolean | null
          name: string
          phone: string
          source?: string | null
          submitted_at?: string
          user_agent?: string | null
        }
        Update: {
          city?: string
          email?: string
          id?: string
          ip_address?: unknown
          mailchimp_error?: string | null
          mailchimp_success?: boolean | null
          name?: string
          phone?: string
          source?: string | null
          submitted_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          billing_city: string | null
          billing_country: string | null
          billing_state: string | null
          created_at: string
          currency: string | null
          email: string
          id: string
          name: string
          payment_type: string | null
          phone: string | null
          product_name: string
          program_slug: string | null
          refund_amount: number | null
          refunded: boolean | null
          refunded_at: string | null
          status: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          billing_city?: string | null
          billing_country?: string | null
          billing_state?: string | null
          created_at?: string
          currency?: string | null
          email: string
          id?: string
          name: string
          payment_type?: string | null
          phone?: string | null
          product_name: string
          program_slug?: string | null
          refund_amount?: number | null
          refunded?: boolean | null
          refunded_at?: string | null
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          billing_city?: string | null
          billing_country?: string | null
          billing_state?: string | null
          created_at?: string
          currency?: string | null
          email?: string
          id?: string
          name?: string
          payment_type?: string | null
          phone?: string | null
          product_name?: string
          program_slug?: string | null
          refund_amount?: number | null
          refunded?: boolean | null
          refunded_at?: string | null
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      playlist_supplements: {
        Row: {
          created_at: string
          description: string | null
          id: string
          playlist_id: string
          sort_order: number
          title: string
          type: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          playlist_id: string
          sort_order?: number
          title: string
          type: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          playlist_id?: string
          sort_order?: number
          title?: string
          type?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_supplements_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "audio_playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      program_auto_enrollment: {
        Row: {
          created_at: string
          id: string
          program_slug: string
          round_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          program_slug: string
          round_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          program_slug?: string
          round_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_auto_enrollment_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "program_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      program_catalog: {
        Row: {
          android_product_id: string | null
          audio_playlist_id: string | null
          available_on_mobile: boolean | null
          available_on_web: boolean | null
          balance_full_discount: number | null
          balance_full_price: number | null
          balance_monthly_count: number | null
          balance_monthly_price: number | null
          created_at: string | null
          delivery_method: string | null
          deposit_price: number | null
          description: string | null
          duration: string | null
          features: Json | null
          id: string
          ios_product_id: string | null
          is_active: boolean | null
          is_free_on_ios: boolean | null
          mailchimp_program_name: string | null
          mailchimp_tags: Json | null
          original_price: number | null
          payment_type: string
          price_amount: number
          slug: string
          stripe_payment_link: string | null
          subscription_duration: string | null
          subscription_full_payment_discount: number | null
          subscription_full_payment_price: number | null
          subscription_interval: string | null
          subscription_interval_count: number | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          android_product_id?: string | null
          audio_playlist_id?: string | null
          available_on_mobile?: boolean | null
          available_on_web?: boolean | null
          balance_full_discount?: number | null
          balance_full_price?: number | null
          balance_monthly_count?: number | null
          balance_monthly_price?: number | null
          created_at?: string | null
          delivery_method?: string | null
          deposit_price?: number | null
          description?: string | null
          duration?: string | null
          features?: Json | null
          id?: string
          ios_product_id?: string | null
          is_active?: boolean | null
          is_free_on_ios?: boolean | null
          mailchimp_program_name?: string | null
          mailchimp_tags?: Json | null
          original_price?: number | null
          payment_type: string
          price_amount?: number
          slug: string
          stripe_payment_link?: string | null
          subscription_duration?: string | null
          subscription_full_payment_discount?: number | null
          subscription_full_payment_price?: number | null
          subscription_interval?: string | null
          subscription_interval_count?: number | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          android_product_id?: string | null
          audio_playlist_id?: string | null
          available_on_mobile?: boolean | null
          available_on_web?: boolean | null
          balance_full_discount?: number | null
          balance_full_price?: number | null
          balance_monthly_count?: number | null
          balance_monthly_price?: number | null
          created_at?: string | null
          delivery_method?: string | null
          deposit_price?: number | null
          description?: string | null
          duration?: string | null
          features?: Json | null
          id?: string
          ios_product_id?: string | null
          is_active?: boolean | null
          is_free_on_ios?: boolean | null
          mailchimp_program_name?: string | null
          mailchimp_tags?: Json | null
          original_price?: number | null
          payment_type?: string
          price_amount?: number
          slug?: string
          stripe_payment_link?: string | null
          subscription_duration?: string | null
          subscription_full_payment_discount?: number | null
          subscription_full_payment_price?: number | null
          subscription_interval?: string | null
          subscription_interval_count?: number | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_catalog_audio_playlist_id_fkey"
            columns: ["audio_playlist_id"]
            isOneToOne: false
            referencedRelation: "audio_playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      program_rounds: {
        Row: {
          audio_playlist_id: string | null
          created_at: string
          end_date: string | null
          first_session_date: string | null
          first_session_duration: number | null
          google_drive_link: string | null
          google_meet_link: string | null
          id: string
          important_message: string | null
          max_students: number | null
          program_slug: string
          round_name: string
          round_number: number
          start_date: string
          status: string
          updated_at: string
          video_url: string | null
          whatsapp_support_number: string | null
        }
        Insert: {
          audio_playlist_id?: string | null
          created_at?: string
          end_date?: string | null
          first_session_date?: string | null
          first_session_duration?: number | null
          google_drive_link?: string | null
          google_meet_link?: string | null
          id?: string
          important_message?: string | null
          max_students?: number | null
          program_slug: string
          round_name: string
          round_number: number
          start_date: string
          status?: string
          updated_at?: string
          video_url?: string | null
          whatsapp_support_number?: string | null
        }
        Update: {
          audio_playlist_id?: string | null
          created_at?: string
          end_date?: string | null
          first_session_date?: string | null
          first_session_duration?: number | null
          google_drive_link?: string | null
          google_meet_link?: string | null
          id?: string
          important_message?: string | null
          max_students?: number | null
          program_slug?: string
          round_name?: string
          round_number?: number
          start_date?: string
          status?: string
          updated_at?: string
          video_url?: string | null
          whatsapp_support_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_rounds_audio_playlist_id_fkey"
            columns: ["audio_playlist_id"]
            isOneToOne: false
            referencedRelation: "audio_playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      push_notification_logs: {
        Row: {
          created_at: string
          created_by: string | null
          destination_url: string | null
          failed_count: number
          id: string
          message: string
          sent_count: number
          target_course: string | null
          target_round_id: string | null
          target_type: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          destination_url?: string | null
          failed_count?: number
          id?: string
          message: string
          sent_count?: number
          target_course?: string | null
          target_round_id?: string | null
          target_type?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          destination_url?: string | null
          failed_count?: number
          id?: string
          message?: string
          sent_count?: number
          target_course?: string | null
          target_round_id?: string | null
          target_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_notification_logs_target_round_id_fkey"
            columns: ["target_round_id"]
            isOneToOne: false
            referencedRelation: "program_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh_key: string
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh_key: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh_key?: string
          user_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          created_at: string
          credits_balance: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_balance?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_balance?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_security_event: {
        Args: { p_action: string; p_details?: Json; p_user_id?: string }
        Returns: undefined
      }
      map_course_name_to_slug: {
        Args: { course_name: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
      audio_category: "audiobook" | "course_supplement" | "podcast"
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
      app_role: ["admin", "user"],
      audio_category: ["audiobook", "course_supplement", "podcast"],
    },
  },
} as const
