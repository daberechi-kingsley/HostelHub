/**
 * Admin users panel — registered users grouped by role tabs (Students / Landlords / Agents).
 * Admin accounts are excluded from the list.
 */
import { useState } from 'react';
import { GraduationCap, Building2, Briefcase, ShieldCheck, Loader2, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { useAllUsers, useSuspendUser } from './useAdminData';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/feedback/EmptyState';
import PageSpinner from '@/components/feedback/PageSpinner';
import { useT } from '@/i18n/useT';
import type { TranslationKey } from '@/i18n/translations';
import type { AppUser, UserRole } from '@/types/user';

type RoleTab = 'student' | 'landlord' | 'agent';

const ROLE_TABS: { id: RoleTab; labelKey: TranslationKey; icon: typeof Users }[] = [
  { id: 'student',  labelKey: 'role.studentLabel',  icon: GraduationCap },
  { id: 'landlord', labelKey: 'role.landlordLabel', icon: Building2 },
  { id: 'agent',    labelKey: 'role.agentLabel',    icon: Briefcase },
];

const ROLE_META: Record<UserRole, { labelKey: TranslationKey; icon: typeof Users }> = {
  student:  { labelKey: 'role.student',       icon: GraduationCap },
  landlord: { labelKey: 'role.landlordShort', icon: Building2 },
  agent:    { labelKey: 'role.agentShort',    icon: Briefcase },
  admin:    { labelKey: 'role.admin',         icon: ShieldCheck },
};

function UserRow({ user }: { user: AppUser }) {
  const t = useT();
  const suspend = useSuspendUser();
  const meta = ROLE_META[user.role] ?? ROLE_META.student;
  const Icon = meta.icon;
  const isSuspended = Boolean(user.suspended);
  const initial = (user.displayName || 'U').charAt(0).toUpperCase();

  return (
    <li className="flex items-center gap-3 rounded-card border border-border bg-bg-card p-4">
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">
          {initial}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold text-text">{user.displayName || 'Unnamed user'}</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-text-muted">
            <Icon className="h-3 w-3" />
            {t(meta.labelKey)}
          </span>
          {user.verified && (
            <ShieldCheck className="h-3.5 w-3.5 text-verified" strokeWidth={2.5} />
          )}
          {isSuspended && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent-700">
              {t('admin.suspended')}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-text-muted">{user.email ?? 'No email on file'}</p>
      </div>

      <Button
        variant={isSuspended ? 'secondary' : 'ghost'}
        size="sm"
        disabled={suspend.isPending}
        className={clsx(!isSuspended && 'text-accent-700 hover:bg-accent-50')}
        onClick={() => suspend.mutate({ uid: user.uid, suspended: !isSuspended })}
      >
        {suspend.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isSuspended ? (
          t('admin.unsuspend')
        ) : (
          t('admin.suspend')
        )}
      </Button>
    </li>
  );
}

export default function UsersList() {
  const t = useT();
  const { data: users, isLoading, isError } = useAllUsers();
  const [roleTab, setRoleTab] = useState<RoleTab>('student');

  if (isLoading) return <PageSpinner />;

  if (isError) {
    return (
      <EmptyState
        title={t('admin.noUsersTitle')}
        description={t('admin.noUsersDesc')}
      />
    );
  }

  // Filter out admin accounts entirely
  const nonAdminUsers = (users ?? []).filter((u) => u.role !== 'admin');
  const filtered = nonAdminUsers.filter((u) => u.role === roleTab);

  if (nonAdminUsers.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-10 w-10" />}
        title={t('admin.noUsersTitle')}
        description={t('admin.noUsersDesc')}
      />
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-text-muted">
        {nonAdminUsers.length} {t('admin.usersCount')}
      </p>

      {/* Role tabs */}
      <div className="mb-5 flex gap-2 overflow-x-auto">
        {ROLE_TABS.map(({ id, labelKey, icon: TabIcon }) => {
          const count = nonAdminUsers.filter((u) => u.role === id).length;
          const active = roleTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setRoleTab(id)}
              className={clsx(
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition',
                active
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-bg-hover text-text-muted hover:bg-border',
              )}
            >
              <TabIcon className="h-4 w-4" />
              {t(labelKey)}
              <span className={clsx(
                'ml-1 rounded-full px-1.5 py-0.5 text-xs font-bold',
                active ? 'bg-white/20 text-white' : 'bg-bg text-text-muted',
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title={`No ${roleTab}s yet`}
          description={`No users have registered as ${roleTab}s.`}
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((user) => (
            <UserRow key={user.uid} user={user} />
          ))}
        </ul>
      )}
    </div>
  );
}
