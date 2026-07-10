import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Heart, MessageCircle, LayoutDashboard } from 'lucide-react';
import { clsx } from 'clsx';
import type { LucideProps } from 'lucide-react';
import { useT } from '@/i18n/useT';
import { useUser } from '@/hooks/useUser';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import type { TranslationKey } from '@/i18n/translations';

interface NavItem {
  to: string;
  tKey: TranslationKey;
  icon: ComponentType<LucideProps>;
  end?: boolean;
  filled?: boolean;
}

const STUDENT_ITEMS: NavItem[] = [
  { to: '/',       tKey: 'nav.home',   icon: Home,          end: true },
  { to: '/search', tKey: 'nav.search', icon: Search },
  { to: '/saves',  tKey: 'nav.saves',  icon: Heart,         filled: true },
  { to: '/chat',   tKey: 'nav.chat',   icon: MessageCircle },
];

const LANDLORD_ITEMS: NavItem[] = [
  { to: '/',          tKey: 'nav.home',      icon: Home,            end: true },
  { to: '/search',    tKey: 'nav.search',    icon: Search },
  { to: '/dashboard', tKey: 'nav.dashboard', icon: LayoutDashboard },
];

const ADMIN_ITEMS: NavItem[] = [
  { to: '/',      tKey: 'nav.home',   icon: Home,            end: true },
  { to: '/search', tKey: 'nav.search', icon: Search },
  { to: '/admin', tKey: 'nav.dashboard', icon: LayoutDashboard },
];

export default function BottomNav() {
  const t = useT();
  const { appUser } = useUser();
  const isAdmin = useIsAdmin();
  const isLandlord = appUser?.role === 'landlord' || appUser?.role === 'agent';
  const items = isAdmin ? ADMIN_ITEMS : isLandlord ? LANDLORD_ITEMS : STUDENT_ITEMS;

  return (
    <nav
      className="sticky bottom-0 z-30 border-t border-border bg-bg-card/95 backdrop-blur sm:hidden"
      aria-label="Primary"
    >
      <ul className="flex items-center justify-around px-2 py-1.5">
        {items.map(({ to, tKey, icon: Icon, end, filled }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-0.5 px-4 py-1.5 text-xs transition-colors',
                  isActive ? 'text-primary' : 'text-text-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="h-5 w-5"
                    strokeWidth={isActive ? 2.5 : 2}
                    fill={isActive && filled ? 'currentColor' : 'none'}
                  />
                  {t(tKey)}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
