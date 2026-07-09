import { X, Smartphone, Globe, ArrowLeft, Loader2, Mail, Eye, EyeOff, GraduationCap, Home, Briefcase } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ConfirmationResult } from 'firebase/auth';
import { clsx } from 'clsx';
import { useAuthModalStore, type AuthGate } from '@/stores/authModalStore';
import { useUser } from '@/hooks/useUser';
import {
  signInWithGoogle,
  signInWithEmailPassword,
  sendPhoneOtp,
  toCameroonE164,
  clearRecaptcha,
  isAdminCredential,
  signInAdmin,
  registerWithEmailPassword,
} from '@/lib/firebase/auth';
import Button from '@/components/ui/Button';
import { useT } from '@/i18n/useT';
import type { TranslationKey } from '@/i18n/translations';
import type { UserRole } from '@/types/user';

const RECAPTCHA_ID = 'hostelhub-recaptcha';

const GATE_COPY: Record<Exclude<AuthGate, null>, { title: TranslationKey; body: TranslationKey }> = {
  contact: { title: 'auth.gateContactTitle', body: 'auth.gateContactBody' },
  save: { title: 'auth.gateSaveTitle', body: 'auth.gateSaveBody' },
  visit: { title: 'auth.gateVisitTitle', body: 'auth.gateVisitBody' },
  book: { title: 'auth.gateBookTitle', body: 'auth.gateBookBody' },
  signin: { title: 'auth.gateSigninTitle', body: 'auth.gateSigninBody' },
};

type SelectableRole = Exclude<UserRole, 'admin'>;

const ROLE_OPTIONS: { role: SelectableRole; labelKey: TranslationKey; Icon: typeof Home }[] = [
  { role: 'student', labelKey: 'role.studentLabel', Icon: GraduationCap },
  { role: 'landlord', labelKey: 'role.landlordLabel', Icon: Home },
  { role: 'agent', labelKey: 'role.agentLabel', Icon: Briefcase },
];

type Step = 'method' | 'phone' | 'otp' | 'email' | 'register';

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
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [regRole, setRegRole] = useState<SelectableRole | null>(null);
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
    setFullName('');
    setShowPassword(false);
    setRegRole(null);
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

  async function handleEmailSignIn(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isAdminCredential(email, password)) {
        // Admin path: auto-provision account + Firestore doc on first sign-in,
        // then redirect straight to the admin dashboard.
        await signInAdmin(email, password);
        await refreshAppUser();
        hide();
        navigate('/admin');
      } else {
        // Regular user path: standard email/password sign-in.
        await signInWithEmailPassword(email, password);
        await refreshAppUser();
        hide();
      }
    } catch (err) {
      setError(humanizeAuthError(err));
      setBusy(false);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!regRole) {
      setError('Please select your role to continue.');
      return;
    }

    setBusy(true);
    try {
      await registerWithEmailPassword(email, password, fullName.trim(), regRole);
      await refreshAppUser();
      hide();
      navigate(regRole === 'student' ? '/search' : '/dashboard');
    } catch (err) {
      setError(humanizeAuthError(err));
      setBusy(false);
    }
  }

  function goBack() {
    if (step === 'otp') return setStep('phone');
    setStep('method');
    setError(null);
  }

  const showBackArrow = step !== 'method';

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
        className="w-full max-w-md overflow-y-auto rounded-t-3xl bg-bg-card p-6 shadow-xl sm:rounded-3xl"
        style={{ maxHeight: '90svh' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 pr-6">
            {showBackArrow && (
              <button
                type="button"
                onClick={goBack}
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
                {step === 'register' && t('auth.registerTitle')}
              </h2>
              <p className="text-sm text-text-muted">
                {step === 'method' && t(copy.body)}
                {step === 'phone' && t('auth.phoneBody')}
                {step === 'otp' && `${t('auth.otpBodyPrefix')} ${toCameroonE164(phone) ?? phone}.`}
                {step === 'email' && t('auth.emailBody')}
                {step === 'register' && t('auth.registerBody')}
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
              {[
                { icon: <Globe className="h-5 w-5" />, label: t('auth.continueGoogle'), action: handleGoogle },
                { icon: <Smartphone className="h-5 w-5" />, label: t('auth.continuePhone'), action: () => { setStep('phone'); setError(null); } },
                { icon: <Mail className="h-5 w-5" />, label: t('auth.signInWithEmail'), action: () => { setStep('email'); setError(null); } },
              ].map(({ icon, label, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  disabled={busy}
                  className="group flex w-full items-center justify-center gap-2 rounded-full border border-border bg-bg-card px-6 py-3.5 text-base font-semibold text-text transition-colors hover:border-accent hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  <span className="transition-colors group-hover:text-white">{icon}</span>
                  {label}
                </button>
              ))}
              {/* Registration CTA */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <span className="text-sm text-text-muted">{t('auth.newToHostelHub')}</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep('register');
                    setError(null);
                  }}
                  disabled={busy}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  {t('auth.createAnAccount')}
                </button>
              </div>
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

          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              {/* Full name */}
              <input
                type="text"
                autoFocus
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('auth.fullNamePlaceholder')}
                className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-primary"
                aria-label={t('auth.fullName')}
              />
              {/* Email */}
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-primary"
                aria-label="Email"
              />
              {/* Password with show/hide */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (6+ characters)"
                  className="w-full rounded-xl border border-border bg-bg px-4 py-3 pr-11 text-sm outline-none focus:border-primary"
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {/* Role selector */}
              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  {t('auth.chooseRole')}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {ROLE_OPTIONS.map(({ role, labelKey, Icon }) => {
                    const active = regRole === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setRegRole(role)}
                        aria-pressed={active}
                        className={clsx(
                          'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition',
                          active
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-bg text-text-muted hover:bg-bg-hover',
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {t(labelKey)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Button type="submit" variant="primary" fullWidth size="lg" disabled={busy}>
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.createAccount')}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setStep('method');
                  setError(null);
                }}
                className="mx-auto block text-sm text-text-muted hover:text-text"
              >
                {t('auth.alreadyHaveAccount')}
              </button>
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
    case 'auth/email-already-in-use':
      return 'That email is already registered. Try signing in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
