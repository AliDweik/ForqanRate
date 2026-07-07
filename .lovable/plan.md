## Overview
Build an Arabic-first (RTL) responsive UI for a Quranic Center "Knight of the Day/Week" system. This first pass is **UI-only with mock data** — no backend, no real auth. The logo you shared uses teal + gold, so I'll seed the palette from that (easy to swap later).

## Scope (v1 — UI only)
All screens listed in your brief, wired with mock Arabic data and client-side routing. No Lovable Cloud yet — I'll enable it when you're ready to persist teachers/students/evaluations.

## Design system
- **RTL** globally (`dir="rtl"`, `lang="ar"`)
- **Fonts**: Tajawal (UI) + Amiri (Quran/display) via `<link>` in `__root.tsx`
- **Palette** (from your logo, adjustable later):
  - Primary teal `oklch(0.48 0.08 200)`, deep teal `oklch(0.35 0.07 210)`
  - Gold accent `oklch(0.78 0.14 85)`, soft cream background `oklch(0.985 0.01 90)`
- Rounded cards, soft shadows, subtle SVG Islamic geometric pattern as background layer
- Semantic tokens in `src/styles.css` + shadcn variants — no hardcoded colors in components

## Routes (TanStack file-based)
```
/                       Landing → parent flow entry (choose teacher/class)
/parent/reveal          Countdown + Knight reveal
/login                  Login card
/admin                  Super Admin dashboard (layout w/ sidebar)
  /admin/teachers
  /admin/classes
  /admin/students
  /admin/standards      Evaluation Standards CRUD
  /admin/import         5-step wizard
  /admin/templates      Knight card templates
  /admin/reports
  /admin/settings
/teacher                Teacher dashboard
  /teacher/class/$id    Class page + countdown
  /teacher/evaluate/$classId  Fast evaluation flow
/student/$id            Student profile
/leaderboard/$classId   Podium + rankings
/knight/$studentId      Premium Knight card (share/download)
```

## Key components (reusable)
`StatCard`, `IslamicPatternBg`, `StarRating` (keyboard-friendly), `CountdownTo8PM`, `KnightCard` (premium, gold/silver/bronze variants), `Podium`, `EvaluationRow` (auto-save indicator), `ImportWizard`, `ProgressRing`, `SectionHeader`, `AppSidebar` (RTL), `EmptyState`, skeletons.

## Behavior highlights
- Evaluation page: keyboard shortcuts (1–5 to rate, ←/→ next student), optimistic "saved ✓" indicator, completion % ring, locks after 8 PM local with the Arabic message.
- Parent flow: live countdown; after 8 PM auto-reveals Knight of the Day (Knight of the Week on Thursdays).
- Knight card: `html-to-image` for PNG download + Web Share API fallback.
- Reports: `recharts` (bar/line/radial).

## Out of scope this pass
Real auth, database, real Excel parsing, real photo uploads, i18n toggle. All mocked; hooks structured so swapping to Cloud later is a drop-in.

## Deliverable
A polished, navigable prototype covering every screen in your brief with realistic Arabic placeholder data. After you approve, I'll build it end-to-end in one pass, then we can iterate on the Knight card and dashboards.
