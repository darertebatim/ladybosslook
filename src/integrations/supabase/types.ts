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
          created_at: string
          currency: string | null
          email: string
          id: string
          name: string
          payment_type: string | null
          phone: string | null
          product_name: string
          program_slug: string | null
          status: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          email: string
          id?: string
          name: string
          payment_type?: string | null
          phone?: string | null
          product_name: string
          program_slug?: string | null
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          email?: string
          id?: string
          name?: string
          payment_type?: string | null
          phone?: string | null
          product_name?: string
          program_slug?: string | null
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
      program_catalog: {
        Row: {
          created_at: string | null
          delivery_method: string | null
          description: string | null
          duration: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          original_price: number | null
          payment_type: string
          price_amount: number
          slug: string
          subscription_duration: string | null
          subscription_full_payment_discount: number | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_method?: string | null
          description?: string | null
          duration?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          original_price?: number | null
          payment_type: string
          price_amount?: number
          slug: string
          subscription_duration?: string | null
          subscription_full_payment_discount?: number | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_method?: string | null
          description?: string | null
          duration?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          original_price?: number | null
          payment_type?: string
          price_amount?: number
          slug?: string
          subscription_duration?: string | null
          subscription_full_payment_discount?: number | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      program_rounds: {
        Row: {
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
          whatsapp_support_number: string | null
        }
        Insert: {
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
          whatsapp_support_number?: string | null
        }
        Update: {
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
          whatsapp_support_number?: string | null
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
      pwa_installations: {
        Row: {
          id: string
          installed_at: string
          platform: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          installed_at?: string
          platform?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          installed_at?: string
          platform?: string | null
          user_agent?: string | null
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
    },
  },
} as const
