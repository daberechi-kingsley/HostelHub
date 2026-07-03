import { X, Smartphone, Globe, ArrowLeft, Loader2, Mail } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ConfirmationResult } from 'firebase/auth';
import { useAuthModalStore, type AuthGate } from '@/stores/authModalStore';
import { useUser } from '@/hooks/useUser';
import {
  signInWithGoogle,
  sendPhoneOtp,
  toCameroonE164,
  clearRecaptcha,
  isAdminCredential,
  signInAdmin,
} from '@/lib/firebase/auth';
import Button from '@/components/ui/Button';
import { useT } from '@/i18n/useT';
import type { TranslationKey } from '@/i18n/translations';

const RECAPTCHA_ID = 'hostelhub-recaptcha';

const GATE_COPY: Record<Exclude<AuthGate, null>, { title: TranslationKey; body: TranslationKey }> = {
  contact: { title: 'auth.gateContactTitle', body: 'auth.gateContactBody' },
  save: { title: 'auth.gateSaveTitle', body: 'auth.gateSaveBody' },
  visit: { title: 'auth.gateVisitTitle', body: 'auth.gateVisitBody' },
  book: { title: 'auth.gateBookTitle', body: 'auth.gateBookBody' },
  signin: { title: 'auth.gateSigninTitle', body: 'auth.gateSigninBody' },
};

type Step = 'method' | 'phone' | 'otp' | 'email';

export default function LazyAuthModal() {
  const open = useAuthModalStore((s) => s.open);
  const gate = useAuthModalStore((s) => s.gate);
  const hide = useAuthModalStore((s) => s.hide);
  const { refreshAppUser } = useUser();
  const navigate = useNavigate();
  const t = useT();

  const [step, setStep] = useState<Step>('method');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Reset internal state whenever the modal closes.
  useEffect(() => {
    if (open) return;
    setStep('method');
    setPhone('');
    setOtp('');
    setEmail('');
    setPassword('');
    setConfirmation(null);
    setBusy(false);
    setError(null);
    clearRecaptcha();
  }, [open]);

  if (!open || !gate) return null;
  const copy = GATE_COPY[gate];

  function close() {
    hide();
  }

  async function handleGoogle() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
      // onAuthStateChanged will pick it up; RoleSelection gate handles the rest.
      hide();
    } catch (err) {
      setError(humanizeAuthError(err));
      setBusy(false);
    }
  }

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const e164 = toCameroonE164(phone);
    if (!e164) {
      setError('Enter a valid Cameroon number, e.g. 6 78 12 34 56.');
      return;
    }
    setBusy(true);
    try {
      const result = await sendPhoneOtp(e164, RECAPTCHA_ID);
      setConfirmation(result);
      setStep('otp');
    } catch (err) {
      setError(humanizeAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmOtp(e: FormEvent) {
    e.preventDefault();
    if (!confirmation) return;
    if (otp.trim().length < 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await confirmation.confirm(otp.trim());
      hide();
    } catch (err) {
      setError(humanizeAuthError(err));
      setBusy(false);
    }
  }

  /**
   * Email sign-in. Reserved for the hidden admin account — only the configured
   * admin credentials are accepted; everything else is rejected because regular
   * users authenticate with Google or phone. On success the admin is recognised
   * automatically and redirected to the dashboard.
   */
  async function handleEmailSignIn(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isAdminCredential(email, password)) {
      setError('Email sign-in is reserved for administrators. Please use Google or phone.');
      return;
    }

    setBusy(true);
    try {
      await signInAdmin(email, password);
      await refreshAppUser(); // load the admin doc before we leave the modal
      hide();
      navigate('/admin');
    } catch (err) {
      setError(humanizeAuthError(err));
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-bg-card p-6 shadow-xl sm:rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 pr-6">
            {step !== 'method' && (
              <button
                type="button"
                onClick={() => {
                  setStep(step === 'otp' ? 'phone' : 'method');
                  setError(null);
                }}
                aria-label="Back"
                className="rounded-full p-1.5 text-text-muted hover:bg-bg-hover"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="space-y-1">
              <h2 id="auth-modal-title" className="font-heading text-xl font-bold">
                {step === 'method' && t(copy.title)}
                {step === 'phone' && t('auth.phoneTitle')}
                {step === 'otp' && t('auth.otpTitle')}
                {step === 'email' && t('auth.emailTitle')}
              </h2>
              <p className="text-sm text-text-muted">
                {step === 'method' && t(copy.body)}
                {step === 'phone' && t('auth.phoneBody')}
                {step === 'otp' && `${t('auth.otpBodyPrefix')} ${toCameroonE164(phone) ?? phone}.`}
                {step === 'email' && t('auth.emailBody')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="rounded-full p-1.5 text-text-muted hover:bg-bg-hover"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-6">
          {step === 'method' && (
            <div className="space-y-3">
              <Button
                variant="secondary"
                fullWidth
                size="lg"
                leftIcon={<Globe className="h-5 w-5" />}
                onClick={handleGoogle}
                disabled={busy}
              >
                {t('auth.continueGoogle')}
              </Button>
              <Button
                variant="primary"
                fullWidth
                size="lg"
                leftIcon={<Smartphone className="h-5 w-5" />}
                onClick={() => {
                  setStep('phone');
                  setError(null);
                }}
                disabled={busy}
              >
                {t('auth.continuePhone')}
              </Button>
              {/* Low-emphasis email entry — the hidden admin sign-in path. */}
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setError(null);
                }}
                disabled={busy}
                className="mx-auto flex items-center gap-1.5 pt-1 text-xs font-medium text-text-muted hover:text-text"
              >
                <Mail className="h-3.5 w-3.5" />
                {t('auth.signInWithEmail')}
              </button>
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleEmailSignIn} className="space-y-3">
              <input
                type="email"
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-primary"
                aria-label="Email"
              />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-primary"
                aria-label="Password"
              />
              <Button type="submit" variant="primary" fullWidth size="lg" disabled={busy}>
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.signIn')}
              </Button>
            </form>
          )}

          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-3">
                <span className="text-sm font-semibold text-text-muted">+237</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoFocus
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="6 78 12 34 56"
                  className="w-full bg-transparent text-sm outline-none"
                  aria-label="Phone number"
                />
              </div>
              <Button type="submit" variant="primary" fullWidth size="lg" disabled={busy}>
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.sendCode')}
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleConfirmOtp} className="space-y-3">
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-center text-lg tracking-[0.5em] outline-none focus:border-primary"
                aria-label="Verification code"
              />
              <Button type="submit" variant="primary" fullWidth size="lg" disabled={busy}>
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.verifyContinue')}
              </Button>
              <p className="text-center text-2xs text-text-subtle">
                {t('auth.otpDevNote')}
              </p>
            </form>
          )}

          {error && (
            <p className="mt-3 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
              {error}
            </p>
          )}
        </div>

        {/* Invisible reCAPTCHA mount point */}
        <div id={RECAPTCHA_ID} />
      </div>
    </div>
  );
}

/** Turn raw Firebase auth errors into student-friendly copy. */
function humanizeAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code: unknown }).code)
      : '';
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in window closed. Try again.';
    case 'auth/invalid-verification-code':
      return 'That code is incorrect. Check it and try again.';
    case 'auth/code-expired':
      return 'That code expired. Request a new one.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/invalid-phone-number':
      return 'That phone number looks invalid.';
    case 'auth/operation-not-allowed':
      return 'Email sign-in is not enabled. Enable the Email/Password provider in Firebase Auth.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Those credentials are incorrect.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
