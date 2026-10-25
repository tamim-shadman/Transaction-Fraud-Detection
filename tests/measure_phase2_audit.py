import json
from pathlib import Path
from playwright.sync_api import sync_playwright

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE = "http://127.0.0.1:4173"
out = Path(__file__).resolve().parent / "phase2_audit_shots"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True)
    ctx = b.new_context(viewport={"width": 1440, "height": 1000})
    page = ctx.new_page()
    rows = []
    for route in ["/", "/model", "/findings", "/artifacts", "/model"]:
        page.goto(BASE + route, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_selector("main h1", timeout=60000)
        page.wait_for_timeout(1200)
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
            jsBytes: js.reduce((s,r)=>s+(r.encodedBodySize||0),0),
            jsonBytes: json.reduce((s,r)=>s+(r.encodedBodySize||0),0),
            requests: res.length,
            nodes: document.querySelectorAll('*').length,
            charts: document.querySelectorAll('canvas').length,
            heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576) : null,
          };
        }""")
        rows.append({"route": route, **m})
    (out / "performance.json").write_text(json.dumps(rows, indent=2), encoding="utf-8")
    for r in rows:
        print(r)
    b.close()
