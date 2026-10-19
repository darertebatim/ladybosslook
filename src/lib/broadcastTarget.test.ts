import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { hasBroadcastTarget } from './broadcastTarget';

test('a copied broadcast requires choosing a new target before sending', () => {
  assert.equal(hasBroadcastTarget('', null), false);
  assert.equal(hasBroadcastTarget('all', null), true);
  assert.equal(hasBroadcastTarget('casigads', null), true);
  assert.equal(hasBroadcastTarget('', 'retoround3'), true);
});