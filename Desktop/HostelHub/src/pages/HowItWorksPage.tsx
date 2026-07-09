import { Link } from 'react-router-dom';
import {
  Search,
  Heart,
  MessageCircle,
  Key,
  PlusCircle,
  ShieldCheck,
  Inbox,
  type LucideIcon,
} from 'lucide-react';

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
}

const STUDENT_STEPS: Step[] = [
  {
    icon: Search,
    title: 'Search in plain English',
    body: 'Type what you need — "quiet room near UB under 250k with water" — and see verified listings that match. Filter by zone, price, amenities, and distance from UB.',
  },
  {
    icon: Heart,
    title: 'Save your favourites',
    body: 'Tap the heart on any listing to save it. Compare rooms side by side before reaching out. Your saves sync across devices when you sign in.',
  },
  {
    icon: MessageCircle,
    title: 'Message the landlord in-app',
    body: 'All first contact happens through HostelHub chat — no phone numbers shared publicly. Schedule a visit directly in the app.',
  },
  {
    icon: Key,
    title: 'Reserve & Move In',
    body: 'Pay a small booking fee via MTN MoMo or Orange Money to hold the room for 7 days while you arrange your move. Rent goes directly to your landlord — HostelHub never holds your rent.',
  },
];

const LANDLORD_STEPS: Step[] = [
  {
    icon: PlusCircle,
    title: 'Create a free listing',
    body: 'Add your property details, upload photos and a video tour. Your listing appears in search results immediately and stays searchable — unlike WhatsApp posts that disappear.',
  },
  {
    icon: ShieldCheck,
    title: 'Get the Verified badge',
    body: 'Submit your ID and property documents through the app. The green Verified badge on your listing builds trust with students and increases enquiries.',
  },
  {
    icon: Inbox,
    title: 'Manage all enquiries in one place',
    body: 'All student messages, visit requests, and reservations come through your HostelHub dashboard. No more managing multiple WhatsApp conversations.',
  },
];

/** One step in the timeline — icon circle sits on top of the connecting line. */
function StepRow({ step, index, isLast }: { step: Step; index: number; isLast: boolean }) {
  const Icon = step.icon;
  return (
    <li className="relative flex gap-4 pb-8 last:pb-0">
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-[19px] top-10 -bottom-2 w-px bg-border"
        />
      )}
      <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-primary/30 bg-bg-card text-primary shadow-card">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <div className="pt-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Step {index + 1}
        </p>
        <h3 className="mt-0.5 font-heading text-base font-bold text-text sm:text-lg">
          {step.title}
        </h3>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-text-muted">{step.body}</p>
      </div>
    </li>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-text sm:text-4xl">
          How HostelHub Works
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-base text-text-muted sm:text-lg">
          From search to move-in — no WhatsApp chaos required.
        </p>
      </div>

      {/* For Students */}
      <section className="mt-12">
        <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-text sm:text-2xl">
          <span aria-hidden>🎓</span>
          For Students
        </h2>
        <ol className="mt-6">
          {STUDENT_STEPS.map((step, i) => (
            <StepRow key={step.title} step={step} index={i} isLast={i === STUDENT_STEPS.length - 1} />
          ))}
        </ol>
      </section>

      {/* For Landlords & Agents */}
      <section className="mt-14">
        <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-text sm:text-2xl">
          <span aria-hidden>🏠</span>
          For Landlords &amp; Agents
        </h2>
        <ol className="mt-6">
          {LANDLORD_STEPS.map((step, i) => (
            <StepRow key={step.title} step={step} index={i} isLast={i === LANDLORD_STEPS.length - 1} />
          ))}
        </ol>
      </section>

      {/* Bottom CTA */}
      <div className="mt-14 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link to="/search" className="btn-primary w-full sm:w-auto">
          Browse Listings
        </Link>
        <Link to="/verify" className="btn-secondary w-full sm:w-auto">
          List Your Property
        </Link>
      </div>
    </div>
  );
}
