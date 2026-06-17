/**
 * Shared helper: returns the list of bucket slugs+titles the user is
 * allowed to write memory items into. Includes every active default
 * bucket plus the single industry bucket whose group_slug matches the
 * user's industry (if any). Industry buckets that don't match are
 * excluded so the model never tags a fact into the wrong group.
 *
 * Used by both aperture-chat (skip classifier, fact extraction) and
 * aperture-file-ingest (file-extracted facts) so the allow-list stays
 * in sync across pipelines.
 */
export async function getAllowedBuckets(
  supabase: any, userId?: string,
): Promise<Array<{ slug: string; title: string }>> {
  const { data: buckets } = await supabase
    .from("aperture_buckets")
    .select("slug,title,kind,industry_group_slug")
    .eq("is_active", true);
  const list = (buckets ?? []) as Array<{
    slug: string; title: string; kind: string; industry_group_slug: string | null;
  }>;

  let userGroupSlug: string | null = null;
  if (userId) {
    const { data: profile } = await supabase
      .from("aperture_user_profile")
      .select("industry_slug").eq("user_id", userId).maybeSingle();
    const industrySlug = (profile as any)?.industry_slug ?? null;
    if (industrySlug) {
      const { data: ind } = await supabase
        .from("aperture_industries")
        .select("group_slug").eq("slug", industrySlug).maybeSingle();
      userGroupSlug = (ind as any)?.group_slug ?? null;
    }
  }

  return list
    .filter(b => {
      if (b.kind !== "industry") return true;
      if (!userGroupSlug) return false;
      return b.industry_group_slug === userGroupSlug;
    })
    .map(b => ({ slug: b.slug, title: b.title }));
}