import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Instagram, Twitter, MessageCircle, Mail } from 'lucide-react';
import { useT } from '@/i18n/useT';

/**
 * "Contact Us" footer link — toggles a small popover (WhatsApp + email)
 * instead of navigating anywhere. Opens upward since the footer sits at the
 * bottom of the page, and closes on any outside click.
 */
function ContactPopover() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="text-text-muted hover:text-primary"
      >
        {t('footer.contact')}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t('footer.contactPopoverTitle')}
          className="absolute bottom-full left-0 z-20 mb-3 w-72 rounded-xl border border-border bg-bg-card p-4 text-left shadow-card-hover"
        >
          <p className="font-heading text-sm font-bold text-text">
            {t('footer.contactPopoverTitle')}
          </p>

          <a
            href="https://wa.me/237XXXXXXXXX"
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center gap-3 rounded-lg p-1.5 hover:bg-bg-hover"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
              <MessageCircle className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs text-text-muted">{t('footer.whatsappLabel')}</span>
              <span className="block truncate text-sm font-medium text-text">
                +237 6XX XXX XXX
              </span>
            </span>
          </a>

          <a
            href="mailto:hello@hostelhub-buea.com"
            className="mt-1 flex items-center gap-3 rounded-lg p-1.5 hover:bg-bg-hover"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs text-text-muted">{t('footer.emailLabel')}</span>
              <span className="block truncate text-sm font-medium text-text">
                hello@hostelhub-buea.com
              </span>
            </span>
          </a>

          <p className="mt-3 border-t border-border pt-3 text-xs text-text-subtle">
            {t('footer.respondNote')}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Global site footer — shown on every page via RootLayout, except /admin
 * (RootLayout hides it there since the admin dashboard is a focused tool,
 * not a marketing surface).
 */
export default function Footer() {
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Column 1 — Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white">
                <Home className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <span className="font-heading text-lg font-bold tracking-tight text-text">
                HostelHub
                <span className="ml-1 text-xs font-medium uppercase text-text-muted">Buea</span>
              </span>
            </Link>
            <p className="mt-3 font-heading text-sm font-semibold text-text">
              {t('footer.tagline')}
            </p>
            <p className="mt-1 max-w-xs text-sm text-text-muted">{t('footer.description')}</p>
          </div>

          {/* Column 2 — Platform links */}
          <div>
            <h3 className="font-heading text-sm font-bold text-text">{t('footer.platform')}</h3>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <Link to="/search" className="text-text-muted hover:text-primary">
                  {t('footer.browseListings')}
                </Link>
              </li>
              <li>
                <Link to="/roommate" className="text-text-muted hover:text-primary">
                  {t('footer.findFlatmate')}
                </Link>
              </li>
              <li>
                <Link to="/verify" className="text-text-muted hover:text-primary">
                  {t('footer.listProperty')}
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-text-muted hover:text-primary">
                  {t('footer.howItWorks')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 — Company links */}
          <div>
            <h3 className="font-heading text-sm font-bold text-text">{t('footer.company')}</h3>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="text-text-muted hover:text-primary">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <ContactPopover />
              </li>
              <li>
                <Link to="/privacy" className="text-text-muted hover:text-primary">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-text-muted hover:text-primary">
                  {t('footer.terms')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col-reverse items-center gap-4 border-t border-border pt-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-text-muted">
            &copy; {year} HostelHub Buea. {t('footer.rights')}
          </p>
          <div className="flex items-center gap-3">
            <a
              href="#"
              aria-label="Instagram"
              className="grid h-9 w-9 place-items-center rounded-full border border-border text-text-muted transition-colors hover:border-primary hover:text-primary"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="Twitter / X"
              className="grid h-9 w-9 place-items-center rounded-full border border-border text-text-muted transition-colors hover:border-primary hover:text-primary"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="https://wa.me/237XXXXXXXXX"
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="grid h-9 w-9 place-items-center rounded-full border border-border text-text-muted transition-colors hover:border-primary hover:text-primary"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
