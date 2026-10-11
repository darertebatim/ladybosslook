import { supabase } from '@/integrations/supabase/client';

/** All login IDs linked to the signed-in student (always includes their own). */
export async function getFamilyIds(userId: string): Promise<string[]> {
  try {
    const { data } = await supabase.rpc('my_family_user_ids' as any);
    const ids = ((data as any[]) || []).map((r) => (typeof r === 'string' ? r : r?.my_family_user_ids)).filter(Boolean);
    return ids.includes(userId) ? ids : [userId, ...ids];
  } catch {
    return [userId];
  }
}
