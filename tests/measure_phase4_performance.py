"""Phase 4 Performance Benchmarking Script.

Measures real browser runtime performance across all 20 application routes:
- DOMContentLoaded, Load, First Paint (FP), First Contentful Paint (FCP)
- Heap usage (MB), DOM node count, Canvas count
- Network requests count & JSON payload bytes
- Interactive table sorting latency (benchmarking cached Intl.Collator)
- Search filter latency
Outputs structured data to artifacts/reports/performance_phase4.json
"""
import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE = "http://127.0.0.1:4173"
OUT = Path("artifacts/reports")
OUT.mkdir(parents=True, exist_ok=True)

ROUTES = [
    "/",
    "/portfolio",
    "/insights",
    "/program",
    "/data-audit",
    "/distributions",
    "/interactions",
    "/temporal",
    "/advanced",
    "/statistics",
    "/features",
    "/model",
    "/economics",
    "/experiments",
    "/lineage",
    "/logs",
    "/explore",
    "/metrics",
    "/findings",
    "/artifacts",
]

def run_performance_benchmarks():
    print("=== Starting Phase 4 Performance Benchmarking ===")
    results = {"routes": [], "interactions": {}}

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Warm up
        page.goto(BASE + "/", wait_until="domcontentloaded")
        page.wait_for_selector("main h1")
        page.wait_for_timeout(1000)

        for route in ROUTES:
            t0 = time.perf_counter()
            page.goto(BASE + route, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_selector("main h1", timeout=60000)
            page.wait_for_timeout(600)
            render_duration_ms = round((time.perf_counter() - t0) * 1000, 1)

            m = page.evaluate("""() => {
                const nav = performance.getEntriesByType('navigation')[0] || {};
                const res = performance.getEntriesByType('resource');
                const js = res.filter(r => r.name.endsWith('.js'));
                const json = res.filter(r => r.name.endsWith('.json'));
                const paints = Object.fromEntries(performance.getEntriesByType('paint').map(p => [p.name, Math.round(p.startTime)]));
                return {
                    domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
                    load: Math.round(nav.loadEventEnd || 0),
                    paints,
                    jsBytes: js.reduce((s, r) => s + (r.encodedBodySize || 0), 0),
                    jsonBytes: json.reduce((s, r) => s + (r.encodedBodySize || 0), 0),
                    requests: res.length,
                    nodes: document.querySelectorAll('*').length,
                    charts: document.querySelectorAll('canvas').length,
                    heapMb: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
                };
            }""")
            entry = {"route": route, "clientRenderMs": render_duration_ms, **m}
            results["routes"].append(entry)
            print(f"  Route: {route:<16} FCP: {m['paints'].get('first-contentful-paint', 'N/A')}ms | Heap: {m['heapMb']}MB | Nodes: {m['nodes']} | Charts: {m['charts']}")

        # Interactive Table Sort Benchmark
        print("\n--- Benchmarking Table Sorting Performance ---")
        page.goto(BASE + "/distributions", wait_until="domcontentloaded")
        page.wait_for_selector(".data-table")

        sort_latencies = []
        for _ in range(5):
            t_sort0 = time.perf_counter()
            page.locator(".data-table th[role='columnheader']").first.click()
            page.wait_for_timeout(50)
            sort_latencies.append(round((time.perf_counter() - t_sort0) * 1000, 2))

        avg_sort_ms = round(sum(sort_latencies) / len(sort_latencies), 2)
        print(f"  Average table column sort latency: {avg_sort_ms} ms (trials: {sort_latencies})")
        results["interactions"]["table_sort_avg_ms"] = avg_sort_ms
        results["interactions"]["table_sort_trials_ms"] = sort_latencies

        # Interactive Search Filter Benchmark
        print("\n--- Benchmarking Search Filter Latency ---")
        page.goto(BASE + "/metrics", wait_until="domcontentloaded")
        page.wait_for_selector(".filter-search input")

        t_search0 = time.perf_counter()
        page.fill(".filter-search input", "PR-AUC")
        page.wait_for_timeout(100)
        search_ms = round((time.perf_counter() - t_search0) * 1000, 2)
        print(f"  Metric catalog filter latency: {search_ms} ms")
        results["interactions"]["filter_search_ms"] = search_ms

        browser.close()

    out_file = OUT / "performance_phase4.json"
    out_file.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"\nPhase 4 Performance Benchmarking complete! Written to {out_file}")
    return results

if __name__ == "__main__":
    run_performance_benchmarks()
