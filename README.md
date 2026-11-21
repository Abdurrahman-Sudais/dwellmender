# DwellMender

**Find recurring property problems sooner.**

DwellMender is an AI-assisted property maintenance intelligence platform for property managers,
residential accommodation operators and commercial facilities teams. It organises tenant
complaints, detects duplicate reports, identifies recurring problems and prepares contractors with
the relevant repair history before dispatch.

Founded by **Ifeoma Eze** (Founder) and **Babatunde Salami** (Co-founder).

> This repository is a working product demo. All properties, tenants and contractors are
> fictional, contractor records are labelled as demonstration records, and AI features are
> **simulated** in the browser (clearly labelled in the UI) behind an AWS-ready service layer.

## Run it

```bash
npm install
npm run dev
```

Open the app, click **Log in → Continue with demo account**. Demo data is stored in your browser's
local storage; reset it from **Settings & AWS → Workspace**.

```bash
npm run build     # typecheck + production build
npm run preview   # serve the build
```

## Stack

Vite · React 18 · TypeScript · Tailwind CSS · shadcn/ui-style components (Radix) · React Router ·
Lucide · Recharts · React Hook Form + Zod · jsPDF (PDF export) · Sonner (toasts)

## What's inside

| Area | Route | Highlights |
| --- | --- | --- |
| Public website | `/`, `/features`, `/solutions`, `/how-it-works`, `/pricing`, `/about`, `/contact` | Product preview, workflow, pricing toggle, validated contact form |
| Auth | `/login`, `/register` | Zod-validated forms, demo account, Cognito-ready |
| Dashboard | `/app` | 8 KPIs, filters (property, building, issue type, priority, date), trend, overdue, activity |
| Properties | `/app/properties`, `/app/properties/:id` | Register properties with buildings/floors/units; unit map; tenants; manager; full maintenance timeline |
| Requests | `/app/requests`, `/app/requests/new`, `/app/requests/:id` | Manual or document-upload intake, photos, live AI classification and duplicate warning, 6-stage status workflow |
| AI classification | `/app/classification` | Review queue (accept/correct), Textract-style document extraction, classifier playground, accuracy tracking |
| Duplicate detection | `/app/duplicates` | Six-signal similarity, shared characteristics, history, approve/reject with confirmation — never auto-merged |
| Recurring issues | `/app/recurring` | Risk-ranked locations, unsuccessful repairs, recurrence frequency, contractors, resolution history |
| Contractor briefs | `/app/briefs`, `/app/briefs/:requestId` | Generated brief, editable sections, photo selection, approve → share |
| Contractors | `/app/contractors`, `/app/contractors/:id` | Demo profiles, assignment, job tracking, performance & callbacks |
| Reports | `/app/reports` | 7 report types with PDF and CSV export |
| Settings | `/app/settings` | AWS architecture & integration status, team, demo reset |

## Project layout

```
src/
  components/ui/       shadcn-style primitives (button, card, dialog, select, tabs, …)
  components/layout/   public + app shells
  components/shared.tsx  status/priority/category badges, AI badge, photo tiles, stat cards
  data/                types, seeded demo data, client store (localStorage)
  services/            ai.ts (Bedrock/Textract-ready), recurring.ts, config.ts (AWS settings)
  pages/public/        marketing site + auth
  pages/app/           product screens
docs/AWS_ARCHITECTURE.md  production architecture and switch-over guide
```

## The demo stories

The seed data contains realistic, interlinked histories so every feature has something to find:

- **Harbourview Residences, Flat 4B** — a bathroom ceiling leak repaired four times; the last
  engineer's note points at Flat 5B. A new report, an email follow-up and a neighbour's damp wall are
  flagged as possible duplicates.
- **Elmstead Court, Building C** — communal boiler lockouts every ~6 weeks; three students report
  no heating on the same day.
- **Kingsgate Business Centre, floor 2 east wing** — intermittent RCD trips traced to circuit 7.
- **Maple Row No. 11** — slipped tiles and a temporary valley patch; a new damp patch awaits
  classification.
- **Riverside Lofts café unit** — repeat rodent treatments with an unsealed service duct.
- **Ashdown House** — a shared kitchen stack that keeps blocking.

## Website: lead capture, AWS section and motion

- **Demo request** (home page, `#demo`) asks for company size, organisation type, primary use case and portfolio and request volume; **contact** (`/contact`) has a topic picker. Both post to HubSpot when `VITE_HUBSPOT_*` is set (see `.env.example` and `docs/crm-plan.md`), otherwise they open a pre-filled email to ifeoma@dwellmender.space.
- **Planned AWS infrastructure** and **progress** sections on the home page are driven by `src/kit/site.ts`.
- **Motion:** headings, intros and card grids fade, rise and sharpen in sequence on scroll; the hero headline enters word by word with a cycling “Built for” line, followed by a marquee band and count-up figures from the demo data (`src/kit/flow.ts`, `src/kit/Flow.tsx`). Everything is shown immediately for visitors who prefer reduced motion.
