import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-[700px] px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <h1 className="font-heading text-3xl font-bold tracking-tight text-text sm:text-4xl">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Last updated: July 2025 · Effective date: July 2025
      </p>

      <div className="prose-legal mt-8 space-y-8 text-base leading-relaxed text-text-muted">
        <section>
          <h2 className="font-heading text-lg font-bold text-text">1. Acceptance of Terms</h2>
          <p className="mt-2">
            By creating an account or using HostelHub Buea (the "Platform"), you agree to these
            Terms of Service. If you do not agree, please do not use the Platform. HostelHub Buea
            is operated as a Software Engineering capstone project at CHITECHMA University
            Institute of Technology, Buea, Cameroon. Contact:{' '}
            <a href="mailto:hello@hostelhub-buea.com" className="text-primary hover:underline">
              hello@hostelhub-buea.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-text">2. What the Platform Does</h2>
          <p className="mt-2">
            HostelHub connects students with landlords and agents offering student accommodation
            in Buea. We provide search, in-app messaging, visit scheduling, and a booking-fee
            reservation flow. HostelHub does not own, manage, or inspect any property listed on
            the Platform, and is not a party to any rental agreement between a student and a
            landlord or agent.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-text">3. Accounts &amp; Eligibility</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>You must provide accurate information when creating an account.</li>
            <li>You are responsible for keeping your account credentials secure.</li>
            <li>
              Accounts are personal — students, landlords, and agents each select the role that
              matches how they'll use the Platform, and roles cannot be changed after signup.
            </li>
            <li>We may suspend or terminate accounts that violate these Terms.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-text">
            4. Bookings &amp; Payments
          </h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              Reserving a room requires paying a booking fee through the Platform via MTN MoMo or
              Orange Money. This fee holds the room for a limited period while you arrange your
              move.
            </li>
            <li>
              <strong className="text-text">Rent itself is never collected by HostelHub.</strong>{' '}
              Rent is paid directly between the student and the landlord or agent, off-platform.
            </li>
            <li>
              HostelHub is not responsible for disputes over rent amounts, move-in dates, deposit
              refunds, or the physical condition of a room once a booking fee has been paid.
            </li>
            <li>Booking fees are generally non-refundable once a room has been held, except where required by law.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-text">
            5. Landlord &amp; Agent Responsibilities
          </h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Listings must accurately describe the property, price, and amenities.</li>
            <li>
              The "Verified" badge indicates a landlord or agent has submitted identity and
              property documents for admin review — it is not a guarantee of property condition or
              legal ownership.
            </li>
            <li>
              Landlords and agents are solely responsible for honoring the terms of any rental
              arrangement made with a student.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-text">6. Communication</h2>
          <p className="mt-2">
            To protect user privacy, first contact between students and landlords/agents happens
            through in-app chat rather than public phone numbers. Misuse of chat to harass,
            defraud, or spam other users is prohibited and may result in account suspension.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-text">7. Prohibited Conduct</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Posting false, misleading, or duplicate listings</li>
            <li>Attempting to circumvent the booking fee or verification process</li>
            <li>Harassing, threatening, or defrauding other users</li>
            <li>Using the Platform for any unlawful purpose</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-text">
            8. Limitation of Liability
          </h2>
          <p className="mt-2">
            HostelHub is provided "as is," as a student capstone project, without warranties of any
            kind. To the fullest extent permitted by law, HostelHub and its developer are not
            liable for any loss, damage, or dispute arising from a rental arrangement, a booking
            fee payment, or interactions between users of the Platform.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-text">9. Termination</h2>
          <p className="mt-2">
            You may delete your account at any time from your profile settings. We may suspend or
            terminate access to the Platform for accounts that violate these Terms or applicable
            law.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-text">10. Changes to These Terms</h2>
          <p className="mt-2">
            We may update these Terms as the Platform evolves. When we do, we will update the
            "Last updated" date above. Continued use of the Platform after changes constitutes
            acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-text">11. Contact</h2>
          <p className="mt-2">
            For any questions about these Terms:
            <br />
            Email:{' '}
            <a href="mailto:hello@hostelhub-buea.com" className="text-primary hover:underline">
              hello@hostelhub-buea.com
            </a>
          </p>
        </section>
      </div>

      <Link
        to="/"
        className="mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
    </div>
  );
}
