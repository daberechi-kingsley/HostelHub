import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { useT } from '@/i18n/useT';

interface SearchBarProps {
  initialValue?: string;
  size?: 'hero' | 'compact';
  autoFocus?: boolean;
}

export default function SearchBar({
  initialValue = '',
  size = 'compact',
  autoFocus,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const navigate = useNavigate();
  const t = useT();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    const search = trimmed ? `?q=${encodeURIComponent(trimmed)}` : '';
    navigate(`/search${search}`);
  }

  const isHero = size === 'hero';

  return (
    <form
      onSubmit={handleSubmit}
      className={
        isHero
          ? 'flex w-full items-center gap-2 rounded-full border border-border bg-bg-card p-2 shadow-card'
          : 'flex w-full items-center gap-2 rounded-full border border-border bg-bg-card p-1.5 shadow-sm'
      }
    >
      <div className="flex flex-1 items-center gap-3 px-4">
        <Search className="h-5 w-5 shrink-0 text-text-muted" strokeWidth={2} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus={autoFocus}
          placeholder={isHero ? t('search.heroPlaceholder') : t('search.placeholder')}
          className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-subtle"
          aria-label={t('search.button')}
        />
      </div>
      <button
        type="submit"
        className="btn-primary shrink-0"
        aria-label="Search"
      >
        <Search className="h-4 w-4" strokeWidth={2.5} />
        <span className={isHero ? '' : 'hidden sm:inline'}>{t('search.button')}</span>
      </button>
    </form>
  );
}
