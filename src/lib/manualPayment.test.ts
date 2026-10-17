import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { paymentAmountInCents, paymentMethodLabel } from './manualPayment';

test('manual amounts are stored in cents without rounding away decimals', () => {
  assert.equal(paymentAmountInCents('1200'), 120000);
  assert.equal(paymentAmountInCents('12.34'), 1234);
  assert.equal(paymentAmountInCents('0.01'), 1);
});
test('zero, negative and over-precision payments are rejected', () => {
  for (const value of ['0', '-10', '1.234', 'NaN', '21474836.48']) {
    assert.throws(() => paymentAmountInCents(value));
  }
});
test('Zelle and Interac records retain their method labels', () => {
  assert.equal(paymentMethodLabel('zelle'), 'Zelle');
  assert.equal(paymentMethodLabel('interac'), 'Interac e-Transfer');
});