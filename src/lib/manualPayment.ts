export const manualPaymentMethods = {
  zelle: 'Zelle', interac: 'Interac e-Transfer', wire_transfer: 'Wire transfer',
  cash: 'Cash', paypal: 'PayPal', other: 'Other',
} as const;

export function paymentAmountInCents(value: string): number {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) throw new Error('Enter an amount with up to two decimal places');
  const [whole, fraction = ''] = value.trim().split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 2147483647) throw new Error('Enter a valid positive amount');
  return cents;
}

export function paymentMethodLabel(method: string | null | undefined): string {
  return method && method in manualPaymentMethods
    ? manualPaymentMethods[method as keyof typeof manualPaymentMethods]
    : method || 'Stripe';
}