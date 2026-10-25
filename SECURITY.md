# Security Policy

## Supported Versions

We provide security updates and patches for the following versions of the Fraud Evidence Console and Analytics Platform:

| Version | Supported          | Security Status |
| ------- | ------------------ | --------------- |
| 1.0.x   | :white_check_mark: | Active support (Production Release) |
| < 1.0.0 | :x:                | Deprecated / Historical phases |

---

## Reporting a Vulnerability

The security and privacy of this analytics platform and its research data are taken seriously.

If you discover a security vulnerability, potential exploit, credential exposure, or data leak:

1. **Do not disclose the vulnerability publicly** in a GitHub issue, discussion board, or pull request.
2. **Submit a Private Vulnerability Report** through GitHub's [Security Advisory](https://github.com/advisories) tab on this repository.
3. If GitHub Private Advisories are unavailable, email the maintainers directly with the subject tag `[SECURITY VULNERABILITY] Fraud Analytics Platform`.

### What to Include in Your Report
Please provide:
- A clear description of the vulnerability (e.g. CWE identifier if known).
- Step-by-step reproduction instructions or a minimal proof of concept (PoC).
- Potential impact on the application, data integrity, or user environment.
- Any suggested remediations or mitigations.

### Response SLA
- **Initial Acknowledgment**: Within **48 hours**.
- **Assessment & Triage**: Within **5 business days**.
- **Fix & Public Advisory**: Coordinated release within **14 business days** or faster depending on severity.

---

## Built-In Security Fortifications

The application includes several proactive defensive controls:

1. **CSV Formula Injection Mitigation (CWE-1236)**:
   All exported CSV tables in `app/src/lib/csv.ts` sanitize cell values by scanning against `/^[=+@\t\r\n\-]/.test(str)`. If formula triggers are detected, a single quote (`'`) is prepended, neutralizing spreadsheet execution in Microsoft Excel, LibreOffice Calc, and Google Sheets.
2. **Path Traversal Protection (CWE-22 / CWE-23)**:
   Filename sanitization strips relative directory paths (`../`, `..\\`) and restricts export names to alphanumeric characters and underscores.
3. **Secret & Credential Isolation**:
   No hardcoded passwords, cloud API keys, or private tokens exist in the codebase. Pre-commit scans and CI workflows automatically reject commits containing `.env` files or cryptographic secrets.
4. **Non-Root Container Execution**:
   The production Docker container runs under an unprivileged user `appuser` (UID: 10001, GID: 10001) with `no-new-privileges:true`.
