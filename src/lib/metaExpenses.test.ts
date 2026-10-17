import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { totalSpend, validDateRange } from '../../supabase/functions/meta-ad-expenses/report';

test('Meta campaign costs use major currency units and sum exactly', () => {
  assert.equal(totalSpend([
    { campaign_id: '1', campaign_name: 'A', spend: '120.23', date_start: '2026-10-01', date_stop: '2026-10-16' },
    { campaign_id: '2', campaign_name: 'B', spend: '50.10', date_start: '2026-10-01', date_stop: '2026-10-16' },
  ]), 170.33);
  assert.equal(totalSpend([]), 0);
});
test('Expense date filters reject invalid and reversed dates', () => {
  assert.equal(validDateRange('2026-10-01', '2026-10-16'), true);
  assert.equal(validDateRange('2026-10-16', '2026-10-01'), false);
  assert.equal(validDateRange('2026-02-30', '2026-10-16'), false);
});