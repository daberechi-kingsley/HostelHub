import { useContext, useState } from 'react';
import { GraduationCap, Home, Briefcase, Loader2, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useUser } from '@/hooks/useUser';
import { AuthContext } from '@/app/providers/AuthProvider';
import { createUserDoc, signOutUser } from '@/lib/firebase/auth';
import Button from '@/components/ui/Button';
import { ADMIN_EMAILS } from '@/config/constants';
import { useT } from '@/i18n/useT';
import type { TranslationKey } from '@/i18n/translations';
import type { UserRole } from '@/types/user';

type SelectableRole = Exclude<UserRole, 'admin'>;

const ROLES: {
  role: SelectableRole;
  labelKey: TranslationKey;
  blurbKey: TranslationKey;
  icon: typeof Home;
}[] = [
  {
    role: 'student',
    labelKey: 'role.studentLabel',
    blurbKey: 'role.studentBlurb',
    icon: GraduationCap,
  },
  {
    role: 'landlord',
    labelKey: 'role.landlordLabel',
    blurbKey: 'role.landlordBlurb',
    icon: Home,
  },
  {
    role: 'agent',
    labelKey: 'role.agentLabel',
    blurbKey: 'role.agentBlurb',
    icon: Briefcase,
  },
];

/**
 * Blocking gate shown right after a user's first sign-in, before they have a
 * HostelHub user doc. They must pick a role — this creates users/{uid}.
 */
export default function RoleSelection() {
  const t = useT();
  const { needsRoleSelection, firebaseUser } = useUser();
  const { refreshAppUser } = useContext(AuthContext);
  const [selected, setSelected] = useState<SelectableRole | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!needsRoleSelection || !firebaseUser) return null;

  // The admin signs in via the email path, which provisions their user doc
  // directly — they never pick a role. Suppress the picker for the admin email
  // so it doesn't flash while that doc is being written/loaded.
  const email = firebaseUser.email;
  if (email && ADMIN_EMAILS.includes(email)) return null;

  async function handleConfirm() {
    if (!selected || !firebaseUser) return;
    setBusy(true);
    setError(null);
    try {
      await createUserDoc({
        uid: firebaseUser.uid,
        role: selected,
        displayName: firebaseUser.displayName ?? 'New user',
        phone: firebaseUser.phoneNumber ?? undefined,
        email: firebaseUser.email ?? undefined,
        avatarUrl: firebaseUser.photoURL ?? undefined,
      });
      await refreshAppUser();
    } catch (err) {
      console.error('[RoleSelection] failed to create user doc', err);
      setError(t('role.saveError'));
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-modal-title"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center"
    >
      <div className="w-full max-w-md rounded-t-3xl bg-bg-card p-6 shadow-xl sm:rounded-3xl">
        {/* Header row with title + close button */}
        <div className="flex items-start justify-between">
          <div className="pr-8">
            <h2 id="role-modal-title" className="font-heading text-xl font-bold">
              {t('role.welcome')}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {t('role.question')}
            </p>
          </div>
          {/* X closes modal by signing out — returns user to anonymous browsing */}
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => signOutUser()}
            className="shrink-0 rounded-full p-1.5 text-text-muted hover:bg-bg-hover"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-2.5">
          {ROLES.map(({ role, labelKey, blurbKey, icon: Icon }) => {
            const active = selected === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => setSelected(role)}
                className={clsx(
                  'flex w-full items-start gap-3 rounded-xl border p-4 text-left transition',
                  active
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-bg hover:bg-bg-hover',
                )}
                aria-pressed={active}
              >
                <span
                  className={clsx(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-lg',
                    active ? 'bg-primary text-white' : 'bg-bg-hover text-text-muted',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-heading text-sm font-semibold">{t(labelKey)}</span>
                  <span className="mt-0.5 block text-xs text-text-muted">{t(blurbKey)}</span>
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
            {error}
          </p>
        )}

        <div className="mt-5">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            disabled={!selected || busy}
            onClick={handleConfirm}
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : t('role.continue')}
          </Button>
        </div>
      </div>
    </div>
  );
}
