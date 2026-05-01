/**
 * i18n setup — light, content-only translation for inside-app pages.
 *
 * Scope (Phase 1): Home, Planner, Tools (Breathe / Mood / Reflections),
 * Settings, Profile. Auth + onboarding stay in English.
 *
 * Default: English. Users opt into Persian via the Home hamburger menu.
 * Choice persists in localStorage under `rilo_language`.
 *
 * No `dir="rtl"` on the document — the app shell stays LTR. Persian text
 * inside paragraphs/cards reads naturally because of inline RTL handling
 * where needed. Vazirmatn font auto-applies to Farsi script glyphs.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import fa from './locales/fa.json';

export const SUPPORTED_LANGUAGES = ['en', 'fa'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

const STORAGE_KEY = 'rilo_language';

function getInitialLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'fa' || saved === 'en') return saved;
  } catch {
    // ignore
  }
  // Default per product decision: always English by default; Persian opt-in.
  return 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fa: { translation: fa },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export function setAppLanguage(lang: SupportedLanguage) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
  i18n.changeLanguage(lang);
  // Tag the <html> element so we can scope a Farsi-friendly font without
  // forcing full RTL on the whole app.
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-lang', lang);
  }
}

// Apply on boot so the font tag is set before first paint settles.
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-lang', i18n.language);
}

export default i18n;