# UX Critique — StackOne Request Logs

> Critique is a deliberate phase, not an implementation prelude. This document audits the
> Figma flow against the section's mission. Each issue lists **severity**, **root cause**,
> and **improvement options** — but **no improvements are implemented yet**. The user
> reviews this and signs off on which items to address before Phase C (improvement design).

---

## Mission (the lens for every critique)

> **Help engineers find and fix integration failures fast.** Every interaction in the Logs
> section should accelerate the loop: **spot anomaly → drill into a request → understand
> why → take corrective action (replay, fix config, contact support).**
>
> The **request** is the entity; everything else is a lens onto it.

A finding is "severe" when it slows that loop, hides information needed in the loop, or
breaks user trust during the loop. Stylistic preferences without functional consequence
are "low".

---

## Severity legend

- **High** — directly blocks or substantially slows the find-and-fix loop, or breaks trust.
- **Medium** — recurring friction or missed opportunity; would compound over thousands of investigations.
- **Low** — polish, consistency, or future-proofing.

---

## 1. Data quality

### 1.1 Frozen timestamps — every row reads `21:05:19.123`

**Severity:** High
**Reference:** [01-logs-default.png](./figma/01-logs-default.png), every Figma frame

Every row in every Figma frame shows the exact same time: `21:05:19.123`. The date column
cycles `Aug 13 → Aug 12 → Aug 09 → Aug 08 → Aug 06 → Aug 13 → ...` — a deterministic
loop that real data would never produce.

**Why it's high severity:** The first job of a logs UI is "spot the recent thing". A
frozen timestamp pattern teaches engineers (and reviewers) to distrust the timestamp
column. If even the mock fakes a real-time feel, the table can't be trusted to display
real timestamps when shipped.

**Root cause hypothesis:** Designer focused on layout; mock data was hand-authored and
never randomised. No designer/engineer pairing on data shape during static-screen review.

**Improvement options:**
1. Generate varied recent timestamps in mock data (1m, 4m, 12m, 1h ago…).
2. Display **relative time** as the primary affordance (`2m ago`), absolute on hover/expand.
3. Live-tick relative timestamps (every 30s) so the page feels alive.

---

### 1.2 Endpoint paths truncate silently — no full-path affordance

**Severity:** Medium
**Reference:** [01-logs-default.png](./figma/01-logs-default.png) — `/unified/ats/appl...`

Endpoint paths in the Request column truncate to `…applications` with no hover-to-reveal,
no copy button, no full text on row hover.

**Why it matters:** Identifying *which* endpoint failed is the first 30 seconds of any
investigation. Truncating it without affordance forces the user to open the drawer just
to read a path.

**Improvement options:**
1. Hover the row → tooltip with full path.
2. Hover the path itself → reveal with copy button.
3. Soft-wrap the path on row hover; expand the row by ~6px to fit it.

---

## 2. Interaction

### 2.1 Chart and table are visually adjacent but functionally disconnected

**Severity:** High
**Reference:** [01-logs-default.png](./figma/01-logs-default.png)

The API Requests chart sits above the table. The two are clearly the same dataset, but
nothing links them: hovering a bar doesn't highlight rows in that bucket; hovering a row
doesn't lift the matching bar; clicking a bar doesn't filter the table to that time window.

**Why it's high severity:** The chart's purpose is "anomaly spotting → drill in". With no
brush and no linked hover, the user spots a red spike and then has to *guess* which rows
correspond — re-doing the chart's work manually.

**Root cause hypothesis:** Chart was designed as a stats widget, not an interaction
surface. The drawer was designed for the row click. No one mapped the full investigation
journey end-to-end.

**Improvement options:**
1. **Bidirectional hover sync** — hover bar → matching rows pulse; hover row → bar lifts and a tooltip shows the time-bucket counts.
2. **Brush selection** — drag across bars → filter the table to that time range (URL-synced).
3. **Click filter** — click any bar → time range = that bucket ±some smart padding.

---

### 2.2 Stat pills (`Total 580,000  Success 580,000 ↑2%  Error 20,000 ↓2%`) are decorative, not actionable

**Severity:** Medium
**Reference:** [01-logs-default.png](./figma/01-logs-default.png) — stats row

The three pills look like buttons, communicate counts, and are the most prominent affordance
above the chart — but they don't filter anything.

**Why it matters:** When an engineer sees "Error 20,000", the next thought is "show me
those". Currently they must drag the chart, configure filters, or scroll.

**Improvement options:**
1. **Click the Error pill → filter table to errors.** Stat pill becomes a toggleable status filter.
2. Add a clear hover affordance (cursor pointer, lift) so the click target is obvious.
3. The Total pill should clear the filter (act as "All").

---

### 2.3 Primary actions hidden behind `...` menu

**Severity:** Medium
**Reference:** [02-logs-dropdowns.png](./figma/02-logs-dropdowns.png)

Replay, Batch-Replay, and Request Tester are the **daily workflow** for an integration
engineer. They all live under `...`. The menu requires two interactions (hover row → click
ellipsis → click action). At scale, that's hundreds of extra clicks per session.

**Why it matters:** The chart and drawer make the investigation faster; the action layer
makes it slower. The whole loop is gated by the slowest step.

**Improvement options:**
1. Surface **Replay** as an icon button on row hover (Linear's pattern). Keeps `...` for secondary actions.
2. ⌘-click row → instant Replay (power-user shortcut).
3. Bulk actions: select N rows → "Replay 5 selected" on the toolbar.

---

### 2.4 "Background Logs" and "Full Width" toggles unexplained

**Severity:** Low
**Reference:** [01-logs-default.png](./figma/01-logs-default.png) — top bar

Two switches sit at the top of the page with no tooltip, microcopy, or default-state
rationale. A new user can't tell what they do.

**Root cause:** Designer assumed product-knowledge context that won't transfer.

**Improvement options:**
1. Add tooltips explaining each (Background Logs = include async webhook jobs; Full Width = expand table to viewport).
2. Move "Full Width" to a row-level view-density control where it makes more sense.
3. If unexplained: drop them. Affordance without comprehension is noise.

---

### 2.5 Three near-duplicate "Details Not Available" panel states

**Severity:** Low
**Reference:** [11-details-expired.png](./figma/11-details-expired.png) and adjacent frames

Three Figma frames show the same panel with three different "Expires" states: Active /
Expired / Not Available. The frames are 95% identical; only the badge and a hover tooltip
differ.

**Why it matters:** A reviewer reads three frames and asks "what's different?". A
component-led design system would express this as **one component, three states** —
faster to spec, easier to QA.

**Improvement options:**
1. Consolidate into one panel component with `expiryState: 'active' | 'expired' | 'not-available'`.
2. Document the three states in a single design-system story, not three frames.
3. Add a fourth "expiring-soon" state (e.g., < 3 days) so users get a heads-up.

---

## 3. Information architecture

### 3.1 The "request" entity is the unit of investigation, but the hierarchy is buried

**Severity:** High

The page title is "Request Logs". A *log* sounds like a passive record. But the user's
mental model is: **request → underlying provider calls → request/response details**.

Today the drawer reflects this hierarchy (Details / Underlying Requests tabs), but the
list view doesn't — every row is a flat record. There's no visual signal that some rows
contain N underlying calls and others contain 0.

**Improvement options:**
1. Lead with "Requests" not "Logs" — the page is a request investigator, not a log file viewer.
2. Show a small fan-out indicator on the row when underlying-count > 0 (we already render the count, but it reads as a generic chip).
3. Allow **expanding the row inline** to show underlying requests without opening the full drawer (progressive disclosure for quick scans).

---

### 3.2 The AI Error Explainer leads with friction, not value

**Severity:** Medium
**Reference:** [09-ai-explainer-generated.png](./figma/09-ai-explainer-generated.png)

In the gated state, the affordance reads: *"Error Explainer ✦ Feature Not Enabled — via Advanced Logs & AI Features"*.

A user with a 401 error stares at this and thinks "great, the *one thing* that would help
me is gated behind a feature flag." The CTA is the friction (enable a feature), not the value
(here's what the explainer would say).

**Improvement options:**
1. **Show a value teaser** — render a blurred/sample explainer with a soft "Enable AI Features to unlock" CTA over it. Same gate, different framing.
2. Free-tier the first 3 explanations per project — users experience the value before being asked.
3. If gating must stay, lead with "AI Error Explainer — generate one resolution suggestion (✦ Enable AI Features)".

---

### 3.3 No URL state — filters, selected log, range can't be shared

**Severity:** High

Open a log, copy the URL, paste it to a teammate — they get the empty list view. The
filters, selected log, date range, and tab state are all local component state.

**Why it's high severity:** The whole "spot → drill → fix" loop often crosses team
boundaries: an engineer drills into a 500, then pings ops with "look at this log". Without
shareable URLs, that handoff becomes a screenshot or a verbal description.

**Improvement options:**
1. **URL-sync everything** — `?q=&status=&from=&to=&log=&tab=`.
2. Back/forward buttons navigate filter history.
3. Deep-linking to a specific log auto-opens the drawer.

---

### 3.4 No keyboard shortcuts at the list level

**Severity:** Medium
**Reference:** [07-underlying-request.png](./figma/07-underlying-request.png) — drawer footer shows `↑↓ Navigate · esc Close`

The drawer footer promises `↑↓ Navigate · esc Close`. But on the list itself:
- `/` doesn't focus search.
- `j/k` doesn't move between rows.
- `r` doesn't refresh.
- No ⌘K command palette.

**Why it matters:** Power users investigate 50+ logs per session. Each requires hand-to-mouse
context switching when keyboard would be 3x faster.

**Improvement options:**
1. Wire `/`, `j`/`k`, `r`, `Enter` (open), `esc` (close).
2. Add ⌘K command palette: "Jump to log…", "Replay 5 selected", "Filter to errors", "Switch theme".
3. Show shortcut hints on hover (the right-edge chevron could show "Enter" on hover).

---

## 4. Visual polish

### 4.1 Same organization shown with different avatar colors

**Severity:** Low
**Reference:** [01-logs-default.png](./figma/01-logs-default.png) — Sample Organization rows

Every row in the Figma shows `Sample Organization`, but the avatar bullets are different
colors (green, blue, orange, red, etc.). For a real "Acme Holdings has 14 logs" view this
reads as 14 different orgs.

**Root cause:** Color was randomized per row index instead of derived from the account ID.

**Improvement options:**
1. **Deterministic hash** of the account ID → palette index. Same org = same color forever. (Implemented in the baseline.)
2. Use account-provided brand color if available.
3. Skip the avatar entirely if same org appears N times consecutively (group header).

---

### 4.2 Status pills don't differentiate 4xx (client) from 5xx (server) severity

**Severity:** Low
**Reference:** [01-logs-default.png](./figma/01-logs-default.png) — `200` green outline, `401` red outline

Today: 2xx = green, anything else = red. But a wave of 401s usually means "user fixed the
token" and a wave of 502s means "their server is down". Both currently look the same.

**Improvement options:**
1. Soft tonal scale: 4xx = amber/red, 5xx = stronger red, redirects = blue.
2. Add a subtle icon for server errors (storm cloud) vs client errors (lock).
3. Reserve the "danger" red for 5xx only.

---

### 4.3 Empty-state copy only handles "no integrations"

**Severity:** Low
**Reference:** [03-logs-empty.png](./figma/03-logs-empty.png)

Two distinct empty cases collapse into one message:
- **No integrations enabled** — onboarding problem. CTA: Go to Integrations.
- **No logs in current filter range** — query problem. CTA: Clear filters / widen range.

The Figma only covers the first.

**Improvement options:**
1. Two empty states with distinct copy and CTAs.
2. The "no results" state shows the active filters so the user can clear them in place.

---

### 4.4 Chart bars have flat tops; Figma shows rounded tops on a different scale

**Severity:** Low

Subtle: in the Figma the bars have a rounded top that's purely decorative. Our baseline
uses `rx=1.5` which approximates this. A consistent treatment across all chart elements
would tighten the look.

**Improvement options:**
1. Round only the top of each *visible* stacked segment (CSS path or per-segment rx logic).
2. Match the radius to the dot radius in legend (`6px` ≈ pill rounding).

---

## 5. Motion

### 5.1 No motion language defined

**Severity:** Medium

The Figma is a series of static frames; no transitions, easings, or durations are documented.
The "Messages" frame shows toasts but not how they enter or leave. The dropdown frames
appear with no shadow/transform spec.

**Why it matters:** Motion communicates relationships ("this drawer slid out of *that* row"),
provides feedback ("your action did something"), and signals system state ("we're loading,
not stuck"). Without a motion language, each component re-invents it inconsistently.

**Improvement options:**
1. Define `--motion-fast/base/slow` and `--ease-out/in-out/spring` tokens (done in baseline).
2. Per-component recipes documented in the design system: drawer slide-in, row pulse, toast spring.
3. Respect `prefers-reduced-motion` everywhere.

---

### 5.2 Skeleton loading doesn't match real layout

**Severity:** Low
**Reference:** [04-logs-loading.png](./figma/04-logs-loading.png)

The loading-state Figma shows skeleton rows that are roughly the right height, but
don't match the column structure. When real data lands, the page reflows.

**Improvement options:**
1. Skeleton uses the same column grid as the real table, so swap-in causes no layout shift.
2. Stagger skeleton animations row-by-row to feel like data streaming, not stuck.

---

## 6. Copy

### 6.1 Jargon-heavy column labels and field names

**Severity:** Low

"Source" in the table reads as `Test Connection`, `Identifier 1`, `Refresh Token`, `Key`.
For a new engineer this is a stew of unrelated concepts:
- `Test Connection` is an action type.
- `Identifier 1` is an account identifier.
- `Refresh Token` is an auth artifact.
- `Key` is a credential.

**Improvement options:**
1. Reword to a single mental model — e.g., "Trigger" — and use distinct icons per kind.
2. Add inline help on the column header explaining what "Source" means in this context.

---

### 6.2 "Open to Generate" — unclear who generates and when

**Severity:** Low
**Reference:** [09-ai-explainer-generated.png](./figma/09-ai-explainer-generated.png)

The CTA reads: `Error Explainer ✦ Open to Generate`. *Who* generates? *How long* does it
take? *Will it cost anything?*

**Improvement options:**
1. "Generate AI explanation (~10s)" — sets the time expectation.
2. Inline a one-line cost/quota indicator if there are limits.

---

## 7. Accessibility

### 7.1 Chart not screen-reader navigable

**Severity:** Medium
**Reference:** all chart frames

The Figma chart conveys all info via color (green/red bars). A screen-reader user has
no way to access the data series.

**Improvement options:**
1. SVG `role="img"` with `aria-label` summarizing totals (baseline has this).
2. Keyboard arrow-key navigation through buckets with live-region announcements.
3. A "View as table" toggle that swaps the chart for a sortable data table.

---

### 7.2 Status conveyed by color alone

**Severity:** Medium

The status pill uses color to communicate severity. Color-blind users (red/green
deuteranopia is common) can't distinguish 200 from 401.

**Improvement options:**
1. Add an icon adjacent to the number (✓ for success, ✕ for client error, ⚠ for server error).
2. Increase contrast in the soft-fill so the pill stands out without relying on hue.

---

### 7.3 No visible focus ring on row hover/click

**Severity:** Low

Tab-navigating through rows in the Figma shows no focus state. Real implementation
needs visible focus rings (baseline includes `:focus-visible` styles globally).

---

## 8. Workflow & shortcuts (cross-cutting)

### 8.1 No bulk actions

**Severity:** Medium

Investigation workflows often produce a list of "replay these 5". The Figma only supports
per-row Replay.

**Improvement options:**
1. Multi-select via shift-click / checkbox column.
2. Bulk actions toolbar appears when selection > 0.
3. ⌘K command: "Replay 5 selected".

---

### 8.2 No saved searches / recently viewed

**Severity:** Low

A common pattern: "yesterday's 401s from BambooHR" — the engineer reconstructs that
filter every morning.

**Improvement options:**
1. Recent searches dropdown next to the search input.
2. Saved filters in the URL or in user prefs.

---

## 9. Notes on the recreation

A few decisions deviated from the Figma deliberately, with the assumption that the user
would prefer fixing them now over critiquing them later:

- **Avatar colors are deterministic** (issue 4.1) — derived from account ID instead of
  random per row. This was implemented in the baseline because shipping random org colors
  felt worse than the small visual drift.
- **Timestamps are realistic** (issue 1.1) — Faker produces varied recent times instead
  of the frozen `21:05:19.123` pattern. Mocking a frozen timestamp would have signalled
  "we kept the bug to faithfully recreate the bug", which is the wrong signal.
- **Date format** is `May 21 | 13:09:01.298` (current date), not Figma's August date.

All other recreation choices match the Figma faithfully. The drawer, chart, table,
dropdowns, toasts, AI Explainer state machine, expiry variants, empty state — all reachable.

---

## Decisions for the user

Before any improvements are designed (Phase C) or implemented (Phase D), please indicate
which issues are in-scope for this assignment. Suggested triage:

**MUST address** (high-severity, blocks the mission):
- 1.1 Frozen timestamps → already addressed in baseline. Document only.
- 2.1 Chart ↔ table disconnect → highest-leverage improvement.
- 3.3 No URL state → quick win that compounds across the whole flow.
- 3.1 Request hierarchy buried → information-architecture clarity.

**SHOULD address** (medium, meaningful but smaller):
- 2.2 Stat pills not actionable.
- 2.3 Primary actions hidden behind `…`.
- 3.4 No list-level keyboard shortcuts.
- 5.1 No motion language → already addressed via tokens; add the per-component recipes.
- 7.1 / 7.2 Accessibility for chart + color-only status.

**DOCUMENT only** (low or out-of-scope for this assignment):
- 1.2, 2.4, 2.5, 3.2, 4.2, 4.3, 4.4, 5.2, 6.1, 6.2, 7.3, 8.1, 8.2.

The Phase C deliverable (`docs/improvements.md`) will then propose specific design changes
for the addressed items only, with tradeoffs documented before any code is written.
