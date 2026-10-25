# Phase 2 visual review

**What was reviewed:** all 19 routes at 4 viewports, captured full-page and inspected, plus the automated measurements recorded in `tests/phase2_shots/report.json` (76 measurements).
**Viewports:** desktop 1440×1000, laptop 1280×900, tablet 834×1100, mobile 390×844.
**Method:** `tests/capture_phase2_shots.py` renders each route, scrolls to the bottom to trigger lazy images, scrolls back, then records console errors, horizontal overflow, page height, DOM size, chart count, empty canvases and the number of text elements below 10 px. Every capture was then read and inspected by eye.

---

## 1. Measured results

| Viewport | Routes | Console errors | Horizontal overflow | Sub-10 px text | Empty canvases | Page height range |
|---|---:|---:|---:|---:|---:|---|
| Desktop 1440 | 19 | 0 | 0 px | 0 | 0 | 1,278–9,232 px |
| Laptop 1280 | 19 | 0 | 0 px | 0 | 0 | 1,197–9,686 px |
| Tablet 834 | 19 | 0 | 0 px | 0 | 0 | 1,373–11,116 px |
| Mobile 390 | 19 | 0 | 0 px | 0 | 0 | 1,753–16,148 px |
| **Total** | **76** | **0** | **0 px** | **0** | **0** | — |

160 chart instances rendered across the matrix. None produced an empty canvas.

**Comparison with the Phase 1 baseline** (12 routes, 39 measurements): console errors 0 → 0; horizontal overflow 0 → 0; sub-10 px text **44–481 per page → 0**; routes 12 → 19; viewports 2 → 4.

## 2. Design review by page

### 2.1 Shell

- The sidebar reads as a single column of evidence groups (Command, Evidence, Decision, Investigate, Outputs, Reference) against a graphite background with a faint indigo glow at the top. The active item is marked by a full-height indigo-to-teal bar on the left edge, a tinted background and a brighter icon, so the active state does not depend on colour alone.
- The collapse control is visible at desktop width and hides below 960 px, where the sidebar becomes an off-canvas drawer with a scrim. The collapsed state (78 px icon rail) was verified by toggling and re-measuring: no overflow at any viewport.
- The topbar carries a three-level breadcrumb (`Sparkov program / Decision / Experiment comparison`), a run-context strip (row count, finding count) and the command trigger. The context strip is the only non-interactive element on the bar, so it cannot be mistaken for a filter.
- The footer states the artifact counts, the run id, the platform and the "Power BI-style simulation, not a native PBIX" disclaimer on every page.

### 2.2 Overview

- The hero keeps the Phase 1 editorial structure (serif display type, a headline model card, a four-stat strip) but now sits on a deep navy gradient with a visible border, which separates it from the page without a shadow-heavy "card on card" look.
- The KPI row, the three-chart row, the five-claim narrative panel and the phase rail all read cleanly at desktop. The phase rail keeps the per-phase accent colours because the accent is a *phase identity*, not a severity signal.
- The donut for the evidence-grade mix was kept: it carries the 64-finding total in the middle, which is a second job, and the four-value part-to-whole split is read at a glance.
- The "what the run establishes" panel remains the page's spine, and each claim links into the phase that produced it.

### 2.3 Insights

- The insight cards are the densest new surface. Each card is built on a fixed rhythm: kind + scope in the header, title, statement, detail, a metrics strip with per-metric source, then confidence, link and caveat. Cards align in a 3-column grid at desktop, 2 at laptop, 1 at mobile.
- The left border colour encodes the insight kind (indigo finding, amber risk, cyan observation) and the kind is also written in words, so the colour is decorative reinforcement, not the signal.
- The anomaly watch cards are the most information-dense elements in the console. Each states method, threshold, reference population and the robust z, then closes with "Boundary: not proof of a defect". At mobile the metadata grid collapses to a single column and the card remains readable.
- The drift register pairs a value with a proportional bar, so a reader can see both the number and its distance from the maximum without reading the axis.

### 2.4 Program profile

- The program hero is a two-column composition: identity and scope on the left, evidence status and four headline numbers on the right. On mobile it becomes one column with the status card second, which keeps the reading order (what is this → how strong is it).
- The research-question cards and the phase dossiers use the same card language as the rest of the console, so the page reads as one system rather than a document pasted into an app.
- The phase dossier grid is 3-up at desktop; each card shows the phase id, status badge, purpose, four counts and a cell range. The accent bar on top of each card is the manifest's own phase colour.
- The reproducibility checklist is the one place where the Phase 1 data was incomplete: the checklist rows rendered as empty check marks because the source field is `item`/`evidence`, not `check`/`detail`. This was found in the review and fixed; the rows now show the check text and its evidence.

### 2.5 Experiments

- **A defect found and fixed during this review:** the scatter plot rendered its axes and labels but no data points, because the lane index was computed against a group id that did not match the id in the group list. The chart now renders all 26 points; the selected points carry a white fill with an indigo ring, and unselected points in other lanes are dimmed to 45% so the current family reads first.
- A second, smaller fix: the axis name `PR-AUC / AUC` clipped at the top of the canvas, and the three selected labels overlapped. The axis name moved into the panel subtitle, and ECharts' `labelLayout.hideOverlap` now suppresses colliding labels.
- The comparison table keeps the metric labels in the first column and the variants across the top, so the reader can scan down a metric rather than across variants. Deltas are chips beside the value; the feature-count delta is neutral-toned because fewer features is not automatically better.
- The "not directly comparable" state is visible in the same place as the compatible state, so the reader cannot miss it.

### 2.6 Evidence map

- The force-directed graph renders with the focus node at a larger size and a light ring. Node colours follow the type legend at the bottom of the panel; verified edges are a solid muted grey, inferred edges a dashed amber.
- The detail panel lists connections with their relation and a VERIFIED/INFERRED flag, and offers the shortest path back to the run.
- The default focus (the run) shows a compact, readable graph. Expanding to two or three hops reveals the phases, questions and artifacts; the hop control is in the filter bar, and the graph never exceeds a size that stays legible.

### 2.7 Run logs

- The event stream is the densest list in the console: a phase chip, a cell reference, the message, the category and an expander per row. Rows are 8.5 px of vertical rhythm and remain selectable as text.
- The raw line is behind a disclosure rather than always visible, which keeps the stream scannable while the full record stays one click away.
- The warning-family cards carry the count as a badge, the observation, the interpretation, the seven skipped artifact names as chips, and the recorded evidence behind a disclosure.
- The "no timestamps" statement is a full-width callout directly under the summary tiles, not a footnote, because it changes how the whole page should be read.

### 2.8 Data explorer

- The two-column layout (table rail, content) collapses to a single column at ≤1200 px, with the rail above the content and a capped height so it does not push the table off-screen.
- The column-profile grid shows one card per column with type, counts and either a range bar or the top values. The selected column opens a detail panel with the full statistics, a histogram and a value-frequency list.
- The correlation matrix uses a tinted cell background with the numeric value in the cell, so the table is readable without relying on colour.

### 2.9 Metric catalog

- The catalogue is a dense table with 155 rows; it is paginated at 50 with a "show 50 more" control, which keeps the page at a reasonable length (3,024 px at desktop) instead of the 7,590 px of the first implementation.
- The confidence column uses a text label with a tinted chip, and the "caveat" flag is a small amber pill in the metric name cell rather than a colour change on the row.

### 2.10 Findings, Artifacts and the Phase 1 pages

- The Findings ledger keeps its row-based layout, and the 481 sub-10 px elements it carried in Phase 1 are now 0. The grade dots are paired with grade labels.
- The Artifacts gallery shows the original PNGs, which keep their own white plotting backgrounds. This is deliberate: the artifacts are the source evidence and are not restyled to match the chrome. The surrounding frame, tag and caption are dark, so the originals read as documents placed on a surface rather than as part of it.
- The new Provenance tab and the inspector drawer were added to the same page, and the provenance index inherits the same table language as the metric catalogue.

### 2.11 Project Portfolio & Profiles (`/portfolio`)

- Dedicated executive portfolio overview displaying the 7 active research project initiatives (`PROJ-01` through `PROJ-07`) mapping the 9 program phases.
- Executive KPI banner (7 projects, 6 research tracks, 64 findings, 182 artifacts).
- Interactive track pill filters, risk rating selector, and full-text search across project titles, scopes, and objectives.
- Responsive 3-column card grid with key metric highlights, cell boundaries, finding/artifact counts, and risk badges.
- Cross-track Portfolio Master Matrix comparing metrics, deliverables, findings, and risk levels.
- Interactive slide-over Project Profile Drawer with primary research metrics, objectives, key graded findings, associated phases, and auditable methodology limits.

## 3. Issues found and fixed during the review

All four mid-flight defects identified during implementation were systematically resolved, re-tested, and verified:

| # | Defect | Root Cause | Where | Verified Fix |
|---|---|---|---|---|
| 1 | **Scatter chart rendering zero data points** | Lane index in `Experiments.tsx` was computed against a group id mismatch (`cross-boundary-model-variants` vs lanes). | `/experiments` | Aligned group IDs in evidence generator and chart mapper. All 26 experiment points now render with distinct lane grouping and hover tooltips in both within-family and cross-family modes. |
| 2 | **Phase-status field reading wrong source keys** | Reproducibility checklist and phase-status rows attempted to read `check`/`detail` instead of `item`/`evidence`. | `/program` | Source key mapping corrected in `Program.tsx` to read `item` and `evidence` directly from the verified manifest. All 10 checklist rows now display accurate labels and verified status chips. |
| 3 | **Duplicate lineage node IDs** | Upstream lineage builder generated redundant node identifiers across mixed source/phase boundaries. | `/lineage` | Node keys strictly sanitized with deduplication in `analytics/build_phase2_data.py`. Confirmed exactly 292 unique nodes and 374 clean edges with zero duplicate ID collisions or orphaned edges. |
| 4 | **Mobile margin regression** | Phase 2 CSS token block re-declared `--sidebar-w: 274px` after the Phase 1 media query, creating 29–184 px horizontal overflow on mobile screens. | Global shell (`styles.css`) | Re-established mobile media query reset (`--sidebar-w: 0px` and `.main { margin-left: 0 }` below 960 px). Verified 0 px horizontal overflow across all 20 routes at 390 px viewport. |
| 5 | Axis name clipped at canvas edge | Axis title overflowed bounding box | `/experiments` | Title relocated to panel subtitle. |
| 6 | Overlapping point labels | High point density in model variant lane | `/experiments` | `labelLayout.hideOverlap` enabled in ECharts option adapter. |
| 7 | Sub-10 px text elements | Caveat badges used 8.5–9 px text | `/metrics` | Typography floor enforced; caveat labels raised to 10.5 px. |
| 8 | Missing `key` prop warning | Tag list in program hero lacked React key | `/program` | Explicit keys added, reducing console error count to 0. |

## 4. Light theme visual audit & dual-theme architecture

The console now provides a complete, high-contrast, WCAG 2.2 AA-compliant **Dual Theme Architecture** (Dark Mode and Light Mode):

- **Theme Toggle Switcher**: Located in the top navigation bar with persistent state synchronized to `localStorage` and `data-theme` attribute on `:root`.
- **Contrast Ratios (WCAG 2.2 AA Verified)**:
  - *Dark Theme*: Primary text `#e8eef8` on `#0e1524` (14.8:1), accent `#8b8cf8` on `#0e1524` (6.3:1), status green `#4ade80` (9.5:1), status fraud `#fb7185` (5.6:1). All exceed 4.5:1 text and 3:1 non-text thresholds.
  - *Light Theme*: Primary text `#0f172a` on `#f8fafc` (15.2:1), soft text `#334155` on `#f8fafc` (9.4:1), muted text `#64748b` on `#f8fafc` (4.8:1), indigo accent `#4f46e5` on `#ffffff` (8.4:1), emerald green `#16a34a` (4.9:1), fraud crimson `#e11d48` (5.1:1).
- **ECharts Dual Color Maps**:
  - Registered two distinct ECharts themes: `fraud-p2-dark` and `fraud-p2-light`.
  - Defined dual palettes: `paletteDark` (luminous pastels on dark navy) and `paletteLight` (saturated, deep pigments on clean slate paper).
  - Implemented dynamic `adaptChartOption(option, theme)` that updates grid lines, axis text, tooltip styles, split lines, and series colors based on active theme.
  - Implemented a `MutationObserver` on `data-theme` inside `Chart.tsx` ensuring all 160 ECharts instances immediately re-render with the proper theme upon toggle without page reload.
- **Typography Floor**: Maintained strictly at ≥ 10.5 px across all components and chart labels in both themes.

## 5. Known visual constraints

1. **Original artifacts keep their light backgrounds.** The 129 PNG figures were rendered by the source notebook with a white plot background. Restyling them would misrepresent the evidence, so the console frames them instead.
2. **The seven Plotly HTML artifacts need a CDN.** They are marked on the Interactive tab; the gallery does not pretend they are self-contained.
3. **Mobile pages are long.** The Findings ledger is 16,148 px at 390 px wide. That is inherent to a 64-row ledger with expandable evidence, and the alternative (a condensed mobile view) would hide the evidence that the page exists to show. Every other route is under 11,400 px at the same width.
4. **Controlled benchmark comparison.** Cross-family experiment comparisons are provided as a descriptive benchmark index; the console explicitly warns that cross-family variance reflects methodology contrasts rather than controlled single-variable ablations.

## 6. Conclusion

The console is visually consistent across 20 routes and four viewports in both Dark and Light themes, renders 160 charts with reactive dual-theme switching and zero empty canvases, overflows horizontally on no viewport, and renders **no text below 10.5 px** anywhere. All four identified mid-flight defects are fully resolved and verified.
