import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import BottomNav from './BottomNav';
import LazyAuthModal from '@/features/auth/LazyAuthModal';
import RoleSelection from '@/features/auth/RoleSelection';
import CompareBar from '@/features/compare/CompareBar';
import CompareDrawer from '@/features/compare/CompareDrawer';
import { useFcmToken } from '@/hooks/useFcmToken';

function FcmRegistrar() {
  // Side-effect only — no UI. Runs once the user is signed in.
  useFcmToken();
  return null;
}

export default function RootLayout() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Soft brand wash behind every page — pure CSS gradients (no image, no
          blur filter) so it's free in bytes and cheap on low-end phones. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-bg"
        style={{
          backgroundImage:
            'radial-gradient(60% 55% at 12% -5%, rgba(99,102,241,0.14), transparent 60%),' +
            'radial-gradient(55% 50% at 105% 105%, rgba(255,107,74,0.11), transparent 60%)',
        }}
      />
      <TopNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <BottomNav />
      {/* Global overlays and portals */}
      <LazyAuthModal />
      <RoleSelection />
      <CompareBar />
      <CompareDrawer />
      {/* Push notification registration — no-op in emulator / when VAPID key absent */}
      <FcmRegistrar />
    </div>
  );
}
