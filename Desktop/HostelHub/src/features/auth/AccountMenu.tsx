import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LogOut,
  User as UserIcon,
  ShieldCheck,
  ChevronDown,
  LayoutDashboard,
  Building2,
  Users,
  Moon,
  Sun,
} from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useAuthModalStore } from '@/stores/authModalStore';
import { signOutUser } from '@/lib/firebase/auth';
import { useT } from '@/i18n/useT';
import type { TranslationKey } from '@/i18n/translations';
import { useThemeStore } from '@/theme/store';

const ROLE_LABEL: Record<string, TranslationKey> = {
  student: 'role.student',
  landlord: 'role.landlordShort',
  agent: 'role.agentShort',
  admin: 'role.admin',
};

export default function AccountMenu() {
  const t = useT();
  const { isSignedIn, appUser, loading } = useUser();
  const isAdmin = useIsAdmin();
  const showAuth = useAuthModalStore((s) => s.show);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (loading) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-bg-hover" />;
  }

  if (!isSignedIn || !appUser) {
    return (
      <button
        type="button"
        onClick={() => showAuth('signin')}
        className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
      >
        {t('nav.signIn')}
      </button>
    );
  }

  const initial = (appUser.displayName || 'U').charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-border bg-bg-card py-1 pl-1 pr-2 transition-colors hover:bg-bg-hover"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {appUser.avatarUrl ? (
          <img src={appUser.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-white">
            {initial}
          </span>
        )}
        <ChevronDown className="h-4 w-4 text-text-muted" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-bg-card p-1.5 shadow-card-hover"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold">{appUser.displayName}</p>
            <p className="flex items-center gap-1 text-xs text-text-muted">
              {ROLE_LABEL[appUser.role] ? t(ROLE_LABEL[appUser.role]!) : appUser.role}
              {appUser.verified && (
                <ShieldCheck className="h-3.5 w-3.5 text-verified" strokeWidth={2.5} />
              )}
            </p>
          </div>
          <div className="my-1 h-px bg-border" />
          <Link
            to="/profile"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text hover:bg-bg-hover"
            onClick={() => setOpen(false)}
          >
            <UserIcon className="h-4 w-4" />
            {t('account.myProfile')}
          </Link>

          {appUser.role === 'student' && (
            <Link
              to="/roommate"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text hover:bg-bg-hover"
              onClick={() => setOpen(false)}
            >
              <Users className="h-4 w-4" />
              {t('account.findRoommate')}
            </Link>
          )}

          {(appUser.role === 'landlord' || appUser.role === 'agent') && (
            <>
              <Link
                to="/dashboard"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text hover:bg-bg-hover"
                onClick={() => setOpen(false)}
              >
                <Building2 className="h-4 w-4" />
                {t('account.dashboard')}
              </Link>
              <Link
                to="/verify"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text hover:bg-bg-hover"
                onClick={() => setOpen(false)}
              >
                <ShieldCheck className="h-4 w-4" />
                {appUser.verified ? t('account.verification') : t('account.getVerified')}
              </Link>
            </>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard className="h-4 w-4" />
              {t('account.adminDashboard')}
            </Link>
          )}

          <div className="my-1 h-px bg-border" />

          {/* Theme toggle — shared by every role. Keeps the menu open so the
              switch is visible immediately. */}
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={theme === 'dark'}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text hover:bg-bg-hover"
            onClick={() => toggleTheme()}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? t('account.lightMode') : t('account.darkMode')}
          </button>

          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-accent-700 hover:bg-accent-50"
            onClick={async () => {
              setOpen(false);
              await signOutUser();
            }}
          >
            <LogOut className="h-4 w-4" />
            {t('account.signOut')}
          </button>
        </div>
      )}
    </div>
  );
}
