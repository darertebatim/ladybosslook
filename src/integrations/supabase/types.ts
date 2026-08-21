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
      account_email_aliases: {
        Row: {
          created_at: string
          email: string
          id: string
          merged_by: string | null
          merged_from_user_id: string | null
          primary_user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          merged_by?: string | null
          merged_from_user_id?: string | null
          primary_user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          merged_by?: string | null
          merged_from_user_id?: string | null
          primary_user_id?: string
        }
        Relationships: []
      }
      admin_ai_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_documents: {
        Row: {
          created_at: string | null
          description: string | null
          extracted_text: string | null
          file_name: string
          file_size_bytes: number | null
          file_url: string
          folder_id: string | null
          id: string
          mime_type: string | null
          title: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          extracted_text?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_url: string
          folder_id?: string | null
          id?: string
          mime_type?: string | null
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          extracted_text?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_url?: string
          folder_id?: string | null
          id?: string
          mime_type?: string | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_quiz_questions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          options: Json
          question_text: string
          quiz_id: string
          sort_order: number
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          options?: Json
          question_text: string
          quiz_id: string
          sort_order?: number
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          options?: Json
          question_text?: string
          quiz_id?: string
          sort_order?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "admin_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_quiz_results: {
        Row: {
          characteristics: Json | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          quiz_id: string
          result_key: string
          score_max: number
          score_min: number
          strengths: Json | null
          subtitle: string | null
          suggestions: Json | null
          title: string
          weaknesses: Json | null
        }
        Insert: {
          characteristics?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          quiz_id: string
          result_key: string
          score_max?: number
          score_min?: number
          strengths?: Json | null
          subtitle?: string | null
          suggestions?: Json | null
          title: string
          weaknesses?: Json | null
        }
        Update: {
          characteristics?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          quiz_id?: string
          result_key?: string
          score_max?: number
          score_min?: number
          strengths?: Json | null
          subtitle?: string | null
          suggestions?: Json | null
          title?: string
          weaknesses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_quiz_results_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "admin_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_quizzes: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_premium: boolean
          overview: string | null
          slug: string
          sort_order: number
          theme_color: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_premium?: boolean
          overview?: string | null
          slug: string
          sort_order?: number
          theme_color?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_premium?: boolean
          overview?: string | null
          slug?: string
          sort_order?: number
          theme_color?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
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
          self_care_equivalent_id: string | null
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
          self_care_equivalent_id?: string | null
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
          self_care_equivalent_id?: string | null
          sort_order?: number
          tag?: string | null
          time_period?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_task_bank_self_care_equivalent_id_fkey"
            columns: ["self_care_equivalent_id"]
            isOneToOne: false
            referencedRelation: "admin_task_bank"
            referencedColumns: ["id"]
          },
        ]
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
      ai_coach_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_coach_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
      aperture_access_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          note: string | null
          resolved_at: string | null
          resolved_code_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          note?: string | null
          resolved_at?: string | null
          resolved_code_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          note?: string | null
          resolved_at?: string | null
          resolved_code_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aperture_access_requests_resolved_code_id_fkey"
            columns: ["resolved_code_id"]
            isOneToOne: false
            referencedRelation: "aperture_invite_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      aperture_action_runs: {
        Row: {
          action_slug: string
          chat_id: string | null
          completed_at: string | null
          current_step: number
          id: string
          started_at: string
          state: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_slug: string
          chat_id?: string | null
          completed_at?: string | null
          current_step?: number
          id?: string
          started_at?: string
          state?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_slug?: string
          chat_id?: string | null
          completed_at?: string | null
          current_step?: number
          id?: string
          started_at?: string
          state?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aperture_action_runs_action_slug_fkey"
            columns: ["action_slug"]
            isOneToOne: false
            referencedRelation: "aperture_actions"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "aperture_action_runs_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "aperture_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      aperture_actions: {
        Row: {
          blurb: string | null
          category: string
          created_at: string
          duration: string | null
          industry_group_slug: string | null
          is_published: boolean
          kind: string
          needs: string[] | null
          output: string | null
          slug: string
          steps: Json
          title: string
          updated_at: string
          why: string | null
        }
        Insert: {
          blurb?: string | null
          category: string
          created_at?: string
          duration?: string | null
          industry_group_slug?: string | null
          is_published?: boolean
          kind: string
          needs?: string[] | null
          output?: string | null
          slug: string
          steps?: Json
          title: string
          updated_at?: string
          why?: string | null
        }
        Update: {
          blurb?: string | null
          category?: string
          created_at?: string
          duration?: string | null
          industry_group_slug?: string | null
          is_published?: boolean
          kind?: string
          needs?: string[] | null
          output?: string | null
          slug?: string
          steps?: Json
          title?: string
          updated_at?: string
          why?: string | null
        }
        Relationships: []
      }
      aperture_ai_usage: {
        Row: {
          completion_tokens: number
          created_at: string
          fn: string
          id: string
          model: string
          prompt_tokens: number
          usd_cost: number
          user_id: string
        }
        Insert: {
          completion_tokens?: number
          created_at?: string
          fn: string
          id?: string
          model: string
          prompt_tokens?: number
          usd_cost?: number
          user_id: string
        }
        Update: {
          completion_tokens?: number
          created_at?: string
          fn?: string
          id?: string
          model?: string
          prompt_tokens?: number
          usd_cost?: number
          user_id?: string
        }
        Relationships: []
      }
      aperture_approved_users: {
        Row: {
          approved_at: string
          code_id: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string
          code_id?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string
          code_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aperture_approved_users_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "aperture_invite_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      aperture_bucket_briefs: {
        Row: {
          bucket_slug: string
          created_at: string
          facts_count: number
          generated_at: string
          id: string
          summary: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bucket_slug: string
          created_at?: string
          facts_count?: number
          generated_at?: string
          id?: string
          summary?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bucket_slug?: string
          created_at?: string
          facts_count?: number
          generated_at?: string
          id?: string
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      aperture_bucket_questions: {
        Row: {
          audience: string
          bucket_slug: string
          choices: Json | null
          created_at: string
          created_by: string | null
          hint: string | null
          id: string
          input_kind: string
          is_active: boolean
          layer: string | null
          prompt: string
          question_key: string
          sort_order: number
          user_id: string | null
        }
        Insert: {
          audience?: string
          bucket_slug: string
          choices?: Json | null
          created_at?: string
          created_by?: string | null
          hint?: string | null
          id?: string
          input_kind?: string
          is_active?: boolean
          layer?: string | null
          prompt: string
          question_key: string
          sort_order?: number
          user_id?: string | null
        }
        Update: {
          audience?: string
          bucket_slug?: string
          choices?: Json | null
          created_at?: string
          created_by?: string | null
          hint?: string | null
          id?: string
          input_kind?: string
          is_active?: boolean
          layer?: string | null
          prompt?: string
          question_key?: string
          sort_order?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aperture_bucket_questions_bucket_slug_fkey"
            columns: ["bucket_slug"]
            isOneToOne: false
            referencedRelation: "aperture_buckets"
            referencedColumns: ["slug"]
          },
        ]
      }
      aperture_buckets: {
        Row: {
          blurb: string | null
          brief: string | null
          created_at: string
          created_by: string | null
          display_order: number
          glyph: string | null
          industry_group_slug: string | null
          is_active: boolean
          kind: string
          metadata: Json
          slug: string
          sort_order: number
          source: string
          target_count: number
          territory: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          blurb?: string | null
          brief?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          glyph?: string | null
          industry_group_slug?: string | null
          is_active?: boolean
          kind?: string
          metadata?: Json
          slug: string
          sort_order?: number
          source?: string
          target_count?: number
          territory?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          blurb?: string | null
          brief?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          glyph?: string | null
          industry_group_slug?: string | null
          is_active?: boolean
          kind?: string
          metadata?: Json
          slug?: string
          sort_order?: number
          source?: string
          target_count?: number
          territory?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      aperture_chats: {
        Row: {
          archived: boolean
          bucket_slug: string | null
          created_at: string
          entry_point: string
          id: string
          last_message_at: string
          origin: string | null
          origin_ref: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          bucket_slug?: string | null
          created_at?: string
          entry_point?: string
          id?: string
          last_message_at?: string
          origin?: string | null
          origin_ref?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          bucket_slug?: string | null
          created_at?: string
          entry_point?: string
          id?: string
          last_message_at?: string
          origin?: string | null
          origin_ref?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      aperture_doc_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          token_count: number | null
          user_id: string
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          token_count?: number | null
          user_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          token_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aperture_doc_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "aperture_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      aperture_documents: {
        Row: {
          created_at: string
          error: string | null
          id: string
          mime_type: string | null
          size_bytes: number | null
          source: string | null
          status: string
          storage_path: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          source?: string | null
          status?: string
          storage_path?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          source?: string | null
          status?: string
          storage_path?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      aperture_events: {
        Row: {
          conversation_id: string | null
          created_at: string
          event_type: string
          id: string
          payload: Json
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          user_id?: string
        }
        Relationships: []
      }
      aperture_files: {
        Row: {
          chat_id: string | null
          created_at: string
          error_message: string | null
          extracted_fact_count: number
          extracted_text: string | null
          file_name: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          source: string
          status: string
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_id?: string | null
          created_at?: string
          error_message?: string | null
          extracted_fact_count?: number
          extracted_text?: string | null
          file_name: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          source?: string
          status?: string
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_id?: string | null
          created_at?: string
          error_message?: string | null
          extracted_fact_count?: number
          extracted_text?: string | null
          file_name?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          source?: string
          status?: string
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      aperture_generated_items: {
        Row: {
          created_at: string
          dedupe_key: string | null
          expires_at: string | null
          generator: string | null
          generator_version: string | null
          id: string
          kind: string
          payload: Json
          scheduled_for: string | null
          score: number | null
          source_bucket_slugs: string[]
          source_memory_ids: string[]
          status: string
          status_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dedupe_key?: string | null
          expires_at?: string | null
          generator?: string | null
          generator_version?: string | null
          id?: string
          kind: string
          payload?: Json
          scheduled_for?: string | null
          score?: number | null
          source_bucket_slugs?: string[]
          source_memory_ids?: string[]
          status?: string
          status_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dedupe_key?: string | null
          expires_at?: string | null
          generator?: string | null
          generator_version?: string | null
          id?: string
          kind?: string
          payload?: Json
          scheduled_for?: string | null
          score?: number | null
          source_bucket_slugs?: string[]
          source_memory_ids?: string[]
          status?: string
          status_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      aperture_industries: {
        Row: {
          created_at: string
          group_label: string
          group_slug: string | null
          id: string
          is_active: boolean
          label: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_label: string
          group_slug?: string | null
          id?: string
          is_active?: boolean
          label: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_label?: string
          group_slug?: string | null
          id?: string
          is_active?: boolean
          label?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      aperture_invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          id: string
          label: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          revoked_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          revoked_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          revoked_at?: string | null
        }
        Relationships: []
      }
      aperture_mcp_tokens: {
        Row: {
          created_at: string
          id: string
          last_used_at: string | null
          name: string
          revoked: boolean
          scopes: string[]
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          name: string
          revoked?: boolean
          scopes?: string[]
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          name?: string
          revoked?: boolean
          scopes?: string[]
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      aperture_memory_card: {
        Row: {
          answers_count: number
          created_at: string
          facts_count: number
          regenerated_at: string | null
          stale: boolean
          summary: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers_count?: number
          created_at?: string
          facts_count?: number
          regenerated_at?: string | null
          stale?: boolean
          summary?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers_count?: number
          created_at?: string
          facts_count?: number
          regenerated_at?: string | null
          stale?: boolean
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      aperture_memory_items: {
        Row: {
          bucket_half: string | null
          bucket_slug: string | null
          chat_id: string | null
          confidence: number | null
          content: string
          created_at: string
          id: string
          is_active: boolean
          layer: string | null
          locked_from_refetch: boolean
          metadata: Json
          question_key: string | null
          source: string
          source_file_id: string | null
          source_kind: string | null
          source_ref: string | null
          updated_at: string
          user_id: string
          wave_number: number | null
        }
        Insert: {
          bucket_half?: string | null
          bucket_slug?: string | null
          chat_id?: string | null
          confidence?: number | null
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          layer?: string | null
          locked_from_refetch?: boolean
          metadata?: Json
          question_key?: string | null
          source?: string
          source_file_id?: string | null
          source_kind?: string | null
          source_ref?: string | null
          updated_at?: string
          user_id: string
          wave_number?: number | null
        }
        Update: {
          bucket_half?: string | null
          bucket_slug?: string | null
          chat_id?: string | null
          confidence?: number | null
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          layer?: string | null
          locked_from_refetch?: boolean
          metadata?: Json
          question_key?: string | null
          source?: string
          source_file_id?: string | null
          source_kind?: string | null
          source_ref?: string | null
          updated_at?: string
          user_id?: string
          wave_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "aperture_memory_items_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "aperture_files"
            referencedColumns: ["id"]
          },
        ]
      }
      aperture_messages: {
        Row: {
          attachments: Json
          bucket_slug: string | null
          chat_id: string
          content: string
          created_at: string
          id: string
          is_memory_question: boolean
          metadata: Json | null
          model: string | null
          role: string
          tokens_in: number | null
          tokens_out: number | null
          usd_cost: number
          user_id: string
        }
        Insert: {
          attachments?: Json
          bucket_slug?: string | null
          chat_id: string
          content: string
          created_at?: string
          id?: string
          is_memory_question?: boolean
          metadata?: Json | null
          model?: string | null
          role: string
          tokens_in?: number | null
          tokens_out?: number | null
          usd_cost?: number
          user_id: string
        }
        Update: {
          attachments?: Json
          bucket_slug?: string | null
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          is_memory_question?: boolean
          metadata?: Json | null
          model?: string | null
          role?: string
          tokens_in?: number | null
          tokens_out?: number | null
          usd_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aperture_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "aperture_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      aperture_onboarding_questions: {
        Row: {
          bucket_question_keys: string[]
          bucket_slugs: string[]
          created_at: string
          flow: string
          hint: string | null
          id: string
          input_kind: string
          is_active: boolean
          options: Json
          prompt: string
          question_key: string
          section: string | null
          signal_key: string | null
          sort_order: number
          step: number
          updated_at: string
        }
        Insert: {
          bucket_question_keys?: string[]
          bucket_slugs?: string[]
          created_at?: string
          flow: string
          hint?: string | null
          id?: string
          input_kind?: string
          is_active?: boolean
          options?: Json
          prompt: string
          question_key: string
          section?: string | null
          signal_key?: string | null
          sort_order?: number
          step?: number
          updated_at?: string
        }
        Update: {
          bucket_question_keys?: string[]
          bucket_slugs?: string[]
          created_at?: string
          flow?: string
          hint?: string | null
          id?: string
          input_kind?: string
          is_active?: boolean
          options?: Json
          prompt?: string
          question_key?: string
          section?: string | null
          signal_key?: string | null
          sort_order?: number
          step?: number
          updated_at?: string
        }
        Relationships: []
      }
      aperture_source_snapshots: {
        Row: {
          created_at: string
          fetched_at: string
          id: string
          meta: Json
          raw_text: string | null
          source_kind: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fetched_at?: string
          id?: string
          meta?: Json
          raw_text?: string | null
          source_kind: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          fetched_at?: string
          id?: string
          meta?: Json
          raw_text?: string | null
          source_kind?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      aperture_tool_card_questions: {
        Row: {
          answer_text: string | null
          answered_at: string | null
          bucket_slug: string
          card_key: string
          card_kind: string | null
          card_label: string | null
          category: string | null
          created_at: string
          generated_at: string
          generation_batch: number
          id: string
          is_active: boolean
          open_field: boolean
          options: Json
          question_index: number
          question_options: Json
          question_text: string
          row_kind: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer_text?: string | null
          answered_at?: string | null
          bucket_slug: string
          card_key: string
          card_kind?: string | null
          card_label?: string | null
          category?: string | null
          created_at?: string
          generated_at?: string
          generation_batch?: number
          id?: string
          is_active?: boolean
          open_field?: boolean
          options?: Json
          question_index?: number
          question_options?: Json
          question_text: string
          row_kind?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer_text?: string | null
          answered_at?: string | null
          bucket_slug?: string
          card_key?: string
          card_kind?: string | null
          card_label?: string | null
          category?: string | null
          created_at?: string
          generated_at?: string
          generation_batch?: number
          id?: string
          is_active?: boolean
          open_field?: boolean
          options?: Json
          question_index?: number
          question_options?: Json
          question_text?: string
          row_kind?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      aperture_tools: {
        Row: {
          categories: string[]
          category: string | null
          created_at: string
          id: string
          industries: string[]
          is_active: boolean
          label: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          categories?: string[]
          category?: string | null
          created_at?: string
          id?: string
          industries?: string[]
          is_active?: boolean
          label: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          categories?: string[]
          category?: string | null
          created_at?: string
          id?: string
          industries?: string[]
          is_active?: boolean
          label?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      aperture_user_bucket_signals: {
        Row: {
          bucket_slug: string
          created_at: string
          id: string
          meta: Json | null
          signal_type: string
          user_id: string
          weight: number
        }
        Insert: {
          bucket_slug: string
          created_at?: string
          id?: string
          meta?: Json | null
          signal_type: string
          user_id: string
          weight?: number
        }
        Update: {
          bucket_slug?: string
          created_at?: string
          id?: string
          meta?: Json | null
          signal_type?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      aperture_user_profile: {
        Row: {
          admin_locked: boolean
          business_name: string | null
          created_at: string
          essential_onboarded_at: string | null
          full_onboarded_at: string | null
          industry_slug: string | null
          instagram: string | null
          owner_name: string | null
          quick_onboarded_at: string | null
          tool_onboarding_done_at: string | null
          updated_at: string
          user_id: string
          user_locked: boolean
          website: string | null
        }
        Insert: {
          admin_locked?: boolean
          business_name?: string | null
          created_at?: string
          essential_onboarded_at?: string | null
          full_onboarded_at?: string | null
          industry_slug?: string | null
          instagram?: string | null
          owner_name?: string | null
          quick_onboarded_at?: string | null
          tool_onboarding_done_at?: string | null
          updated_at?: string
          user_id: string
          user_locked?: boolean
          website?: string | null
        }
        Update: {
          admin_locked?: boolean
          business_name?: string | null
          created_at?: string
          essential_onboarded_at?: string | null
          full_onboarded_at?: string | null
          industry_slug?: string | null
          instagram?: string | null
          owner_name?: string | null
          quick_onboarded_at?: string | null
          tool_onboarding_done_at?: string | null
          updated_at?: string
          user_id?: string
          user_locked?: boolean
          website?: string | null
        }
        Relationships: []
      }
      aperture_user_tools: {
        Row: {
          category: string | null
          connected_at: string | null
          connection_metadata: Json
          created_at: string
          custom: boolean
          id: string
          is_active: boolean
          tool_name: string
          tool_slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          connected_at?: string | null
          connection_metadata?: Json
          created_at?: string
          custom?: boolean
          id?: string
          is_active?: boolean
          tool_name: string
          tool_slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          connected_at?: string | null
          connection_metadata?: Json
          created_at?: string
          custom?: boolean
          id?: string
          is_active?: boolean
          tool_name?: string
          tool_slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      aperture_waves: {
        Row: {
          active_layers: string[] | null
          answered_count: number
          completed_at: string | null
          created_at: string
          id: string
          question_payload: Json | null
          reasoning_summary: string | null
          selected_at: string | null
          status: string
          updated_at: string
          user_id: string
          wave_number: number
        }
        Insert: {
          active_layers?: string[] | null
          answered_count?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          question_payload?: Json | null
          reasoning_summary?: string | null
          selected_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          wave_number: number
        }
        Update: {
          active_layers?: string[] | null
          answered_count?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          question_payload?: Json | null
          reasoning_summary?: string | null
          selected_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          wave_number?: number
        }
        Relationships: []
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
          platform: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string | null
          user_id?: string
        }
        Relationships: []
      }
      app_review_prompts: {
        Row: {
          app_version: string | null
          created_at: string
          error_message: string | null
          forced: boolean
          id: string
          platform: string
          success: boolean
          trigger_source: string | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          error_message?: string | null
          forced?: boolean
          id?: string
          platform: string
          success?: boolean
          trigger_source?: string | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          created_at?: string
          error_message?: string | null
          forced?: boolean
          id?: string
          platform?: string
          success?: boolean
          trigger_source?: string | null
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
      audience_presets: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          emoji: string
          exclude_playlists: string[]
          exclude_programs: string[]
          exclude_tools: string[]
          id: string
          include_playlists: string[]
          include_programs: string[]
          include_tools: string[]
          include_update_status: string[]
          name: string
          target_instructor_ids: string[]
          target_languages: string[]
          target_timezones: string[]
          target_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          emoji?: string
          exclude_playlists?: string[]
          exclude_programs?: string[]
          exclude_tools?: string[]
          id?: string
          include_playlists?: string[]
          include_programs?: string[]
          include_tools?: string[]
          include_update_status?: string[]
          name: string
          target_instructor_ids?: string[]
          target_languages?: string[]
          target_timezones?: string[]
          target_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          emoji?: string
          exclude_playlists?: string[]
          exclude_programs?: string[]
          exclude_tools?: string[]
          id?: string
          include_playlists?: string[]
          include_programs?: string[]
          include_tools?: string[]
          include_update_status?: string[]
          name?: string
          target_instructor_ids?: string[]
          target_languages?: string[]
          target_timezones?: string[]
          target_type?: string
          updated_at?: string
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
          is_hot: boolean
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
          is_hot?: boolean
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
          is_hot?: boolean
          metadata?: Json | null
          program_slug?: string | null
          published_at?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      audio_listen_events: {
        Row: {
          audio_id: string
          created_at: string
          id: string
          playlist_id: string | null
          seconds_listened: number
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_id: string
          created_at?: string
          id?: string
          playlist_id?: string | null
          seconds_listened?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_id?: string
          created_at?: string
          id?: string
          playlist_id?: string | null
          seconds_listened?: number
          updated_at?: string
          user_id?: string
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
          tracks_standalone: boolean
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
          tracks_standalone?: boolean
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
          tracks_standalone?: boolean
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
          is_premium: boolean
          name: string
          sort_order: number
          subtitle: string | null
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
          is_premium?: boolean
          name: string
          sort_order?: number
          subtitle?: string | null
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
          is_premium?: boolean
          name?: string
          sort_order?: number
          subtitle?: string | null
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
      cart_items: {
        Row: {
          added_by: string | null
          created_at: string
          deposit_price: number | null
          id: string
          payment_option: string | null
          payment_type: string
          price_amount: number
          program_slug: string
          program_title: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          deposit_price?: number | null
          id?: string
          payment_option?: string | null
          payment_type: string
          price_amount: number
          program_slug: string
          program_title: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          deposit_price?: number | null
          id?: string
          payment_option?: string | null
          payment_type?: string
          price_amount?: number
          program_slug?: string
          program_title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversation_tags: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          tag: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          tag: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversation_tags_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
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
      content_hosts: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          host_id: string
          id: string
          role: string
          sort_order: number
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          host_id: string
          id?: string
          role?: string
          sort_order?: number
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          host_id?: string
          id?: string
          role?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_hosts_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      content_tags: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          tag_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          tag_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
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
          sessions_purchased: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          course_name: string
          enrolled_at?: string
          id?: string
          program_slug?: string | null
          round_id?: string | null
          sessions_purchased?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          course_name?: string
          enrolled_at?: string
          id?: string
          program_slug?: string | null
          round_id?: string | null
          sessions_purchased?: number | null
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
      dedication_claim_attempts: {
        Row: {
          attempted_at: string
          id: number
          ip_hash: string
          token: string | null
        }
        Insert: {
          attempted_at?: string
          id?: number
          ip_hash: string
          token?: string | null
        }
        Update: {
          attempted_at?: string
          id?: number
          ip_hash?: string
          token?: string | null
        }
        Relationships: []
      }
      dedications: {
        Row: {
          claimed_at: string | null
          claimed_by_user_id: string | null
          created_at: string
          id: string
          message: string | null
          moment_id: string
          recipient_hint: string | null
          recipient_id: string | null
          recipient_token: string | null
          reported_at: string | null
          seen_at: string | null
          sender_id: string
          tried_at: string | null
        }
        Insert: {
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          moment_id: string
          recipient_hint?: string | null
          recipient_id?: string | null
          recipient_token?: string | null
          reported_at?: string | null
          seen_at?: string | null
          sender_id: string
          tried_at?: string | null
        }
        Update: {
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          moment_id?: string
          recipient_hint?: string | null
          recipient_id?: string | null
          recipient_token?: string | null
          reported_at?: string | null
          seen_at?: string | null
          sender_id?: string
          tried_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dedications_claimed_by_user_id_fkey"
            columns: ["claimed_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dedications_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "user_moments"
            referencedColumns: ["id"]
          },
        ]
      }
      document_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
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
          submoods: string[] | null
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
          submoods?: string[] | null
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
          submoods?: string[] | null
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
      feed_channel_exclusions: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_channel_exclusions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "feed_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_channels: {
        Row: {
          allow_comments: boolean
          allow_reactions: boolean
          audience_preset_id: string | null
          cover_image_url: string | null
          created_at: string
          exclude_playlists: string[]
          exclude_programs: string[]
          exclude_tools: string[]
          id: string
          include_playlists: string[]
          include_programs: string[]
          include_tools: string[]
          include_update_status: string[]
          is_archived: boolean
          name: string
          program_slug: string | null
          round_id: string | null
          slug: string
          sort_order: number
          target_instructor_ids: string[]
          target_languages: string[]
          target_timezones: string[]
          target_type: string
          type: string
        }
        Insert: {
          allow_comments?: boolean
          allow_reactions?: boolean
          audience_preset_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          exclude_playlists?: string[]
          exclude_programs?: string[]
          exclude_tools?: string[]
          id?: string
          include_playlists?: string[]
          include_programs?: string[]
          include_tools?: string[]
          include_update_status?: string[]
          is_archived?: boolean
          name: string
          program_slug?: string | null
          round_id?: string | null
          slug: string
          sort_order?: number
          target_instructor_ids?: string[]
          target_languages?: string[]
          target_timezones?: string[]
          target_type?: string
          type?: string
        }
        Update: {
          allow_comments?: boolean
          allow_reactions?: boolean
          audience_preset_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          exclude_playlists?: string[]
          exclude_programs?: string[]
          exclude_tools?: string[]
          id?: string
          include_playlists?: string[]
          include_programs?: string[]
          include_tools?: string[]
          include_update_status?: string[]
          is_archived?: boolean
          name?: string
          program_slug?: string | null
          round_id?: string | null
          slug?: string
          sort_order?: number
          target_instructor_ids?: string[]
          target_languages?: string[]
          target_timezones?: string[]
          target_type?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_channels_audience_preset_id_fkey"
            columns: ["audience_preset_id"]
            isOneToOne: false
            referencedRelation: "audience_presets"
            referencedColumns: ["id"]
          },
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
          scheduled_for: string | null
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
          scheduled_for?: string | null
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
          scheduled_for?: string | null
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
      focus_sessions: {
        Row: {
          completed: boolean
          created_at: string
          duration_seconds: number
          id: string
          pomodoro_rounds: number | null
          session_type: string
          started_at: string
          theme: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          duration_seconds: number
          id?: string
          pomodoro_rounds?: number | null
          session_type?: string
          started_at?: string
          theme?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          duration_seconds?: number
          id?: string
          pomodoro_rounds?: number | null
          session_type?: string
          started_at?: string
          theme?: string | null
          user_id?: string
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
          city: string
          email: string
          id: string
          ip_address: unknown
          join_now_round_id: string | null
          join_now_sent_at: string | null
          mailchimp_error: string | null
          mailchimp_success: boolean | null
          name: string
          next_session_round_id: string | null
          next_session_sent_at: string | null
          phone: string
          reminder_round_id: string | null
          reminder_sent_at: string | null
          round_id: string | null
          source: string | null
          submitted_at: string
          user_agent: string | null
        }
        Insert: {
          city: string
          email: string
          id?: string
          ip_address?: unknown
          join_now_round_id?: string | null
          join_now_sent_at?: string | null
          mailchimp_error?: string | null
          mailchimp_success?: boolean | null
          name: string
          next_session_round_id?: string | null
          next_session_sent_at?: string | null
          phone: string
          reminder_round_id?: string | null
          reminder_sent_at?: string | null
          round_id?: string | null
          source?: string | null
          submitted_at?: string
          user_agent?: string | null
        }
        Update: {
          city?: string
          email?: string
          id?: string
          ip_address?: unknown
          join_now_round_id?: string | null
          join_now_sent_at?: string | null
          mailchimp_error?: string | null
          mailchimp_success?: boolean | null
          name?: string
          next_session_round_id?: string | null
          next_session_sent_at?: string | null
          phone?: string
          reminder_round_id?: string | null
          reminder_sent_at?: string | null
          round_id?: string | null
          source?: string | null
          submitted_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      free_form_reflections: {
        Row: {
          content: string
          created_at: string
          id: string
          mood: string | null
          shared_at: string | null
          shared_with_admin: boolean | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          mood?: string | null
          shared_at?: string | null
          shared_with_admin?: boolean | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          mood?: string | null
          shared_at?: string | null
          shared_with_admin?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      friend_invite_clicks: {
        Row: {
          clicked_at: string
          code: string
          id: string
          installed_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string
          code: string
          id?: string
          installed_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string
          code?: string
          id?: string
          installed_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      friendships: {
        Row: {
          accepted_at: string | null
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
        }
        Relationships: []
      }
      home_banners: {
        Row: {
          audience_preset_id: string | null
          background_color: string | null
          button_text: string | null
          button_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          destination_id: string | null
          destination_type: string | null
          display_delay_seconds: number | null
          display_frequency: string | null
          display_location: string[] | null
          ends_at: string | null
          exclude_playlists: string[] | null
          exclude_programs: string[] | null
          exclude_tools: string[] | null
          icon: string | null
          id: string
          include_playlists: string[] | null
          include_programs: string[] | null
          include_tools: string[] | null
          include_update_status: string[] | null
          is_active: boolean | null
          priority: number | null
          starts_at: string | null
          target_below_version: string | null
          target_instructor_ids: string[]
          target_languages: string[] | null
          target_timezones: string[] | null
          target_type: string | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          audience_preset_id?: string | null
          background_color?: string | null
          button_text?: string | null
          button_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          destination_id?: string | null
          destination_type?: string | null
          display_delay_seconds?: number | null
          display_frequency?: string | null
          display_location?: string[] | null
          ends_at?: string | null
          exclude_playlists?: string[] | null
          exclude_programs?: string[] | null
          exclude_tools?: string[] | null
          icon?: string | null
          id?: string
          include_playlists?: string[] | null
          include_programs?: string[] | null
          include_tools?: string[] | null
          include_update_status?: string[] | null
          is_active?: boolean | null
          priority?: number | null
          starts_at?: string | null
          target_below_version?: string | null
          target_instructor_ids?: string[]
          target_languages?: string[] | null
          target_timezones?: string[] | null
          target_type?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          audience_preset_id?: string | null
          background_color?: string | null
          button_text?: string | null
          button_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          destination_id?: string | null
          destination_type?: string | null
          display_delay_seconds?: number | null
          display_frequency?: string | null
          display_location?: string[] | null
          ends_at?: string | null
          exclude_playlists?: string[] | null
          exclude_programs?: string[] | null
          exclude_tools?: string[] | null
          icon?: string | null
          id?: string
          include_playlists?: string[] | null
          include_programs?: string[] | null
          include_tools?: string[] | null
          include_update_status?: string[] | null
          is_active?: boolean | null
          priority?: number | null
          starts_at?: string | null
          target_below_version?: string | null
          target_instructor_ids?: string[]
          target_languages?: string[] | null
          target_timezones?: string[] | null
          target_type?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "home_banners_audience_preset_id_fkey"
            columns: ["audience_preset_id"]
            isOneToOne: false
            referencedRelation: "audience_presets"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_packages: {
        Row: {
          cover_image_url: string | null
          created_at: string
          default_channel_ids: string[]
          default_playlist_ids: string[]
          default_program_slug: string | null
          default_routine_ids: string[]
          description: string | null
          id: string
          instructor_id: string
          is_active: boolean
          name: string
          plus_trial_days: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          default_channel_ids?: string[]
          default_playlist_ids?: string[]
          default_program_slug?: string | null
          default_routine_ids?: string[]
          description?: string | null
          id?: string
          instructor_id: string
          is_active?: boolean
          name: string
          plus_trial_days?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          default_channel_ids?: string[]
          default_playlist_ids?: string[]
          default_program_slug?: string | null
          default_routine_ids?: string[]
          description?: string | null
          id?: string
          instructor_id?: string
          is_active?: boolean
          name?: string
          plus_trial_days?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_packages_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_referrals: {
        Row: {
          attribution_source: string
          created_at: string
          id: string
          instructor_id: string
          package_id: string | null
          raw_attribution: Json | null
          user_id: string
          welcome_shown_at: string | null
        }
        Insert: {
          attribution_source?: string
          created_at?: string
          id?: string
          instructor_id: string
          package_id?: string | null
          raw_attribution?: Json | null
          user_id: string
          welcome_shown_at?: string | null
        }
        Update: {
          attribution_source?: string
          created_at?: string
          id?: string
          instructor_id?: string
          package_id?: string | null
          raw_attribution?: Json | null
          user_id?: string
          welcome_shown_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_referrals_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_referrals_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "instructor_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      instructors: {
        Row: {
          bio: string | null
          created_at: string
          default_channel_ids: string[]
          default_playlist_ids: string[]
          default_program_slug: string | null
          default_routine_ids: string[]
          display_name: string
          id: string
          is_active: boolean
          photo_url: string | null
          plus_trial_days: number
          slug: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          default_channel_ids?: string[]
          default_playlist_ids?: string[]
          default_program_slug?: string | null
          default_routine_ids?: string[]
          display_name: string
          id?: string
          is_active?: boolean
          photo_url?: string | null
          plus_trial_days?: number
          slug: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          default_channel_ids?: string[]
          default_playlist_ids?: string[]
          default_program_slug?: string | null
          default_routine_ids?: string[]
          display_name?: string
          id?: string
          is_active?: boolean
          photo_url?: string | null
          plus_trial_days?: number
          slug?: string
          updated_at?: string
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
      media_categories: {
        Row: {
          created_at: string
          emoji: string
          id: string
          is_active: boolean
          label: string
          slug: string
          sort_order: number
          tags: string[]
          type: string
        }
        Insert: {
          created_at?: string
          emoji?: string
          id?: string
          is_active?: boolean
          label: string
          slug: string
          sort_order?: number
          tags?: string[]
          type: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          is_active?: boolean
          label?: string
          slug?: string
          sort_order?: number
          tags?: string[]
          type?: string
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
      my_rilo_path_trophies: {
        Row: {
          created_at: string
          earned_date: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          earned_date: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          earned_date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_answers: {
        Row: {
          answer: Json
          created_at: string
          flow_id: string
          id: string
          step_id: string
          user_id: string
        }
        Insert: {
          answer: Json
          created_at?: string
          flow_id: string
          id?: string
          step_id: string
          user_id: string
        }
        Update: {
          answer?: Json
          created_at?: string
          flow_id?: string
          id?: string
          step_id?: string
          user_id?: string
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
          usd_amount: number | null
          usd_exchange_rate: number | null
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
          usd_amount?: number | null
          usd_exchange_rate?: number | null
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
          usd_amount?: number | null
          usd_exchange_rate?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      path_dismissals: {
        Row: {
          dismissed_at: string
          dismissed_date: string
          id: string
          step_kind: string
          step_ref: string
          user_id: string
        }
        Insert: {
          dismissed_at?: string
          dismissed_date: string
          id?: string
          step_kind: string
          step_ref: string
          user_id: string
        }
        Update: {
          dismissed_at?: string
          dismissed_date?: string
          id?: string
          step_kind?: string
          step_ref?: string
          user_id?: string
        }
        Relationships: []
      }
      path_step_actions: {
        Row: {
          action: string
          created_at: string
          effective_until: string | null
          id: string
          step_kind: string
          step_ref: string
          swap_target: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          effective_until?: string | null
          id?: string
          step_kind: string
          step_ref: string
          swap_target?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          effective_until?: string | null
          id?: string
          step_kind?: string
          step_ref?: string
          swap_target?: string | null
          user_id?: string
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
      planner_trophies: {
        Row: {
          created_at: string
          earned_date: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          earned_date: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          earned_date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      playlist_gifts: {
        Row: {
          claimed_at: string | null
          created_at: string
          id: string
          playlist_id: string
          recipient_id: string | null
          recipient_token: string
          sender_id: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          id?: string
          playlist_id: string
          recipient_id?: string | null
          recipient_token: string
          sender_id: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          id?: string
          playlist_id?: string
          recipient_id?: string | null
          recipient_token?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_gifts_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "audio_playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_saves: {
        Row: {
          id: string
          playlist_id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          id?: string
          playlist_id: string
          saved_at?: string
          user_id: string
        }
        Update: {
          id?: string
          playlist_id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_saves_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "audio_playlists"
            referencedColumns: ["id"]
          },
        ]
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
      playlist_update_notification_reads: {
        Row: {
          audio_id: string
          id: string
          playlist_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          audio_id: string
          id?: string
          playlist_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          audio_id?: string
          id?: string
          playlist_id?: string
          read_at?: string
          user_id?: string
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
          date_of_birth: string | null
          email: string
          friend_code: string | null
          full_name: string | null
          gender: string | null
          goals: string[] | null
          id: string
          last_active_date: string | null
          notification_preferences: Json | null
          occupation: string | null
          phone: string | null
          plus_trial_granted_at: string | null
          plus_trial_granted_by_instructor_id: string | null
          preferred_language: string | null
          referral_source: string | null
          referred_by_instructor_id: string | null
          relationship_status: string | null
          return_count: number | null
          social_instagram: string | null
          social_telegram: string | null
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
          date_of_birth?: string | null
          email: string
          friend_code?: string | null
          full_name?: string | null
          gender?: string | null
          goals?: string[] | null
          id: string
          last_active_date?: string | null
          notification_preferences?: Json | null
          occupation?: string | null
          phone?: string | null
          plus_trial_granted_at?: string | null
          plus_trial_granted_by_instructor_id?: string | null
          preferred_language?: string | null
          referral_source?: string | null
          referred_by_instructor_id?: string | null
          relationship_status?: string | null
          return_count?: number | null
          social_instagram?: string | null
          social_telegram?: string | null
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
          date_of_birth?: string | null
          email?: string
          friend_code?: string | null
          full_name?: string | null
          gender?: string | null
          goals?: string[] | null
          id?: string
          last_active_date?: string | null
          notification_preferences?: Json | null
          occupation?: string | null
          phone?: string | null
          plus_trial_granted_at?: string | null
          plus_trial_granted_by_instructor_id?: string | null
          preferred_language?: string | null
          referral_source?: string | null
          referred_by_instructor_id?: string | null
          relationship_status?: string | null
          return_count?: number | null
          social_instagram?: string | null
          social_telegram?: string | null
          state?: string | null
          this_month_active_days?: number | null
          timezone?: string | null
          total_active_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_plus_trial_granted_by_instructor_id_fkey"
            columns: ["plus_trial_granted_by_instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_instructor_id_fkey"
            columns: ["referred_by_instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
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
          auto_create_feed_channel: boolean
          available_on_mobile: boolean | null
          available_on_web: boolean | null
          balance_full_discount: number | null
          balance_full_price: number | null
          balance_monthly_count: number | null
          balance_monthly_price: number | null
          cover_image_url: string | null
          created_at: string | null
          default_session_count: number | null
          delivery_method: string | null
          deposit_price: number | null
          description: string | null
          duration: string | null
          features: Json | null
          id: string
          ios_product_id: string | null
          is_active: boolean | null
          is_free_on_ios: boolean | null
          is_one_on_one: boolean
          language: string
          mailchimp_program_name: string | null
          mailchimp_tags: Json | null
          original_price: number | null
          payment_type: string
          price_amount: number
          requires_subscription: boolean
          restricted_regions: string[]
          show_in_app_waitlist: boolean
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
          auto_create_feed_channel?: boolean
          available_on_mobile?: boolean | null
          available_on_web?: boolean | null
          balance_full_discount?: number | null
          balance_full_price?: number | null
          balance_monthly_count?: number | null
          balance_monthly_price?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          default_session_count?: number | null
          delivery_method?: string | null
          deposit_price?: number | null
          description?: string | null
          duration?: string | null
          features?: Json | null
          id?: string
          ios_product_id?: string | null
          is_active?: boolean | null
          is_free_on_ios?: boolean | null
          is_one_on_one?: boolean
          language?: string
          mailchimp_program_name?: string | null
          mailchimp_tags?: Json | null
          original_price?: number | null
          payment_type: string
          price_amount?: number
          requires_subscription?: boolean
          restricted_regions?: string[]
          show_in_app_waitlist?: boolean
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
          auto_create_feed_channel?: boolean
          available_on_mobile?: boolean | null
          available_on_web?: boolean | null
          balance_full_discount?: number | null
          balance_full_price?: number | null
          balance_monthly_count?: number | null
          balance_monthly_price?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          default_session_count?: number | null
          delivery_method?: string | null
          deposit_price?: number | null
          description?: string | null
          duration?: string | null
          features?: Json | null
          id?: string
          ios_product_id?: string | null
          is_active?: boolean | null
          is_free_on_ios?: boolean | null
          is_one_on_one?: boolean
          language?: string
          mailchimp_program_name?: string | null
          mailchimp_tags?: Json | null
          original_price?: number | null
          payment_type?: string
          price_amount?: number
          requires_subscription?: boolean
          restricted_regions?: string[]
          show_in_app_waitlist?: boolean
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
          auto_create_feed_channel: boolean
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
          in_app_support_enabled: boolean
          instructor_id: string | null
          is_one_on_one: boolean
          is_self_paced: boolean
          mailchimp_tags: Json | null
          max_students: number | null
          owner_user_id: string | null
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
          auto_create_feed_channel?: boolean
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
          in_app_support_enabled?: boolean
          instructor_id?: string | null
          is_one_on_one?: boolean
          is_self_paced?: boolean
          mailchimp_tags?: Json | null
          max_students?: number | null
          owner_user_id?: string | null
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
          auto_create_feed_channel?: boolean
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
          in_app_support_enabled?: boolean
          instructor_id?: string | null
          is_one_on_one?: boolean
          is_self_paced?: boolean
          mailchimp_tags?: Json | null
          max_students?: number | null
          owner_user_id?: string | null
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
          {
            foreignKeyName: "program_rounds_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
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
      program_waitlist: {
        Row: {
          created_at: string
          id: string
          program_slug: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          program_slug: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          program_slug?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_banners: {
        Row: {
          aspect_ratio: string
          audience_preset_id: string | null
          cover_image_url: string
          created_at: string
          custom_url: string | null
          destination_id: string | null
          destination_type: string
          display_delay_seconds: number | null
          display_frequency: string
          display_location: string[]
          ends_at: string | null
          exclude_playlists: string[] | null
          exclude_programs: string[] | null
          exclude_tools: string[] | null
          id: string
          include_playlists: string[] | null
          include_programs: string[] | null
          include_tools: string[] | null
          include_update_status: string[] | null
          is_active: boolean
          priority: number
          starts_at: string | null
          target_audio_ids: string[] | null
          target_instructor_ids: string[]
          target_languages: string[] | null
          target_playlist_ids: string[] | null
          target_timezones: string[] | null
          target_type: string
          target_video_ids: string[] | null
          updated_at: string
        }
        Insert: {
          aspect_ratio?: string
          audience_preset_id?: string | null
          cover_image_url: string
          created_at?: string
          custom_url?: string | null
          destination_id?: string | null
          destination_type: string
          display_delay_seconds?: number | null
          display_frequency?: string
          display_location?: string[]
          ends_at?: string | null
          exclude_playlists?: string[] | null
          exclude_programs?: string[] | null
          exclude_tools?: string[] | null
          id?: string
          include_playlists?: string[] | null
          include_programs?: string[] | null
          include_tools?: string[] | null
          include_update_status?: string[] | null
          is_active?: boolean
          priority?: number
          starts_at?: string | null
          target_audio_ids?: string[] | null
          target_instructor_ids?: string[]
          target_languages?: string[] | null
          target_playlist_ids?: string[] | null
          target_timezones?: string[] | null
          target_type?: string
          target_video_ids?: string[] | null
          updated_at?: string
        }
        Update: {
          aspect_ratio?: string
          audience_preset_id?: string | null
          cover_image_url?: string
          created_at?: string
          custom_url?: string | null
          destination_id?: string | null
          destination_type?: string
          display_delay_seconds?: number | null
          display_frequency?: string
          display_location?: string[]
          ends_at?: string | null
          exclude_playlists?: string[] | null
          exclude_programs?: string[] | null
          exclude_tools?: string[] | null
          id?: string
          include_playlists?: string[] | null
          include_programs?: string[] | null
          include_tools?: string[] | null
          include_update_status?: string[] | null
          is_active?: boolean
          priority?: number
          starts_at?: string | null
          target_audio_ids?: string[] | null
          target_instructor_ids?: string[]
          target_languages?: string[] | null
          target_playlist_ids?: string[] | null
          target_timezones?: string[] | null
          target_type?: string
          target_video_ids?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_banners_audience_preset_id_fkey"
            columns: ["audience_preset_id"]
            isOneToOne: false
            referencedRelation: "audience_presets"
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
          platform: string | null
          user_id: string
        }
        Insert: {
          app_version?: string | null
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh_key: string
          platform?: string | null
          user_id: string
        }
        Update: {
          app_version?: string | null
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh_key?: string
          platform?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quiz_submissions: {
        Row: {
          answers: Json
          completed_at: string | null
          created_at: string
          id: string
          quiz_id: string
          result_key: string | null
          total_score: number
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          created_at?: string
          id?: string
          quiz_id: string
          result_key?: string | null
          total_score?: number
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          created_at?: string
          id?: string
          quiz_id?: string
          result_key?: string | null
          total_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_submissions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "admin_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_content: {
        Row: {
          author: string | null
          category: string
          cover_aspect: string
          cover_url: string | null
          created_at: string | null
          description: string | null
          emoji: string | null
          id: string
          is_premium: boolean | null
          is_published: boolean | null
          reading_time_minutes: number | null
          sort_order: number | null
          subtitle: string | null
          theme_color: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          category?: string
          cover_aspect?: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_premium?: boolean | null
          is_published?: boolean | null
          reading_time_minutes?: number | null
          sort_order?: number | null
          subtitle?: string | null
          theme_color?: string | null
          title: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          category?: string
          cover_aspect?: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_premium?: boolean | null
          is_published?: boolean | null
          reading_time_minutes?: number | null
          sort_order?: number | null
          subtitle?: string | null
          theme_color?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reading_sections: {
        Row: {
          body: string
          content_id: string
          created_at: string | null
          heading: string | null
          id: string
          image_url: string | null
          quote: string | null
          sort_order: number | null
        }
        Insert: {
          body?: string
          content_id: string
          created_at?: string | null
          heading?: string | null
          id?: string
          image_url?: string | null
          quote?: string | null
          sort_order?: number | null
        }
        Update: {
          body?: string
          content_id?: string
          created_at?: string | null
          heading?: string | null
          id?: string
          image_url?: string | null
          quote?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_sections_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "reading_content"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_user_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          content_id: string
          id: string
          last_section_index: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          content_id: string
          id?: string
          last_section_index?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          content_id?: string
          id?: string
          last_section_index?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_user_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "reading_content"
            referencedColumns: ["id"]
          },
        ]
      }
      reflection_pages: {
        Row: {
          content: string
          created_at: string
          description: string | null
          id: string
          page_order: number
          reflection_id: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string
          description?: string | null
          id?: string
          page_order?: number
          reflection_id: string
          type?: string
        }
        Update: {
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          page_order?: number
          reflection_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflection_pages_reflection_id_fkey"
            columns: ["reflection_id"]
            isOneToOne: false
            referencedRelation: "reflections"
            referencedColumns: ["id"]
          },
        ]
      }
      reflections: {
        Row: {
          category: string | null
          cover_color: string | null
          cover_image_url: string | null
          created_at: string
          emoji: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          is_free: boolean
          shuffle_mode: boolean
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          cover_color?: string | null
          cover_image_url?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_free?: boolean
          shuffle_mode?: boolean
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          cover_color?: string | null
          cover_image_url?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_free?: boolean
          shuffle_mode?: boolean
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      round_notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "round_notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "round_update_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      round_update_notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          program_slug: string
          round_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          program_slug: string
          round_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          program_slug?: string
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "round_update_notifications_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "program_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_categories: {
        Row: {
          color: string
          created_at: string
          description: string | null
          display_order: number
          icon: string
          id: string
          is_active: boolean
          name: string
          slug: string
          tags: string[]
          task_display_order: number
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          tags?: string[]
          task_display_order?: number
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          tags?: string[]
          task_display_order?: number
        }
        Relationships: []
      }
      routine_favorites: {
        Row: {
          created_at: string
          id: string
          routine_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          routine_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          routine_id?: string
          user_id?: string
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
      routine_session_tasks: {
        Row: {
          actual_seconds: number | null
          created_at: string
          id: string
          session_id: string
          status: string
          target_seconds: number | null
          task_emoji: string | null
          task_order: number | null
          task_title: string
          user_task_id: string | null
        }
        Insert: {
          actual_seconds?: number | null
          created_at?: string
          id?: string
          session_id: string
          status?: string
          target_seconds?: number | null
          task_emoji?: string | null
          task_order?: number | null
          task_title: string
          user_task_id?: string | null
        }
        Update: {
          actual_seconds?: number | null
          created_at?: string
          id?: string
          session_id?: string
          status?: string
          target_seconds?: number | null
          task_emoji?: string | null
          task_order?: number | null
          task_title?: string
          user_task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_session_tasks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "routine_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_session_tasks_user_task_id_fkey"
            columns: ["user_task_id"]
            isOneToOne: false
            referencedRelation: "user_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          routine_emoji: string | null
          routine_id: string
          routine_title: string
          started_at: string
          tasks_completed: number | null
          tasks_skipped: number | null
          tasks_total: number | null
          total_seconds: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          routine_emoji?: string | null
          routine_id: string
          routine_title: string
          started_at?: string
          tasks_completed?: number | null
          tasks_skipped?: number | null
          tasks_total?: number | null
          total_seconds?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          routine_emoji?: string | null
          routine_id?: string
          routine_title?: string
          started_at?: string
          tasks_completed?: number | null
          tasks_skipped?: number | null
          tasks_total?: number | null
          total_seconds?: number | null
          user_id?: string
        }
        Relationships: []
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
          audio_url: string | null
          badge_image_url: string | null
          category: string
          challenge_start_date: string | null
          color: string | null
          cover_aspect: string
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          emoji: string | null
          end_after_days: number | null
          end_date: string | null
          end_mode: string
          id: string
          is_active: boolean | null
          is_challenge: boolean
          is_featured: boolean
          is_focus: boolean
          is_free: boolean
          is_moment: boolean
          is_popular: boolean | null
          is_welcome_popup: boolean
          linked_program_slug: string | null
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
          audio_url?: string | null
          badge_image_url?: string | null
          category?: string
          challenge_start_date?: string | null
          color?: string | null
          cover_aspect?: string
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          end_after_days?: number | null
          end_date?: string | null
          end_mode?: string
          id?: string
          is_active?: boolean | null
          is_challenge?: boolean
          is_featured?: boolean
          is_focus?: boolean
          is_free?: boolean
          is_moment?: boolean
          is_popular?: boolean | null
          is_welcome_popup?: boolean
          linked_program_slug?: string | null
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
          audio_url?: string | null
          badge_image_url?: string | null
          category?: string
          challenge_start_date?: string | null
          color?: string | null
          cover_aspect?: string
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          end_after_days?: number | null
          end_date?: string | null
          end_mode?: string
          id?: string
          is_active?: boolean | null
          is_challenge?: boolean
          is_featured?: boolean
          is_focus?: boolean
          is_free?: boolean
          is_moment?: boolean
          is_popular?: boolean | null
          is_welcome_popup?: boolean
          linked_program_slug?: string | null
          requires_subscription?: boolean
          schedule_type?: string
          sort_order?: number | null
          start_day_of_week?: number | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routines_bank_linked_program_slug_fkey"
            columns: ["linked_program_slug"]
            isOneToOne: false
            referencedRelation: "program_catalog"
            referencedColumns: ["slug"]
          },
        ]
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
          is_once: boolean
          monthly_day: number | null
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
          is_once?: boolean
          monthly_day?: number | null
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
          is_once?: boolean
          monthly_day?: number | null
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
      selfcare_personality_results: {
        Row: {
          answers: Json
          created_at: string
          id: string
          personality: string
          primary_category: string
          primary_cluster: string
          quiz_version: string
          readiness_level: string
          secondary_category: string
          secondary_cluster: string
          suggested_task_ids: string[]
          taken_at: string
          task_count: number
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          personality: string
          primary_category: string
          primary_cluster: string
          quiz_version?: string
          readiness_level: string
          secondary_category: string
          secondary_cluster: string
          suggested_task_ids?: string[]
          taken_at?: string
          task_count?: number
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          personality?: string
          primary_category?: string
          primary_cluster?: string
          quiz_version?: string
          readiness_level?: string
          secondary_category?: string
          secondary_cluster?: string
          suggested_task_ids?: string[]
          taken_at?: string
          task_count?: number
          user_id?: string
        }
        Relationships: []
      }
      selfcare_quiz_results: {
        Row: {
          ai_insight: string | null
          answers: Json
          created_at: string
          gap_categories: string[]
          id: string
          suggested_task_ids: string[]
          user_id: string
        }
        Insert: {
          ai_insight?: string | null
          answers?: Json
          created_at?: string
          gap_categories?: string[]
          id?: string
          suggested_task_ids?: string[]
          user_id: string
        }
        Update: {
          ai_insight?: string | null
          answers?: Json
          created_at?: string
          gap_categories?: string[]
          id?: string
          suggested_task_ids?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "selfcare_quiz_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      tag_dimensions: {
        Row: {
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          is_active: boolean
          is_multi_select: boolean
          label: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean
          is_multi_select?: boolean
          label: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean
          is_multi_select?: boolean
          label?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          description: string | null
          dimension_id: string
          emoji: string | null
          id: string
          is_active: boolean
          label: string
          parent_tag_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          dimension_id: string
          emoji?: string | null
          id?: string
          is_active?: boolean
          label: string
          parent_tag_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          dimension_id?: string
          emoji?: string | null
          id?: string
          is_active?: boolean
          label?: string
          parent_tag_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "tag_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_parent_tag_id_fkey"
            columns: ["parent_tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
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
      task_draft_items: {
        Row: {
          created_at: string
          id: string
          is_sent: boolean
          section_id: string
          sent_at: string | null
          sort_order: number
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_sent?: boolean
          section_id: string
          sent_at?: string | null
          sort_order?: number
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_sent?: boolean
          section_id?: string
          sent_at?: string | null
          sort_order?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_draft_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "task_draft_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      task_draft_sections: {
        Row: {
          created_at: string
          description: string
          id: string
          sort_order: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_challenge_badges: {
        Row: {
          badge_image_url: string
          earned_at: string
          id: string
          routine_emoji: string
          routine_id: string
          routine_title: string
          user_id: string
        }
        Insert: {
          badge_image_url: string
          earned_at?: string
          id?: string
          routine_emoji?: string
          routine_id: string
          routine_title: string
          user_id: string
        }
        Update: {
          badge_image_url?: string
          earned_at?: string
          id?: string
          routine_emoji?: string
          routine_id?: string
          routine_title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_badges_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines_bank"
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
      user_moments: {
        Row: {
          created_at: string
          dedicated_at: string | null
          emoji: string | null
          expires_at: string
          id: string
          kind: string
          payload: Json
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dedicated_at?: string | null
          emoji?: string | null
          expires_at?: string
          id?: string
          kind: string
          payload?: Json
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          dedicated_at?: string | null
          emoji?: string | null
          expires_at?: string
          id?: string
          kind?: string
          payload?: Json
          title?: string
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
          friend_accepted: boolean
          friend_requests: boolean
          goal_milestones: boolean
          goal_nudges: boolean
          id: string
          moments_received: boolean
          momentum_celebration: boolean
          morning_summary: boolean
          playlist_gifts: boolean
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
          friend_accepted?: boolean
          friend_requests?: boolean
          goal_milestones?: boolean
          goal_nudges?: boolean
          id?: string
          moments_received?: boolean
          momentum_celebration?: boolean
          morning_summary?: boolean
          playlist_gifts?: boolean
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
          friend_accepted?: boolean
          friend_requests?: boolean
          goal_milestones?: boolean
          goal_nudges?: boolean
          id?: string
          moments_received?: boolean
          momentum_celebration?: boolean
          morning_summary?: boolean
          playlist_gifts?: boolean
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
      user_quick_presets: {
        Row: {
          amount: number
          created_at: string
          icon: string | null
          id: string
          label: string
          sort_order: number
          tool: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          icon?: string | null
          id?: string
          label: string
          sort_order?: number
          tool: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          icon?: string | null
          id?: string
          label?: string
          sort_order?: number
          tool?: string
          user_id?: string
        }
        Relationships: []
      }
      user_reflection_responses: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          page_id: string
          reflection_id: string
          response_text: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          page_id: string
          reflection_id: string
          response_text?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          page_id?: string
          reflection_id?: string
          response_text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reflection_responses_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "reflection_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reflection_responses_reflection_id_fkey"
            columns: ["reflection_id"]
            isOneToOne: false
            referencedRelation: "reflections"
            referencedColumns: ["id"]
          },
        ]
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
          category: string | null
          color: string | null
          completed_at: string | null
          cover_image_url: string | null
          current_step: number | null
          emoji: string | null
          id: string
          is_active: boolean
          is_focus: boolean | null
          is_user_created: boolean
          order_index: number | null
          routine_id: string
          schedule_type: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          added_at?: string
          category?: string | null
          color?: string | null
          completed_at?: string | null
          cover_image_url?: string | null
          current_step?: number | null
          emoji?: string | null
          id?: string
          is_active?: boolean
          is_focus?: boolean | null
          is_user_created?: boolean
          order_index?: number | null
          routine_id?: string
          schedule_type?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          added_at?: string
          category?: string | null
          color?: string | null
          completed_at?: string | null
          cover_image_url?: string | null
          current_step?: number | null
          emoji?: string | null
          id?: string
          is_active?: boolean
          is_focus?: boolean | null
          is_user_created?: boolean
          order_index?: number | null
          routine_id?: string
          schedule_type?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
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
          streak_recovery_count: number
          streak_recovery_used: boolean
          streak_recovery_used_at: string | null
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
          streak_recovery_count?: number
          streak_recovery_used?: boolean
          streak_recovery_used_at?: string | null
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
          streak_recovery_count?: number
          streak_recovery_used?: boolean
          streak_recovery_used_at?: string | null
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
          calendar_event_id: string | null
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
          is_urgent: boolean
          linked_playlist_id: string | null
          order_index: number
          pro_link_type: string | null
          pro_link_value: string | null
          project_step: number | null
          reminder_enabled: boolean
          reminder_offset: number
          repeat_days: number[] | null
          repeat_end_date: string | null
          repeat_interval: number | null
          repeat_pattern: string
          scheduled_date: string | null
          scheduled_time: string | null
          source_routine_id: string | null
          tag: string | null
          time_period: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calendar_event_id?: string | null
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
          is_urgent?: boolean
          linked_playlist_id?: string | null
          order_index?: number
          pro_link_type?: string | null
          pro_link_value?: string | null
          project_step?: number | null
          reminder_enabled?: boolean
          reminder_offset?: number
          repeat_days?: number[] | null
          repeat_end_date?: string | null
          repeat_interval?: number | null
          repeat_pattern?: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          source_routine_id?: string | null
          tag?: string | null
          time_period?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calendar_event_id?: string | null
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
          is_urgent?: boolean
          linked_playlist_id?: string | null
          order_index?: number
          pro_link_type?: string | null
          pro_link_value?: string | null
          project_step?: number | null
          reminder_enabled?: boolean
          reminder_offset?: number
          repeat_days?: number[] | null
          repeat_end_date?: string | null
          repeat_interval?: number | null
          repeat_pattern?: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          source_routine_id?: string | null
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
      video_content: {
        Row: {
          created_at: string
          description: string | null
          duration_seconds: number
          file_size_mb: number | null
          file_url: string
          id: string
          is_free: boolean
          is_vertical: boolean
          program_slug: string | null
          published_at: string | null
          sort_order: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_seconds?: number
          file_size_mb?: number | null
          file_url: string
          id?: string
          is_free?: boolean
          is_vertical?: boolean
          program_slug?: string | null
          published_at?: string | null
          sort_order?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_type?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_seconds?: number
          file_size_mb?: number | null
          file_url?: string
          id?: string
          is_free?: boolean
          is_vertical?: boolean
          program_slug?: string | null
          published_at?: string | null
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_type?: string
        }
        Relationships: []
      }
      video_playlist_items: {
        Row: {
          created_at: string
          drip_delay_days: number
          id: string
          playlist_id: string
          sort_order: number
          video_id: string
        }
        Insert: {
          created_at?: string
          drip_delay_days?: number
          id?: string
          playlist_id: string
          sort_order?: number
          video_id: string
        }
        Update: {
          created_at?: string
          drip_delay_days?: number
          id?: string
          playlist_id?: string
          sort_order?: number
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "video_playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_playlist_items_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_content"
            referencedColumns: ["id"]
          },
        ]
      }
      video_playlists: {
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
      video_progress: {
        Row: {
          completed: boolean
          created_at: string
          current_position_seconds: number
          id: string
          last_watched_at: string
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          current_position_seconds?: number
          id?: string
          last_watched_at?: string
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          current_position_seconds?: number
          id?: string
          last_watched_at?: string
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_content"
            referencedColumns: ["id"]
          },
        ]
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
      aperture_bucket_half_valid: {
        Args: { _bucket: string; _half: string }
        Returns: boolean
      }
      aperture_full_reset: { Args: { p_user_id: string }; Returns: Json }
      can_access_admin_page: {
        Args: { _page_slug: string; _user_id: string }
        Returns: boolean
      }
      claim_dedication: { Args: { t: string }; Returns: Json }
      claim_playlist_gift: { Args: { t: string }; Returns: Json }
      create_playlist_gift: { Args: { p_playlist_id: string }; Returns: Json }
      find_profile_by_code: {
        Args: { _code: string }
        Returns: {
          friend_code: string
          full_name: string
          id: string
        }[]
      }
      generate_dedication_token: { Args: never; Returns: string }
      generate_friend_code: { Args: never; Returns: string }
      generate_playlist_gift_token: { Args: never; Returns: string }
      get_admin_user_breakdown: { Args: never; Returns: Json }
      get_current_user_role: { Args: never; Returns: string }
      get_dedication_by_token: {
        Args: { t: string }
        Returns: {
          created_at: string
          expires_token_at: string
          id: string
          is_claimed: boolean
          message: string
          moment_emoji: string
          moment_kind: string
          moment_payload: Json
          moment_title: string
          recipient_hint: string
          sender_avatar_url: string
          sender_first_name: string
        }[]
      }
      get_home_data: {
        Args: { p_date_str: string; p_user_id: string }
        Returns: Json
      }
      get_playlist_gift_by_token: {
        Args: { t: string }
        Returns: {
          created_at: string
          id: string
          is_claimed: boolean
          playlist_cover_image_url: string
          playlist_description: string
          playlist_id: string
          playlist_name: string
          requires_subscription: boolean
          sender_avatar_url: string
          sender_first_name: string
        }[]
      }
      get_program_events_for_date: {
        Args: { p_date_str: string; p_user_id: string }
        Returns: Json
      }
      get_safe_profiles: {
        Args: { _ids: string[] }
        Returns: {
          avatar_url: string
          friend_code: string
          full_name: string
          id: string
        }[]
      }
      get_scheduled_feed_posts: {
        Args: never
        Returns: {
          author_full_name: string
          channel_id: string
          channel_name: string
          content: string
          display_name: string
          id: string
          image_url: string
          is_pinned: boolean
          scheduled_for: string
          send_push: boolean
          title: string
        }[]
      }
      has_channel_access: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_aperture_event: {
        Args: {
          p_conversation_id?: string
          p_event_type: string
          p_payload?: Json
        }
        Returns: string
      }
      log_security_event: {
        Args: { p_action: string; p_details?: Json; p_user_id?: string }
        Returns: undefined
      }
      map_course_name_to_slug: {
        Args: { course_name: string }
        Returns: string
      }
      provision_daily_reset_for_user: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      provision_routine_for_user: {
        Args: { p_routine_id: string; p_user_id: string }
        Returns: Json
      }
      publish_due_scheduled_posts: { Args: never; Returns: Json }
      redeem_aperture_invite: { Args: { p_code: string }; Returns: Json }
      regenerate_my_friend_code: { Args: never; Returns: string }
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
