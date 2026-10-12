/** Quote a value for CSV and neutralize spreadsheet formulas (=, +, -, @, tab, CR). */
export function csvCell(v: unknown): string {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
