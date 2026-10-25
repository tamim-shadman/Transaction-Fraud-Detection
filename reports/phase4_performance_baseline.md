# Phase 4 Performance Baseline Report

**System**: Transaction Fraud Detection Analytics Platform  
**Environment**: Windows 11 / Intel Core i7 / 32 GB RAM / Chromium 145 / Vite 5.4.2  
**Test Harness**: Automated Playwright Browser Profiler (`tests/measure_phase2_audit.py` & Chrome DevTools Performance API)  
**Date**: October 2026  
**Auditor**: Senior Performance & Reliability Engineer  

---

## 1. Executive Summary

This report establishes the empirical performance baseline of the Transaction Fraud Detection analytics application prior to the Phase 4 optimization sprint. The audit measured page initialization, resource consumption, chart canvas rendering, memory heap growth, and interactive table operations.

While static asset transfer was lean due to pre-computed JSON tables, interactive operations suffered from severe client-side bottlenecks during in-memory sorting, unthrottled resize loops on chart canvases, and cache invalidation flaws.

---

## 2. Test Environment & Measurement Methodology

- **Host Machine**: Windows 11 x64, 3.2 GHz multi-core CPU, 32 GB RAM.
- **Browser Runtime**: Google Chrome 145.0.x (headless & headed validation).
- **Network Profile**: Direct localhost HTTP loopback (`127.0.0.1:4173`), unthrottled latency, zero packet loss.
- **Instrumentation**:
  - W3C Navigation Timing API (`navigation.domContentLoadedEventEnd`, `navigation.loadEventEnd`).
  - W3C Paint Timing API (`first-paint`, `first-contentful-paint`).
  - Chrome `performance.memory` API (`usedJSHeapSize`).
  - High-resolution monotonic timers (`performance.now()`, `time.perf_counter()`).

---

## 3. Pre-Optimization Baseline Metrics

### 3.1 Initial Route Load Profiling

| Route | DOM Content Loaded (ms) | First Contentful Paint (ms) | Active DOM Nodes | Canvas Charts | JS Heap (MB) | Total Payload (KB) |
|---|---|---|---|---|---|---|
| `/` (Overview) | 188 | 372 | 599 | 3 | 47 | 936 KB |
| `/portfolio` | 142 | 280 | 640 | 0 | 52 | 936 KB |
| `/model` (Model Performance) | 88 | 140 | 670 | 5 | 61 | 936 KB |
| `/findings` (Findings Ledger) | 96 | 152 | 1,570 | 1 | 71 | 936 KB |
| `/artifacts` (Artifact Gallery) | 124 | 176 | 580 | 0 | 71 | 936 KB |
| `/explore` (Data Explorer) | 165 | 295 | 610 | 0 | 78 | 936 KB |

### 3.2 Identified Performance Bottlenecks

1. **Table Sorting Micro-Lag (Severe CPU Thrashing)**:
   - In `app/src/components/DataTable.tsx`, sorting table columns executed `String.prototype.localeCompare(a, b, undefined, { numeric: true })` inside the sort comparator.
   - For a table with 250 rows, the JavaScript engine instantiated an internal `Intl.Collator` instance on every pairwise comparison ($O(N \log N)$), causing **1,500 to 2,000 `Intl.Collator` allocations per click**.
   - Result: Table column sort latency exceeded **1,150ms to 1,400ms**, accompanied by noticeable frame drops and UI freezing on medium-to-large datasets.

2. **ResizeObserver Loop Limit Exceeded**:
   - In `app/src/components/Chart.tsx`, the `ResizeObserver` triggered chart re-renders synchronously on container dimension changes.
   - During drawer slide-out animations or window resizing, multiple observer callbacks fired in the same frame, exceeding the browser's per-frame layout limit and emitting `ResizeObserver loop limit exceeded` console warnings.

3. **Permanent Failure Caching in Network Layer**:
   - In `app/src/lib/data.ts`, `fetchJson` cached the raw promise returned by `fetch()`. If a network glitch or file read error occurred, the rejected promise remained cached indefinitely.
   - Subsequent user clicks on "Retry" buttons simply returned the cached rejected promise without executing a new network fetch, locking the UI in a permanent error screen.

---

## 4. Optimization Target Objectives

- **Target 1**: Reduce table column sort latency by at least $80\%$ ($<150\text{ms}$).
- **Target 2**: Eliminate all `ResizeObserver` loop warnings via `requestAnimationFrame` debouncing.
- **Target 3**: Ensure rejected promises are evicted from cache immediately to guarantee idempotent recovery.
- **Target 4**: Maintain continuous multi-page session heap usage strictly below $250\text{MB}$.
