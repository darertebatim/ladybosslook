import { test, expect } from 'bun:test';
import { paymentAmountInCents, paymentMethodLabel } from './manualPayment';

test('manual amounts are stored in cents without rounding away decimals', () => {
  expect(paymentAmountInCents('1200')).toBe(120000);
  expect(paymentAmountInCents('12.34')).toBe(1234);
  expect(paymentAmountInCents('0.01')).toBe(1);
});
test('zero, negative and over-precision payments are rejected', () => {
  for (const value of ['0', '-10', '1.234', 'NaN', '21474836.48']) {
    expect(() => paymentAmountInCents(value)).toThrow();
  }
});
test('Zelle and Interac records retain their method labels', () => {
  expect(paymentMethodLabel('zelle')).toBe('Zelle');
  expect(paymentMethodLabel('interac')).toBe('Interac e-Transfer');
});