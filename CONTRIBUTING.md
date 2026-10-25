# Contributing to Fraud Evidence Console & Analytics Platform

Thank you for your interest in contributing! This document provides guidelines and workflows for contributing code, research findings, documentation, and improvements.

---

## Code of Conduct

All contributors and maintainers are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before participating.

---

## Development Setup

### 1. Prerequisites
- **Node.js**: v20.x, v22.x, or v24.x
- **Python**: 3.10, 3.12, or 3.14
- **Package Managers**: `npm` (or `npm.cmd` on Windows) and `pip`

### 2. Clone and Configure
```bash
# Clone the repository
git clone https://github.com/tamim-shadman/Transaction-Fraud-Detection.git
cd Transaction-Fraud-Detection

# Set up local environment template
cp .env.example .env

# Install frontend dependencies
cd app
npm install     # or npm.cmd install on Windows
cd ..

# Install Python requirements
pip install -r requirements.txt
```

### 3. Verify Local Environment
```bash
python scripts/config_loader.py --validate
python scripts/health_check.py --type all
```

---

## Local Development Workflows

### Running the Web Application
```bash
cd app
npm run dev     # or npm.cmd run dev on Windows
```
Open [http://127.0.0.1:4173](http://127.0.0.1:4173) in your browser.

### Running the Production Server
```bash
cd app
npm run build
cd ..
python scripts/server.py
```

---

## Quality Standards & Pre-PR Testing

Before opening a pull request, all automated checks and mathematical validation suites must pass:

```bash
# 1. Strict TypeScript compilation check (0 errors required)
cd app && npm run typecheck && cd ..

# 2. Production build verification
cd app && npm run build && cd ..

# 3. Mathematical metric integrity (196 checks)
python tests/validate_metrics.py

# 4. Schema contracts and phase mappings (144 checks)
python tests/validate_phase2.py

# 5. Phase 6 refresh & reproducibility engine assertions (7 checks)
python tests/validate_phase6_engine.py

# 6. Deployment, health probe & backup test suite (7 checks)
python tests/test_phase7_deployment.py

# 7. Backup and isolated disaster recovery rehearsal
python tests/test_backup_recovery.py
```

---

## Invariant Rules for Contributions

1. **Zero Fabrication**: All displayed metrics must trace directly back to the executed research notebook (`fraud_eda_colab(1).ipynb`), canonical CSV tables, or execution run logs. Never insert ungrounded synthetic claims.
2. **Preserve Canonical Data**: Never modify or delete canonical files in `tables/`, `figures/`, `logs/`, or `fraud_eda_colab(1).ipynb` without peer review.
3. **No Hardcoded Secrets**: Never commit `.env` files, API keys, passwords, or personal credentials.
4. **Accessibility (WCAG 2.2 AA)**: Any new UI component must include semantic HTML, proper ARIA labels, contrast compliance, and keyboard navigation support.

---

## Pull Request Process

1. Fork the repository and create your feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your changes using descriptive commit messages:
   ```bash
   git commit -m "feat(scenarios): add sensitivity bounds for false positive cost"
   ```
3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
4. Open a Pull Request targeting the `main` branch. Fill out the [Pull Request Template](.github/pull_request_template.md).
5. Ensure all GitHub Actions CI checks pass.
