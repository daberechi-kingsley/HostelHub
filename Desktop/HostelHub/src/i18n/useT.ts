import { useLangStore } from './store';
import { translations, type TranslationKey } from './translations';

/**
 * Returns a translate function bound to the current language.
 * Falls back to English, then to the raw key, so a missing string is never
 * blank on screen.
 */
export function useT() {
  const lang = useLangStore((s) => s.lang);
  return (key: TranslationKey): string =>
    translations[lang][key] ?? translations.en[key] ?? key;
}
