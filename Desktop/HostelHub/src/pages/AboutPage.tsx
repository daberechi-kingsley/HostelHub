import { Link } from 'react-router-dom';

interface ValueCard {
  emoji: string;
  title: string;
  body: string;
}

const VALUES: ValueCard[] = [
  {
    emoji: '🔒',
    title: 'Trust',
    body: 'Verified landlords, transparent pricing, and in-app messaging keep students safe.',
  },
  {
    emoji: '📍',
    title: 'Local',
    body: 'Built specifically for Buea. Every feature reflects how students here actually search for accommodation.',
  },
  {
    emoji: '📱',
    title: 'Accessible',
    body: 'A PWA that works on any phone, with any browser, on any network speed.',
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      {/* Hero */}
      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-text sm:text-4xl">
          About HostelHub Buea
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-text-muted sm:text-lg">
          We built the platform we wish existed when we were searching for a room.
        </p>
      </div>

      {/* The problem */}
      <section className="mt-12">
        <h2 className="font-heading text-xl font-bold text-text sm:text-2xl">
          The Problem We're Solving
        </h2>
        <p className="mt-3 text-base leading-relaxed text-text-muted">
          Every September, thousands of students arrive in Buea to study at the University of
          Buea, CHITECHMA, and other institutions. Most of them face the same exhausting process:
          scrolling through WhatsApp groups, calling numbers from handwritten flyers, visiting
          rooms that don't match their descriptions, and paying middlemen who offer no
          accountability.
        </p>
        <p className="mt-3 text-base leading-relaxed text-text-muted">
          There is no verified, searchable, permanent record of available student accommodation in
          Buea. Until now.
        </p>
      </section>

      {/* What we built */}
      <section className="mt-10">
        <h2 className="font-heading text-xl font-bold text-text sm:text-2xl">What We Built</h2>
        <p className="mt-1 text-sm font-semibold text-primary">
          A verified accommodation platform built for Buea students
        </p>
        <p className="mt-3 text-base leading-relaxed text-text-muted">
          HostelHub is a Progressive Web App — meaning it installs on your phone like a native
          app, works even with slow internet, and sends you notifications — without requiring a
          Play Store download.
        </p>
        <p className="mt-3 text-base leading-relaxed text-text-muted">
          Every listing on HostelHub is attached to a real landlord or agent who has gone through
          our verification process. Every room has photos, amenities, and distance from UB
          calculated automatically. Every conversation happens in-app, not in a WhatsApp group
          that disappears in 24 hours.
        </p>
      </section>

      {/* Our values */}
      <section className="mt-10">
        <h2 className="font-heading text-xl font-bold text-text sm:text-2xl">Our Values</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="rounded-card border border-border bg-bg-card p-5 text-center sm:text-left"
            >
              <span className="text-2xl" aria-hidden>
                {v.emoji}
              </span>
              <h3 className="mt-2 font-heading text-base font-bold text-text">{v.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-text-muted">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Built by a student */}
      <section className="mt-10">
        <h2 className="font-heading text-xl font-bold text-text sm:text-2xl">
          Built by a student, for students
        </h2>
        <p className="mt-3 text-base leading-relaxed text-text-muted">
          HostelHub was designed and developed as a final-year Software Engineering capstone
          project at CHITECHMA University Institute of Technology, Buea. It is a real product,
          built on real infrastructure, solving a real problem.
        </p>
      </section>

      {/* Bottom CTA */}
      <div className="mt-14 flex justify-center">
        <Link to="/search" className="btn-primary">
          Browse Listings
        </Link>
      </div>
    </div>
  );
}
