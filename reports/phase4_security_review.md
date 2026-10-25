# Phase 4 Security & Data Protection Review

**System**: Transaction Fraud Detection Analytics Platform  
**Architecture**: Client-side React Application with Static Analytical Store & Python Data Pipeline  
**Standard**: OWASP Top 10 / CWE / Data Protection Guidelines  
**Date**: October 2026  
**Auditor**: Senior Application Security Reviewer  

---

## 1. Executive Summary

This security review audited the complete attack surface of the Transaction Fraud Detection analytics platform, including client-side input handling, data export generation, file loading, dependency trees, and repository contents. 

Prior to Phase 4, the platform had a vulnerability to **CSV Formula Injection (CWE-1236)** and unsanitized export filenames. Both issues have been corrected and verified via automated testing. No hardcoded credentials, live API keys, path traversal vulnerabilities, or unescaped HTML injection vectors exist in the codebase.

---

## 2. Attack Surface Analysis & Threat Modeling

| Threat Vector | CWE / Standard | Risk Assessment | Implemented Defensive Control | Verification Result |
|---|---|---|---|---|
| **CSV Formula Injection** | **CWE-1236** | **HIGH**: An exported CSV opened in Microsoft Excel or LibreOffice Calc could execute arbitrary system commands via formula operators (`=cmd\|`, `@SUM`, `-10+20`, `\tDDE`). | In `app/src/lib/csv.ts`, all exported string values are scanned against `/^[=+@\t\r\n\-]/.test(str)`. If matched, a single quote (`'`) is prepended, neutralizing spreadsheet formula interpretation. Double quotes are properly doubled (`""`). | **RESOLVED & VERIFIED** (Tested in Flow 12 of `tests/test_interactive_flows.py`) |
| **Path Traversal in Export Filenames** | **CWE-22** | **MEDIUM**: Malicious or malformed export names could attempt to write files outside intended directories (`../../etc/passwd`). | In `app/src/lib/csv.ts`, `sanitizeFilename()` replaces all characters outside `[a-zA-Z0-9_-]` with underscores, strips leading/trailing underscores, limits length to 100 characters, and defaults to `"export"`. | **RESOLVED & VERIFIED** (Verified via Playwright evaluation) |
| **Path Traversal in Static Asset Loading** | **CWE-23** | **LOW**: Exploiting `data.ts` to fetch arbitrary system files via relative path traversal. | `fetchJson` only queries static relative paths rooted in `data/`. No dynamic server-side file access API is exposed; Vite static file server restricts delivery to `public/` and workspace root. | **SECURE** |
| **Exposed Credentials & API Secrets** | **CWE-798** | **HIGH (if present)**: Accidental exposure of cloud database credentials, AWS keys, or API tokens in source code or Git history. | Full repository scan using automated regex patterns (`AKIA[0-9A-Z]{16}`, `password=`, `SECRET_KEY`). No secrets or credentials were discovered. All analytical data is synthetic and pre-computed. | **SECURE** (0 secrets found) |
| **Cross-Site Scripting (XSS)** | **CWE-79** | **MEDIUM**: Rendering unescaped user inputs, logs, or table cells into HTML. | React’s virtual DOM automatically escapes all text nodes by default. Search queries in `SearchModal.tsx`, `DataTable.tsx`, and `Logs.tsx` render via standard JSX text bindings with zero usage of `dangerouslySetInnerHTML`. | **SECURE** |
| **Insecure Direct Object Reference (IDOR)** | **CWE-639** | **N/A**: Accessing restricted tenant data without authorization. | The platform is a single-tenant local analytical workstation. There is no multi-tenant database or remote authorization boundary. | **N/A (Documented)** |
| **Client-Side Memory Bloat & URL Leaks** | **CWE-400** | **LOW**: Retaining Blob URLs indefinitely in browser memory during repeated CSV/JSON exports. | In `app/src/lib/csv.ts`, all object URLs generated via `URL.createObjectURL(blob)` are revoked immediately in a `setTimeout(..., 1000)` callback after the download trigger. | **SECURE** |

---

## 3. Detailed Vulnerability Fix: CSV Formula Injection & Path Traversal

### Code Implementation (`app/src/lib/csv.ts`)

```typescript
export function sanitizeFilename(name: string): string {
  // Strip path traversal (../, /), backslashes, null bytes, and non-alphanumeric chars
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/^_+|_+$/g, "").slice(0, 100) || "export";
}

function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  // Neutralize formula injection: Excel/Calc formula prefixes and whitespace triggers
  if (/^[=+@\t\r\n\-]/.test(str)) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}
```

### Verification Test Evidence:
Executed during browser integration test suite (`tests/test_interactive_flows.py`, Flow 12):
```
[Flow 12] Testing CSV Export Sanitization...
  Sanitization check: {
    'cmdPayload': '"\'=cmd|\' /C calc\'!A0"',
    'atPayload': '"\'@SUM(1,2)"',
    'dashPayload': '"\'-10+20"',
    'tabPayload': '"\'\tMALICIOUS"',
    'safeFilename': 'etc_passwd_dangerous_20file_csv'
  }
```
All formula triggers are safely escaped; directory traversal sequences (`../../`) and percent-encoded characters are completely neutralized.

---

## 4. Sensitive Data & Privacy Verification

- **Real PII / Card Numbers**: The raw credit card numbers from the original Kaggle dataset were synthetic generator artifacts (`cc_num`). However, as formalized in caveats C1–C5, raw transaction files (`fraudTrain.csv`, `fraudTest.csv`) are strictly excluded from the Git repository.
- **Derived Analytics**: All figures, tables, and metrics present in `data/`, `tables/`, `figures/`, and `powerbi/` contain only aggregated statistics, anonymized merchant category tokens, and feature distributions.

---

## 5. Security Posture Conclusion

The application satisfies security requirements for a high-assurance client-side analytics workstation. High-risk injection vectors have been eliminated, no secrets are committed, and data exports are fortified against client-side exploitation.
