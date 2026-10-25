---
name: Data Audit Finding / Metric Discrepancy
about: Report an anomaly, data contract violation, or metric calculation discrepancy in research evidence
title: "[DATA-AUDIT]: "
labels: ["data-audit", "research-evidence", "needs-triage"]
assignees: []
---

## 1. Finding Overview
<!-- A clear, concise summary of the data finding, metric discrepancy, or contract anomaly. -->

## 2. Research Context & Phase Mapping
- **Initiative / Project ID**: (e.g. `PROJ-01`, `PROJ-04`, `PROJ-06`)
- **Phase**: (e.g. `P0 Data Audit`, `P1 Distributions`, `P3 Temporal`, `P5 Evaluation`)
- **Target Table / Artifact**: (e.g. `tables/phase0_contracts.csv`, `phase1_category_table.csv`, `figures/*.png`)
- **Notebook Cell Range**: (e.g. `Cells 13–18`)

## 3. Discrepancy or Anomaly Details
| Dimension | Expected / Documented Value | Observed / Recomputed Value | Deviation ($\Delta$) |
|---|---|---|---|
| Value / Rate | | | |
| Metric Identifier | | | |
| Contract Rule | | | |

## 4. Steps to Reproduce
1. Run script: `python tests/...` or open route: `http://127.0.0.1:4173/...`
2. Inspect table or metric card:
3. Observe discrepancy:

## 5. Evidence Excerpt
<!-- Provide the relevant code snippet, query output, or notebook cell output -->
```python
# Insert reproducible Python or SQL/DAX snippet
```

## 6. Mathematical & Research Impact
- **Severity**: [ ] Critical (Invalidates Model Evaluation) · [ ] Moderate (Affects Sub-table) · [ ] Minor (Typographical / Rounding)
- **Causal Interpretation**: Does this affect cross-boundary generalizability, prevalence calibration, or economics?
- **Recommended Remediation**: (e.g. update data contract, recompute post-hoc pair, adjust baseline snapshot)
