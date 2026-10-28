/**
 * Server-synced localStorage keys.
 *
 * Onboarding completion flags and today's Path snapshot used to live only on
 * the device. This module mirrors a small allow-list of localStorage keys to
 * `user_synced_state` so they follow the account across phones and desktop.
 * localStorage stays the instant cache; the server is the source of truth.
 *
 * Existing call sites keep using localStorage directly — writes/removes on
 * synced keys are intercepted and pushed to the server in the background.
 */
import { supabase } from "@/integrations/supabase/client";

export const SYNCED_PREFIXES = [
  "simora_onboarding_completed_",
  "simora_onboarding_progress_",
  "simora_onboarding_planner_intro_dismissed",
  "simora_path_plan_",
  "simora_path_tapped_",
];

export const isSyncedKey = (key: string) =>
  SYNCED_PREFIXES.some((p) => key.startsWith(p));

const table = () => supabase.from("user_synced_state" as any) as any;

let currentUserId: string | null = null;
let hydratePromise: Promise<void> = Promise.resolve();
let installed = false;

const origSet = Storage.prototype.setItem;
const origRemove = Storage.prototype.removeItem;

function localSyncedKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && isSyncedKey(k)) keys.push(k);
  }
  return keys;
}

async function hydrate(userId: string) {
  try {
    const { data, error } = await table().select("key, value").eq("user_id", userId);
    if (error) throw error;
    const server = new Map<string, string>((data ?? []).map((r: any) => [r.key, r.value]));
    // Server wins: copy server values down.
    server.forEach((v, k) => origSet.call(localStorage, k, v));
    // First device / offline writes: push local-only keys up.
    const missing = localSyncedKeys()
      .filter((k) => !server.has(k))
      .map((k) => ({ user_id: userId, key: k, value: localStorage.getItem(k) ?? "" }));
    if (missing.length) await table().upsert(missing, { onConflict: "user_id,key" });
  } catch (e) {
    console.warn("[syncedStorage] hydrate failed", e);
  }
}

/** Resolves once the signed-in user's synced keys are copied into localStorage. */
export const whenSyncedStorageReady = () => hydratePromise;

export function installSyncedStorage() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  Storage.prototype.setItem = function (key: string, value: string) {
    origSet.call(this, key, value);
    if (this === localStorage && currentUserId && isSyncedKey(key)) {
      table()
        .upsert({ user_id: currentUserId, key, value: String(value) }, { onConflict: "user_id,key" })
        .then(({ error }: any) => error && console.warn("[syncedStorage] upsert", error));
    }
  };
  Storage.prototype.removeItem = function (key: string) {
    origRemove.call(this, key);
    if (this === localStorage && currentUserId && isSyncedKey(key)) {
      table()
        .delete()
        .eq("user_id", currentUserId)
        .eq("key", key)
        .then(({ error }: any) => error && console.warn("[syncedStorage] delete", error));
    }
  };

  const onUser = (uid: string | null) => {
    if (uid === currentUserId) return;
    currentUserId = uid;
    if (uid) hydratePromise = hydrate(uid);
  };
  supabase.auth.getSession().then(({ data }) => onUser(data.session?.user?.id ?? null));
  supabase.auth.onAuthStateChange((_e, session) => {
    const uid = session?.user?.id ?? null;
    // Block readers immediately on sign-in, before the async hydrate kicks off.
    if (uid && uid !== currentUserId) {
      currentUserId = uid;
      hydratePromise = new Promise((r) => setTimeout(() => hydrate(uid).then(r), 0));
    } else if (!uid) {
      currentUserId = null;
    }
  });
}
