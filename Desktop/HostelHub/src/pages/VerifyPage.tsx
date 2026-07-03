/**
 * /verify — landlord/agent verification.
 *
 * Renders one of: sign-in prompt · not-applicable (students) · already verified ·
 * under review · rejected (with reason + resubmit) · the upload form.
 */
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, ShieldCheck, XCircle } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useLazyAuth } from '@/hooks/useLazyAuth';
import { useMyVerification } from '@/features/verification/useVerification';
import VerificationForm from '@/features/verification/VerificationForm';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/feedback/EmptyState';
import PageSpinner from '@/components/feedback/PageSpinner';

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-xl px-4 pb-16 pt-6">{children}</div>;
}

export default function VerifyPage() {
  const { isSignedIn, appUser, loading: authLoading } = useUser();
  const { require } = useLazyAuth();
  const { data: request, isLoading: requestLoading } = useMyVerification();
  const qc = useQueryClient();

  if (authLoading) return <PageSpinner />;

  // ── Not signed in ────────────────────────────────────────────────────────
  if (!isSignedIn || !appUser) {
    return (
      <Shell>
        <EmptyState
          icon={<ShieldCheck className="h-10 w-10" />}
          title="Sign in to get verified"
          description="Verification builds trust with students and unlocks the verified badge on your listings."
          action={
            <Button variant="primary" onClick={() => require('contact')}>
              Sign in
            </Button>
          }
        />
      </Shell>
    );
  }

  // ── Students and admins don't need verification ──────────────────────────
  if (appUser.role === 'student' || appUser.role === 'admin') {
    return (
      <Shell>
        <EmptyState
          icon={<ShieldCheck className="h-10 w-10" />}
          title="Verification is for landlords & agents"
          description="Only landlords and agents need to verify. Browse listings and contact them any time."
          action={
            <Link to="/search" className="btn-primary">
              Browse listings
            </Link>
          }
        />
      </Shell>
    );
  }

  // ── Already verified ─────────────────────────────────────────────────────
  if (appUser.verified) {
    return (
      <Shell>
        <div className="rounded-card border border-verified/30 bg-verified/5 p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-verified" />
          <h1 className="mt-3 font-heading text-xl font-bold">You're verified</h1>
          <p className="mt-1 text-sm text-text-muted">
            The verified badge now shows on your profile and all your listings.
          </p>
          <Link to="/search" className="btn-primary mt-6 inline-flex">
            View listings
          </Link>
        </div>
      </Shell>
    );
  }

  if (requestLoading) return <PageSpinner />;

  // ── Request under review ─────────────────────────────────────────────────
  if (request?.status === 'pending') {
    return (
      <Shell>
        <div className="rounded-card border border-primary/30 bg-primary/5 p-8 text-center">
          <Clock className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-3 font-heading text-xl font-bold">Under review</h1>
          <p className="mt-1 text-sm text-text-muted">
            We received your documents on{' '}
            {new Date(request.submittedAt).toLocaleDateString()}. The HostelHub team
            reviews requests within 1–2 days — you'll see your badge as soon as it's
            approved.
          </p>
        </div>
      </Shell>
    );
  }

  // ── Form (first submission, or resubmit after rejection) ─────────────────
  const rejected = request?.status === 'rejected';

  return (
    <Shell>
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="font-heading text-2xl font-bold">Get verified</h1>
      </div>
      <p className="mt-1 text-sm text-text-muted">
        Upload your ID and a property document. Once approved, a verified badge appears
        on your profile and every listing you post — students trust verified landlords
        far more.
      </p>

      {rejected && (
        <div className="mt-5 rounded-xl border border-accent/30 bg-accent/10 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-accent-700">
            <XCircle className="h-4 w-4" />
            Your previous request was not approved
          </p>
          {request?.reviewerNote && (
            <p className="mt-1 text-sm text-text-muted">Reason: {request.reviewerNote}</p>
          )}
          <p className="mt-1 text-sm text-text-muted">
            Please re-check your documents and submit again below.
          </p>
        </div>
      )}

      <div className="mt-6">
        <VerificationForm
          user={appUser}
          onSubmitted={() => {
            void qc.invalidateQueries({ queryKey: ['verification', appUser.uid] });
          }}
        />
      </div>
    </Shell>
  );
}
