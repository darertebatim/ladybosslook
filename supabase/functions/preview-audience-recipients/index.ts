import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AudienceFilter {
  target_type?: "all" | "enrolled" | "custom";
  include_programs?: string[];
  exclude_programs?: string[];
  include_playlists?: string[];
  exclude_playlists?: string[];
  include_tools?: string[];
  exclude_tools?: string[];
  target_languages?: string[];
  target_timezones?: string[];
  include_update_status?: string[];
  target_instructor_ids?: string[];
}

interface PreviewRequest {
  audience?: AudienceFilter | null;
  /** Optional simple selectors used by Push Only / Broadcast panels to narrow recipients further. */
  targetCourse?: string | null;   // program_slug
  targetRoundId?: string | null;
  /** When 'push' (default) we also report device-token coverage; 'broadcast' reports profile coverage only. */
  channel?: "push" | "broadcast";
}

/** Same logic as send-push-notification / send-broadcast-message. */
async function resolveAudienceUserIds(
  supabase: any,
  audience: AudienceFilter | null | undefined,
): Promise<Set<string> | null> {
  if (!audience) return null;
  async function pagedIds(
    table: string,
    column: string,
    builder: (q: any) => any,
  ): Promise<Set<string>> {
    const out = new Set<string>();
    const PAGE = 1000;
    let from = 0;
    while (true) {
      const q = supabase.from(table).select(column).range(from, from + PAGE - 1);
      const { data, error } = await builder(q);
      if (error || !data) break;
      for (const r of data) {
        const id = r[column];
        if (id) out.add(id);
      }
      if (data.length < PAGE) break;
      from += PAGE;
    }
    return out;
  }
  const hasAnyRule =
    (audience.target_type && audience.target_type !== "all") ||
    (audience.include_programs?.length ?? 0) > 0 ||
    (audience.exclude_programs?.length ?? 0) > 0 ||
    (audience.include_playlists?.length ?? 0) > 0 ||
    (audience.exclude_playlists?.length ?? 0) > 0 ||
    (audience.target_languages?.length ?? 0) > 0 ||
    (audience.target_timezones?.length ?? 0) > 0 ||
    (audience.include_update_status?.length ?? 0) > 0 ||
    (audience.target_instructor_ids?.length ?? 0) > 0;
  if (!hasAnyRule) return null;

  let candidates: Set<string>;
  if (audience.target_type === "enrolled") {
    const { data } = await supabase
      .from("course_enrollments").select("user_id").eq("status", "active");
    candidates = new Set((data ?? []).map((r: any) => r.user_id));
  } else {
    candidates = new Set();
    const PAGE = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from("profiles").select("id").range(from, from + PAGE - 1);
      if (error) break;
      for (const r of data ?? []) candidates.add(r.id);
      if (!data || data.length < PAGE) break;
      from += PAGE;
    }
  }

  if ((audience.include_programs?.length ?? 0) > 0) {
    const allowed = await pagedIds("course_enrollments", "user_id", (q) =>
      q.in("program_slug", audience.include_programs!).eq("status", "active"),
    );
    candidates = new Set([...candidates].filter((id) => allowed.has(id)));
  }
  if ((audience.exclude_programs?.length ?? 0) > 0) {
    const blocked = await pagedIds("course_enrollments", "user_id", (q) =>
      q.in("program_slug", audience.exclude_programs!).eq("status", "active"),
    );
    candidates = new Set([...candidates].filter((id) => !blocked.has(id)));
  }
  if ((audience.include_playlists?.length ?? 0) > 0) {
    const allowed = await pagedIds("playlist_saves", "user_id", (q) =>
      q.in("playlist_id", audience.include_playlists!),
    );
    candidates = new Set([...candidates].filter((id) => allowed.has(id)));
  }
  if ((audience.exclude_playlists?.length ?? 0) > 0) {
    const blocked = await pagedIds("playlist_saves", "user_id", (q) =>
      q.in("playlist_id", audience.exclude_playlists!),
    );
    candidates = new Set([...candidates].filter((id) => !blocked.has(id)));
  }
  if ((audience.target_languages?.length ?? 0) > 0) {
    const allowed = await pagedIds("profiles", "id", (q) =>
      q.in("preferred_language", audience.target_languages!),
    );
    candidates = new Set([...candidates].filter((id) => allowed.has(id)));
  }
  if ((audience.target_timezones?.length ?? 0) > 0) {
    const allowed = await pagedIds("profiles", "id", (q) =>
      q.in("timezone", audience.target_timezones!),
    );
    candidates = new Set([...candidates].filter((id) => allowed.has(id)));
  }
  if ((audience.target_instructor_ids?.length ?? 0) > 0) {
    const allowed = await pagedIds("instructor_referrals", "user_id", (q) =>
      q.in("instructor_id", audience.target_instructor_ids!),
    );
    candidates = new Set([...candidates].filter((id) => allowed.has(id)));
  }
  if ((audience.include_update_status?.length ?? 0) > 0) {
    const wantLatest = audience.include_update_status!.includes("latest");
    const wantPrev = audience.include_update_status!.includes("previous");
    if (!(wantLatest && wantPrev)) {
      const { data: settings } = await supabase
        .from("app_settings").select("key,value")
        .in("key", ["latest_ios_version", "latest_android_version"]);
      const latestIos = settings?.find((s: any) => s.key === "latest_ios_version")?.value ?? null;
      const latestAndroid = settings?.find((s: any) => s.key === "latest_android_version")?.value ?? null;
      const userToInstall = new Map<string, { app_version: string | null; platform: string | null }>();
      let from = 0;
      const PAGE = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("app_installations").select("user_id, app_version, platform, last_seen_at")
          .order("last_seen_at", { ascending: false }).range(from, from + PAGE - 1);
        if (error || !data) break;
        for (const r of data) {
          if (!userToInstall.has(r.user_id)) {
            userToInstall.set(r.user_id, { app_version: r.app_version, platform: r.platform });
          }
        }
        if (data.length < PAGE) break;
        from += PAGE;
      }
      candidates = new Set(
        [...candidates].filter((id) => {
          const inst = userToInstall.get(id);
          if (!inst) return wantPrev;
          const latest =
            inst.platform === "ios" ? latestIos :
            inst.platform === "android" ? latestAndroid : null;
          const isLatest = !!latest && inst.app_version === latest;
          return isLatest ? wantLatest : wantPrev;
        }),
      );
    }
  }
  return candidates;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body: PreviewRequest = await req.json();
    const channel = body.channel ?? "push";

    // 1. Audience-resolved candidates (or null = "all users")
    const audienceSet = await resolveAudienceUserIds(supabase, body.audience);

    // 2. Apply simple selectors (course / round) the same way the senders do
    let courseUserIds: Set<string> | null = null;
    if (body.targetRoundId) {
      const { data } = await supabase
        .from("course_enrollments").select("user_id")
        .eq("round_id", body.targetRoundId).eq("status", "active");
      courseUserIds = new Set((data ?? []).map((r: any) => r.user_id));
    } else if (body.targetCourse) {
      const { data } = await supabase
        .from("course_enrollments").select("user_id")
        .eq("program_slug", body.targetCourse).eq("status", "active");
      courseUserIds = new Set((data ?? []).map((r: any) => r.user_id));
    }

    // 3. Compute final user set (intersection)
    let finalUserIds: Set<string>;
    if (audienceSet && courseUserIds) {
      finalUserIds = new Set([...audienceSet].filter((id) => courseUserIds!.has(id)));
    } else if (audienceSet) {
      finalUserIds = audienceSet;
    } else if (courseUserIds) {
      finalUserIds = courseUserIds;
    } else {
      // No filters at all = "all users" — for preview, count active profiles
      const { count } = await supabase
        .from("profiles").select("id", { count: "exact", head: true });
      return new Response(
        JSON.stringify({
          channel,
          matched_users: count ?? 0,
          devices_total: null,
          devices_ios: null,
          devices_android: null,
          note: "No audience filter set — would target all users with active devices.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const matchedUsers = finalUserIds.size;

    // 4. For push, also count device-token coverage by platform
    let devicesTotal: number | null = null;
    let devicesIos = 0;
    let devicesAndroid = 0;
    let devicesUnknown = 0;
    if (channel === "push" && matchedUsers > 0) {
      // Page through subscriptions in chunks (the .in() filter caps around ~1000 ids)
      const ids = [...finalUserIds];
      const CHUNK = 500;
      devicesTotal = 0;
      for (let i = 0; i < ids.length; i += CHUNK) {
        const slice = ids.slice(i, i + CHUNK);
        const { data } = await supabase
          .from("push_subscriptions").select("platform").in("user_id", slice);
        for (const s of data ?? []) {
          devicesTotal++;
          if (s.platform === "ios") devicesIos++;
          else if (s.platform === "android") devicesAndroid++;
          else devicesUnknown++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        channel,
        matched_users: matchedUsers,
        devices_total: devicesTotal,
        devices_ios: devicesIos,
        devices_android: devicesAndroid,
        devices_unknown: devicesUnknown,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("[preview-audience-recipients] error:", err);
    return new Response(
      JSON.stringify({ error: err?.message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});