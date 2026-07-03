/**
 * One-time "You're verified!" celebration — a centered toast with a burst of
 * CSS confetti that auto-dismisses after a few seconds.
 *
 * Shown exactly once per user when their account flips to verified: the caller
 * decides *when* to mount this (see useVerifiedCelebration), and a localStorage
 * flag keyed by uid guarantees it never re-fires on later visits or refreshes.
 *
 * Zero dependencies — confetti is plain divs animated with an inline keyframe.
 */
import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';

const CONFETTI_COLORS = ['#6366F1', '#FF6B4A', '#10B981', '#F59E0B', '#EC4899', '#3B82F6'];
const PIECE_COUNT = 70;
const AUTO_DISMISS_MS = 5000;

interface Props {
  onDone: () => void;
}

export default function VerifiedCelebration({ onDone }: Props) {
  const [leaving, setLeaving] = useState(false);

  // Fixed random layout for the confetti, computed once.
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECE_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.4 + Math.random() * 1.6,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 6,
        rotate: Math.random() * 360,
        drift: (Math.random() - 0.5) * 160,
      })),
    [],
  );

  useEffect(() => {
    const t = setTimeout(() => setLeaving(true), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, []);

  // After the exit transition, tell the parent to unmount us.
  function handleTransitionEnd() {
    if (leaving) onDone();
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      <style>{`
        @keyframes hh-confetti-fall {
          0%   { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) translateX(var(--drift)) rotate(720deg); opacity: 1; }
        }
      `}</style>

      {/* Confetti layer */}
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 block rounded-[2px]"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.6}px`,
            backgroundColor: p.color,
            // @ts-expect-error — CSS custom property
            '--drift': `${p.drift}px`,
            transform: `rotate(${p.rotate}deg)`,
            animation: `hh-confetti-fall ${p.duration}s linear ${p.delay}s forwards`,
          }}
        />
      ))}

      {/* Toast card */}
      <div className="absolute inset-x-0 top-24 flex justify-center px-4">
        <div
          onTransitionEnd={handleTransitionEnd}
          className={`pointer-events-auto flex max-w-sm items-start gap-3 rounded-2xl border border-verified/30 bg-bg-card px-5 py-4 shadow-card-hover transition-all duration-300 ${
            leaving ? '-translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
          }`}
          role="status"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-verified/15 text-verified">
            <ShieldCheck className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <div className="flex-1">
            <p className="font-heading text-sm font-bold text-text">You're verified! 🎉</p>
            <p className="mt-0.5 text-xs text-text-muted">
              The green badge now shows on your profile and every listing you post.
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setLeaving(true)}
            className="shrink-0 rounded-full p-1 text-text-muted hover:bg-bg-hover"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
