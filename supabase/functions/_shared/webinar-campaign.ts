export interface WebinarRoundIdentity {
  id: string;
  program_slug?: string | null;
  round_number?: number | string | null;
}

const PREFIXED_PROGRAMS = new Set(["startads", "powerfree", "igfreewebinar"]);

/** Campaign-scoped delivery key prevents identical round numbers sharing email dedupe. */
export function webinarRoundKey(round: WebinarRoundIdentity): string {
  const base = String(round.round_number ?? round.id);
  return round.program_slug && PREFIXED_PROGRAMS.has(round.program_slug)
    ? `${round.program_slug}-${base}`
    : base;
}

/** IG Free briefly used the unscoped key; keep its earlier sends deduplicated. */
export function webinarRoundKeys(round: WebinarRoundIdentity): string[] {
  const key = webinarRoundKey(round);
  const legacy = String(round.round_number ?? round.id);
  return round.program_slug === "igfreewebinar" && key !== legacy ? [key, legacy] : [key];
}

/** Shared gift pages count only people registered for this exact round. */
export function registeredGiftEmails(
  giftEmails: Iterable<string>,
  registrationEmails: Iterable<string>,
): string[] {
  const registered = new Set(
    [...registrationEmails].map((email) => email.trim().toLowerCase()).filter(Boolean),
  );
  return [
    ...new Set(
      [...giftEmails]
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email && registered.has(email)),
    ),
  ];
}
