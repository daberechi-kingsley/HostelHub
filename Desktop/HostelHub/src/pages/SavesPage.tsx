import { Link } from 'react-router-dom';
import { useSaves } from '@/features/saves/useSaves';
import { useListingsByIds } from '@/features/listings/hooks';
import ListingGrid from '@/features/listings/ListingGrid';
import { useUser } from '@/hooks/useUser';
import { useT } from '@/i18n/useT';

export default function SavesPage() {
  const t = useT();
  const { savedIds: ids } = useSaves();
  const { isSignedIn } = useUser();
  const { data: saved, isLoading, isError } = useListingsByIds(ids);

  return (
    <div className="px-4 pb-12 pt-6 sm:px-6">
      <h1 className="font-heading text-2xl font-bold">{t('saves.title')}</h1>
      <p className="mt-1 text-sm text-text-muted">
        {isSignedIn ? t('saves.subtitleSignedIn') : t('saves.subtitleAnon')}
      </p>

      <div className="mt-6">
        <ListingGrid
          listings={ids.length === 0 ? [] : saved}
          loading={ids.length > 0 && isLoading}
          error={isError}
          columns={3}
          emptyTitle={t('saves.emptyTitle')}
          emptyDescription={t('saves.emptyDesc')}
          emptyAction={
            <Link to="/search" className="btn-primary">
              {t('saves.browse')}
            </Link>
          }
        />
      </div>
    </div>
  );
}
