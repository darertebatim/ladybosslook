import { useEffect, useState } from 'react';

const KEY = 'admin_test_email';
export const DEFAULT_TEST_EMAIL = 'darertebatim@gmail.com';
export const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

/** Admin "send test" recipient, remembered in this browser and shared by all campaign tabs. */
export function useTestEmailAddress() {
  const [email, setEmail] = useState<string>(() => localStorage.getItem(KEY) || DEFAULT_TEST_EMAIL);
  useEffect(() => {
    if (isValidEmail(email)) localStorage.setItem(KEY, email.trim().toLowerCase());
  }, [email]);
  return [email, setEmail] as const;
}
