import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, ArrowRight } from 'lucide-react';
import SearchBar from '@/features/search/SearchBar';
import ListingGrid from '@/features/listings/ListingGrid';
import { useListings } from '@/features/listings/hooks';
import { formatFcfaCompact } from '@/lib/format/money';
import { formatDistance } from '@/lib/format/distance';
import { useT } from '@/i18n/useT';

export default function HomePage() {
  const t = useT();
  const { data: listings, isLoading, isError } = useListings();
  const featured = (listings ?? []).slice(0, 4);

  // Three preview cards for the looping hero stack. Uses real featured listings
  // when available, otherwise the bundled placeholder room photos.
  const stackFallback = [
    { photo: '/room-1.jpg', title: t('home.teaserTitle'), zone: 'Molyko',  distanceFromUbMeters: 850,  pricePerYear: 250_000 },
    { photo: '/room-2.jpg', title: t('home.teaserTitle'), zone: 'Bonduma', distanceFromUbMeters: 1300, pricePerYear: 180_000 },
    { photo: '/room-3.jpg', title: t('home.teaserTitle'), zone: 'Molyko',  distanceFromUbMeters: 600,  pricePerYear: 420_000 },
  ];
  const stackCards = [0, 1, 2].map((i) => {
    const f = featured[i];
    return f
      ? {
          photo: f.photos[0] ?? stackFallback[i].photo,
          title: f.title,
          zone: f.zone,
          distanceFromUbMeters: f.distanceFromUbMeters,
          pricePerYear: f.pricePerYear,
        }
      : stackFallback[i];
  });

  return (
    <div className="px-4 pb-12 pt-6 sm:px-6 sm:pt-10">
      {/* Hero — blurred room interior behind a dark overlay, two-column on desktop. */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900">
        {/* Ken Burns background: starts zoomed in, slowly zooms out. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center blur-[2px] will-change-transform"
          style={{
            backgroundImage: 'url(/hero-room.jpg)',
            animation: 'hh-kenburns 22s ease-in-out infinite alternate',
          }}
        />
        {/* Dark overlay — keeps text readable over any photo. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-primary/50"
        />

        <div className="relative grid items-center gap-10 p-6 sm:p-10 lg:grid-cols-2 lg:p-14">
          {/* ── Left column: copy + search + trust ─────────────────────── */}
          <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
            <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {[t('home.heroWord1'), t('home.heroWord2'), t('home.heroWord3')].map((word, i) => (
                <span
                  key={i}
                  className="mr-2.5 inline-block"
                  style={{ animation: 'hh-fade-up 0.5s ease-out both', animationDelay: `${i * 0.12}s` }}
                >
                  {word}
                </span>
              ))}
            </h1>
            <p
              className="mt-3 text-lg font-medium text-white/85 sm:text-xl"
              style={{ animation: 'hh-fade-up 0.6s ease-out both', animationDelay: '0.5s' }}
            >
              {t('home.heroLine2')}
            </p>
            <p
              className="mx-auto mt-3 max-w-lg text-base text-white/75 sm:text-lg lg:mx-0"
              style={{ animation: 'hh-fade-in 0.6s ease-out both', animationDelay: '0.64s' }}
            >
              {t('home.subtitle')}
            </p>
            <div
              className="mt-6"
              style={{
                animation: 'hh-search-up 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                animationDelay: '0.78s',
              }}
            >
              <SearchBar size="hero" />
            </div>
            <div
              className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/90 lg:justify-start"
              style={{ animation: 'hh-fade-in 0.6s ease-out both', animationDelay: '1s' }}
            >
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                {t('home.trustVerified')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {t('home.trustDistance')}
              </span>
            </div>
          </div>

          {/* ── Right column: looping stack of 3 listing previews (desktop only) ── */}
          <div
            className="hidden items-center justify-center lg:flex"
            style={{ animation: 'hh-card-in 0.7s ease-out both', animationDelay: '0.45s' }}
          >
            <div className="relative h-[360px] w-full max-w-xs">
              {stackCards.map((card, i) => (
                <div
                  key={i}
                  className="absolute inset-x-0 top-0 will-change-transform"
                  style={{ animation: `hh-stack 9s ease-in-out ${-i * 3}s infinite` }}
                >
                  <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
                    <div className="relative aspect-[4/3] bg-gray-100">
                      <img src={card.photo} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-1 font-heading text-sm font-semibold text-gray-900">
                        {card.title}
                      </h3>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3 shrink-0" strokeWidth={2} />
                        {card.zone} · {formatDistance(card.distanceFromUbMeters)} {t('common.toUb')}
                      </p>
                      <p className="mt-2 font-heading text-base font-bold text-gray-900">
                        {formatFcfaCompact(card.pricePerYear)}
                        <span className="ml-0.5 text-xs font-normal text-gray-500">
                          {t('common.perYearShort')}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scoped entrance + ambient keyframes (self-contained; no config change). */}
        <style>{`
          @keyframes hh-fade-up {
            from { opacity: 0; transform: translateY(14px); }
            to   { opacity: 1; transform: none; }
          }
          @keyframes hh-fade-in {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          @keyframes hh-search-up {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes hh-card-in {
            from { opacity: 0; transform: translateX(48px); }
            to   { opacity: 1; transform: none; }
          }
          @keyframes hh-stack {
            0%    { transform: translateY(0)     scale(1);    opacity: 1;   z-index: 3; }
            27%   { transform: translateY(0)     scale(1);    opacity: 1;   z-index: 3; }
            33%   { transform: translateY(-44px) scale(1);    opacity: 0;   z-index: 3; }
            33.5% { transform: translateY(40px)  scale(0.86); opacity: 0;   z-index: 1; }
            39%   { transform: translateY(40px)  scale(0.86); opacity: 0.7; z-index: 1; }
            60%   { transform: translateY(40px)  scale(0.86); opacity: 0.7; z-index: 1; }
            66%   { transform: translateY(20px)  scale(0.93); opacity: 0.9; z-index: 2; }
            94%   { transform: translateY(20px)  scale(0.93); opacity: 0.9; z-index: 2; }
            100%  { transform: translateY(0)     scale(1);    opacity: 1;   z-index: 3; }
          }
          @keyframes hh-kenburns {
            from { transform: scale(1.04) translate(0, 0); }
            to   { transform: scale(1.16) translate(-1.5%, -1.5%); }
          }
          @media (prefers-reduced-motion: reduce) {
            [style*='hh-'] { animation: none !important; }
          }
        `}</style>
      </section>

      {/* Featured listings */}
      <section className="mt-10">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold">{t('home.featuredTitle')}</h2>
            <p className="mt-1 text-sm text-text-muted">{t('home.featuredSub')}</p>
          </div>
          <Link
            to="/search"
            className="hidden items-center gap-1 text-sm font-semibold text-primary hover:text-primary-700 sm:inline-flex"
          >
            {t('home.seeAll')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5">
          <ListingGrid
            listings={featured}
            loading={isLoading}
            error={isError}
            columns={4}
            skeletonCount={4}
            emptyTitle={t('home.emptyTitle')}
            emptyDescription={t('home.emptyDesc')}
          />
        </div>

        <div className="mt-6 sm:hidden">
          <Link
            to="/search"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
          >
            {t('home.seeAllListings')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Roommate matching CTA */}
      <section className="mt-10">
        <Link
          to="/roommate"
          className="group flex items-center gap-5 rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/5 to-bg p-6 transition-all hover:border-primary/40 hover:shadow-md sm:p-8"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
            🤝
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-bold">{t('home.findFlatmate')}</h2>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {t('home.aiPowered')}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-text-muted">
              {t('home.roommateSub')}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
        </Link>
      </section>

      {/* Trust strip */}
      <section className="mt-12 grid grid-cols-1 gap-4 rounded-card border border-border bg-bg-card p-6 sm:grid-cols-3">
        <div>
          <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-primary">
            {t('home.trust1Title')}
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            {t('home.trust1Body')}
          </p>
        </div>
        <div>
          <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-primary">
            {t('home.trust2Title')}
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            {t('home.trust2Body')}
          </p>
        </div>
        <div>
          <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-primary">
            {t('home.trust3Title')}
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            {t('home.trust3Body')}
          </p>
        </div>
      </section>
    </div>
  );
}
