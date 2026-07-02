import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ApertureOnboardingFlow = "quick" | "full" | "essential";

export interface ApertureOnboardingQuestionRow {
  id: string;
  flow: ApertureOnboardingFlow;
  step: number;
  question_key: string;
  prompt: string;
  hint: string | null;
  input_kind: string;
  options: any;
  bucket_slugs: string[] | null;
  bucket_question_keys: string[] | null;
  section: string | null;
  sort_order: number;
  is_active: boolean;
  signal_key?: string | null;
}

export function useApertureOnboardingDB(flow: ApertureOnboardingFlow, opts: { activeOnly?: boolean } = {}) {
  const { activeOnly = true } = opts;
  const [questions, setQuestions] = useState<ApertureOnboardingQuestionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("aperture_onboarding_questions")
      .select("*")
      .eq("flow", flow)
      .order("step", { ascending: true })
      .order("sort_order", { ascending: true });
    if (activeOnly) q = q.eq("is_active", true);
    const { data } = await q;
    setQuestions((data ?? []) as ApertureOnboardingQuestionRow[]);
    setLoading(false);
  }, [flow, activeOnly]);

  useEffect(() => { refresh(); }, [refresh]);

  return { questions, loading, refresh };
}

export interface ApertureIndustryRow {
  id: string;
  slug: string;
  group_label: string | null;
  group_slug: string | null;
  label: string;
  sort_order: number;
  is_active: boolean;
}

export function useApertureIndustriesDB(opts: { activeOnly?: boolean } = {}) {
  const { activeOnly = true } = opts;
  const [industries, setIndustries] = useState<ApertureIndustryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("aperture_industries")
      .select("*")
      .order("group_label", { ascending: true })
      .order("sort_order", { ascending: true });
    if (activeOnly) q = q.eq("is_active", true);
    const { data } = await q;
    setIndustries((data ?? []) as ApertureIndustryRow[]);
    setLoading(false);
  }, [activeOnly]);

  useEffect(() => { refresh(); }, [refresh]);

  return { industries, loading, refresh };
}

export interface ApertureToolRow {
  id: string;
  slug: string;
  category: string | null;
  label: string;
  sort_order: number;
  is_active: boolean;
}

export function useApertureToolsDB(opts: { activeOnly?: boolean } = {}) {
  const { activeOnly = true } = opts;
  const [tools, setTools] = useState<ApertureToolRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    let q = (supabase as any)
      .from("aperture_tools")
      .select("*")
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });
    if (activeOnly) q = q.eq("is_active", true);
    const { data } = await q;
    setTools((data ?? []) as ApertureToolRow[]);
    setLoading(false);
  }, [activeOnly]);

  useEffect(() => { refresh(); }, [refresh]);

  return { tools, loading, refresh };
}