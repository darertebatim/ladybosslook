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
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      audio_bookmarks: {
        Row: {
          audio_id: string
          created_at: string
          id: string
          note: string | null
          timestamp_seconds: number
          user_id: string
        }
        Insert: {
          audio_id: string
          created_at?: string
          id?: string
          note?: string | null
          timestamp_seconds: number
          user_id: string
        }
        Update: {
          audio_id?: string
          created_at?: string
          id?: string
          note?: string | null
          timestamp_seconds?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_bookmarks_audio_id_fkey"
            columns: ["audio_id"]
            isOneToOne: false
            referencedRelation: "audio_content"
            referencedColumns: ["id"]
          },
        ]
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
          drip_delay_days: number
          id: string
          playlist_id: string
          sort_order: number
        }
        Insert: {
          audio_id: string
          created_at?: string
          drip_delay_days?: number
          id?: string
          playlist_id: string
          sort_order?: number
        }
        Update: {
          audio_id?: string
          created_at?: string
          drip_delay_days?: number
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
          display_mode: string
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
          display_mode?: string
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
          display_mode?: string
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
      feed_channels: {
        Row: {
          allow_comments: boolean
          allow_reactions: boolean
          cover_image_url: string | null
          created_at: string
          id: string
          is_archived: boolean
          name: string
          program_slug: string | null
          round_id: string | null
          slug: string
          sort_order: number
          type: string
        }
        Insert: {
          allow_comments?: boolean
          allow_reactions?: boolean
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          name: string
          program_slug?: string | null
          round_id?: string | null
          slug: string
          sort_order?: number
          type?: string
        }
        Update: {
          allow_comments?: boolean
          allow_reactions?: boolean
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          name?: string
          program_slug?: string | null
          round_id?: string | null
          slug?: string
          sort_order?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_channels_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "program_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_hidden: boolean
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_post_reads: {
        Row: {
          id: string
          post_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          post_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          post_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_post_reads_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_post_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          action_data: Json | null
          action_type: string | null
          audio_duration: number | null
          audio_url: string | null
          author_id: string | null
          channel_id: string
          content: string
          created_at: string
          display_name: string | null
          id: string
          image_url: string | null
          is_pinned: boolean
          is_system: boolean
          post_type: string
          send_push: boolean
          title: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          action_data?: Json | null
          action_type?: string | null
          audio_duration?: number | null
          audio_url?: string | null
          author_id?: string | null
          channel_id: string
          content: string
          created_at?: string
          display_name?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          is_system?: boolean
          post_type?: string
          send_push?: boolean
          title?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          action_data?: Json | null
          action_type?: string | null
          audio_duration?: number | null
          audio_url?: string | null
          author_id?: string | null
          channel_id?: string
          content?: string
          created_at?: string
          display_name?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          is_system?: boolean
          post_type?: string
          send_push?: boolean
          title?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "feed_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      home_banners: {
        Row: {
          background_color: string | null
          button_text: string | null
          button_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          ends_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          starts_at: string | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          background_color?: string | null
          button_text?: string | null
          button_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          starts_at?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          background_color?: string | null
          button_text?: string | null
          button_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          starts_at?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          id: string
          mood: string | null
          shared_at: string | null
          shared_with_admin: boolean | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          mood?: string | null
          shared_at?: string | null
          shared_with_admin?: boolean | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          mood?: string | null
          shared_at?: string | null
          shared_with_admin?: boolean | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_reminder_settings: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          last_reminded_at: string | null
          reminder_time: string
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_reminded_at?: string | null
          reminder_time?: string
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_reminded_at?: string | null
          reminder_time?: string
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      module_progress: {
        Row: {
          created_at: string | null
          id: string
          supplement_id: string
          user_id: string
          viewed: boolean | null
          viewed_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          supplement_id: string
          user_id: string
          viewed?: boolean | null
          viewed_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          supplement_id?: string
          user_id?: string
          viewed?: boolean | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_progress_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "playlist_supplements"
            referencedColumns: ["id"]
          },
        ]
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
          audio_id: string | null
          created_at: string
          description: string | null
          drip_delay_days: number
          id: string
          playlist_id: string
          sort_order: number
          title: string
          type: string
          updated_at: string
          url: string
        }
        Insert: {
          audio_id?: string | null
          created_at?: string
          description?: string | null
          drip_delay_days?: number
          id?: string
          playlist_id: string
          sort_order?: number
          title: string
          type: string
          updated_at?: string
          url: string
        }
        Update: {
          audio_id?: string | null
          created_at?: string
          description?: string | null
          drip_delay_days?: number
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
            foreignKeyName: "playlist_supplements_audio_id_fkey"
            columns: ["audio_id"]
            isOneToOne: false
            referencedRelation: "audio_content"
            referencedColumns: ["id"]
          },
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
          country: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          state?: string | null
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
          cover_image_url: string | null
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
          stripe_price_id: string | null
          stripe_product_id: string | null
          subscription_duration: string | null
          subscription_full_payment_discount: number | null
          subscription_full_payment_price: number | null
          subscription_interval: string | null
          subscription_interval_count: number | null
          title: string
          type: string
          updated_at: string | null
          video_url: string | null
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
          cover_image_url?: string | null
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
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          subscription_duration?: string | null
          subscription_full_payment_discount?: number | null
          subscription_full_payment_price?: number | null
          subscription_interval?: string | null
          subscription_interval_count?: number | null
          title: string
          type: string
          updated_at?: string | null
          video_url?: string | null
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
          cover_image_url?: string | null
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
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          subscription_duration?: string | null
          subscription_full_payment_discount?: number | null
          subscription_full_payment_price?: number | null
          subscription_interval?: string | null
          subscription_interval_count?: number | null
          title?: string
          type?: string
          updated_at?: string | null
          video_url?: string | null
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
          drip_offset_days: number
          end_date: string | null
          first_session_date: string | null
          first_session_duration: number | null
          google_drive_link: string | null
          google_meet_link: string | null
          id: string
          important_message: string | null
          mailchimp_tags: Json | null
          max_students: number | null
          program_slug: string
          round_name: string
          round_number: number
          start_date: string
          status: string
          support_link_label: string | null
          support_link_url: string | null
          updated_at: string
          video_url: string | null
          whatsapp_support_number: string | null
        }
        Insert: {
          audio_playlist_id?: string | null
          created_at?: string
          drip_offset_days?: number
          end_date?: string | null
          first_session_date?: string | null
          first_session_duration?: number | null
          google_drive_link?: string | null
          google_meet_link?: string | null
          id?: string
          important_message?: string | null
          mailchimp_tags?: Json | null
          max_students?: number | null
          program_slug: string
          round_name: string
          round_number: number
          start_date: string
          status?: string
          support_link_label?: string | null
          support_link_url?: string | null
          updated_at?: string
          video_url?: string | null
          whatsapp_support_number?: string | null
        }
        Update: {
          audio_playlist_id?: string | null
          created_at?: string
          drip_offset_days?: number
          end_date?: string | null
          first_session_date?: string | null
          first_session_duration?: number | null
          google_drive_link?: string | null
          google_meet_link?: string | null
          id?: string
          important_message?: string | null
          mailchimp_tags?: Json | null
          max_students?: number | null
          program_slug?: string
          round_name?: string
          round_number?: number
          start_date?: string
          status?: string
          support_link_label?: string | null
          support_link_url?: string | null
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
      program_sessions: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          meeting_link: string | null
          round_id: string
          session_date: string
          session_number: number
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_link?: string | null
          round_id: string
          session_date: string
          session_number: number
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_link?: string | null
          round_id?: string
          session_date?: string
          session_number?: number
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_sessions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "program_rounds"
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
      subtask_completions: {
        Row: {
          completed_at: string
          completed_date: string
          id: string
          subtask_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          completed_date: string
          id?: string
          subtask_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          completed_date?: string
          id?: string
          subtask_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtask_completions_subtask_id_fkey"
            columns: ["subtask_id"]
            isOneToOne: false
            referencedRelation: "user_subtasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_completions: {
        Row: {
          completed_at: string
          completed_date: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          completed_date: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          completed_date?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "user_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          category: string
          color: string
          created_at: string
          description: string | null
          display_order: number
          emoji: string
          id: string
          is_active: boolean
          repeat_pattern: string
          suggested_time: string | null
          title: string
        }
        Insert: {
          category: string
          color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          emoji?: string
          id?: string
          is_active?: boolean
          repeat_pattern?: string
          suggested_time?: string | null
          title: string
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          emoji?: string
          id?: string
          is_active?: boolean
          repeat_pattern?: string
          suggested_time?: string | null
          title?: string
        }
        Relationships: []
      }
      user_admin_permissions: {
        Row: {
          created_at: string | null
          id: string
          page_slug: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          page_slug: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          page_slug?: string
          user_id?: string
        }
        Relationships: []
      }
      user_celebrated_rounds: {
        Row: {
          celebrated_at: string
          id: string
          round_id: string
          user_id: string
        }
        Insert: {
          celebrated_at?: string
          id?: string
          round_id: string
          user_id: string
        }
        Update: {
          celebrated_at?: string
          id?: string
          round_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_celebrated_rounds_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "program_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      user_content_views: {
        Row: {
          content_id: string
          content_type: string
          content_updated_at: string | null
          created_at: string
          id: string
          last_viewed_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          content_updated_at?: string | null
          created_at?: string
          id?: string
          last_viewed_at?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          content_updated_at?: string | null
          created_at?: string
          id?: string
          last_viewed_at?: string
          user_id?: string
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
      user_streaks: {
        Row: {
          current_streak: number
          id: string
          last_completion_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_completion_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_completion_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subtasks: {
        Row: {
          created_at: string
          id: string
          order_index: number
          task_id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number
          task_id: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "user_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          color: string
          created_at: string
          emoji: string
          id: string
          is_active: boolean
          order_index: number
          reminder_enabled: boolean
          reminder_offset: number
          repeat_days: number[] | null
          repeat_pattern: string
          scheduled_date: string | null
          scheduled_time: string | null
          tag: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          emoji?: string
          id?: string
          is_active?: boolean
          order_index?: number
          reminder_enabled?: boolean
          reminder_offset?: number
          repeat_days?: number[] | null
          repeat_pattern?: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          tag?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          emoji?: string
          id?: string
          is_active?: boolean
          order_index?: number
          reminder_enabled?: boolean
          reminder_offset?: number
          repeat_days?: number[] | null
          repeat_pattern?: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          tag?: string | null
          title?: string
          updated_at?: string
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
      can_access_admin_page: {
        Args: { _page_slug: string; _user_id: string }
        Returns: boolean
      }
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
