import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lang } from './translations';

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
}

/** Reflect the active language on <html lang> for a11y + browser hints. */
function applyHtmlLang(lang: Lang) {
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
}

/**
 * App language, persisted to localStorage so the choice survives reloads.
 * Only two languages for now (Cameroon: English / French), so `toggle` flips
 * between them.
 */
export const useLangStore = create<LangState>()(
  persist(
    (set, get) => ({
      lang: 'en',
      setLang: (lang) => {
        applyHtmlLang(lang);
        set({ lang });
      },
      toggle: () => get().setLang(get().lang === 'en' ? 'fr' : 'en'),
    }),
    {
      name: 'hh-lang',
      onRehydrateStorage: () => (state) => {
        if (state) applyHtmlLang(state.lang);
      },
    },
  ),
);
