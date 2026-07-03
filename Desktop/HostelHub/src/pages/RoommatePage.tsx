/**
 * /roommate — AI Roommate Matching page (Claude Sonnet 4.6)
 *
 * States:
 *   not signed in   → sign-in prompt
 *   loading profile → spinner
 *   no profile      → RoommateQuestionnaire (full-page form)
 *   has profile     → profile summary card + "Find matches" CTA + results grid
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Sparkles,
  Loader2,
  Eye,
  EyeOff,
  Pencil,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useUser } from '@/hooks/useUser';
import { useAuthModalStore } from '@/stores/authModalStore';
import {
  useMyRoommateProfile,
  useRoommateMatches,
  useSetRoommateActive,
} from '@/features/roommate/hooks';
import RoommateQuestionnaire from '@/features/roommate/RoommateQuestionnaire';
import MatchCard from '@/features/roommate/MatchCard';
import EmptyState from '@/components/feedback/EmptyState';
import PageSpinner from '@/components/feedback/PageSpinner';
import Button from '@/components/ui/Button';
import {
  LIFESTYLE_LABEL,
  CLEANLINESS_LABEL,
  STUDY_LABEL,
  LOOKING_FOR_LABEL,
  type RoommateMatch,
} from '@/types/roommate';
import { formatFcfa } from '@/lib/format/money';

type View = 'results' | 'edit';

export default function RoommatePage() {
  const { isSignedIn, loading: authLoading } = useUser();
  const showAuth   = useAuthModalStore((s) => s.show);
  const { data: profile, isLoading: profileLoading } = useMyRoommateProfile();
  const matchMutation = useRoommateMatches();
  const setActive     = useSetRoommateActive();

  const [view,    setView]    = useState<View>('results');
  const [matches, setMatches] = useState<RoommateMatch[] | null>(null);
  const [degraded, setDegraded] = useState(false);

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (authLoading) return <PageSpinner />;

  if (!isSignedIn) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20">
        <div className="max-w-sm text-center">
          <span className="text-5xl">🤝</span>
          <h1 className="mt-4 font-heading text-2xl font-bold">Find your flatmate</h1>
          <p className="mt-2 text-text-muted">
            Sign in to set up your roommate profile and let Claude match you with compatible students.
          </p>
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="mt-6"
            onClick={() => showAuth('signin')}
          >
            Sign in to get matched
          </Button>
        </div>
      </div>
    );
  }

  // ── Loading profile ────────────────────────────────────────────────────────
  if (profileLoading) return <PageSpinner />;

  // ── No profile → show questionnaire ───────────────────────────────────────
  if (!profile || view === 'edit') {
    return (
      <div className="mx-auto max-w-lg px-4 pb-16 pt-6 sm:px-6">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold">
            {profile ? 'Edit your profile' : 'Set up your roommate profile'}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {profile
              ? 'Update your preferences — Claude will re-run your matches.'
              : 'Tell us a bit about yourself so Claude can find you the right flatmates.'}
          </p>
        </div>
        <RoommateQuestionnaire
          initialProfile={profile ?? undefined}
          onSuccess={() => {
            setMatches(null);
            setView('results');
          }}
          onCancel={() => setView('results')}
        />
      </div>
    );
  }

  // ── Has profile — main view ────────────────────────────────────────────────
  async function handleFindMatches() {
    try {
      const res = await matchMutation.mutateAsync();
      setMatches(res.matches);
      setDegraded(res.degraded ?? false);
    } catch {
      // error shown via matchMutation.isError
    }
  }

  const isFinding = matchMutation.isPending;

  return (
    <div className="px-4 pb-16 pt-6 sm:px-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Find a flatmate</h1>
          <p className="mt-0.5 text-sm text-text-muted">
            Powered by Claude Sonnet · AI-matched compatibility
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<Pencil className="h-3.5 w-3.5" />}
          onClick={() => setView('edit')}
        >
          Edit my profile
        </Button>
      </div>

      {/* Profile summary card */}
      <div className="mt-5 rounded-2xl border border-border bg-bg-card p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold">{profile.displayName}</p>
            <p className="mt-0.5 text-sm text-text-muted">
              {profile.courseYear} · {profile.faculty}
            </p>
            <p className="mt-0.5 text-sm text-text-muted">
              Budget: {formatFcfa(profile.budgetMin)} – {formatFcfa(profile.budgetMax)}/yr
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.preferredZones.map((z) => (
                <span key={z} className="rounded-full bg-bg-hover px-2.5 py-0.5 text-xs">
                  {z}
                </span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-border px-2.5 py-0.5 text-xs">
                {LIFESTYLE_LABEL[profile.lifestyle]}
              </span>
              <span className="rounded-full border border-border px-2.5 py-0.5 text-xs">
                {CLEANLINESS_LABEL[profile.cleanliness]}
              </span>
              <span className="rounded-full border border-border px-2.5 py-0.5 text-xs">
                {STUDY_LABEL[profile.studyHabits]}
              </span>
              <span className="rounded-full border border-border px-2.5 py-0.5 text-xs">
                {LOOKING_FOR_LABEL[profile.lookingFor]}
              </span>
            </div>
          </div>

          {/* Visibility toggle */}
          <button
            type="button"
            disabled={setActive.isPending}
            onClick={() => setActive.mutate(!profile.active)}
            className={clsx(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              profile.active
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'border-border bg-bg-hover text-text-muted hover:bg-bg',
            )}
            title={profile.active ? 'Visible to others — click to hide' : 'Hidden from others — click to show'}
          >
            {setActive.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : profile.active ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
            {profile.active ? 'Visible' : 'Hidden'}
          </button>
        </div>

        {profile.bio && (
          <p className="mt-3 border-t border-border pt-3 text-sm italic text-text-muted">
            "{profile.bio}"
          </p>
        )}
      </div>

      {/* Find matches CTA */}
      <div className="mt-6">
        {!matches ? (
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isFinding}
            leftIcon={
              isFinding
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : <Sparkles className="h-5 w-5" />
            }
            onClick={handleFindMatches}
          >
            {isFinding
              ? 'Claude is analysing compatibility…'
              : 'Find compatible flatmates'}
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isFinding}
            leftIcon={
              isFinding
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <RefreshCw className="h-4 w-4" />
            }
            onClick={handleFindMatches}
          >
            {isFinding ? 'Refreshing…' : 'Refresh matches'}
          </Button>
        )}

        {matchMutation.isError && (
          <p className="mt-3 rounded-xl bg-accent-50 px-4 py-3 text-sm text-accent-700">
            Could not load matches. Make sure your profile is active and try again.
          </p>
        )}
      </div>

      {/* Results */}
      {matches !== null && (
        <section className="mt-6">
          {degraded && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Claude AI is not configured — showing basic compatibility scores instead.
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold">
              {matches.length === 0 ? 'No matches found' : `${matches.length} match${matches.length !== 1 ? 'es' : ''} found`}
            </h2>
            {matches.length > 0 && (
              <p className="text-xs text-text-muted">Sorted by compatibility</p>
            )}
          </div>

          {matches.length === 0 ? (
            <EmptyState
              icon={<Users className="h-10 w-10" />}
              title="No compatible flatmates yet"
              description="Be the first — share the app with your classmates so more profiles appear."
              action={
                <Link to="/search" className="btn-primary">
                  Browse listings instead
                </Link>
              }
            />
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((m) => (
                <MatchCard key={m.uid} match={m} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
