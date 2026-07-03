import { create } from 'zustand';

export type AuthGate = 'contact' | 'save' | 'visit' | 'book' | 'signin' | null;

interface AuthModalState {
  open: boolean;
  gate: AuthGate;
  show: (gate: AuthGate) => void;
  hide: () => void;
}

/**
 * Single source of truth for the lazy auth modal. Any gated action calls
 * `show('contact' | 'save' | 'visit' | 'book')` to open with the right copy.
 * `show('signin')` is the generic entry point used by the nav's Sign-in button.
 */
export const useAuthModalStore = create<AuthModalState>((set) => ({
  open: false,
  gate: null,
  show: (gate) => set({ open: true, gate }),
  hide: () => set({ open: false, gate: null }),
}));
