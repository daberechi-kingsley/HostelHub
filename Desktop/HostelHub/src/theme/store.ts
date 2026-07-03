import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

/** Toggle the `dark` class on <html> — Tailwind's darkMode: 'class' hook. */
function applyThemeClass(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

/**
 * App-wide light/dark theme, persisted to localStorage. Used everywhere via
 * the account menu toggle, so all roles (student/landlord/agent/admin) share it.
 *
 * A tiny inline script in index.html applies the saved class before first
 * paint to avoid a flash of the wrong theme; this store keeps it in sync after.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        applyThemeClass(theme);
        set({ theme });
      },
      toggle: () => get().setTheme(get().theme === 'light' ? 'dark' : 'light'),
    }),
    {
      name: 'hh-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyThemeClass(state.theme);
      },
    },
  ),
);
