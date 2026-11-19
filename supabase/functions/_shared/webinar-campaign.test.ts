import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { registeredGiftEmails, webinarRoundKey, webinarRoundKeys } from './webinar-campaign.ts';

const igFreeRound = { id: 'd1b24c2c-56db-417d-ac34-a376639ed8cf', program_slug: 'igfreewebinar', round_number: 1 };

test('IG Free round 1 does not share delivery dedupe with IG Ads round 1', () => {
  assert.equal(webinarRoundKey(igFreeRound), 'igfreewebinar-1');
  assert.equal(webinarRoundKey({ ...igFreeRound, program_slug: 'igadsfree' }), '1');
});

test('IG Free still recognizes its earlier unscoped reminder delivery', () => {
  assert.deepEqual(webinarRoundKeys(igFreeRound), ['igfreewebinar-1', '1']);
});

test('shared gift submissions only count registrants from the selected round', () => {
  assert.deepEqual(
    registeredGiftEmails(
      ['Live@Example.com', 'other@example.com', 'live@example.com'],
      ['live@example.com', 'registered-no-gift@example.com'],
    ),
    ['live@example.com'],
  );
});
