import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import EmptyState from '@/components/feedback/EmptyState';
import { useT } from '@/i18n/useT';

export default function NotFoundPage() {
  const t = useT();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <EmptyState
        icon={<Compass className="h-12 w-12" />}
        title={t('notfound.title')}
        description={t('notfound.desc')}
        action={
          <Link to="/" className="btn-primary">
            {t('common.backToHome')}
          </Link>
        }
      />
    </div>
  );
}
