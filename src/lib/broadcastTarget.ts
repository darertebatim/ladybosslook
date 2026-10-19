/** Copies require a fresh target selection before they can be sent. */
export function hasBroadcastTarget(program: string, presetId: string | null): boolean {
  return Boolean(program || presetId);
}