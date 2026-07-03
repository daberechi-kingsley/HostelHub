/**
 * Admin verification queue — review uploaded documents, approve or reject.
 */
import { useState } from 'react';
import { CheckCircle2, Clock, ExternalLink, Loader2, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useVerificationActions, useVerificationQueue } from './useAdminData';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/feedback/EmptyState';
import PageSpinner from '@/components/feedback/PageSpinner';
import { useT } from '@/i18n/useT';
import type { VerificationRequest } from '@/types/verification';

const STATUS_STYLE: Record<VerificationRequest['status'], string> = {
  pending: 'bg-primary/10 text-primary',
  approved: 'bg-verified/10 text-verified',
  rejected: 'bg-accent/10 text-accent-700',
};

function DocLink({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5"
    >
      {label}
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

function VerificationCard({ req }: { req: VerificationRequest }) {
  const t = useT();
  const { approve, reject } = useVerificationActions();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const busy = approve.isPending || reject.isPending;

  return (
    <li className="rounded-card border border-border bg-bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-text">{req.displayName}</p>
          <p className="text-xs text-text-muted">
            {req.role === 'agent' ? t('role.agentShort') : t('role.landlordShort')} ·{' '}
            {new Date(req.submittedAt).toLocaleDateString()}
          </p>
        </div>
        <span
          className={clsx(
            'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
            STATUS_STYLE[req.status],
          )}
        >
          {req.status}
        </span>
      </div>

      {req.note && (
        <p className="mt-3 rounded-lg bg-bg px-3 py-2 text-sm text-text-muted">
          “{req.note}”
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <DocLink label={t('admin.viewIdDoc')} url={req.idDocUrl} />
        <DocLink label={t('admin.viewPropertyDoc')} url={req.propertyDocUrl} />
      </div>

      {req.status === 'rejected' && req.reviewerNote && (
        <p className="mt-3 text-sm text-accent-700">
          {t('admin.rejectedPrefix')}: {req.reviewerNote}
        </p>
      )}

      {/* Action area — only for pending requests */}
      {req.status === 'pending' && (
        <div className="mt-4 border-t border-border pt-4">
          {rejecting ? (
            <div className="space-y-2">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder={t('admin.rejectReasonVerif')}
                className="w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={busy || !reason.trim()}
                  onClick={() =>
                    reject.mutate(
                      { id: req.id, note: reason.trim() },
                      { onSuccess: () => setRejecting(false) },
                    )
                  }
                >
                  {t('admin.confirmRejection')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    setRejecting(false);
                    setReason('');
                  }}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                disabled={busy}
                leftIcon={
                  approve.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )
                }
                onClick={() => approve.mutate(req)}
              >
                {t('admin.approve')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={busy}
                leftIcon={<XCircle className="h-4 w-4" />}
                onClick={() => setRejecting(true)}
              >
                {t('admin.reject')}
              </Button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export default function VerificationQueue() {
  const t = useT();
  const { data: requests, isLoading, isError } = useVerificationQueue();

  if (isLoading) return <PageSpinner />;

  if (isError) {
    return (
      <EmptyState
        title={t('admin.noVerifsTitle')}
        description={t('admin.noVerifsDesc')}
      />
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="h-10 w-10" />}
        title={t('admin.noVerifsTitle')}
        description={t('admin.noVerifsDesc')}
      />
    );
  }

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div>
      <p className="mb-4 text-sm text-text-muted">
        {pendingCount} {t('admin.pendingWord')} · {requests.length} {t('admin.totalWord')}
      </p>
      <ul className="space-y-3">
        {requests.map((req) => (
          <VerificationCard key={req.id} req={req} />
        ))}
      </ul>
    </div>
  );
}
