# StackOne Logs

An interview-take on StackOne's **Request Logs** page: a recreation of the Figma flow with a written UX critique, a design pass on the improvements, and a working implementation.

> **Mission** · Help engineers find and fix integration failures fast. Every interaction in the Logs section accelerates the loop: *spot anomaly → drill into a request → understand why → take corrective action*. The **request** is the entity; everything else is a lens onto it.

![Default light view](docs/screenshots/01-default-light.png)

---

## Quick start

```bash
pnpm install
pnpm dev           # http://localhost:5173/logs
pnpm build         # production build (+ service worker + manifest)
pnpm preview       # serve the production build locally
```

Requires Node 22+ and pnpm 11+. Or swap pnpm for npm / yarn — there's nothing pnpm-specific.

The mock data layer simulates 800–1200ms of network latency so the skeleton states are visible during interaction.

---

## What's in the box

**Recreation of all 30 Figma frames** as a single working app:
- Logs list with chart + filterable table + detail drawer
- Empty / loading / expanded states
- Detail drawer with Request/Response accordions, underlying requests tab, expiry variants
- Full AI Error Explainer state machine: gated → collapsed → generating → generated → feedback → submitted

**Improvements designed and shipped on top** (see [docs/improvements.md](docs/improvements.md)):
1. **URL-synced state** — every filter, the selected log, the active tab, and the chart's time range live in the URL. Refresh works, back button works, links are shareable
2. **Chart ↔ table sync** — hover a row, the matching bar in the chart lifts. Hover a bar, the rows in that bucket get an accent stripe. Click a bar to filter the table to that 12-second window
3. **Surface Replay on row hover** — the daily action moves from "two clicks behind a `…` menu" to one click on the row
4. **4-tier status pills with non-color signal** — 2xx ✓ / 3xx ⇄ / 4xx ⚠ / 5xx ✕. Operations can scan client vs server failures at a glance. WCAG 1.4.1
5. **⌘K command palette + keyboard shortcuts** — `/ j k r esc ⌘K` for power users
6. **Installable as a PWA** — manifest + service worker + StackOne icon. Opens in its own window without browser chrome

The Figma's frozen-timestamp pattern (every row showing `21:05:19.123`) is replaced by realistic varied timestamps from Faker — see [docs/critique.md § 1.1](docs/critique.md).

![Default dark view](docs/screenshots/02-default-dark.png)

---

## Stack and rationale

Every dependency has a one-line UX or accessibility justification. Total: 14 runtime deps.

| Dependency | Why |
|---|---|
| **Vite + React 18 + TypeScript** | Fast dev. React 18 for `useSyncExternalStore` (theme manager, hover store). |
| **React Router 6** | URL-synced state via `useSearchParams`. Native typed-enough for the contract we need. |
| **Zustand** | 1KB cross-component hover handshake between chart and table. Smaller than Redux/Context+reducer. |
| **TanStack Table** | Headless table. Column visibility, sort, per-column filters, pagination — without bringing styles. |
| **Visx** | Chart with `linearGradient`-filled bars (continuous error-on-success without seams), brush-ready scales, bidirectional hover via `useHoverStore`. |
| **@visx/responsive (ParentSize)** | Native-width chart rendering so x-axis tick labels don't get stretched. |
| **Radix UI primitives** | Dialog (drawer), DropdownMenu, Tabs, Tooltip, Switch, Popover, Accordion, Avatar, Toast. Headless, accessible, zero styles. |
| **react-day-picker** | Date range inside a Radix Popover. Hand-rolling a date picker is 200+ LOC of a11y traps. |
| **cmdk** | Headless ⌘K palette primitive. Wrapped in Radix Dialog for focus-trap + Esc behavior. |
| **@phosphor-icons/react** | Icons with weight variants — `weight="fill"` for active sidebar nav, `regular` elsewhere. State expression through a single icon. |
| **vite-plugin-pwa** | Installable manifest + service worker. App shell precaches; mock data stays NetworkOnly. |
| **@faker-js/faker** | Realistic mock data. Fixed seed (42) so the dataset is deterministic across renders. |
| **sharp** *(dev only)* | One-shot PNG icon generation from the SVG source. |

**Deliberately avoided:**

| | Why not |
|---|---|
| Tailwind / utility CSS | Project mandate: semantic CSS with role classes on primitives (`<button class="primary">`, not `.btn-primary`). |
| Framer Motion | All animations are CSS transitions on Radix `[data-state]` attrs. No JS for motion. |
| TanStack Query | Mock-only data layer. A ~40-LOC `useQuery` hook is enough until a real backend lands. |
| Recharts / Nivo / Tremor | Recharts has clunky `activeIndex`-based hover sync; Visx's render-prop API made the bidirectional sync cleaner. |
| Sonner / shadcn | Both ship their own theme. Radix primitives + own CSS keeps everything stylable. |
| date-fns / dayjs | Native `Intl.RelativeTimeFormat` and `Intl.DateTimeFormat` cover every format we needed. |

---

## File layout

```
src/
├── App.tsx                       # Router shell, TooltipProvider
├── main.tsx                      # Entry, BrowserRouter
├── styles/
│   ├── reset.css                 # @layer reset
│   ├── tokens.css                # @layer tokens — colors, spacing, radii, motion (light + dark)
│   ├── primitives.css            # @layer primitives — element baselines (button, input, kbd, …)
│   ├── roles.css                 # @layer roles — variants as compound selectors (button.primary)
│   ├── patterns.css              # @layer patterns — composed components (chart card, drawer, table…)
│   └── layout.css                # @layer layout — page-level grids
├── pages/Logs/
│   ├── index.tsx                 # Page composition + URL state wiring + keyboard shortcuts
│   ├── LogsChart.tsx             # Visx stacked bars with gradient fills, hover sync, brush-click filter
│   ├── LogsTable.tsx             # TanStack Table — controlled column filters, pagination, row replay
│   ├── LogsFilters.tsx           # Search + date range + Background Logs toggle + Refresh
│   ├── LogsDetail.tsx            # Drawer with tabs, accordions, AI Error Explainer state machine
│   ├── LogsEmpty.tsx             # Empty / no-results states
│   └── LogsLoading.tsx           # ChartSkeleton + TableSkeleton with shimmer
├── components/
│   ├── primitives/               # Drawer, Switch, Tooltip (thin Radix wrappers)
│   ├── CommandPalette.tsx        # cmdk + Radix Dialog (modal={false} so it doesn't slide the drawer)
│   ├── ColumnFilterMenu.tsx      # Per-column filter dropdown (Method, Status, Account, Source)
│   ├── RowActionsMenu.tsx        # Row "…" dropdown — Replay, Batch-Replay, Request Tester, Integration, Account
│   ├── Sidebar.tsx               # Collapsible nav with stub-link console warnings
│   ├── TopBar.tsx                # Page title + ⌘K hint + theme toggle + Docs link
│   ├── DateRangePicker.tsx       # react-day-picker in Radix Popover with active-state clear button
│   ├── StatusPill.tsx            # 4-tier severity pill with icon + tooltip
│   ├── Avatar.tsx                # Deterministic color from account name
│   ├── MethodBadge.tsx           # HTTP method chip
│   ├── JsonViewer.tsx            # Recursive JSON tree (~80 LOC, no library)
│   ├── ThemeToggle.tsx           # Auto / Light / Dark cycle
│   └── Toaster.tsx               # Radix Toast with optional action button
├── data/
│   ├── types.ts                  # Log, ChartBucket, ChartSummary, UnderlyingRequest
│   ├── mock.ts                   # Faker generators with seeded output; bucket-coverage guaranteed
│   ├── service.ts                # Mock list/get/replay with 800-1200ms latency
│   └── useQuery.ts               # ~40 LOC query hook
├── state/
│   ├── urlState.ts               # useUrlState — typed wrapper over useSearchParams
│   ├── hoverStore.ts             # Zustand: bucket-hover + source ('bar' | 'row')
│   └── sidebarStore.ts           # Sidebar collapse persistence
└── lib/
    ├── theme.ts                  # Theme manager + useTheme (useSyncExternalStore)
    ├── time.ts                   # Intl wrappers (relative, absolute, duration, delta)
    ├── buckets.ts                # Timestamp ↔ bucket-index helpers
    └── keyboard.ts               # useKeyboardShortcut — single document listener with modifier matching

docs/
├── critique.md                   # Phase B — 17-issue UX audit, anchored to Figma frames
├── improvements.md               # Phase C — design proposals for the four items implemented
├── audit.md                      # Per-frame Figma-vs-implementation discrepancy log
├── figma/                        # Reference Figma frames (PNG)
├── audit/                        # Side-by-side comparison screenshots
└── screenshots/                  # Final state captures (this README)
```

CSS uses cascade layers (`@layer reset, tokens, primitives, roles, patterns, layout, overrides`) so specificity is predictable and we can append new patterns without fighting the cascade.

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `/` | Focus the search input |
| `j` / `↓` | Next row (opens first if no row selected) |
| `k` / `↑` | Previous row |
| `Enter` | Open detail drawer for the selected row |
| `r` | Refresh chart + table |
| `Esc` | Close drawer, palette, popover |
| `⌘K` / `Ctrl+K` | Toggle command palette |

Shortcuts suppress when focus is inside an `<input>` / `<textarea>` / contenteditable. Modifier matching is exact — pressing `⌘K` won't trigger plain `k`.

---

## URL contract

```
/logs?q=:string
     &status=:csv         # success | redirect | client-error | server-error
     &method=:csv         # GET,POST,PUT,PATCH,DELETE
     &account=:csv        # account names (deduplicated)
     &source=:csv         # source types
     &from=:isoDate
     &to=:isoDate
     &log=:logId
     &tab=details|underlying
     &state=empty         # demo-only: forces the empty list state
```

Every meaningful piece of UI state is in the URL. A reload restores context, the back button works as users expect, and any view is shareable as a link.

---

## Design decisions worth flagging

**Color palette — softer chart, brand-faithful chrome.** The chart bars use mint `#59CCA0` + salmon `#F0A89E` instead of the brand `#00AF66` / `#EF3737`. The brand greens/reds are saved for status pills, accents, and alarm signals; chart bars carry traffic density and look calmer for it.

**Single-gradient bars, not stacked rects.** Two stacked rects with rounded corners produce a visible seam between segments. Each bucket renders as one `<rect>` with a `linearGradient` and a hard color stop at the error/success boundary — visually continuous, single hover region, simpler tooltip.

**Sidebar collapse is one-way.** Opening the detail drawer collapses the sidebar; closing it does *not* re-expand. Repeated row clicks would otherwise produce a jarring expand/collapse cycle.

**Bucket-mate highlight only fires from the chart side.** Originally, hovering a row also lit up every other row in the same time bucket — visually noisy with 12s buckets. The hover store now tracks `hoverSource: 'bar' | 'row'`; row-hover only lifts the matching bar, bar-hover lights bucket-mates.

**Mocked data favours realism over fidelity.** The Figma's frozen `21:05:19.123` timestamp on every row would have been technically faithful but functionally misleading — see [critique 1.1](docs/critique.md). One log per visible chart bucket is seeded so click-filtering a bar always yields results.

**No `Framer Motion`.** Drawer slide, accordion expand, toast spring, row pulse — all CSS transitions targeting Radix's `[data-state="open|closed"]` attributes. Smaller bundle, single motion language.

**Status pill is 4-tier.** 4xx and 5xx are categorically different problems for an integration engineer; the previous all-red treatment hid that. Amber-for-client-error, red-for-server-error is the operational signal.

Full critique and per-item design rationales: [docs/critique.md](docs/critique.md) · [docs/improvements.md](docs/improvements.md) · [docs/audit.md](docs/audit.md).

---

## Accessibility

- **Keyboard reachable everything** — tab order is logical, focus rings via `:focus-visible` globally
- **Radix primitives** carry their own focus management (Dialog focus trap, DropdownMenu roving tabindex, Tooltip aria-describedby)
- **Status not color-only** — every status pill has an icon and a tooltip explaining the category
- **Chart has `role="img"` + `aria-label`** summarising the series; tooltip values are programmatic
- **Sidebar tooltips on collapse** keep labels accessible to screen readers when icons are the only visual
- **`prefers-reduced-motion`** zeros out all animation/transition durations site-wide
- **Theme system** respects `prefers-color-scheme` by default, persists explicit user choice

---

## Out of scope

Documented in [docs/critique.md](docs/critique.md) as "what we'd do next":
- Bulk row actions (multi-select Replay)
- Saved searches / recently viewed
- Realtime streaming updates instead of manual Refresh
- Two-tier drawer header for nested underlying-request views
- Sort state in URL (filter state is)
- Live unit tests / Playwright (manual verification is the bar for the assignment)

The bundle is ~370KB gzipped — fine for an internal tool, would code-split per route in a real app with more pages.

---

## License

Interview project — not licensed for redistribution.
