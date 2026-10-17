export interface CampaignExpense {
  campaign_id: string;
  campaign_name: string;
  spend: string;
  date_start: string;
  date_stop: string;
}

export function validDateRange(since: unknown, until: unknown): since is string {
  const validDate = (value: unknown) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  };
  return validDate(since) && validDate(until) && String(since) <= String(until);
}

export function totalSpend(rows: CampaignExpense[]): number {
  return rows.reduce((sum, row) => sum + Math.round(Number(row.spend) * 100), 0) / 100;
}