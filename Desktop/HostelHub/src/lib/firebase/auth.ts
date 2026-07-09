/**
 * Auth helpers — thin wrappers over the Firebase Auth SDK.
 *
 * Two sign-in methods (locked in spec): Google popup and phone OTP.
 * Phone numbers are Cameroon E.164 (+237 + 9 digits).
 *
 * In emulator mode the reCAPTCHA is auto-solved and the OTP code is printed
 * to the Firebase emulator logs instead of being sent by SMS.
 */
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signOut,
  type ConfirmationResult,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import { env } from '@/config/env';
import type { UserRole } from '@/types/user';

// ---- Google ----

export async function signInWithGoogle(): Promise<FirebaseUser> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

// ---- Phone OTP ----

let recaptcha: RecaptchaVerifier | null = null;

/** Lazily create the invisible reCAPTCHA verifier bound to a DOM container. */
function ensureRecaptcha(containerId: string): RecaptchaVerifier {
  if (recaptcha) return recaptcha;
  recaptcha = new RecaptchaVerifier(getFirebaseAuth(), containerId, {
    size: 'invisible',
  });
  return recaptcha;
}

/** Tear down the verifier — call when the auth modal closes. */
export function clearRecaptcha(): void {
  if (recaptcha) {
    recaptcha.clear();
    recaptcha = null;
  }
}

/**
 * Normalize a Cameroon phone number to E.164.
 * Accepts "678123456", "6 78 12 34 56", "+237678123456", "237678123456".
 */
export function toCameroonE164(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.startsWith('237') && digits.length === 12) return `+${digits}`;
  if (digits.length === 9 && /^[26]/.test(digits)) return `+237${digits}`;
  return null;
}

export async function sendPhoneOtp(
  phoneE164: string,
  recaptchaContainerId: string,
): Promise<ConfirmationResult> {
  const auth = getFirebaseAuth();
  const verifier = ensureRecaptcha(recaptchaContainerId);
  return signInWithPhoneNumber(auth, phoneE164, verifier);
}

// ---- Hidden admin ----

/**
 * True when the supplied credentials exactly match the configured admin
 * account (VITE_ADMIN_EMAIL / VITE_ADMIN_PASSWORD). Email is compared
 * case-insensitively; password is an exact match.
 *
 * ⚠️ These env vars are bundled into the client JS and are NOT secret. This
 * check is just the trigger for the admin sign-in path; the real privilege
 * gate is the email-matched Firebase Auth token enforced in firestore.rules.
 */
export function isAdminCredential(email: string, password: string): boolean {
  const adminEmail = env.admin.email.trim().toLowerCase();
  const adminPassword = env.admin.password;
  if (!adminEmail || !adminPassword) return false;
  return email.trim().toLowerCase() === adminEmail && password === adminPassword;
}

/**
 * Sign in the hardcoded admin via Firebase email/password auth, provisioning
 * both the Auth account and the users/{uid} admin doc on first ever sign-in.
 *
 * MUST only be called after isAdminCredential() has returned true — by then
 * the password is known-correct, so an auth failure means the account simply
 * doesn't exist yet and we create it.
 *
 * Requires the Email/Password provider to be enabled in Firebase Auth.
 */
export async function signInAdmin(email: string, password: string): Promise<FirebaseUser> {
  const auth = getFirebaseAuth();
  let user: FirebaseUser;
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    user = cred.user;
  } catch (err) {
    const code = (err as { code?: string })?.code ?? '';
    // First run: the admin Auth account doesn't exist yet. Modern Firebase
    // collapses "user-not-found" and "wrong-password" into invalid-credential;
    // since the password is known-correct here, this means create it.
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      user = cred.user;
    } else {
      throw err;
    }
  }
  await ensureAdminUserDoc(user);
  return user;
}

/** Create or promote the admin's users/{uid} doc to role 'admin' (idempotent). */
async function ensureAdminUserDoc(user: FirebaseUser): Promise<void> {
  const db = getFirebaseDb();
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      role: 'admin',
      displayName: 'HostelHub Admin',
      phone: null,
      email: user.email ?? null,
      avatarUrl: null,
      verified: true,
      createdAt: Date.now(),
      fcmTokens: [],
    });
  } else if (snap.data().role !== 'admin') {
    // Promote an existing doc — allowed by rules because the auth token email
    // matches the admin email (isAdmin()).
    await setDoc(ref, { role: 'admin', verified: true }, { merge: true });
  }
}

// ---- Email/password registration (regular users) ----

/**
 * Register a new user with email + password and immediately write their
 * HostelHub user doc. Bypasses the RoleSelection gate because role is
 * captured in the registration form.
 */
export async function registerWithEmailPassword(
  email: string,
  password: string,
  displayName: string,
  role: Exclude<UserRole, 'admin'>,
): Promise<FirebaseUser> {
  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await createUserDoc({ uid: cred.user.uid, role, displayName, email });
  return cred.user;
}

// ---- Sign out ----

export async function signOutUser(): Promise<void> {
  await signOut(getFirebaseAuth());
}

// ---- User doc ----

export async function userDocExists(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(getFirebaseDb(), 'users', uid));
  return snap.exists();
}

/**
 * Create the HostelHub user doc on first sign-in. Role is one of the three
 * self-selectable roles — 'admin' is never assignable from the client
 * (enforced by Firestore rules).
 */
export async function createUserDoc(params: {
  uid: string;
  role: Exclude<UserRole, 'admin'>;
  displayName: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
}): Promise<void> {
  const db = getFirebaseDb();
  await setDoc(doc(db, 'users', params.uid), {
    role: params.role,
    displayName: params.displayName,
    phone: params.phone ?? null,
    email: params.email ?? null,
    avatarUrl: params.avatarUrl ?? null,
    verified: false,
    createdAt: Date.now(),
    fcmTokens: [],
  });
}
