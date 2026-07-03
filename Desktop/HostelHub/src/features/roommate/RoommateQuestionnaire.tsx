/**
 * Multi-step roommate profile questionnaire.
 *
 * Step 1 — About You     (year, faculty, looking for, bio)
 * Step 2 — Budget & Zones (min/max budget, preferred zones)
 * Step 3 — Lifestyle     (lifestyle, cleanliness, study habits, gender pref, smoking/pets)
 *
 * Accepts an optional `initialProfile` for editing an existing profile.
 */
import { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useSaveRoommateProfile } from './hooks';
import { BUEA_ZONES } from '@/config/constants';
import {
  COURSE_YEARS,
  UB_FACULTIES,
  type RoommateProfile,
  type Lifestyle,
  type Cleanliness,
  type StudyHabits,
  type GenderPref,
  type LookingFor,
} from '@/types/roommate';
import { useUser } from '@/hooks/useUser';

interface Props {
  initialProfile?: RoommateProfile;
  onSuccess: () => void;
  onCancel:  () => void;
}

interface FormDraft {
  courseYear:       string;
  faculty:          string;
  bio:              string;
  lookingFor:       LookingFor;
  budgetMin:        number;
  budgetMax:        number;
  preferredZones:   string[];
  lifestyle:        Lifestyle;
  cleanliness:      Cleanliness;
  studyHabits:      StudyHabits;
  genderPreference: GenderPref;
  smokingOk:        boolean;
  petsOk:           boolean;
}

function defaultDraft(profile?: RoommateProfile): FormDraft {
  return {
    courseYear:       profile?.courseYear       ?? '200L',
    faculty:          profile?.faculty          ?? '',
    bio:              profile?.bio              ?? '',
    lookingFor:       profile?.lookingFor       ?? 'either',
    budgetMin:        profile?.budgetMin        ?? 200_000,
    budgetMax:        profile?.budgetMax        ?? 500_000,
    preferredZones:   profile?.preferredZones   ?? ['Molyko'],
    lifestyle:        profile?.lifestyle        ?? 'flexible',
    cleanliness:      profile?.cleanliness      ?? 'moderate',
    studyHabits:      profile?.studyHabits      ?? 'light_noise',
    genderPreference: profile?.genderPreference ?? 'any',
    smokingOk:        profile?.smokingOk        ?? false,
    petsOk:           profile?.petsOk           ?? false,
  };
}

// ── Reusable sub-components ────────────────────────────────────────────────────

function OptionPill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
        selected
          ? 'border-primary bg-primary text-white shadow-sm'
          : 'border-border bg-bg-card text-text hover:border-primary/50',
      )}
    >
      {children}
    </button>
  );
}

function OptionCard({
  selected,
  onClick,
  emoji,
  label,
  sub,
}: {
  selected: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
  sub?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all',
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-bg-card hover:border-primary/40',
      )}
    >
      <span className="text-3xl leading-none">{emoji}</span>
      <span className={clsx('text-sm font-semibold', selected ? 'text-primary' : 'text-text')}>
        {label}
      </span>
      {sub && (
        <span className="text-xs text-text-muted text-center leading-tight">{sub}</span>
      )}
    </button>
  );
}

function ToggleRow({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    // Use div (not label) to avoid the browser firing a synthetic click on the
    // inner button when the row is clicked — which would call onChange twice.
    <div
      role="group"
      onClick={() => onChange(!value)}
      className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border bg-bg-card px-4 py-3 select-none"
    >
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-text-muted">{sub}</p>
      </div>
      {/* Purely visual — pointer-events-none so clicks go to the parent div */}
      <div
        role="switch"
        aria-checked={value}
        className={clsx(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors pointer-events-none',
          value ? 'bg-primary' : 'bg-border',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            value ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </div>
    </div>
  );
}

const TOTAL_STEPS = 3;

const STEP_LABELS = ['About You', 'Budget & Zones', 'Lifestyle'];

// ── Main component ─────────────────────────────────────────────────────────────

export default function RoommateQuestionnaire({ initialProfile, onSuccess, onCancel }: Props) {
  const { appUser } = useUser();
  const save = useSaveRoommateProfile();
  const [step,   setStep]   = useState(1);
  const [draft,  setDraft]  = useState<FormDraft>(() => defaultDraft(initialProfile));
  const [errors, setErrors] = useState<string[]>([]);

  function set<K extends keyof FormDraft>(key: K, val: FormDraft[K]) {
    setDraft((d) => ({ ...d, [key]: val }));
    setErrors([]);
  }

  function toggleZone(zone: string) {
    setDraft((d) => {
      const has = d.preferredZones.includes(zone);
      const next = has
        ? d.preferredZones.filter((z) => z !== zone)
        : [...d.preferredZones, zone];
      return { ...d, preferredZones: next };
    });
    setErrors([]);
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function validateStep(): boolean {
    const errs: string[] = [];
    if (step === 1) {
      if (!draft.courseYear) errs.push('Select your year of study.');
      if (!draft.faculty.trim()) errs.push('Enter your faculty / department.');
      if (draft.bio.length > 250) errs.push('Bio must be 250 characters or less.');
    }
    if (step === 2) {
      if (draft.budgetMin <= 0) errs.push('Enter a minimum budget.');
      if (draft.budgetMax < draft.budgetMin) errs.push('Max budget must be ≥ min budget.');
      if (draft.preferredZones.length === 0) errs.push('Select at least one zone.');
    }
    setErrors(errs);
    return errs.length === 0;
  }

  function goNext() {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  // ── Final submit ──────────────────────────────────────────────────────────
  // Intentionally NOT a form onSubmit — we use a plain div wrapper so there
  // is no native form-submission event. This prevents the browser from firing
  // a submit when the bottom button changes from type="button" (Next) to the
  // save action during the step-2 → step-3 re-render.
  async function submitProfile() {
    if (!validateStep()) return;
    try {
      await save.mutateAsync({
        displayName: appUser?.displayName ?? 'Student',
        avatarUrl:   appUser?.avatarUrl   ?? '',
        ...draft,
      });
      onSuccess();
    } catch {
      setErrors(['Could not save your profile. Try again.']);
    }
  }

  const isBusy = save.isPending;

  return (
    <div className="space-y-6">
      {/* Progress bar + step header */}
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-text-muted">
          <span className="font-medium text-text">{STEP_LABELS[step - 1]}</span>
          <span>Step {step} of {TOTAL_STEPS}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-hover">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Step 1 — About You ──────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Year of study */}
          <div>
            <p className="mb-2 text-sm font-medium">Year of study</p>
            <div className="flex flex-wrap gap-2">
              {COURSE_YEARS.map((y) => (
                <OptionPill
                  key={y}
                  selected={draft.courseYear === y}
                  onClick={() => set('courseYear', y)}
                >
                  {y}
                </OptionPill>
              ))}
            </div>
          </div>

          {/* Faculty */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="rm-faculty">
              Faculty / Department
            </label>
            <input
              id="rm-faculty"
              type="text"
              list="rm-faculties"
              placeholder="e.g. Engineering & Technology"
              value={draft.faculty}
              onChange={(e) => set('faculty', e.target.value)}
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <datalist id="rm-faculties">
              {UB_FACULTIES.map((f) => <option key={f} value={f} />)}
            </datalist>
          </div>

          {/* Looking for */}
          <div>
            <p className="mb-2 text-sm font-medium">I'm looking for</p>
            <div className="grid grid-cols-3 gap-3">
              <OptionCard
                selected={draft.lookingFor === 'roommate'}
                onClick={() => set('lookingFor', 'roommate')}
                emoji="🏠"
                label="Roommate"
                sub="Share a room / flat"
              />
              <OptionCard
                selected={draft.lookingFor === 'hostel_group'}
                onClick={() => set('lookingFor', 'hostel_group')}
                emoji="🏘"
                label="Hostel group"
                sub="Group in same hostel"
              />
              <OptionCard
                selected={draft.lookingFor === 'either'}
                onClick={() => set('lookingFor', 'either')}
                emoji="🤝"
                label="Either"
                sub="Open to both"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="rm-bio">
              Short intro{' '}
              <span className="font-normal text-text-muted">(optional — up to 250 chars)</span>
            </label>
            <textarea
              id="rm-bio"
              rows={3}
              maxLength={250}
              placeholder="e.g. 300L Engineering student, quiet, early riser. I study most evenings and like a tidy space."
              value={draft.bio}
              onChange={(e) => set('bio', e.target.value)}
              className="w-full resize-none rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <p className="mt-1 text-right text-xs text-text-muted">
              {draft.bio.length} / 250
            </p>
          </div>
        </div>
      )}

      {/* ── Step 2 — Budget & Zones ─────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Budget range */}
          <div>
            <p className="mb-2 text-sm font-medium">Annual rent budget (FCFA)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-text-muted" htmlFor="rm-bmin">
                  Minimum
                </label>
                <input
                  id="rm-bmin"
                  type="number"
                  min={50_000}
                  max={2_000_000}
                  step={10_000}
                  value={draft.budgetMin}
                  onChange={(e) => set('budgetMin', Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted" htmlFor="rm-bmax">
                  Maximum
                </label>
                <input
                  id="rm-bmax"
                  type="number"
                  min={50_000}
                  max={2_000_000}
                  step={10_000}
                  value={draft.budgetMax}
                  onChange={(e) => set('budgetMax', Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
            <p className="mt-1.5 text-xs text-text-muted">
              {(draft.budgetMin / 1000).toFixed(0)}k –{' '}
              {(draft.budgetMax / 1000).toFixed(0)}k FCFA / year
            </p>
          </div>

          {/* Preferred zones */}
          <div>
            <p className="mb-2 text-sm font-medium">
              Preferred zones{' '}
              <span className="font-normal text-text-muted">(pick one or more)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {BUEA_ZONES.map((zone) => (
                <OptionPill
                  key={zone}
                  selected={draft.preferredZones.includes(zone)}
                  onClick={() => toggleZone(zone)}
                >
                  {zone}
                </OptionPill>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3 — Lifestyle & Preferences ───────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          {/* Lifestyle */}
          <div>
            <p className="mb-2 text-sm font-medium">Daily schedule</p>
            <div className="grid grid-cols-3 gap-3">
              <OptionCard
                selected={draft.lifestyle === 'early_bird'}
                onClick={() => set('lifestyle', 'early_bird')}
                emoji="🌅"
                label="Early bird"
                sub="Up before 7 AM"
              />
              <OptionCard
                selected={draft.lifestyle === 'night_owl'}
                onClick={() => set('lifestyle', 'night_owl')}
                emoji="🦉"
                label="Night owl"
                sub="Active after midnight"
              />
              <OptionCard
                selected={draft.lifestyle === 'flexible'}
                onClick={() => set('lifestyle', 'flexible')}
                emoji="🌊"
                label="Flexible"
                sub="No fixed schedule"
              />
            </div>
          </div>

          {/* Cleanliness */}
          <div>
            <p className="mb-2 text-sm font-medium">Cleanliness level</p>
            <div className="grid grid-cols-3 gap-3">
              <OptionCard
                selected={draft.cleanliness === 'very_clean'}
                onClick={() => set('cleanliness', 'very_clean')}
                emoji="✨"
                label="Very clean"
                sub="Daily tidying"
              />
              <OptionCard
                selected={draft.cleanliness === 'moderate'}
                onClick={() => set('cleanliness', 'moderate')}
                emoji="👍"
                label="Moderate"
                sub="Tidy most of the time"
              />
              <OptionCard
                selected={draft.cleanliness === 'relaxed'}
                onClick={() => set('cleanliness', 'relaxed')}
                emoji="🛋"
                label="Relaxed"
                sub="Clean when needed"
              />
            </div>
          </div>

          {/* Study habits */}
          <div>
            <p className="mb-2 text-sm font-medium">Study / noise level</p>
            <div className="grid grid-cols-3 gap-3">
              <OptionCard
                selected={draft.studyHabits === 'silent'}
                onClick={() => set('studyHabits', 'silent')}
                emoji="🤫"
                label="Silent"
                sub="Quiet always"
              />
              <OptionCard
                selected={draft.studyHabits === 'light_noise'}
                onClick={() => set('studyHabits', 'light_noise')}
                emoji="🎵"
                label="Light noise"
                sub="Low music OK"
              />
              <OptionCard
                selected={draft.studyHabits === 'noise_ok'}
                onClick={() => set('studyHabits', 'noise_ok')}
                emoji="🎶"
                label="Noise fine"
                sub="Relaxed about sound"
              />
            </div>
          </div>

          {/* Gender preference */}
          <div>
            <p className="mb-2 text-sm font-medium">Roommate gender preference</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: 'any',         label: 'Any gender' },
                  { value: 'same_gender', label: 'Same gender only' },
                ] as const
              ).map(({ value, label }) => (
                <OptionPill
                  key={value}
                  selected={draft.genderPreference === value}
                  onClick={() => set('genderPreference', value as GenderPref)}
                >
                  {label}
                </OptionPill>
              ))}
            </div>
          </div>

          {/* Smoking / pets toggles */}
          <div className="space-y-2">
            <ToggleRow
              label="Smoking OK"
              sub="Comfortable with a flatmate who smokes outdoors"
              value={draft.smokingOk}
              onChange={(v) => set('smokingOk', v)}
            />
            <ToggleRow
              label="Pets OK"
              sub="Comfortable with a flatmate who has a pet"
              value={draft.petsOk}
              onChange={(v) => set('petsOk', v)}
            />
          </div>
        </div>
      )}

      {/* Error messages */}
      {errors.length > 0 && (
        <ul className="rounded-xl bg-accent-50 px-4 py-3 text-sm text-accent-700 space-y-0.5">
          {errors.map((e) => <li key={e}>• {e}</li>)}
        </ul>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center gap-3 pt-1">
        {step > 1 ? (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setStep((s) => s - 1)}
            leftIcon={<ChevronLeft className="h-4 w-4" />}
            disabled={isBusy}
          >
            Back
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={isBusy}
          >
            Cancel
          </Button>
        )}

        {step < TOTAL_STEPS ? (
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            onClick={goNext}
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            Next
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            disabled={isBusy}
            onClick={submitProfile}
          >
            {isBusy ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </span>
            ) : (
              initialProfile ? 'Save changes' : 'Save & find matches'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
