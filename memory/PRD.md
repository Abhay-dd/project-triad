# Triad Realty — Product Requirements (Living Doc)

## Original Problem Statement
Rebuild the Triad Realty (triadrealty.ae) website with an 8-tab structure, a white/gold/black luxury theme, a reference look-and-feel inspired by 3xcapital.ae and springfieldproperties.ae, and content for a Dubai/Sharjah/UAE off-plan & resale property consultancy. Remove the generic "services" grid, change the font, and add registration-gated brochure downloads, founders/team profiles, comparative analysis, blogs, careers, contact, and footer with social/video links.

## Personas
- **Investor (HNW / international)** — wants curated off-plan inventory, market data, brochures, comparison, ROI clarity.
- **End-user buyer (family / resident)** — wants community-fit info (Dubai Hills, Aljada, etc.), payment plans, school proximity context.
- **Talent (job-seeker)** — wants open roles, why work with Triad, and a simple application form.
- **Press / partner** — wants founder bios, social handles, contact, milestones.

## Architecture
- **Frontend**: React 19 + React Router 7 (multi-page SPA), Tailwind CSS, Cormorant Garamond (display) + Outfit (body) via Google Fonts, lucide-react icons, axios.
- **Backend**: FastAPI on :8001 with all routes under `/api`, Pydantic + email-validator, Motor (async MongoDB).
- **Mongo collections**: `leads`, `contacts`, `applications` (UUID ids, ISO datetimes, `_id` always projected out).
- **Static seeded data** (in server.py): 6 PROJECTS, 4 BLOGS, 4 CAREERS.

## Pages (implemented)
1. **Home** — preloader intro → cinematic video hero (Pexels Dubai aerial, muted-loop, with poster fallback + mute toggle) → About + Milestones → Latest Launches (3 hot cards) → Top Communities (6 Dubai/Sharjah) → Team (4) → Google Reviews → CTA.
2. **About** — Hero, Who-we-are, Journey timeline, Founders (3), Team (4).
3. **Projects** — Hot launches strip (floating), search + emirate/type/config filters + price slider, 6 project cards.
4. **Project Detail** — Hero, stats row, sticky tab nav: Details / Gallery / Floor Plan / Amenities / Location / Payment Plan / Comparison / Transactions; brochure-download modal posts to `/api/leads`.
5. **Comparative Analysis** — Market KPIs, quarterly volume bar chart, add/remove project comparison table, hotspots list.
6. **Triad Experience / Gallery** — Bento image grid + lightbox.
7. **Blogs** + **BlogDetail** — Editorial feature post + 3 cards; magazine-style article.
8. **Careers** — Hero, Why Work With Us (4), Open Positions (4), Application form → `/api/applications`.
9. **Contact** — Contact details, Google Maps embed (Dubai Marina), social, contact form → `/api/contacts`.

## Cross-cutting features
- Luxury **intro/preloader** on first session load (sessionStorage flag).
- **Scroll progress bar** (gold) + **reveal-on-scroll** stagger animations (IntersectionObserver) + parallax hook.
- **New-launch popup** appears after a delay, sessionStorage-dismissed.
- **Brochure modal** (name/email/phone) gates Brochure / Factsheet / Floor Plan / Payment Plan / Comparison / Market Analysis downloads.
- Reduced-motion respect (`prefers-reduced-motion: reduce`).
- Mobile responsive (XL nav breakpoint, hamburger below).
- `data-testid` attributes throughout.

## What's been implemented (with dates)
- **2026-01-12** — MVP shipped:
  - Backend with `/api/projects`, `/api/projects/{id}`, `/api/blogs`, `/api/blogs/{id}`, `/api/careers`, `/api/leads`, `/api/contacts`, `/api/applications` (all tested via 17/17 pytest).
  - Full 9-route frontend with white/gold/black theme, Cormorant Garamond display font.
  - Brochure download modal, new-launch popup, sticky tab nav, comparison table.
  - Intro preloader, video hero (replaced photo slideshow), gold scroll-progress bar, IntersectionObserver reveal animations.

## Backlog
**P1**
- Email integration for lead / contact / application notifications (Resend or SendGrid) — currently storage-only.
- Admin/CRM page to view stored leads, contacts, applications.
- Real Google Reviews API integration (currently 5 curated quotes).
- Replace placeholder team photos with real client-supplied imagery.

**P2**
- Off-market / resale section with separate listings.
- Multi-language (Arabic + English) toggle.
- Live currency switch (AED / USD / EUR / GBP) on Projects.
- Investment calculator (price, down payment, term, rate, yield → cash flow).
- Referral programme landing page (`/referral`) with affiliate-link gen.

**P3**
- Blog CMS via Markdown files or simple admin.
- Video player for in-house YouTube tours instead of external links.
- A/B testing for hero CTA + brochure form copy.

## Next Tasks
1. Replace seed founder/team imagery with real photographs from client.
2. Wire transactional email (Resend) for `/api/leads`, `/api/contacts`, `/api/applications`.
3. Build a basic password-protected `/admin` view that lists collected leads.
