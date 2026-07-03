import { lazy, Suspense, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, MessageCircle, Calendar, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useListing } from '@/features/listings/hooks';
import { formatFcfa } from '@/lib/format/money';
import { formatDistance } from '@/lib/format/distance';
import { useT } from '@/i18n/useT';
import { useTypeLabel, useAmenityLabel } from '@/i18n/labels';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import SaveHeart from '@/features/saves/SaveHeart';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/feedback/EmptyState';
import PageSpinner from '@/components/feedback/PageSpinner';
import { useLazyAuth } from '@/hooks/useLazyAuth';
import { useStartChat } from '@/features/chat/useStartChat';
import ScheduleVisitSheet from '@/features/visits/ScheduleVisitSheet';
import BookingSheet from '@/features/booking/BookingSheet';
import ReviewSection from '@/features/reviews/ReviewSection';

// Lazy-loaded so Leaflet never lands in the initial bundle
const ListingMap = lazy(() => import('@/features/map/ListingMap'));

export default function ListingDetailPage() {
  const { id } = useParams();
  const { data: listing, isLoading, isError } = useListing(id);
  const { require } = useLazyAuth();
  const { startChat, starting } = useStartChat();
  const [visitOpen, setVisitOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const t = useT();
  const typeLabel = useTypeLabel();
  const amenityLabel = useAmenityLabel();

  if (isLoading) {
    return <PageSpinner />;
  }

  if (isError || !listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title={t('listing.notFound')}
          description={t('listing.notFoundDesc')}
          action={
            <Link to="/search" className="btn-primary">
              {t('common.backToSearch')}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="px-4 pb-32 pt-4 sm:px-6 sm:pb-12 sm:pt-6 lg:px-8">
      <Link
        to="/search"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('common.backToSearch')}
      </Link>

      {/* Gallery */}
      <div className="mt-4 grid grid-cols-1 gap-2 overflow-hidden rounded-card sm:grid-cols-3 sm:gap-2">
        <div className="relative aspect-[4/3] sm:col-span-2 sm:aspect-auto">
          <img
            src={listing.photos[0]}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute right-3 top-3">
            <SaveHeart listingId={listing.id} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
          {listing.photos.slice(1, 3).map((src, i) => (
            <div key={i} className="aspect-[4/3] overflow-hidden">
              <img src={src} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* Header + meta */}
      <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              {typeLabel(listing.type)}
            </span>
            {listing.verified ? <VerifiedBadge /> : null}
          </div>
          <h1 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">{listing.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {listing.address} · {listing.zone}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-accent text-accent" strokeWidth={1.5} />
              {listing.rating.toFixed(1)} · {listing.reviewCount} {t('common.reviews')}
            </span>
            <span>{formatDistance(listing.distanceFromUbMeters)} {t('common.toUb')}</span>
          </div>

          <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-text">
            {listing.description}
          </p>

          <section className="mt-8">
            <h2 className="font-heading text-lg font-bold">{t('listing.included')}</h2>
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {listing.amenities.map((a) => (
                <li
                  key={a}
                  className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm"
                >
                  <ShieldCheck className="h-4 w-4 text-verified" />
                  {amenityLabel(a)}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8 rounded-card border border-border bg-bg-card p-5">
            <h2 className="font-heading text-lg font-bold">{t('listing.map')}</h2>
            <p className="mt-1 text-sm text-text-muted">
              {listing.zone} · {formatDistance(listing.distanceFromUbMeters)} {t('listing.fromUbGate')}
            </p>
            {/* Explicit height so Leaflet can compute its dimensions */}
            <div className="mt-3 h-56 w-full overflow-hidden rounded-xl sm:h-72">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-50 to-bg">
                    <PageSpinner />
                  </div>
                }
              >
                <ListingMap
                  geo={listing.geo}
                  title={listing.title}
                  distanceFromUbMeters={listing.distanceFromUbMeters}
                />
              </Suspense>
            </div>
          </section>

          <ReviewSection listing={listing} />
        </div>

        {/* Sticky price + CTAs */}
        <aside className="sm:sticky sm:top-20 sm:self-start">
          <div className="rounded-card border border-border bg-bg-card p-5 shadow-card">
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-2xl font-bold">
                {formatFcfa(listing.pricePerYear)}
              </span>
              <span className="text-sm text-text-muted">{t('common.perYear')}</span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              {t('listing.rentToLandlord')}
            </p>

            <div className="mt-5 space-y-2">
              <Button
                variant="primary"
                fullWidth
                size="lg"
                leftIcon={<MessageCircle className="h-5 w-5" />}
                disabled={starting}
                onClick={() =>
                  require('contact', () => startChat(listing.id, listing.title))
                }
              >
                {starting ? t('listing.openingChat') : t('listing.contact')}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                size="lg"
                leftIcon={<Calendar className="h-5 w-5" />}
                onClick={() => require('visit', () => setVisitOpen(true))}
              >
                {t('listing.scheduleVisit')}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                size="lg"
                onClick={() => require('book', () => setBookingOpen(true))}
              >
                {t('listing.reserve')}
              </Button>
            </div>
            <p className="mt-4 text-2xs text-text-subtle">
              {t('listing.phonePrivacy')}
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-14 z-20 border-t border-border bg-bg-card/95 px-4 py-3 backdrop-blur sm:hidden">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-sm font-bold">{formatFcfa(listing.pricePerYear)}{t('common.perYearShort')}</div>
            <div className="flex items-center gap-0.5 text-2xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3 shrink-0" strokeWidth={2} />
              {t('listing.rentToLandlordShort')}
            </div>
          </div>
          <Button
            variant="primary"
            size="md"
            leftIcon={<MessageCircle className="h-4 w-4" />}
            disabled={starting}
            onClick={() =>
              require('contact', () => startChat(listing.id, listing.title))
            }
          >
            {starting ? t('listing.opening') : t('listing.contact')}
          </Button>
        </div>
      </div>

      {/* Visit scheduling sheet */}
      <ScheduleVisitSheet
        listing={listing}
        open={visitOpen}
        onClose={() => setVisitOpen(false)}
      />

      {/* Booking-fee checkout sheet */}
      <BookingSheet
        listing={listing}
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
      />
    </div>
  );
}
