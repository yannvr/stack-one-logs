# Phase C — Improvement Design

> Per-issue design proposals for the items selected from `docs/critique.md`.
> No code is written until each section has user sign-off.

Four improvements approved for build:

1. **URL-synced state** — shareable filters, selected log, time range, tab
2. **Surface Replay on row hover** — primary action visible, not buried under `…`
3. **⌘K command palette + keyboard shortcuts** — `/ j k r esc`, jump-to-log
4. **4xx vs 5xx severity + a11y status icons** — semantic depth + non-color signal

---

## 1. URL-synced state (critique item 3.3)

**Goal:** every interaction that changes what's on screen should be reflected in the URL, so links are shareable, back-button works, and a hard refresh restores context.

### URL contract

```
/logs?q=:string
     &status=:csv      // success | client | server (subset of)
     &method=:csv      // GET,POST,PUT,PATCH,DELETE
     &account=:csv     // account names
     &source=:csv      // Test Connection | Test Mapping | Identifier | ...
     &from=:isoDate
     &to=:isoDate
     &log=:logId       // open detail drawer
     &tab=details|underlying
```

### Implementation

- Replace local `useState` for filters in `pages/Logs/index.tsx` with `useSearchParams` from React Router. Filter changes write via `setSearchParams({...current, q: 'foo'}, { replace: false })`.
- The chart bar-click that sets a time range writes `from` + `to` instead of local state.
- Opening the drawer writes `?log=<id>`; closing removes it. Listening for back/forward closes/opens the drawer naturally.
- `tab` state (Details / Underlying Requests) also URL-synced.

### Tradeoff

- Pro: shareability, back/forward works, refresh-stable. Demos like a real product.
- Con: a small refactor of state plumbing. ~80 LOC moved.
- Con: column filters use TanStack Table's internal state (`columnFilters`) — I'll sync that to the URL via a `useEffect` mirror rather than re-parenting all the column filter state.

### Out of scope (deferred)

- Sort state in URL. Low value; deferred.
- Pagination state in URL. Pagination resets on filter change anyway; deferred.

---

## 2. Surface Replay on row hover (critique item 2.3)

**Goal:** Replay is the primary daily action. Today it requires two clicks (open `…` → click Replay). Move it to a row-hover affordance.

### Design

- On row-hover, a small "Replay" icon button appears in the same column as the existing chevron, to the left of it. Phosphor `ArrowsClockwise` icon, 24×24, ghost style.
- Click triggers the existing `onReplay(log)` flow with the existing toast.
- The `…` menu stays — Batch-Replay, Request Tester, Integration, Account remain there. Replay is duplicated (visible + in menu) because it's the most common.
- Tooltip on the hover button: "Replay request".

### Tradeoff

- Pro: 1 click instead of 2 for the daily action. Linear-style row affordance.
- Con: row-hover affordances are not keyboard accessible by default. Need to ensure the button is reachable via tab order (it is — buttons inside `<td>` are tabbable). Set `aria-hidden="true"` until row gets focus is wrong; keep it always tabbable and rely on opacity transition for visual reveal.
- Con: visible button adds one more icon to a row that already has count, `…`, and chevron. Acceptable.

### Out of scope

- Bulk replay (multi-select). Listed as critique 8.1, deferred.

---

## 3. ⌘K palette + keyboard shortcuts (critique item 3.4)

**Goal:** power users investigate dozens of logs per session. Reduce hand-to-mouse cost.

### Shortcuts

| Key | Action |
|---|---|
| `/` | Focus the search input |
| `j` / `↓` | Move selection down within visible rows |
| `k` / `↑` | Move selection up within visible rows |
| `Enter` | Open detail drawer for selected row |
| `r` | Refresh (chart + table) |
| `esc` | Close drawer or palette |
| `⌘K` / `Ctrl+K` | Open command palette |

### Command palette (cmdk — already installed)

A Radix Dialog hosting cmdk, with grouped command sections:
- **Actions**: Refresh, Replay last log, Clear filters
- **Navigation**: Jump to log by id, jump to first/last page
- **Filters**: "Show only errors", "Show only success", "Clear time range"
- **Theme**: Switch to auto / light / dark

Trigger on `⌘K` / `Ctrl+K`. Focus-trapped. Esc closes.

### Implementation

- A single `useKeyboardShortcuts()` hook attached at the page level, listens at `document.keydown`, dispatches via a small registry pattern. Skips when the user is typing in an input.
- The palette is its own component, `components/CommandPalette.tsx`, mounted at app root.
- Hint footer in the drawer already shows `↑↓ Navigate · esc Close`. Add a similar small `⌘K` hint in the top bar.

### Tradeoff

- Pro: demonstrates power-user UX maturity and a11y awareness (keyboard-first).
- Con: ~150 LOC across hook + palette + commands wiring.
- Con: shortcut conflicts — `/` is browser quick-find on some sites; we intercept only when not in an input. Acceptable.

---

## 4. 4xx vs 5xx severity + a11y status icons (critique items 4.2, 7.2)

**Goal:** distinguish client error (often "fix your config") from server error (often "wait it out") visually. Also: status that doesn't rely on color alone (color-blind accessibility).

### Design

- Status pill stays a pill, but:
  - **2xx (success)**: outline + soft fill in mint green (current `--color-status-success-soft`)
  - **3xx (redirect)**: outline in `--color-status-info` (purple)
  - **4xx (client error)**: outline + soft fill in amber `--color-status-warning-soft` (less alarming than red — these are mostly auth / validation issues)
  - **5xx (server error)**: outline + soft fill in red `--color-status-error-soft`
- A small icon prefixes the status number, providing non-color signal:
  - 2xx → `Check` (Phosphor) ✓
  - 3xx → `ArrowsLeftRight`
  - 4xx → `Warning` (triangle)
  - 5xx → `XCircle`
- Tooltip on the pill explains the category: "Client error — invalid request" / "Server error — provider unavailable".

### Tradeoff

- Pro: a11y improvement (WCAG 1.4.1 Use of Color). Better operational signal — 4xx and 5xx are very different.
- Pro: requires no new tokens — uses existing semantic color tokens.
- Con: pill becomes slightly wider with the icon (still fits in column).

### Out of scope

- 429 (rate limit) as its own visual category — would be nice but adds complexity. Stays in 4xx (warning) bucket.

---

## Build order

1. **Status pill rework** (smallest, isolated) — ~30 minutes.
2. **Surface Replay** — ~30 minutes.
3. **URL state migration** — ~90 minutes, touches the page state model.
4. **Keyboard shortcuts + ⌘K palette** — ~90 minutes, last because it benefits from URL state being in place.

After all four: move to Phase E (README, a11y pass, screenshots, ship).

---

## Sign-off checklist

Before any code is written, please confirm:

- [ ] URL contract (param names + behavior) acceptable
- [ ] Replay-on-hover placement (left of chevron, ghost icon)
- [ ] Shortcut keys (`/ j k r esc ⌘K`) match expectations
- [ ] Status pill 4-tier system (success / redirect / client warning / server error) acceptable
