import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[700px] px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <h1 className="font-heading text-3xl font-bold tracking-tight text-text sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Last updated: July 2025 · Effective date: July 2025
      </p>

      <div className="prose-legal mt-8 space-y-8 text-base leading-relaxed text-text-muted">
        <section>
          <h2 className="font-heading text-lg font-bold text-text">
            1. Introduction &amp; Who We Are
          </h2>
          <p className="mt-2">
            HostelHub Buea is a student accommodation discovery platform operated as a Software
            Engineering capstone project at CHITECHMA University Institute of Technology, Buea,
            Cameroon. Contact:{' '}
            <a href="mailto:hello@hostelhub-buea.com" className="text-primary hover:underline">
              hello@hostelhub-buea.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-text">2. What Data We Collect</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Account data: name, email, phone number (via Google Sign-In or Firebase Auth)</li>
            <li>Listing data submitted by landlords and agents</li>
            <li>Usage data: pages visited, searches performed</li>
            <li>Device data: browser type, PWA installation status</li>
            <li>Messages sent through the in-app chat</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-text">3. How We Use Your Data</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>To operate the platform and connect students with listings</li>
            <li>To send booking notifications and chat messages</li>
            <li>To verify landlord and agent identities</li>
            <li>To improve the platform based on usage patterns</li>
            <li>We do NOT sell your personal data to third parties under any circumstances</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-text">
            4. Data Storage &amp; Security
          </h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>All data is stored on Google Firebase infrastructure (Firestore and Firebase Auth)</li>
            <li>Firebase operates on GDPR-compliant servers</li>
            <li>
              Passwords are never stored by HostelHub — authentication is handled entirely by
              Firebase Auth and Google OAuth
            </li>
            <li>Data is encrypted in transit (HTTPS) and at rest</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-text">5. Your Rights</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Right to access: request a copy of your personal data</li>
            <li>
              Right to deletion: delete your account and associated data at any time from your
              profile settings
            </li>
            <li>Right to correction: update your profile information at any time</li>
            <li>
              To exercise any right, contact:{' '}
              <a href="mailto:hello@hostelhub-buea.com" className="text-primary hover:underline">
                hello@hostelhub-buea.com
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-text">6. Cookies</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>We use minimal session cookies for authentication state management</li>
            <li>We do not use advertising cookies or third-party tracking cookies</li>
            <li>
              PWA functionality may store data in your browser's local storage for offline use
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-text">7. Changes to This Policy</h2>
          <p className="mt-2">
            We may update this Privacy Policy as the platform evolves. When we do, we will update
            the "Last updated" date above. Continued use of the platform after changes constitutes
            acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-text">8. Contact</h2>
          <p className="mt-2">
            For any privacy-related questions or requests:
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
