import { X, Smartphone, ArrowLeft, Loader2, Mail, Eye, EyeOff, GraduationCap, Home, Briefcase } from 'lucide-react';
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

/** Official Google coloured "G" logo — inline so no CDN dependency. */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

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

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [open]);

  useEffect(() => {
    if (open) return;
    setStep('method');
    setPhone(''); setOtp(''); setEmail(''); setPassword('');
    setFullName(''); setShowPassword(false); setRegRole(null);
    setConfirmation(null); setBusy(false); setError(null);
    clearRecaptcha();
  }, [open]);

  if (!open || !gate) return null;
  const copy = GATE_COPY[gate];

  function close() { hide(); }

  async function handleGoogle() {
    setBusy(true); setError(null);
    try { await signInWithGoogle(); hide(); }
    catch (err) { setError(humanizeAuthError(err)); setBusy(false); }
  }

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault(); setError(null);
    const e164 = toCameroonE164(phone);
    if (!e164) { setError('Enter a valid Cameroon number, e.g. 6 78 12 34 56.'); return; }
    setBusy(true);
    try { const result = await sendPhoneOtp(e164, RECAPTCHA_ID); setConfirmation(result); setStep('otp'); }
    catch (err) { setError(humanizeAuthError(err)); }
    finally { setBusy(false); }
  }

  async function handleConfirmOtp(e: FormEvent) {
    e.preventDefault();
    if (!confirmation) return;
    if (otp.trim().length < 6) { setError('Enter the 6-digit code.'); return; }
    setBusy(true); setError(null);
    try { await confirmation.confirm(otp.trim()); hide(); }
    catch (err) { setError(humanizeAuthError(err)); setBusy(false); }
  }

  async function handleEmailSignIn(e: FormEvent) {
    e.preventDefault(); setError(null); setBusy(true);
    try {
      if (isAdminCredential(email, password)) {
        await signInAdmin(email, password);
        await refreshAppUser();
        hide(); navigate('/admin');
      } else {
        await signInWithEmailPassword(email, password);
        await refreshAppUser();
        hide();
      }
    } catch (err) { setError(humanizeAuthError(err)); setBusy(false); }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault(); setError(null);
    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!regRole) { setError('Please select your role to continue.'); return; }
    setBusy(true);
    try {
      await registerWithEmailPassword(email, password, fullName.trim(), regRole);
      await refreshAppUser();
      hide();
      navigate(regRole === 'student' ? '/search' : '/dashboard');
    } catch (err) { setError(humanizeAuthError(err)); setBusy(false); }
  }

  function goBack() {
    if (step === 'otp') return setStep('phone');
    setStep('method'); setError(null);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-y-auto rounded-t-3xl bg-bg-card shadow-2xl sm:rounded-3xl"
        style={{ maxHeight: '90svh' }}
      >
        {step === 'method' ? (
          /* ─── Branded method step ─── */
          <div className="overflow-hidden">
            {/* Gradient hero header */}
            <div className="relative bg-gradient-to-br from-primary via-primary to-indigo-700 px-6 pb-10 pt-12 text-white">
              {/* Decorative background circles */}
              <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full bg-white/[0.06]" />
              <div aria-hidden className="pointer-events-none absolute -bottom-6 right-8 h-24 w-24 rounded-full bg-white/[0.06]" />
              <div aria-hidden className="pointer-events-none absolute bottom-0 left-0 h-16 w-16 rounded-full bg-white/[0.04]" />

              {/* Close */}
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="absolute right-4 top-4 rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Brand identity row */}
              <div className="mb-4 flex items-center gap-2.5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 shadow-inner">
                  <Home className="h-5 w-5 text-white" strokeWidth={2.5} />
                </span>
                <span className="font-heading text-sm font-bold tracking-wide text-white/90">
                  HostelHub <span className="font-normal opacity-70">Buea</span>
                </span>
              </div>

              <h2
                id="auth-modal-title"
                className="font-heading text-2xl font-bold leading-tight text-white"
              >
                {t(copy.title)}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                {t(copy.body)}
              </p>
            </div>

            {/* Buttons section */}
            <div className="px-6 pb-8 pt-6">
              {/* Google — primary CTA */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-bg-card px-5 py-3.5 text-sm font-semibold text-text shadow-sm transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <GoogleIcon />
                <span className="flex-1 text-center">{t('auth.continueGoogle')}</span>
              </button>

              {/* Divider */}
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium uppercase tracking-widest text-text-muted">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Phone */}
              <button
                type="button"
                onClick={() => { setStep('phone'); setError(null); }}
                disabled={busy}
                className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-border bg-bg px-5 py-3.5 text-sm font-semibold text-text transition-colors hover:border-accent hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Smartphone className="h-5 w-5" />
                <span className="flex-1 text-center">{t('auth.continuePhone')}</span>
              </button>

              {/* Email */}
              <button
                type="button"
                onClick={() => { setStep('email'); setError(null); }}
                disabled={busy}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-bg px-5 py-3.5 text-sm font-semibold text-text transition-colors hover:border-accent hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Mail className="h-5 w-5" />
                <span className="flex-1 text-center">{t('auth.signInWithEmail')}</span>
              </button>

              {/* Register */}
              <div className="mt-6 flex items-center justify-center gap-1.5">
                <span className="text-sm text-text-muted">{t('auth.newToHostelHub')}</span>
                <button
                  type="button"
                  onClick={() => { setStep('register'); setError(null); }}
                  disabled={busy}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  {t('auth.createAnAccount')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ─── All other steps (phone / otp / email / register) ─── */
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 pr-6">
                <button
                  type="button"
                  onClick={goBack}
                  aria-label="Back"
                  className="rounded-full p-1.5 text-text-muted hover:bg-bg-hover"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="space-y-1">
                  <h2 id="auth-modal-title" className="font-heading text-xl font-bold">
                    {step === 'phone' && t('auth.phoneTitle')}
                    {step === 'otp' && t('auth.otpTitle')}
                    {step === 'email' && t('auth.emailTitle')}
                    {step === 'register' && t('auth.registerTitle')}
                  </h2>
                  <p className="text-sm text-text-muted">
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
              {step === 'email' && (
                <form onSubmit={handleEmailSignIn} className="space-y-3">
                  <input
                    type="email" autoFocus autoComplete="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-primary"
                    aria-label="Email"
                  />
                  <input
                    type="password" autoComplete="current-password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
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
                      type="tel" inputMode="numeric" autoFocus
                      value={phone} onChange={(e) => setPhone(e.target.value)}
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
                    type="text" inputMode="numeric" autoFocus maxLength={6}
                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-center text-lg tracking-[0.5em] outline-none focus:border-primary"
                    aria-label="Verification code"
                  />
                  <Button type="submit" variant="primary" fullWidth size="lg" disabled={busy}>
                    {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.verifyContinue')}
                  </Button>
                  <p className="text-center text-2xs text-text-subtle">{t('auth.otpDevNote')}</p>
                </form>
              )}

              {step === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3">
                  <input
                    type="text" autoFocus autoComplete="name"
                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('auth.fullNamePlaceholder')}
                    className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-primary"
                    aria-label={t('auth.fullName')}
                  />
                  <input
                    type="email" autoComplete="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-primary"
                    aria-label="Email"
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                      value={password} onChange={(e) => setPassword(e.target.value)}
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
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                      {t('auth.chooseRole')}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {ROLE_OPTIONS.map(({ role, labelKey, Icon }) => {
                        const active = regRole === role;
                        return (
                          <button
                            key={role} type="button"
                            onClick={() => setRegRole(role)} aria-pressed={active}
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
                    onClick={() => { setStep('method'); setError(null); }}
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
          </div>
        )}

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
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for sign-in. The site admin needs to add it in Firebase Console → Auth → Settings → Authorized domains.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
