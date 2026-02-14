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
      admin_task_bank: {
        Row: {
          category: string
          color: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          emoji: string
          goal_enabled: boolean
          goal_target: number | null
          goal_type: string | null
          goal_unit: string | null
          id: string
          is_active: boolean
          is_popular: boolean
          linked_playlist_id: string | null
          pro_link_type: string | null
          pro_link_value: string | null
          reminder_enabled: boolean
          repeat_days: number[] | null
          repeat_interval: number | null
          repeat_pattern: string
          sort_order: number
          tag: string | null
          time_period: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          emoji?: string
          goal_enabled?: boolean
          goal_target?: number | null
          goal_type?: string | null
          goal_unit?: string | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          linked_playlist_id?: string | null
          pro_link_type?: string | null
          pro_link_value?: string | null
          reminder_enabled?: boolean
          repeat_days?: number[] | null
          repeat_interval?: number | null
          repeat_pattern?: string
          sort_order?: number
          tag?: string | null
          time_period?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          emoji?: string
          goal_enabled?: boolean
          goal_target?: number | null
          goal_type?: string | null
          goal_unit?: string | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          linked_playlist_id?: string | null
          pro_link_type?: string | null
          pro_link_value?: string | null
          reminder_enabled?: boolean
          repeat_days?: number[] | null
          repeat_interval?: number | null
          repeat_pattern?: string
          sort_order?: number
          tag?: string | null
          time_period?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_task_bank_subtasks: {
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
            foreignKeyName: "admin_task_bank_subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "admin_task_bank"
            referencedColumns: ["id"]
          },
        ]
      }
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
          last_seen_at: string | null
          last_seen_version: string | null
          platform: string
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          device_id: string
          id?: string
          installed_at?: string
          last_seen_at?: string | null
          last_seen_version?: string | null
          platform?: string
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          created_at?: string
          device_id?: string
          id?: string
          installed_at?: string
          last_seen_at?: string | null
          last_seen_version?: string | null
          platform?: string
          user_id?: string | null
        }
        Relationships: []
      }
      app_return_events: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
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
      app_update_logs: {
        Row: {
          checked_at: string
          device_version: string
          id: string
          latest_version: string
          platform: string
          update_available: boolean
          user_id: string | null
        }
        Insert: {
          checked_at?: string
          device_version: string
          id?: string
          latest_version: string
          platform?: string
          update_available?: boolean
          user_id?: string | null
        }
        Update: {
          checked_at?: string
          device_version?: string
          id?: string
          latest_version?: string
          platform?: string
          update_available?: boolean
          user_id?: string | null
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
          available_on_mobile: boolean
          category: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          display_mode: string
          id: string
          is_free: boolean
          is_hidden: boolean
          language: string
          name: string
          program_slug: string | null
          requires_subscription: boolean
          sort_order: number
        }
        Insert: {
          available_on_mobile?: boolean
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          display_mode?: string
          id?: string
          is_free?: boolean
          is_hidden?: boolean
          language?: string
          name: string
          program_slug?: string | null
          requires_subscription?: boolean
          sort_order?: number
        }
        Update: {
          available_on_mobile?: boolean
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          display_mode?: string
          id?: string
          is_free?: boolean
          is_hidden?: boolean
          language?: string
          name?: string
          program_slug?: string | null
          requires_subscription?: boolean
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
      breathing_exercises: {
        Row: {
          category: string
          created_at: string
          description: string | null
          emoji: string | null
          exhale_hold_seconds: number
          exhale_method: string
          exhale_seconds: number
          id: string
          inhale_hold_seconds: number
          inhale_method: string
          inhale_seconds: number
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          emoji?: string | null
          exhale_hold_seconds?: number
          exhale_method?: string
          exhale_seconds?: number
          id?: string
          inhale_hold_seconds?: number
          inhale_method?: string
          inhale_seconds?: number
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          emoji?: string | null
          exhale_hold_seconds?: number
          exhale_method?: string
          exhale_seconds?: number
          id?: string
          inhale_hold_seconds?: number
          inhale_method?: string
          inhale_seconds?: number
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      breathing_sessions: {
        Row: {
          completed_at: string
          duration_seconds: number
          exercise_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          duration_seconds: number
          exercise_id: string
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          duration_seconds?: number
          exercise_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "breathing_sessions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "breathing_exercises"
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
          inbox_type: string
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
          inbox_type?: string
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
          inbox_type?: string
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
      emotion_logs: {
        Row: {
          category: string
          contexts: string[] | null
          created_at: string | null
          emotion: string
          id: string
          notes: string | null
          user_id: string
          valence: string
        }
        Insert: {
          category: string
          contexts?: string[] | null
          created_at?: string | null
          emotion: string
          id?: string
          notes?: string | null
          user_id: string
          valence: string
        }
        Update: {
          category?: string
          contexts?: string[] | null
          created_at?: string | null
          emotion?: string
          id?: string
          notes?: string | null
          user_id?: string
          valence?: string
        }
        Relationships: []
      }
      fasting_preferences: {
        Row: {
          default_fasting_hours: number
          default_protocol: string
          id: string
          reminder_enabled: boolean
          reminder_zone: string | null
          show_on_home: boolean
          updated_at: string
          user_id: string
          weight_goal: number | null
          weight_unit: string
        }
        Insert: {
          default_fasting_hours?: number
          default_protocol?: string
          id?: string
          reminder_enabled?: boolean
          reminder_zone?: string | null
          show_on_home?: boolean
          updated_at?: string
          user_id: string
          weight_goal?: number | null
          weight_unit?: string
        }
        Update: {
          default_fasting_hours?: number
          default_protocol?: string
          id?: string
          reminder_enabled?: boolean
          reminder_zone?: string | null
          show_on_home?: boolean
          updated_at?: string
          user_id?: string
          weight_goal?: number | null
          weight_unit?: string
        }
        Relationships: []
      }
      fasting_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          fasting_hours: number
          id: string
          protocol: string
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          fasting_hours?: number
          id?: string
          protocol?: string
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          fasting_hours?: number
          id?: string
          protocol?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
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
          reply_to_post_id: string | null
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
          reply_to_post_id?: string | null
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
          reply_to_post_id?: string | null
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
          {
            foreignKeyName: "feed_posts_reply_to_post_id_fkey"
            columns: ["reply_to_post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
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
          target_below_version: string | null
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
          target_below_version?: string | null
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
          target_below_version?: string | null
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
      local_notification_events: {
        Row: {
          created_at: string
          event: string
          id: string
          metadata: Json | null
          notification_id: number | null
          notification_type: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          metadata?: Json | null
          notification_id?: number | null
          notification_type: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          metadata?: Json | null
          notification_id?: number | null
          notification_type?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "local_notification_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      period_logs: {
        Row: {
          created_at: string
          date: string
          flow_intensity: string | null
          id: string
          is_period_day: boolean
          notes: string | null
          symptoms: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          flow_intensity?: string | null
          id?: string
          is_period_day?: boolean
          notes?: string | null
          symptoms?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          flow_intensity?: string | null
          id?: string
          is_period_day?: boolean
          notes?: string | null
          symptoms?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      period_settings: {
        Row: {
          average_cycle: number
          average_period: number
          created_at: string
          id: string
          last_period_start: string | null
          onboarding_done: boolean
          reminder_days: number
          reminder_enabled: boolean
          show_on_home: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          average_cycle?: number
          average_period?: number
          created_at?: string
          id?: string
          last_period_start?: string | null
          onboarding_done?: boolean
          reminder_days?: number
          reminder_enabled?: boolean
          show_on_home?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          average_cycle?: number
          average_period?: number
          created_at?: string
          id?: string
          last_period_start?: string | null
          onboarding_done?: boolean
          reminder_days?: number
          reminder_enabled?: boolean
          show_on_home?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      planner_program_completions: {
        Row: {
          completed_date: string
          created_at: string
          event_id: string
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          completed_date: string
          created_at?: string
          event_id: string
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          completed_date?: string
          created_at?: string
          event_id?: string
          event_type?: string
          id?: string
          user_id?: string
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
      pn_config: {
        Row: {
          body: string
          category: string
          created_at: string
          emoji: string | null
          id: string
          is_enabled: boolean
          is_urgent: boolean | null
          notification_key: string
          repeat_days: number[] | null
          schedule_hour: number
          schedule_minute: number
          sort_order: number | null
          sound: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          emoji?: string | null
          id?: string
          is_enabled?: boolean
          is_urgent?: boolean | null
          notification_key: string
          repeat_days?: number[] | null
          schedule_hour: number
          schedule_minute?: number
          sort_order?: number | null
          sound?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          emoji?: string | null
          id?: string
          is_enabled?: boolean
          is_urgent?: boolean | null
          notification_key?: string
          repeat_days?: number[] | null
          schedule_hour?: number
          schedule_minute?: number
          sort_order?: number | null
          sound?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      pn_schedule_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          failed_count: number | null
          function_name: string
          id: string
          notification_type: string | null
          schedule_id: string | null
          scheduled_for: string | null
          sent_at: string | null
          sent_count: number | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          failed_count?: number | null
          function_name: string
          id?: string
          notification_type?: string | null
          schedule_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          failed_count?: number | null
          function_name?: string
          id?: string
          notification_type?: string | null
          schedule_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pn_schedule_logs_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "push_notification_schedules"
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
          last_active_date: string | null
          phone: string | null
          return_count: number | null
          state: string | null
          this_month_active_days: number | null
          timezone: string | null
          total_active_days: number | null
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
          last_active_date?: string | null
          phone?: string | null
          return_count?: number | null
          state?: string | null
          this_month_active_days?: number | null
          timezone?: string | null
          total_active_days?: number | null
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
          last_active_date?: string | null
          phone?: string | null
          return_count?: number | null
          state?: string | null
          this_month_active_days?: number | null
          timezone?: string | null
          total_active_days?: number | null
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
          annual_android_product_id: string | null
          annual_ios_product_id: string | null
          annual_price_amount: number | null
          annual_stripe_price_id: string | null
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
          language: string
          mailchimp_program_name: string | null
          mailchimp_tags: Json | null
          original_price: number | null
          payment_type: string
          price_amount: number
          requires_subscription: boolean
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
          trial_days: number | null
          type: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          android_product_id?: string | null
          annual_android_product_id?: string | null
          annual_ios_product_id?: string | null
          annual_price_amount?: number | null
          annual_stripe_price_id?: string | null
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
          language?: string
          mailchimp_program_name?: string | null
          mailchimp_tags?: Json | null
          original_price?: number | null
          payment_type: string
          price_amount?: number
          requires_subscription?: boolean
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
          trial_days?: number | null
          type: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          android_product_id?: string | null
          annual_android_product_id?: string | null
          annual_ios_product_id?: string | null
          annual_price_amount?: number | null
          annual_stripe_price_id?: string | null
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
          language?: string
          mailchimp_program_name?: string | null
          mailchimp_tags?: Json | null
          original_price?: number | null
          payment_type?: string
          price_amount?: number
          requires_subscription?: boolean
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
          trial_days?: number | null
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
          first_session_is_google_meet: boolean | null
          google_drive_link: string | null
          google_meet_link: string | null
          id: string
          important_message: string | null
          is_self_paced: boolean
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
          first_session_is_google_meet?: boolean | null
          google_drive_link?: string | null
          google_meet_link?: string | null
          id?: string
          important_message?: string | null
          is_self_paced?: boolean
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
          first_session_is_google_meet?: boolean | null
          google_drive_link?: string | null
          google_meet_link?: string | null
          id?: string
          important_message?: string | null
          is_self_paced?: boolean
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
      promo_banners: {
        Row: {
          aspect_ratio: string
          cover_image_url: string
          created_at: string
          custom_url: string | null
          destination_id: string | null
          destination_type: string
          display_frequency: string
          display_location: string
          ends_at: string | null
          exclude_playlists: string[] | null
          exclude_programs: string[] | null
          exclude_tools: string[] | null
          id: string
          include_playlists: string[] | null
          include_programs: string[] | null
          include_tools: string[] | null
          is_active: boolean
          priority: number
          starts_at: string | null
          target_playlist_ids: string[] | null
          target_type: string
          updated_at: string
        }
        Insert: {
          aspect_ratio?: string
          cover_image_url: string
          created_at?: string
          custom_url?: string | null
          destination_id?: string | null
          destination_type: string
          display_frequency?: string
          display_location?: string
          ends_at?: string | null
          exclude_playlists?: string[] | null
          exclude_programs?: string[] | null
          exclude_tools?: string[] | null
          id?: string
          include_playlists?: string[] | null
          include_programs?: string[] | null
          include_tools?: string[] | null
          is_active?: boolean
          priority?: number
          starts_at?: string | null
          target_playlist_ids?: string[] | null
          target_type?: string
          updated_at?: string
        }
        Update: {
          aspect_ratio?: string
          cover_image_url?: string
          created_at?: string
          custom_url?: string | null
          destination_id?: string | null
          destination_type?: string
          display_frequency?: string
          display_location?: string
          ends_at?: string | null
          exclude_playlists?: string[] | null
          exclude_programs?: string[] | null
          exclude_tools?: string[] | null
          id?: string
          include_playlists?: string[] | null
          include_programs?: string[] | null
          include_tools?: string[] | null
          is_active?: boolean
          priority?: number
          starts_at?: string | null
          target_playlist_ids?: string[] | null
          target_type?: string
          updated_at?: string
        }
        Relationships: []
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
      push_notification_schedules: {
        Row: {
          created_at: string | null
          description: string | null
          function_name: string
          id: string
          is_active: boolean | null
          last_run_at: string | null
          last_run_count: number | null
          last_run_status: string | null
          name: string
          schedule: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          function_name: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          last_run_count?: number | null
          last_run_status?: string | null
          name: string
          schedule: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          function_name?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          last_run_count?: number | null
          last_run_status?: string | null
          name?: string
          schedule?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          app_version: string | null
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh_key: string
          user_id: string
        }
        Insert: {
          app_version?: string | null
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh_key: string
          user_id: string
        }
        Update: {
          app_version?: string | null
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh_key?: string
          user_id?: string
        }
        Relationships: []
      }
      routine_categories: {
        Row: {
          color: string
          created_at: string
          display_order: number
          icon: string
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          color?: string
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          color?: string
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      routine_plan_ratings: {
        Row: {
          created_at: string
          id: string
          plan_id: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_id: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_plan_ratings_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "routine_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_plan_sections: {
        Row: {
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          plan_id: string
          section_order: number
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          plan_id: string
          section_order?: number
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          plan_id?: string
          section_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_plan_sections_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "routine_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_plan_tasks: {
        Row: {
          created_at: string
          drip_day: number | null
          duration_minutes: number
          icon: string
          id: string
          is_active: boolean
          linked_playlist_id: string | null
          plan_id: string
          pro_link_type: string | null
          pro_link_value: string | null
          schedule_days: number[] | null
          source_task_id: string | null
          task_order: number
          title: string
        }
        Insert: {
          created_at?: string
          drip_day?: number | null
          duration_minutes?: number
          icon?: string
          id?: string
          is_active?: boolean
          linked_playlist_id?: string | null
          plan_id: string
          pro_link_type?: string | null
          pro_link_value?: string | null
          schedule_days?: number[] | null
          source_task_id?: string | null
          task_order?: number
          title: string
        }
        Update: {
          created_at?: string
          drip_day?: number | null
          duration_minutes?: number
          icon?: string
          id?: string
          is_active?: boolean
          linked_playlist_id?: string | null
          plan_id?: string
          pro_link_type?: string | null
          pro_link_value?: string | null
          schedule_days?: number[] | null
          source_task_id?: string | null
          task_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_plan_tasks_linked_playlist_id_fkey"
            columns: ["linked_playlist_id"]
            isOneToOne: false
            referencedRelation: "audio_playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_plan_tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "routine_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_plan_tasks_source_task_id_fkey"
            columns: ["source_task_id"]
            isOneToOne: false
            referencedRelation: "admin_task_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_plans: {
        Row: {
          category_id: string | null
          color: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          display_order: number
          end_after_days: number | null
          end_date: string | null
          end_mode: string
          estimated_minutes: number
          icon: string
          id: string
          is_active: boolean
          is_featured: boolean
          is_popular: boolean
          is_pro_routine: boolean
          linked_round_id: string | null
          points: number
          schedule_type: string
          subtitle: string | null
          title: string
        }
        Insert: {
          category_id?: string | null
          color?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          end_after_days?: number | null
          end_date?: string | null
          end_mode?: string
          estimated_minutes?: number
          icon?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_popular?: boolean
          is_pro_routine?: boolean
          linked_round_id?: string | null
          points?: number
          schedule_type?: string
          subtitle?: string | null
          title: string
        }
        Update: {
          category_id?: string | null
          color?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          end_after_days?: number | null
          end_date?: string | null
          end_mode?: string
          estimated_minutes?: number
          icon?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_popular?: boolean
          is_pro_routine?: boolean
          linked_round_id?: string | null
          points?: number
          schedule_type?: string
          subtitle?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_plans_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "routine_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_plans_linked_round_id_fkey"
            columns: ["linked_round_id"]
            isOneToOne: false
            referencedRelation: "program_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_task_templates: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_order: number
          duration_minutes: number
          icon: string
          id: string
          is_active: boolean
          is_popular: boolean
          linked_playlist_id: string | null
          pro_link_type: string
          pro_link_value: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          duration_minutes?: number
          icon?: string
          id?: string
          is_active?: boolean
          is_popular?: boolean
          linked_playlist_id?: string | null
          pro_link_type: string
          pro_link_value?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          duration_minutes?: number
          icon?: string
          id?: string
          is_active?: boolean
          is_popular?: boolean
          linked_playlist_id?: string | null
          pro_link_type?: string
          pro_link_value?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_task_templates_linked_playlist_id_fkey"
            columns: ["linked_playlist_id"]
            isOneToOne: false
            referencedRelation: "audio_playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      routines_bank: {
        Row: {
          category: string
          challenge_start_date: string | null
          color: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          emoji: string | null
          end_after_days: number | null
          end_date: string | null
          end_mode: string
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          is_welcome_popup: boolean
          requires_subscription: boolean
          schedule_type: string
          sort_order: number | null
          start_day_of_week: number | null
          subtitle: string | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          category?: string
          challenge_start_date?: string | null
          color?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          end_after_days?: number | null
          end_date?: string | null
          end_mode?: string
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          is_welcome_popup?: boolean
          requires_subscription?: boolean
          schedule_type?: string
          sort_order?: number | null
          start_day_of_week?: number | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          category?: string
          challenge_start_date?: string | null
          color?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          end_after_days?: number | null
          end_date?: string | null
          end_mode?: string
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          is_welcome_popup?: boolean
          requires_subscription?: boolean
          schedule_type?: string
          sort_order?: number | null
          start_day_of_week?: number | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      routines_bank_sections: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          routine_id: string
          section_order: number | null
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          routine_id: string
          section_order?: number | null
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          routine_id?: string
          section_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "routines_bank_sections_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      routines_bank_tasks: {
        Row: {
          created_at: string | null
          drip_day: number | null
          duration_minutes: number | null
          emoji: string | null
          id: string
          routine_id: string
          schedule_days: number[] | null
          section_id: string | null
          section_title: string | null
          task_id: string | null
          task_order: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          drip_day?: number | null
          duration_minutes?: number | null
          emoji?: string | null
          id?: string
          routine_id: string
          schedule_days?: number[] | null
          section_id?: string | null
          section_title?: string | null
          task_id?: string | null
          task_order?: number | null
          title: string
        }
        Update: {
          created_at?: string | null
          drip_day?: number | null
          duration_minutes?: number | null
          emoji?: string | null
          id?: string
          routine_id?: string
          schedule_days?: number[] | null
          section_id?: string | null
          section_title?: string | null
          task_id?: string | null
          task_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "routines_bank_tasks_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines_bank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routines_bank_tasks_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "routines_bank_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routines_bank_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "admin_task_bank"
            referencedColumns: ["id"]
          },
        ]
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
      subscription_products: {
        Row: {
          created_at: string
          id: string
          interval: string
          ios_product_id: string | null
          is_active: boolean
          name: string
          price_amount: number
          stripe_price_id: string | null
          trial_days: number
        }
        Insert: {
          created_at?: string
          id?: string
          interval?: string
          ios_product_id?: string | null
          is_active?: boolean
          name: string
          price_amount?: number
          stripe_price_id?: string | null
          trial_days?: number
        }
        Update: {
          created_at?: string
          id?: string
          interval?: string
          ios_product_id?: string | null
          is_active?: boolean
          name?: string
          price_amount?: number
          stripe_price_id?: string | null
          trial_days?: number
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
          goal_progress: number | null
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          completed_date: string
          goal_progress?: number | null
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          completed_date?: string
          goal_progress?: number | null
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
      task_reminder_logs: {
        Row: {
          id: string
          reminder_date: string
          sent_at: string
          task_id: string
          user_id: string
        }
        Insert: {
          id?: string
          reminder_date: string
          sent_at?: string
          task_id: string
          user_id: string
        }
        Update: {
          id?: string
          reminder_date?: string
          sent_at?: string
          task_id?: string
          user_id?: string
        }
        Relationships: []
      }
      task_skips: {
        Row: {
          created_at: string
          id: string
          skipped_date: string
          snoozed_to_date: string | null
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          skipped_date: string
          snoozed_to_date?: string | null
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          skipped_date?: string
          snoozed_to_date?: string | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_skips_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "user_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_access_config: {
        Row: {
          created_at: string
          free_usage_limit: number | null
          id: string
          requires_subscription: boolean
          tool_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          free_usage_limit?: number | null
          id?: string
          requires_subscription?: boolean
          tool_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          free_usage_limit?: number | null
          id?: string
          requires_subscription?: boolean
          tool_id?: string
          updated_at?: string
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
      user_coach_access: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
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
      user_notification_preferences: {
        Row: {
          action_reminders: boolean
          announcements: boolean
          content_drip: boolean
          created_at: string
          daily_completion: boolean
          evening_checkin: boolean
          feed_posts: boolean
          goal_milestones: boolean
          goal_nudges: boolean
          id: string
          momentum_celebration: boolean
          morning_summary: boolean
          session_reminders: boolean
          sleep_time: string | null
          time_period_reminders: boolean
          updated_at: string
          user_id: string
          wake_time: string | null
          weekly_summary: boolean
        }
        Insert: {
          action_reminders?: boolean
          announcements?: boolean
          content_drip?: boolean
          created_at?: string
          daily_completion?: boolean
          evening_checkin?: boolean
          feed_posts?: boolean
          goal_milestones?: boolean
          goal_nudges?: boolean
          id?: string
          momentum_celebration?: boolean
          morning_summary?: boolean
          session_reminders?: boolean
          sleep_time?: string | null
          time_period_reminders?: boolean
          updated_at?: string
          user_id: string
          wake_time?: string | null
          weekly_summary?: boolean
        }
        Update: {
          action_reminders?: boolean
          announcements?: boolean
          content_drip?: boolean
          created_at?: string
          daily_completion?: boolean
          evening_checkin?: boolean
          feed_posts?: boolean
          goal_milestones?: boolean
          goal_nudges?: boolean
          id?: string
          momentum_celebration?: boolean
          morning_summary?: boolean
          session_reminders?: boolean
          sleep_time?: string | null
          time_period_reminders?: boolean
          updated_at?: string
          user_id?: string
          wake_time?: string | null
          weekly_summary?: boolean
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
      user_routine_plans: {
        Row: {
          added_at: string
          id: string
          is_active: boolean
          plan_id: string
          started_at: string | null
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          is_active?: boolean
          plan_id: string
          started_at?: string | null
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          is_active?: boolean
          plan_id?: string
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_routine_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "routine_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_routines_bank: {
        Row: {
          added_at: string
          id: string
          is_active: boolean
          routine_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          is_active?: boolean
          routine_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          is_active?: boolean
          routine_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_routines_bank_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          current_gold_streak: number | null
          current_streak: number
          id: string
          last_completion_date: string | null
          last_gold_date: string | null
          longest_gold_streak: number | null
          longest_streak: number
          streak_goal: number | null
          streak_goal_completed_at: string | null
          streak_goal_set_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          current_gold_streak?: number | null
          current_streak?: number
          id?: string
          last_completion_date?: string | null
          last_gold_date?: string | null
          longest_gold_streak?: number | null
          longest_streak?: number
          streak_goal?: number | null
          streak_goal_completed_at?: string | null
          streak_goal_set_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          current_gold_streak?: number | null
          current_streak?: number
          id?: string
          last_completion_date?: string | null
          last_gold_date?: string | null
          longest_gold_streak?: number | null
          longest_streak?: number
          streak_goal?: number | null
          streak_goal_completed_at?: string | null
          streak_goal_set_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          platform: string
          product_id: string | null
          program_slug: string | null
          revenuecat_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          platform?: string
          product_id?: string | null
          program_slug?: string | null
          revenuecat_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          platform?: string
          product_id?: string | null
          program_slug?: string | null
          revenuecat_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "subscription_products"
            referencedColumns: ["id"]
          },
        ]
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
          description: string | null
          emoji: string
          goal_enabled: boolean
          goal_target: number | null
          goal_type: string | null
          goal_unit: string | null
          id: string
          is_active: boolean
          is_urgent: boolean
          linked_playlist_id: string | null
          order_index: number
          pro_link_type: string | null
          pro_link_value: string | null
          reminder_enabled: boolean
          reminder_offset: number
          repeat_days: number[] | null
          repeat_end_date: string | null
          repeat_interval: number | null
          repeat_pattern: string
          scheduled_date: string | null
          scheduled_time: string | null
          tag: string | null
          time_period: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          emoji?: string
          goal_enabled?: boolean
          goal_target?: number | null
          goal_type?: string | null
          goal_unit?: string | null
          id?: string
          is_active?: boolean
          is_urgent?: boolean
          linked_playlist_id?: string | null
          order_index?: number
          pro_link_type?: string | null
          pro_link_value?: string | null
          reminder_enabled?: boolean
          reminder_offset?: number
          repeat_days?: number[] | null
          repeat_end_date?: string | null
          repeat_interval?: number | null
          repeat_pattern?: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          tag?: string | null
          time_period?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          emoji?: string
          goal_enabled?: boolean
          goal_target?: number | null
          goal_type?: string | null
          goal_unit?: string | null
          id?: string
          is_active?: boolean
          is_urgent?: boolean
          linked_playlist_id?: string | null
          order_index?: number
          pro_link_type?: string | null
          pro_link_value?: string | null
          reminder_enabled?: boolean
          reminder_offset?: number
          repeat_days?: number[] | null
          repeat_end_date?: string | null
          repeat_interval?: number | null
          repeat_pattern?: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          tag?: string | null
          time_period?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_linked_playlist_id_fkey"
            columns: ["linked_playlist_id"]
            isOneToOne: false
            referencedRelation: "audio_playlists"
            referencedColumns: ["id"]
          },
        ]
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
      weight_logs: {
        Row: {
          created_at: string
          id: string
          logged_at: string
          user_id: string
          weight_unit: string
          weight_value: number
        }
        Insert: {
          created_at?: string
          id?: string
          logged_at?: string
          user_id: string
          weight_unit?: string
          weight_value: number
        }
        Update: {
          created_at?: string
          id?: string
          logged_at?: string
          user_id?: string
          weight_unit?: string
          weight_value?: number
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
      get_home_data: {
        Args: { p_date_str: string; p_user_id: string }
        Returns: Json
      }
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
      subscription_status: "active" | "expired" | "trial" | "cancelled"
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
      subscription_status: ["active", "expired", "trial", "cancelled"],
    },
  },
} as const
