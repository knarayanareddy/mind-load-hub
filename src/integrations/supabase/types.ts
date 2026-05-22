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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cl_scores: {
        Row: {
          alert_level: string
          boundary_score: number | null
          burnout_risk_pct: number | null
          communication_score: number | null
          computed_at: string
          id: string
          in_flow_state: boolean | null
          person_id: string
          recommended_interventions: Json | null
          risk_factors: Json | null
          score: number
          score_trend: string | null
          sentiment_score: number | null
          task_switching_score: number | null
          temporal_score: number | null
        }
        Insert: {
          alert_level: string
          boundary_score?: number | null
          burnout_risk_pct?: number | null
          communication_score?: number | null
          computed_at?: string
          id?: string
          in_flow_state?: boolean | null
          person_id: string
          recommended_interventions?: Json | null
          risk_factors?: Json | null
          score: number
          score_trend?: string | null
          sentiment_score?: number | null
          task_switching_score?: number | null
          temporal_score?: number | null
        }
        Update: {
          alert_level?: string
          boundary_score?: number | null
          burnout_risk_pct?: number | null
          communication_score?: number | null
          computed_at?: string
          id?: string
          in_flow_state?: boolean | null
          person_id?: string
          recommended_interventions?: Json | null
          risk_factors?: Json | null
          score?: number
          score_trend?: string | null
          sentiment_score?: number | null
          task_switching_score?: number | null
          temporal_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cl_scores_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interventions: {
        Row: {
          cl_score_after: number | null
          cl_score_before: number | null
          created_at: string
          id: string
          intervention_params: Json | null
          intervention_type: string
          outcome: string | null
          outcome_details: string | null
          person_id: string
          triggered_by: string
        }
        Insert: {
          cl_score_after?: number | null
          cl_score_before?: number | null
          created_at?: string
          id?: string
          intervention_params?: Json | null
          intervention_type: string
          outcome?: string | null
          outcome_details?: string | null
          person_id: string
          triggered_by: string
        }
        Update: {
          cl_score_after?: number | null
          cl_score_before?: number | null
          created_at?: string
          id?: string
          intervention_params?: Json | null
          intervention_type?: string
          outcome?: string | null
          outcome_details?: string | null
          person_id?: string
          triggered_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "interventions_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_alerts: {
        Row: {
          alert_level: string
          alert_message: string
          created_at: string
          id: string
          is_read: boolean
          manager_id: string
          person_id: string
        }
        Insert: {
          alert_level: string
          alert_message: string
          created_at?: string
          id?: string
          is_read?: boolean
          manager_id: string
          person_id: string
        }
        Update: {
          alert_level?: string
          alert_message?: string
          created_at?: string
          id?: string
          is_read?: boolean
          manager_id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_alerts_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_alerts_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          consent_level: string
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_active: boolean
          manager_id: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          consent_level?: string
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          consent_level?: string
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_snapshots: {
        Row: {
          avg_gap_mins: number | null
          avg_response_time_mins: number | null
          avg_tasks_in_progress: number | null
          back_to_back_chains: number | null
          captured_at: string
          days_without_break: number | null
          focus_blocks_available: number | null
          id: string
          meeting_count_today: number | null
          meetings_after_hours: number | null
          message_length_trend: string | null
          messages_after_hours: number | null
          parallel_open_prs: number | null
          person_id: string
          sentiment_score: number | null
          sentiment_trend: string | null
          source: string | null
          ticket_reassignments: number | null
        }
        Insert: {
          avg_gap_mins?: number | null
          avg_response_time_mins?: number | null
          avg_tasks_in_progress?: number | null
          back_to_back_chains?: number | null
          captured_at?: string
          days_without_break?: number | null
          focus_blocks_available?: number | null
          id?: string
          meeting_count_today?: number | null
          meetings_after_hours?: number | null
          message_length_trend?: string | null
          messages_after_hours?: number | null
          parallel_open_prs?: number | null
          person_id: string
          sentiment_score?: number | null
          sentiment_trend?: string | null
          source?: string | null
          ticket_reassignments?: number | null
        }
        Update: {
          avg_gap_mins?: number | null
          avg_response_time_mins?: number | null
          avg_tasks_in_progress?: number | null
          back_to_back_chains?: number | null
          captured_at?: string
          days_without_break?: number | null
          focus_blocks_available?: number | null
          id?: string
          meeting_count_today?: number | null
          meetings_after_hours?: number | null
          message_length_trend?: string | null
          messages_after_hours?: number | null
          parallel_open_prs?: number | null
          person_id?: string
          sentiment_score?: number | null
          sentiment_trend?: string | null
          source?: string | null
          ticket_reassignments?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "signal_snapshots_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_profile_id: { Args: never; Returns: string }
      is_manager_of: { Args: { target_person: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
