/**
 * Top-of-screen banner shown when a new service worker has downloaded and is
 * waiting to activate. Tapping it calls skipWaiting() on the new SW and reloads,
 * so the user gets the new bundle on demand instead of being reloaded silently
 * mid-search or mid-chat.
 *
 * Works identically in a browser tab and in the installed PWA — both go through
 * the same navigator.serviceWorker.controller lifecycle.
 *
 * Offline is untouched: useRegisterSW still registers the SW on boot, and
 * runtime caching (fonts / images / Firestore) continues to work — only the
 * *update* moment is gated on a user tap.
 */
import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useT } from '@/i18n/useT';

export default function UpdateAvailableBanner() {
  const t = useT();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(err) {
      // A silent registration failure would still leave the banner logic wired
      // up correctly; we log so it's greppable in production consoles.
      console.error('[sw] registration failed', err);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[70] flex justify-center px-3 pt-3 sm:pt-4"
    >
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-primary/30 bg-bg-card px-4 py-3 shadow-card-hover">
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="flex flex-1 items-center gap-3 text-left"
          aria-label={t('update.available')}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <RefreshCw className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="min-w-0 text-sm font-medium text-text">
            {t('update.available')}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          aria-label={t('update.dismiss')}
          className="shrink-0 rounded-full p-1 text-text-muted hover:bg-bg-hover"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
