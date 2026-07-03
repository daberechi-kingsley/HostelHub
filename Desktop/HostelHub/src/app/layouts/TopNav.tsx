import { Link, NavLink } from 'react-router-dom';
import { Heart, Home, LayoutDashboard, MessageCircle, Search } from 'lucide-react';
import { clsx } from 'clsx';
import AccountMenu from '@/features/auth/AccountMenu';
import LanguageSwitcher from '@/features/i18n/LanguageSwitcher';
import { useT } from '@/i18n/useT';
import { useUser } from '@/hooks/useUser';

function navCls({ isActive }: { isActive: boolean }) {
  return clsx(
    'flex items-center gap-1.5 text-sm font-medium transition-colors',
    isActive ? 'text-primary' : 'text-text hover:text-primary',
  );
}

export default function TopNav() {
  const t = useT();
  const { appUser } = useUser();
  const isLandlord = appUser?.role === 'landlord' || appUser?.role === 'agent';
  const isAdmin = appUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg-card/95 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white">
            <Home className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="font-heading text-lg font-bold tracking-tight">
            HostelHub
            <span className="ml-1 text-xs font-medium uppercase text-text-muted">Buea</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <nav className="hidden items-center gap-6 sm:flex">
            {/* Listings — visible to everyone */}
            <NavLink to="/search" className={navCls}>
              <Search className="h-4 w-4" />
              {t('nav.browse')}
            </NavLink>

            {isAdmin ? (
              /* Admin nav — Listings only (dashboard is in the account menu) */
              null
            ) : isLandlord ? (
              /* Landlord / agent nav */
              <NavLink to="/dashboard" className={navCls}>
                <LayoutDashboard className="h-4 w-4" />
                {t('nav.dashboard')}
              </NavLink>
            ) : (
              /* Student / anonymous nav */
              <>
                <NavLink to="/saves" className={navCls}>
                  <Heart className="h-4 w-4" />
                  {t('nav.saves')}
                </NavLink>
                <NavLink to="/chat" className={navCls}>
                  <MessageCircle className="h-4 w-4" />
                  {t('nav.chat')}
                </NavLink>
              </>
            )}
          </nav>
          <LanguageSwitcher />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
