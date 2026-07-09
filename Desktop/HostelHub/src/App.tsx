import { Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import RootLayout from '@/app/layouts/RootLayout';
import PageSpinner from '@/components/feedback/PageSpinner';
import { useUser } from '@/hooks/useUser';

const HomePage = lazy(() => import('@/pages/HomePage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const ListingDetailPage = lazy(() => import('@/pages/ListingDetailPage'));
const SavesPage = lazy(() => import('@/pages/SavesPage'));
const ChatListPage = lazy(() => import('@/pages/ChatListPage'));
const ChatThreadPage = lazy(() => import('@/pages/ChatThreadPage'));
const VerifyPage = lazy(() => import('@/pages/VerifyPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const LandlordDashboardPage = lazy(() => import('@/pages/LandlordDashboardPage'));
const RoommatePage = lazy(() => import('@/pages/RoommatePage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const HowItWorksPage = lazy(() => import('@/pages/HowItWorksPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

/** Sends landlords/agents straight to their dashboard; everyone else sees the home page. */
function RoleBasedHome() {
  const { appUser } = useUser();
  if (appUser?.role === 'landlord' || appUser?.role === 'agent') {
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <Suspense fallback={<PageSpinner />}>
      <HomePage />
    </Suspense>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<RoleBasedHome />} />
        <Route
          path="search"
          element={
            <Suspense fallback={<PageSpinner />}>
              <SearchPage />
            </Suspense>
          }
        />
        <Route
          path="listing/:id"
          element={
            <Suspense fallback={<PageSpinner />}>
              <ListingDetailPage />
            </Suspense>
          }
        />
        <Route
          path="saves"
          element={
            <Suspense fallback={<PageSpinner />}>
              <SavesPage />
            </Suspense>
          }
        />
        <Route
          path="chat"
          element={
            <Suspense fallback={<PageSpinner />}>
              <ChatListPage />
            </Suspense>
          }
        />
        <Route
          path="chat/:chatId"
          element={
            <Suspense fallback={<PageSpinner />}>
              <ChatThreadPage />
            </Suspense>
          }
        />
        <Route
          path="verify"
          element={
            <Suspense fallback={<PageSpinner />}>
              <VerifyPage />
            </Suspense>
          }
        />
        <Route
          path="admin"
          element={
            <Suspense fallback={<PageSpinner />}>
              <AdminPage />
            </Suspense>
          }
        />
        <Route
          path="dashboard"
          element={
            <Suspense fallback={<PageSpinner />}>
              <LandlordDashboardPage />
            </Suspense>
          }
        />
        <Route
          path="roommate"
          element={
            <Suspense fallback={<PageSpinner />}>
              <RoommatePage />
            </Suspense>
          }
        />
        <Route
          path="profile"
          element={
            <Suspense fallback={<PageSpinner />}>
              <ProfilePage />
            </Suspense>
          }
        />
        <Route
          path="how-it-works"
          element={
            <Suspense fallback={<PageSpinner />}>
              <HowItWorksPage />
            </Suspense>
          }
        />
        <Route
          path="about"
          element={
            <Suspense fallback={<PageSpinner />}>
              <AboutPage />
            </Suspense>
          }
        />
        <Route
          path="privacy"
          element={
            <Suspense fallback={<PageSpinner />}>
              <PrivacyPage />
            </Suspense>
          }
        />
        <Route
          path="terms"
          element={
            <Suspense fallback={<PageSpinner />}>
              <TermsPage />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <Suspense fallback={<PageSpinner />}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
