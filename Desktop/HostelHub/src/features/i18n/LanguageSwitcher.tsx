import { Globe } from 'lucide-react';
import { useLangStore } from '@/i18n/store';

/**
 * Compact globe toggle for the bilingual (EN / FR) market. One tap flips
 * between English and French; the choice persists across reloads.
 */
export default function LanguageSwitcher() {
  const lang = useLangStore((s) => s.lang);
  const toggle = useLangStore((s) => s.toggle);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={lang === 'en' ? 'Passer en français' : 'Switch to English'}
      title={lang === 'en' ? 'Français' : 'English'}
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-bg-card px-2.5 py-1.5 text-xs font-semibold text-text transition-colors hover:bg-bg-hover"
    >
      <Globe className="h-4 w-4" />
      {lang.toUpperCase()}
    </button>
  );
}
