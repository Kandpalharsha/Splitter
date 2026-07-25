Act as a World-Class Senior Creative Technologist and Full-Stack Engineer. You are building a complete product: a functional expense-splitting web app AND a high-fidelity, cinematic public landing page for it. The landing page should feel like a digital instrument — every scroll intentional, every animation weighted and professional. Eradicate all generic AI patterns.

This is one project with two distinct surfaces:

Public Landing Page (/) — marketing surface, uses the full cinematic design system below.
App Screens (/login, /dashboard, /groups/:id, etc.) — functional product surface, clean and correctness-first, NOT over-styled.

Do not apply GSAP/cinematic treatment to the functional app screens — that belongs on the landing page only. Mixing heavy animation into forms and dashboards will hurt usability and correctness, which matters more for this deliverable.

PART 1 — Core Application (priority: correctness)

Stack: React + CSS for frontend, Python (Flask) for backend, MySQL for database.

Requirements
Auth: JWT-based signup/login (email + password).
Groups: Create a group (e.g., "Hostel Room 204"), add members by email, view all groups a user belongs to.
Expenses: Any member can add an expense with description, amount, payer, split type (equal or custom amount/percentage per member), and date.
Balance calculation: Per group, compute net balance per user (total paid − total owed) using SQL aggregation queries — not application-side loops.
Settlement optimizer: Minimum-cash-flow algorithm that takes net balances and outputs the minimum number of transactions to settle all debts. Present as a clear "who pays whom how much" list.
Dashboard: Overall balance across all groups, expense history per group, simple bar chart of spending by category or member.
Database schema: Normalized MySQL tables — Users, Groups, GroupMembers, Expenses, ExpenseSplits, Settlements — with proper foreign keys.
Deliverables
MySQL schema (CREATE TABLE statements with relationships)
Flask REST API (auth, groups, expenses, balances, settlement calculation)
Settlement optimization algorithm, explained and implemented in Python
React app screens: Login/Signup, Dashboard, Group View, Add Expense form, Settlement summary
App screens: clean, functional, minimal styling — prioritize correctness over visual polish
PART 2 — Public Landing Page (priority: cinematic polish)

This is the marketing page a visitor sees before signing up. Full creative license here.

Agent Flow (ask before building the landing page)

Ask these 4 questions in a single batch before generating landing page content — do not over-discuss, then build:

Brand name and one-line purpose — e.g., "SplitStay — settle hostel expenses in the fewest transactions possible."
Aesthetic direction — pick one preset (below).
3 key value propositions — e.g., "Minimum-transaction settlement," "Custom splits," "Real-time balance tracking."
Primary CTA — e.g., "Create your first group."
Aesthetic Presets

(pick one; each defines palette, typography, identity, image mood)

A — Organic Tech (Clinical Boutique): Moss 
#2E4036 / Clay 
#CC5833 / Cream 
#F2F0E9 / Charcoal 
#1A1A1A. Headings: Plus Jakarta Sans + Outfit. Drama: Cormorant Garamond Italic. Data: IBM Plex Mono. Imagery: dark forest, organic textures, lab glassware.

B — Midnight Luxe (Dark Editorial): Obsidian 
#0D0D12 / Champagne 
#C9A84C / Ivory 
#FAF8F5 / Slate 
#2A2A35. Headings: Inter. Drama: Playfair Display Italic. Data: JetBrains Mono. Imagery: dark marble, gold accents, architectural shadows.

C — Brutalist Signal (Raw Precision): Paper 
#E8E4DD / Signal Red 
#E63B2E / Off-white 
#F5F3EE / Black 
#111111. Headings: Space Grotesk. Drama: DM Serif Display Italic. Data: Space Mono. Imagery: concrete, brutalist architecture, industrial. (Suggested default for a utilitarian finance tool — reads precise, trustworthy, no-nonsense.)

D — Vapor Clinic (Neon Biotech): Deep Void 
#0A0A14 / Plasma 
#7B61FF / Ghost 
#F0EFF4 / Graphite 
#18181B. Headings: Sora. Drama: Instrument Serif Italic. Data: Fira Code. Imagery: bioluminescence, dark water, neon reflections.

Fixed Design System (apply regardless of preset)
Global CSS noise overlay via inline SVG <feTurbulence> at 0.05 opacity.
rounded-[2rem] to rounded-[3rem] radius everywhere — no sharp corners.
Buttons: "magnetic" hover (scale(1.03), cubic-bezier(0.25, 0.46, 0.45, 0.94)), sliding background layer, overflow-hidden.
Links/interactive elements: translateY(-1px) lift on hover.
All animation via gsap.context() inside useEffect, cleaned up with ctx.revert(). Entrances: power3.out. Morphs: power2.inOut. Stagger: 0.08 text / 0.15 cards.
Component Architecture

A. Navbar — "Floating Island": Fixed, pill-shaped, centered. Transparent + light text over hero; morphs to bg-[background]/60 backdrop-blur-xl with border once scrolled past hero (ScrollTrigger or IntersectionObserver). Logo, 3–4 nav links, accent CTA button.

B. Hero — "The Opening Shot": 100dvh, full-bleed Unsplash image matching preset's image mood, heavy gradient overlay. Content bottom-left third. Two-part headline: bold sans line + massive serif-italic drama line (3–5x size contrast), generated from brand name + purpose. GSAP staggered fade-up (y:40→0). CTA below headline in accent color.

C. Features — 3 functional micro-UI cards (mapped from the 3 value props):

Card 1 "Diagnostic Shuffler": 3 overlapping cards auto-cycling every 3s (array.unshift(array.pop())), spring-bounce transition. Sub-labels from value prop 1 (e.g., settlement stats).
Card 2 "Telemetry Typewriter": Monospace live-text feed typing messages related to value prop 2, blinking accent cursor, pulsing "Live Feed" dot.
Card 3 "Cursor Protocol Scheduler": Weekly grid (S M T W T F S), animated SVG cursor moves to a cell, clicks (scale(0.95)), highlights it, moves to "Save," fades out. Labels from value prop 3.

D. Philosophy — "The Manifesto": Dark-background full-width section, parallaxing low-opacity texture image. Two contrasting lines: "Most splitting apps focus on: [tracking who owes what]." (smaller, neutral) vs "We focus on: [settling it in the fewest possible transactions]." (massive, drama serif italic, accent keyword). GSAP word/line reveal on ScrollTrigger.

E. Protocol — "Sticky Stacking Archive": 3 full-screen pinned cards (ScrollTrigger pin: true); underlying card scales to 0.9, blurs 20px, fades to 0.5 as next stacks on top. Each card: unique SVG/canvas motif (rotating geometric shape / scanning laser-line over a dot grid / EKG-style pulsing waveform via stroke-dashoffset), step number (monospace), title, 2-line description — derived from the app's actual flow: 1) Add an expense, 2) We calculate balances, 3) Get the minimum settlement plan.

F. Get Started section: Since this is a free student tool (no pricing), replace the pricing grid with a single large CTA section — headline + "Create your first group" button.

G. Footer: Deep dark background, rounded-t-[4rem]. Brand + tagline, nav columns, legal links, "System Operational" status indicator (pulsing green dot, monospace label).

Technical Requirements (landing page)
React 19, Tailwind CSS v3.4.17, GSAP 3 + ScrollTrigger, Lucide React icons.
Google Fonts loaded via <link> tags per selected preset.
Real Unsplash image URLs matching the preset's image mood — no placeholders.
Single App.jsx (split into components/ if >600 lines), single index.css for Tailwind + noise overlay + custom utilities.
Mobile-first responsive: cards stack vertically, hero font scales down, navbar collapses.
Execution Directive

Do not build a generic landing page; build a digital instrument. Every scroll should feel intentional, every animation weighted and professional. Then route the CTA into the real Part 1 application (/login → real JWT auth flow).

Build Order
MySQL schema + Flask backend + settlement algorithm (Part 1, steps 1–5)
React app screens wired to the API (Part 1, step 6)
Ask the 4 landing page questions, pick a preset
Build the landing page (Part 2) with CTA routed into the real app