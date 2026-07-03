/**
 * /profile — the signed-in user's profile.
 *
 *  • Header: photo (click to upload), name, email, role, verified badge, bio
 *  • Inline edit: full name, phone, bio → saved to Firestore
 *  • Students:  roommate-preference summary + saved rooms grid
 *  • Landlords/agents: active-listing count
 *
 * Photo uploads degrade gracefully if Storage isn't enabled (clear message,
 * never an infinite spinner — see features/profile/api.ts).
 */
import { useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Loader2,
  Pencil,
  Check,
  AlertCircle,
  Mail,
  Phone,
  Building2,
  Briefcase,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useUser } from '@/hooks/useUser';
import { useAuthModalStore } from '@/stores/authModalStore';
import { useUpdateProfile, useUploadProfilePhoto } from '@/features/profile/hooks';
import { ProfilePhotoError } from '@/features/profile/api';
import { useSaves } from '@/features/saves/useSaves';
import { useListingsByIds } from '@/features/listings/hooks';
import { useMyListings } from '@/features/landlord/hooks';
import { useMyRoommateProfile } from '@/features/roommate/hooks';
import ListingGrid from '@/features/listings/ListingGrid';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import Button from '@/components/ui/Button';
import PageSpinner from '@/components/feedback/PageSpinner';
import { formatFcfa } from '@/lib/format/money';
import {
  LIFESTYLE_LABEL,
  CLEANLINESS_LABEL,
  STUDY_LABEL,
  LOOKING_FOR_LABEL,
} from '@/types/roommate';

const ROLE_LABEL: Record<string, string> = {
  student: 'Student',
  landlord: 'Landlord',
  agent: 'Agent',
  admin: 'Admin',
};

export default function ProfilePage() {
  const { appUser, firebaseUser, loading, isSignedIn } = useUser();
  const showAuth = useAuthModalStore((s) => s.show);

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (loading) return <PageSpinner />;

  if (!isSignedIn || !appUser) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="font-heading text-2xl font-bold">Your profile</h1>
        <p className="mt-2 max-w-sm text-text-muted">
          Sign in to view and edit your HostelHub profile.
        </p>
        <Button variant="primary" size="lg" className="mt-6" onClick={() => showAuth('signin')}>
          Sign in
        </Button>
      </div>
    );
  }

  const isStudent = appUser.role === 'student';
  const isOwner = appUser.role === 'landlord' || appUser.role === 'agent';

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      <h1 className="font-heading text-2xl font-bold">My profile</h1>

      <ProfileHeader />

      {isStudent && <RoommatePreferences />}
      {isStudent && <SavedRooms />}
      {isOwner && <ActiveListings />}
    </div>
  );

  // ── Header card with photo + identity + inline edit ────────────────────────
  function ProfileHeader() {
    const photo = useUploadProfilePhoto();
    const update = useUpdateProfile();
    const fileRef = useRef<HTMLInputElement>(null);

    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(appUser!.displayName ?? '');
    const [phone, setPhone] = useState(appUser!.phone ?? '');
    const [bio, setBio] = useState(appUser!.bio ?? '');

    const email = appUser!.email ?? firebaseUser!.email ?? '—';
    const initial = (appUser!.displayName || 'U').charAt(0).toUpperCase();

    function onPickPhoto(e: ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      e.target.value = ''; // allow re-picking the same file
      if (file) photo.mutate(file);
    }

    function onSave() {
      if (!name.trim()) return;
      update.mutate(
        { displayName: name, phone, bio },
        { onSuccess: () => setEditing(false) },
      );
    }

    function onCancel() {
      setName(appUser!.displayName ?? '');
      setPhone(appUser!.phone ?? '');
      setBio(appUser!.bio ?? '');
      setEditing(false);
      update.reset();
    }

    const photoError =
      photo.error instanceof ProfilePhotoError
        ? photo.error.message
        : photo.error
          ? 'Could not upload the photo. Please try again.'
          : null;

    const RoleIcon = ROLE_ICON[appUser!.role] ?? GraduationCap;

    return (
      <section className="mt-5 overflow-hidden rounded-card border border-border bg-bg-card shadow-card">
        {/* Gradient cover banner */}
        <div className="h-28 bg-gradient-to-br from-primary via-primary-700 to-accent sm:h-32" />

        <div className="px-5 pb-6 sm:px-6">
          {/* Avatar overlapping the cover */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={photo.isPending}
              className="group relative -mt-16 h-32 w-32 overflow-hidden rounded-full bg-bg-hover shadow-lg ring-4 ring-bg-card sm:-mt-20"
              aria-label="Change profile photo"
            >
              {appUser!.avatarUrl ? (
                <img
                  src={appUser!.avatarUrl}
                  alt={appUser!.displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/20 to-accent/20 text-4xl font-bold text-primary">
                  {initial}
                </span>
              )}
              {/* Hover / loading overlay */}
              <span
                className={clsx(
                  'absolute inset-0 grid place-items-center bg-black/45 text-white transition-opacity',
                  photo.isPending ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                )}
              >
                {photo.isPending ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Camera className="h-6 w-6" />
                )}
              </span>
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={photo.isPending}
              className="mt-2 text-xs font-medium text-primary hover:text-primary-700"
            >
              {photo.isPending ? 'Uploading…' : 'Change photo'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickPhoto}
            />
          </div>

          {/* Identity / edit form */}
          <div className="w-full">
            {!editing ? (
              <>
                {/* Name + role */}
                <div className="mt-3 flex flex-col items-center">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <h2 className="font-heading text-2xl font-bold">{appUser!.displayName}</h2>
                    {appUser!.verified && <VerifiedBadge />}
                  </div>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <RoleIcon className="h-3.5 w-3.5" />
                    {ROLE_LABEL[appUser!.role] ?? appUser!.role}
                  </span>
                </div>

                {/* Contact details */}
                <div className="mx-auto mt-6 w-full max-w-sm space-y-2.5">
                  <InfoRow icon={Mail}>
                    <span className="break-all">{email}</span>
                  </InfoRow>
                  <InfoRow icon={Phone}>
                    {appUser!.phone || (
                      <span className="italic text-text-muted">No phone added</span>
                    )}
                  </InfoRow>
                </div>

                {/* About */}
                <div className="mx-auto mt-4 w-full max-w-sm rounded-2xl bg-bg p-4 text-left">
                  <p className="text-2xs font-semibold uppercase tracking-wide text-text-subtle">
                    About
                  </p>
                  <p className="mt-1 text-sm">
                    {appUser!.bio ? (
                      appUser!.bio
                    ) : (
                      <span className="italic text-text-muted">
                        No bio yet — tap “Edit profile” to add one.
                      </span>
                    )}
                  </p>
                </div>

                <div className="mx-auto mt-5 w-full max-w-sm">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    leftIcon={<Pencil className="h-4 w-4" />}
                    onClick={() => setEditing(true)}
                  >
                    Edit profile
                  </Button>
                </div>
              </>
            ) : (
              <div className="mx-auto mt-5 w-full max-w-sm space-y-3 text-left">
                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="pf-name">
                    Full name
                  </label>
                  <input
                    id="pf-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                    className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="pf-phone">
                    Phone number
                  </label>
                  <input
                    id="pf-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 6 78 12 34 56"
                    maxLength={20}
                    className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="pf-bio">
                    Bio
                  </label>
                  <textarea
                    id="pf-bio"
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={300}
                    placeholder="A short line about you."
                    className="w-full resize-none rounded-xl border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                  <p className="mt-1 text-right text-xs text-text-muted">{bio.length}/300</p>
                </div>

                {update.isError && (
                  <p className="flex items-center gap-1.5 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Couldn't save your changes. Please try again.
                  </p>
                )}

                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={onCancel} disabled={update.isPending}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={onSave}
                    disabled={update.isPending || !name.trim()}
                  >
                    {update.isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                      </span>
                    ) : (
                      'Save changes'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Photo / save feedback */}
          <div className="mx-auto w-full max-w-sm">
            {photoError && (
              <p className="mt-4 flex items-start gap-1.5 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {photoError}
              </p>
            )}
            {photo.isSuccess && (
              <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <Check className="h-4 w-4 shrink-0" />
                Profile photo updated.
              </p>
            )}
            {update.isSuccess && !editing && (
              <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <Check className="h-4 w-4 shrink-0" />
                Profile saved.
              </p>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ── Student: roommate preferences ──────────────────────────────────────────
  function RoommatePreferences() {
    const { data: profile, isLoading } = useMyRoommateProfile();

    return (
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">Roommate preferences</h2>
          <Link
            to="/roommate"
            className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-700"
          >
            {profile ? 'Edit' : 'Set up'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        ) : !profile ? (
          <div className="rounded-card border border-dashed border-border bg-bg-card p-5 text-center text-sm text-text-muted">
            You haven't set up roommate matching yet.{' '}
            <Link to="/roommate" className="font-semibold text-primary">
              Find a flatmate →
            </Link>
          </div>
        ) : (
          <div className="rounded-card border border-border bg-bg-card p-5">
            <div className="flex flex-wrap gap-2">
              <Chip>{LIFESTYLE_LABEL[profile.lifestyle]}</Chip>
              <Chip>{CLEANLINESS_LABEL[profile.cleanliness]}</Chip>
              <Chip>{STUDY_LABEL[profile.studyHabits]}</Chip>
              <Chip>{LOOKING_FOR_LABEL[profile.lookingFor]}</Chip>
            </div>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-text-muted">Budget</dt>
                <dd className="font-medium">
                  {formatFcfa(profile.budgetMin)} – {formatFcfa(profile.budgetMax)} / yr
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Preferred zones</dt>
                <dd className="font-medium">
                  {profile.preferredZones.length ? profile.preferredZones.join(', ') : '—'}
                </dd>
              </div>
              {(profile.faculty || profile.courseYear) && (
                <div>
                  <dt className="text-text-muted">Study</dt>
                  <dd className="font-medium">
                    {[profile.courseYear, profile.faculty].filter(Boolean).join(' · ') || '—'}
                  </dd>
                </div>
              )}
            </dl>
            {profile.bio && (
              <p className="mt-3 border-t border-border pt-3 text-sm italic text-text-muted">
                "{profile.bio}"
              </p>
            )}
          </div>
        )}
      </section>
    );
  }

  // ── Student: saved rooms ────────────────────────────────────────────────────
  function SavedRooms() {
    const { savedIds } = useSaves();
    const { data: saved, isLoading, isError } = useListingsByIds(savedIds);

    return (
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">
            Saved rooms{savedIds.length ? ` (${savedIds.length})` : ''}
          </h2>
          <Link
            to="/saves"
            className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-700"
          >
            See all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <ListingGrid
          listings={savedIds.length === 0 ? [] : saved}
          loading={savedIds.length > 0 && isLoading}
          error={isError}
          columns={3}
          emptyTitle="No saved rooms yet"
          emptyDescription="Tap the heart on any listing to keep it here."
          emptyAction={
            <Link to="/search" className="btn-primary">
              Browse listings
            </Link>
          }
        />
      </section>
    );
  }

  // ── Landlord / agent: active listings count ─────────────────────────────────
  function ActiveListings() {
    const { data: listings, isLoading } = useMyListings();
    const total = listings?.length ?? 0;
    const active = listings?.filter((l) => l.status === 'active').length ?? 0;

    return (
      <section className="mt-6">
        <h2 className="mb-3 font-heading text-lg font-bold">Your listings</h2>
        <Link
          to="/dashboard"
          className="flex items-center justify-between rounded-card border border-border bg-bg-card p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </span>
            <div>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
              ) : (
                <p className="text-2xl font-bold leading-none tabular-nums">
                  {active}
                  <span className="ml-1 text-sm font-medium text-text-muted">
                    active {active === 1 ? 'listing' : 'listings'}
                  </span>
                </p>
              )}
              <p className="mt-1 text-xs text-text-muted">{total} total · manage in dashboard</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-text-muted" />
        </Link>
      </section>
    );
  }
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border px-2.5 py-0.5 text-xs">{children}</span>
  );
}

/** Per-role icon for the role pill. */
const ROLE_ICON: Record<string, React.ElementType> = {
  student: GraduationCap,
  landlord: Building2,
  agent: Briefcase,
  admin: GraduationCap,
};

/** A contact-detail line: tinted icon chip + value. */
function InfoRow({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 text-sm">{children}</span>
    </div>
  );
}
