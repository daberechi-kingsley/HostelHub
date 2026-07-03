/**
 * Card displaying a single roommate compatibility match.
 * Shows compatibility score, Claude's match reason, key lifestyle chips, bio,
 * and a "Message" button that opens a direct RTDB chat.
 */
import { useState } from 'react';
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import Button from '@/components/ui/Button';
import { useStartDirectChat } from '@/features/chat/useStartDirectChat';
import {
  LIFESTYLE_LABEL,
  CLEANLINESS_LABEL,
  STUDY_LABEL,
  LOOKING_FOR_LABEL,
  type RoommateMatch,
} from '@/types/roommate';
import { formatFcfa } from '@/lib/format/money';

interface Props {
  match: RoommateMatch;
}

/** Score → tailwind colour classes */
function scoreStyle(score: number) {
  if (score >= 85) return { badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', label: 'Great match' };
  if (score >= 70) return { badge: 'bg-blue-100 text-blue-700',       bar: 'bg-blue-500',   label: 'Good match'  };
  if (score >= 55) return { badge: 'bg-amber-100 text-amber-700',     bar: 'bg-amber-400',  label: 'Fair match'  };
  return             { badge: 'bg-bg-hover text-text-muted',           bar: 'bg-border',     label: 'Low match'   };
}

function Avatar({ name, url }: { name: string; url: string }) {
  const initial = (name || 'S').charAt(0).toUpperCase();
  if (url) {
    return <img src={url} alt={name} className="h-12 w-12 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
      {initial}
    </div>
  );
}

export default function MatchCard({ match }: Props) {
  const { startDirectChat, starting } = useStartDirectChat();
  const [expanded, setExpanded] = useState(false);
  const style = scoreStyle(match.compatibilityScore);

  const { profile } = match;

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-bg-card shadow-sm hover:shadow-md transition-shadow">
      {/* Score bar (top edge) */}
      <div className="h-1 w-full overflow-hidden rounded-t-2xl bg-bg-hover">
        <div
          className={clsx('h-full rounded-full transition-all', style.bar)}
          style={{ width: `${match.compatibilityScore}%` }}
        />
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <Avatar name={match.displayName} url={match.avatarUrl} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{match.displayName}</p>
            <p className="text-xs text-text-muted mt-0.5">
              {profile.courseYear} · {profile.faculty}
            </p>
            {profile.preferredZones.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {profile.preferredZones.slice(0, 3).map((z) => (
                  <span
                    key={z}
                    className="rounded-full bg-bg-hover px-2 py-0.5 text-xs text-text-muted"
                  >
                    {z}
                  </span>
                ))}
                {profile.preferredZones.length > 3 && (
                  <span className="text-xs text-text-muted">
                    +{profile.preferredZones.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
          {/* Score badge */}
          <div className={clsx('flex shrink-0 flex-col items-center rounded-2xl px-3 py-2', style.badge)}>
            <span className="text-lg font-bold tabular-nums leading-none">
              {match.compatibilityScore}%
            </span>
            <span className="text-xs font-medium">{style.label}</span>
          </div>
        </div>

        {/* Claude's match reason */}
        {match.matchReason && (
          <p className="rounded-xl bg-primary/5 px-3 py-2.5 text-sm italic text-primary-700 leading-relaxed">
            "{match.matchReason}"
          </p>
        )}

        {/* Lifestyle chips */}
        <div className="flex flex-wrap gap-1.5">
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

        {/* Budget */}
        <p className="text-xs text-text-muted">
          Budget:{' '}
          <span className="font-medium text-text">
            {formatFcfa(profile.budgetMin)} – {formatFcfa(profile.budgetMax)}
          </span>
          {' '}/ year
        </p>

        {/* Expandable bio */}
        {profile.bio && (
          <div>
            <p className={clsx('text-sm text-text-muted', !expanded && 'line-clamp-2')}>
              {profile.bio}
            </p>
            {profile.bio.length > 80 && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-1 flex items-center gap-0.5 text-xs font-medium text-primary"
              >
                {expanded
                  ? <><ChevronUp className="h-3.5 w-3.5" /> Show less</>
                  : <><ChevronDown className="h-3.5 w-3.5" /> Read more</>
                }
              </button>
            )}
          </div>
        )}

        {/* CTA */}
        <Button
          type="button"
          variant="primary"
          fullWidth
          size="sm"
          disabled={starting}
          leftIcon={<MessageCircle className="h-4 w-4" />}
          onClick={() => startDirectChat(match.uid, match.displayName)}
        >
          {starting ? 'Opening chat…' : 'Message'}
        </Button>
      </div>
    </article>
  );
}
