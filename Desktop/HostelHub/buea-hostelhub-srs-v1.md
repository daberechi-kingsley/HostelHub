# Buea HostelHub — Software Requirements Specification (SRS) v1.0

*Author: Discovery synthesis with Dab (founder)*
*Status: Draft for engineering execution*
*Companion: Buea HostelHub — Discovery synthesis*

---

## 1. Introduction

### 1.1 Purpose

This document specifies the functional and non-functional requirements for **Buea HostelHub v1** — an AI-powered Progressive Web Application that helps students and other newcomers find verified hostels, single rooms, studios, and apartments in Buea, Cameroon. It is the engineering blueprint for the rebuild and the basis for academic supervisor review.

### 1.2 Document conventions

- **FR-X.X** denotes a functional requirement.
- **NFR-X.X** denotes a non-functional requirement.
- **MUST** indicates an absolute requirement for v1.
- **SHOULD** indicates a strong preference, deferrable if engineering time is constrained.
- **MAY** indicates an optional feature.

### 1.3 Scope

HostelHub v1 covers the end-to-end journey of finding and booking a hostel or apartment in Buea: discovery, AI matching, listing detail, in-app communication (mediated by the founder in v1), visit scheduling, agent visit service, and post-booking review. Marketplace, native mobile apps, ads, and partnerships are explicitly out of scope for v1.

### 1.4 Definitions and acronyms

- **PWA**: Progressive Web Application
- **UB**: University of Buea
- **MoMo**: Mobile Money (MTN MoMo, Orange Money)
- **FCFA**: Central African CFA franc
- **NL search**: Natural-language search
- **Listing**: A hostel room, single room, studio, or apartment available for rent
- **Concierge**: The founder (Dab) acting as mediator between student and landlord in v1
- **Verified Agent**: An existing Buea hostel agent onboarded with revenue share

---

## 2. Product overview

### 2.1 Product description

HostelHub is a two-sided marketplace connecting students (and other adults) seeking accommodation in Buea with landlords and verified agents who have listings. It replaces the dominant but chaotic WhatsApp-group + informal-agent system with persistent searchable listings, AI-powered matching, verification, in-app communication, and optional concierge support.

### 2.2 Target users

- **Primary persona**: A student who needs to find a hostel, apartment, or studio in Buea — whether new to the city or returning for another year. Budget 150k FCFA to 1M+ depending on tier. Uses Android or iOS, browses on data, frustrated with WhatsApp groups and sketchy agents.
- **Secondary**: Working professionals and families seeking apartments in Buea.
- **Supply side**: Landlords, caretakers, and existing local agents (the latter onboarded as Verified Agents).

### 2.3 High-level feature set (v1)

1. Account creation and authentication (lazy — triggered at action time)
2. Search and discovery (filters + natural-language search)
3. Listing browsing (cards, details, photos, video tours, map)
4. AI matching and recommendations
5. Save, favorite, compare
6. Verified Landlord and Verified Agent badges
7. In-app chat (founder-mediated in v1)
8. Visit scheduling (hybrid: chat + in-app slots)
9. HostelHub Agent visit service (paid)
10. Booking flow (commission collected upfront by HostelHub)
11. Reviews and ratings
12. AI roommate-matching (side feature)
13. Landlord onboarding and listing management
14. Notifications (in-app + push)

### 2.4 Operating environment

- **Client**: Modern web browsers on Android, iOS, desktop. Installable as PWA on home screen.
- **Connectivity**: Designed for mobile data networks (3G, 4G); offline-friendly for saved content.
- **Backend**: Firebase cloud infrastructure (managed).
- **Geography**: Inventory restricted to Buea, Cameroon. Users may originate from anywhere.

### 2.5 Constraints and assumptions

- **Constraint**: Founder is the sole developer in v1; vibe coding with AI assistance is the primary build mode.
- **Constraint**: No budget — only free tiers and pay-per-use APIs.
- **Constraint**: Off-platform rent payments (landlord receives rent directly via MoMo or bank); HostelHub holds no rent funds.
- **Assumption**: MTN MoMo and Orange Money are the dominant payment rails for the booking-fee commission.
- **Assumption**: Most users access via Android phone on cellular data.

### 2.6 Out of scope (v1)

- Student-to-student marketplace for furniture and appliances (phase 2)
- Airbnb-style short-term hosting by students (never)
- Native Android / iOS apps (v2 if PWA limits bind)
- Multi-city expansion beyond Buea
- Ads and third-party promotional placements

---

## 3. Functional requirements

### 3.1 Authentication and user management

- **FR-3.1.1 (MUST)**: The system MUST allow unauthenticated browsing of search results and listing details.
- **FR-3.1.2 (MUST)**: The system MUST prompt sign-up only at first action requiring user identity (contact landlord, save listing, schedule visit, leave a review, book).
- **FR-3.1.3 (MUST)**: Sign-up MUST support at least: phone number + OTP, Google account. Email/password MAY be supported.
- **FR-3.1.4 (MUST)**: The system MUST distinguish between three user types: *student/renter*, *landlord*, and *agent*. Roles set at registration with a role-switch later if needed.
- **FR-3.1.5 (MUST)**: User profile MUST include name, phone, email (optional), profile photo, year of study (students only), preferences (budget range, preferred zones, lifestyle tags for roommate matching).
- **FR-3.1.6 (MUST)**: Authentication state MUST persist across PWA sessions.

### 3.2 Search and discovery

- **FR-3.2.1 (MUST)**: The home/landing screen MUST present search input, recent or featured listings, and trust signals (count of verified listings) within 2 seconds on 4G.
- **FR-3.2.2 (MUST)**: The system MUST support filter-based search by: zone (Molyko, Mile 16, Bonduma, etc.), property type (hostel room, single room, studio, 2-bed, 3-bed), price range, distance from UB, amenities (water, electricity, kitchen, balcony, toilet, parking, WiFi), availability status.
- **FR-3.2.3 (MUST)**: The system MUST support **natural-language search** — users can type free-form queries ("affordable single near Molyko with running water under 200k") and the system parses, applies filters, and ranks results.
- **FR-3.2.4 (MUST)**: Search results MUST be returned as cards showing: cover photo, property title, monthly/yearly price, zone, distance from UB, verified badge (if applicable), star rating (if reviews exist), and a quick "save" control.
- **FR-3.2.5 (MUST)**: AI matching MUST personalize result ranking based on user preferences and prior behavior (saved listings, viewed listings).
- **FR-3.2.6 (SHOULD)**: Sort options MUST include: AI recommended (default), price (ascending/descending), distance from UB, newest, highest rated.
- **FR-3.2.7 (MUST)**: Search results MUST clearly indicate availability status (Available, Reserved, Taken) and never surface Taken listings by default.

### 3.3 Listing detail

- **FR-3.3.1 (MUST)**: Listing detail page MUST display: gallery (photos), embedded or playable video tour, price (clearly broken into rent and any platform fee), location (map with marker), distance from UB on foot and by bike-taxi, amenities checklist, room type and size, availability status, landlord/agent profile snippet, verified badge, reviews and rating, posting date, similar listings.
- **FR-3.3.2 (MUST)**: Map MUST use Leaflet + OpenStreetMap.
- **FR-3.3.3 (MUST)**: Listing detail page MUST offer three primary actions: **Contact**, **Save**, **Schedule Visit**.
- **FR-3.3.4 (MUST)**: Landlord/agent phone numbers MUST NOT be visible publicly. All initial contact goes through in-app chat.
- **FR-3.3.5 (SHOULD)**: A "Request HostelHub Agent Visit" CTA MUST be present for users who cannot visit in person.

### 3.4 AI-powered features

#### 3.4.1 AI matching and recommendations

- **FR-3.4.1.1 (MUST)**: The system MUST rank search results using a recommendation model considering user-stated preferences, browsing/saving behavior, listing attributes, price fit, and distance.
- **FR-3.4.1.2 (MUST)**: AI matching MUST run server-side via the chosen LLM provider (Claude API or OpenAI) or a local heuristic if API unavailable.
- **FR-3.4.1.3 (SHOULD)**: The system SHOULD surface a "Why we recommended this" rationale for each top-ranked result.

#### 3.4.2 Natural-language search

- **FR-3.4.2.1 (MUST)**: The system MUST parse free-form user queries into a structured filter set + ranking criteria via the LLM provider.
- **FR-3.4.2.2 (MUST)**: Parsed queries MUST be displayed back to the user as editable filter chips so they can refine.

#### 3.4.3 AI-assisted verification

- **FR-3.4.3.1 (MUST)**: On listing submission, the system MUST run an automated check for duplicate listings (image similarity, address match), missing required fields, and suspicious patterns.
- **FR-3.4.3.2 (MUST)**: Suspicious or duplicate listings MUST be routed to a manual review queue (founder reviews in v1).

#### 3.4.4 AI roommate-matching

- **FR-3.4.4.1 (SHOULD)**: Users who book a shared room or have an empty bed in their hostel MAY post a roommate listing with preferences (sleep schedule, study habits, gender preference, lifestyle).
- **FR-3.4.4.2 (SHOULD)**: The system SHOULD use AI to rank candidate matches and surface them in a dedicated Roomie-Match section.

### 3.5 Save, favorite, and compare

- **FR-3.5.1 (MUST)**: Authenticated users MUST be able to save listings to a personal favorites list.
- **FR-3.5.2 (MUST)**: Users MUST be able to view their favorites in a dedicated screen.
- **FR-3.5.3 (SHOULD)**: Users SHOULD be able to add 2–4 listings to a comparison view that shows their attributes side by side.

### 3.6 In-app chat and contact

- **FR-3.6.1 (MUST)**: Tapping "Contact" on a listing MUST open an in-app chat thread.
- **FR-3.6.2 (MUST)**: In v1, the chat counterpart MUST be the HostelHub Concierge (the founder), who mediates inquiries and negotiations.
- **FR-3.6.3 (MUST)**: The system MUST persist all chat history per thread per listing.
- **FR-3.6.4 (MUST)**: The system MUST support sending text, images, and short voice notes within chat.
- **FR-3.6.5 (MUST)**: When the concierge transitions a deal to landlord finalization, the system MUST log the handoff and provide the user with the landlord's contact (WhatsApp number) along with a deal summary.
- **FR-3.6.6 (MUST)**: The chat infrastructure MUST be architected to support direct student↔landlord chat from day one, even though v1 routes through the concierge. The flip from concierge to direct chat MUST require no rebuild — only configuration.
- **FR-3.6.7 (MUST)**: A "switch trigger" admin-side metric MUST be available so the founder can monitor when to flip to direct chat (target: 30 chats/day or 4 hours/day of founder time).

### 3.7 Visit scheduling

- **FR-3.7.1 (MUST)**: Users MUST be able to request a visit via chat ("can I come this afternoon?") and via an in-app booking interface where the landlord publishes available slots.
- **FR-3.7.2 (MUST)**: In-app booking slots MUST send confirmation to both parties and create a reminder 1 hour before the scheduled time.
- **FR-3.7.3 (SHOULD)**: Cancellations and reschedules SHOULD be supported with simple in-chat actions.

### 3.8 Booking and payment

- **FR-3.8.1 (MUST)**: Once a user confirms intent to book a listing, the system MUST display the booking fee (10% of rent) clearly.
- **FR-3.8.2 (MUST)**: The system MUST collect the booking fee upfront via MTN MoMo, Orange Money, or card payment (via a Cameroon-compatible payment gateway).
- **FR-3.8.3 (MUST)**: Rent itself MUST be paid by the user directly to the landlord off-platform; HostelHub MUST NOT hold rent funds.
- **FR-3.8.4 (MUST)**: On successful booking fee collection, the system MUST mark the listing as Reserved (not yet Taken) and notify the landlord and the user.
- **FR-3.8.5 (MUST)**: When the user confirms the deal is finalized (or after 7 days with no dispute), the listing transitions to Taken and the landlord sweetener (5–10k FCFA) is queued for payout.
- **FR-3.8.6 (MUST)**: Refund policy MUST be documented and enforced in code: if the deal falls through within 72 hours of booking fee payment, the user is refunded minus a small admin fee (TBD with supervisor input).

### 3.9 Reviews and ratings

- **FR-3.9.1 (MUST)**: After a confirmed booking and ~2 weeks post-move-in, the system MUST prompt the user to leave a review of the landlord and the property.
- **FR-3.9.2 (MUST)**: Reviews MUST include a 1–5 star rating and a free-text comment, with optional photo uploads.
- **FR-3.9.3 (MUST)**: Reviews MUST be visible on the listing detail page and aggregate into the listing's average rating.
- **FR-3.9.4 (MUST)**: Landlords MUST be able to respond to reviews (one response per review).
- **FR-3.9.5 (SHOULD)**: The system SHOULD flag potentially abusive or fake reviews via AI moderation before publishing.

### 3.10 HostelHub Agent service

- **FR-3.10.1 (MUST)**: Users MUST be able to request a paid agent visit on a specific listing.
- **FR-3.10.2 (MUST)**: Agent fee MUST be collected upfront via MoMo / Orange Money / card.
- **FR-3.10.3 (MUST)**: After the agent visit, the agent MUST submit a short report (text + photos/video) viewable only by the requesting user.
- **FR-3.10.4 (SHOULD)**: Agent assignment MUST consider zone (assign the agent closest to the listing).

### 3.11 Landlord side

- **FR-3.11.1 (MUST)**: Landlords MUST be able to sign up with name, phone, email, ID document upload (for verification), and bank/MoMo details (for sweetener payouts).
- **FR-3.11.2 (MUST)**: Landlords MUST be able to create listings: title, description, type, photos (min 4), optional video, address, GPS marker on map, price, amenities, room count, availability.
- **FR-3.11.3 (MUST)**: Listings MUST go through a verification queue before publishing. Founder approves in v1.
- **FR-3.11.4 (MUST)**: Landlords MUST be able to update availability (Available, Reserved, Taken), edit listings, mark as inactive, and respond to chat messages (in v2 when direct chat is enabled).
- **FR-3.11.5 (MUST)**: Landlords MUST have a dashboard showing: active listings, inquiry count, booking count, earnings (rent + sweeteners they've received), review history.

### 3.12 HostelHub Concierge (founder mediation in v1)

- **FR-3.12.1 (MUST)**: An admin interface MUST allow the founder to see all active chat threads, respond to inquiries, set listing prices, and trigger landlord handoffs.
- **FR-3.12.2 (MUST)**: The admin interface MUST track concierge metrics: chats per day, average response time, conversion rate (chats → bookings), time spent.

### 3.13 Notifications

- **FR-3.13.1 (MUST)**: The system MUST support in-app notifications for: new chat messages, visit confirmations, booking confirmations, reservation expiring soon, review prompts, saved-listing price changes.
- **FR-3.13.2 (SHOULD)**: Push notifications MUST be supported on supported browsers (Android Chrome, iOS Safari 16.4+).
- **FR-3.13.3 (MAY)**: Email notifications MAY be sent for critical events (booking confirmation, refund processed).

### 3.14 Verified Agent (co-opted local agent) flow

- **FR-3.14.1 (MUST)**: Existing Buea agents MAY apply for Verified Agent status with their own roster of listings.
- **FR-3.14.2 (MUST)**: Approved Verified Agents MUST receive 6% of the 10% commission on bookings they originated.
- **FR-3.14.3 (MUST)**: Verified Agents MUST have a dashboard showing their listings, inquiries, and earnings.

---

## 4. Non-functional requirements

### 4.1 Performance

- **NFR-4.1.1**: Initial page load (Largest Contentful Paint) MUST be under 2.5 seconds on a Buea 4G connection.
- **NFR-4.1.2**: Search results MUST return within 1.5 seconds for filter-based searches and within 4 seconds for natural-language searches.
- **NFR-4.1.3**: Total bundle size MUST be under 250KB gzipped for initial route; lazy-load all other routes.
- **NFR-4.1.4**: Image delivery MUST use WebP/AVIF with lazy loading and blur placeholders.

### 4.2 Security and privacy

- **NFR-4.2.1**: All traffic MUST be encrypted (HTTPS).
- **NFR-4.2.2**: Phone numbers and personal data MUST NOT be exposed publicly on listing pages.
- **NFR-4.2.3**: User passwords (if used) MUST be hashed; OTP secrets MUST be one-time and time-limited.
- **NFR-4.2.4**: Firebase security rules MUST enforce role-based access (students cannot edit landlord listings, etc.).
- **NFR-4.2.5**: ID documents and verification data MUST be stored in restricted Firebase Storage buckets with admin-only read access.
- **NFR-4.2.6**: The system MUST comply with applicable Cameroonian data protection norms.

### 4.3 Usability

- **NFR-4.3.1**: The PWA MUST be installable from the browser to the home screen on Android and iOS.
- **NFR-4.3.2**: All primary user flows MUST be operable on a 360px-wide mobile screen.
- **NFR-4.3.3**: Touch targets MUST be at least 44×44px.
- **NFR-4.3.4**: All copy MUST be in English; Pidgin-friendly phrasing where natural; French-version SHOULD be considered for v1.5.

### 4.4 Scalability

- **NFR-4.4.1**: Architecture MUST handle 500 daily active users and 50 concurrent users with no degradation on Firebase Spark (free) tier.
- **NFR-4.4.2**: Database schema MUST support migration to Firebase Blaze (pay-as-you-go) tier without code changes.

### 4.5 Availability

- **NFR-4.5.1**: Target uptime: 99.5% (excluding scheduled maintenance windows).
- **NFR-4.5.2**: Service worker MUST allow offline browsing of previously loaded listings and saved favorites.

### 4.6 Localization

- **NFR-4.6.1**: All prices MUST be displayed in FCFA with proper number formatting (e.g., "250,000 FCFA").
- **NFR-4.6.2**: Date and time formatting MUST follow Cameroon conventions.
- **NFR-4.6.3**: The system MUST support phone numbers in Cameroon format (+237).

---

## 5. External interfaces

### 5.1 User interface

- Progressive Web App, mobile-first, installable on Android and iOS home screens.
- Visual design: Direction B palette (Indigo #4F46E5 primary, Coral #FF6B4A CTA, Emerald #10B981 verified, Charcoal #1F2937 text, Cream #FAFAFA background, Mist #E5E7EB borders). Typography: Plus Jakarta Sans (headings), Inter (body).

### 5.2 Software interfaces (APIs)

| Service | Purpose | Provider |
|---|---|---|
| Firebase Firestore | Primary database | Google Firebase |
| Firebase Authentication | User auth (phone OTP, Google) | Google Firebase |
| Firebase Storage | Photos, videos, ID documents | Google Firebase |
| Firebase Realtime Database | In-app chat | Google Firebase |
| Firebase Cloud Messaging | Push notifications | Google Firebase |
| Anthropic Claude API | AI matching, NL search, verification, roommate-matching | Anthropic |
| Leaflet + OpenStreetMap | Maps | OSM Foundation |
| MTN MoMo API / Orange Money API | Payment collection (booking fees) | MTN / Orange |
| Email service (e.g., SendGrid, Resend) | Transactional email (optional v1) | Third party |

### 5.3 Communications interfaces

- Real-time chat over Firebase Realtime DB.
- Push notifications over FCM.
- Optional: WhatsApp Business API for landlord handoff messages (v1.5 if time).

---

## 6. Data model (high-level entities)

The following are the core entities. Detailed schemas to be defined during implementation.

- **User** — id, role (student / landlord / agent / admin), phone, email, name, photo, preferences, createdAt
- **Listing** — id, ownerId (landlord or agent), type, title, description, price, currency, zone, gpsCoords, photos[], videoUrl, amenities[], roomCount, availability status, verifiedAt, verifiedBy, ratingAvg, ratingCount, createdAt
- **Booking** — id, listingId, userId, ownerId, bookingFee, status (Reserved / Confirmed / Disputed / Refunded / Cancelled), paidAt, finalizedAt
- **ChatThread** — id, listingId, participantIds[], lastMessageAt, status
- **Message** — id, threadId, senderId, type (text / image / voice), content, sentAt
- **Visit** — id, listingId, userId, scheduledAt, agentId (if agent visit), status, report (if agent visit)
- **Review** — id, listingId, userId, bookingId, rating, comment, photos[], landlordResponse, createdAt
- **RoommateProfile** — id, userId, listingId, preferences, lookingFor, status
- **AgentAssignment** — agentId, zones[], commissionShare

---

## 7. Technical architecture

### 7.1 Stack summary

- **Frontend**: React + TypeScript + Tailwind CSS + Vite + Vite PWA plugin
- **Backend / DB / Auth / Storage / Chat**: Firebase (Firestore, Auth, Storage, Realtime DB, Cloud Messaging)
- **AI provider**: Anthropic Claude API (primary). OpenAI may be substituted.
- **Maps**: Leaflet + OpenStreetMap
- **Hosting**: Vercel (preferred for PWA) — Firebase Hosting and Netlify also viable
- **Payment**: MTN MoMo API + Orange Money API; possibly a payment aggregator (Flutterwave, etc.) for card support

### 7.2 Deployment topology

- Client (PWA) → Vercel CDN
- Client ↔ Firebase services (direct from client where Firebase security rules permit)
- Sensitive operations (LLM calls, payment initiation, admin actions) routed via Firebase Cloud Functions to avoid exposing API keys
- Push notifications via FCM

### 7.3 AI integration architecture

- All LLM calls go through Firebase Cloud Functions (server-side) — never directly from the client. This protects API keys and allows token budgeting.
- LLM functions: parse natural-language query → structured filter; rank listings against user profile; analyze listing for verification flags; rank roommate candidates.
- Aggressive caching of LLM responses where input is similar (popular queries, common preferences) to control API spend.

---

## 8. v1 acceptance criteria

v1 is ready to launch when:

1. A new user can land on the home screen, search by filters and by natural language, view a listing detail page with photos and video tour, save it, and request a visit — all on an Android phone over 4G — in under 60 seconds.
2. AI matching returns personalized rankings within 2 seconds of search input.
3. A landlord can register, upload an ID document, list a property with photos and video, and have it appear publicly within 24 hours of approval.
4. The founder (concierge) has an admin interface showing all active chat threads and can respond, negotiate, and trigger landlord handoffs.
5. A user can pay the booking fee via MoMo or Orange Money and receive confirmation.
6. The Verified badge appears on the listing card, detail page, and landlord profile.
7. Post-booking review prompts fire at ~14 days and reviews appear on listings.
8. PWA installs to home screen on Android Chrome and iOS Safari 16.4+.
9. The app passes Lighthouse PWA audit with a score of 90+ on Performance and 100 on PWA.
10. Operational cost at launch with low traffic is below $20/month all-in.

---

## 9. Phased roadmap

### 9.1 v1 (launch)

All sections above.

### 9.2 v1.5 (post-launch, within 3 months)

- Flip concierge from default to paid-premium opt-in once volume trigger fires
- Direct student↔landlord chat as default
- Roommate-matching full implementation if not in v1
- French-language UI
- Improved verification automation
- Anti-circumvention enforcement (listing agreement terms, etc.)

### 9.3 v2 (within 12 months)

- Student-to-student marketplace (furniture, appliances)
- Native Android and iOS apps
- Partnerships (MTN, Orange, internet providers, banks)
- Multi-city expansion (Limbe, Tiko, Douala suburbs)

---

## 10. Open items requiring resolution

- Final logo direction
- Final monetization model (post-supervisor meeting)
- Refund policy specifics
- Payment gateway selection (direct MoMo APIs vs aggregator like Flutterwave)
- Exact admin fee on cancelled bookings

---

*End of SRS v1.0. Subject to revision after supervisor review.*
