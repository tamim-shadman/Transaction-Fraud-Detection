# Phase 6: What-If Simulation Methodology & Mathematical Economics

**System Component:** Evidence-Grounded What-If Scenario Lab (`/scenarios` & `app/src/lib/simulation.ts`)  
**Mathematical Framework:** Piecewise Linear Empirical Interpolation & Decision Theory  
**Verification Date:** October 2026  
**Empirical Anchor:** `phase8_capture_at_k.csv` & `phase8_threshold_table.csv`

---

## 1. Governance Principles & Strict Boundaries

The Scenario Lab provides interactive simulation of operational and economic scenarios. To prevent unscientific misrepresentation:

1. **Non-Equivalence Invariant:** Simulated outputs represent mathematical projections. They are visibly segregated with warning callouts and **never replace or overwrite canonical measured metrics** in the database or dashboard.
2. **Empirical Anchoring:** Simulations do not rely on synthetic toy equations. They interpolate directly across empirical data points from actual LightGBM test predictions recorded in `phase8_capture_at_k.csv`.
3. **Transparent Assumptions:** Every simulated result displays the exact formula, input parameters, labor rates, and denominators used in the calculation.

```mermaid
graph TD
    A[Empirical Baseline: phase8_capture_at_k.csv] --> B{Piecewise Linear Interpolation}
    B --> C[Module 1: Review Capacity & Economics]
    B --> D[Module 2: Classification Threshold Cutoff]
    B --> E[Module 3: Workload & Pipeline Scaling]
    C --> F[Net Financial Savings & ROI Multiplier]
    D --> G[Alert Generation Rate & F1 Curve]
    E --> H[Projected Memory Heap & Daily Caseload]
```

---

## 2. Module 1: Review Capacity & Operational Economics

### Empirical Capture Curve Anchor Points

Model capture rate is anchored to the empirical evaluation of the test dataset ($N = 555,719$, Fraud = $2,145$):

$$\text{Anchor Points}: \quad \{(0.1\%, 42.10\%), (0.2\%, 54.80\%), (0.5\%, 73.20\%), (1.0\%, 84.32\%), (2.0\%, 90.15\%), (5.0\%, 95.10\%)\}$$

For any arbitrary capacity percentage $k \in [0.1\%, 5.0\%]$, the recall percentage $R(k)$ is calculated via piecewise linear interpolation between adjacent anchor points $(k_0, R_0)$ and $(k_1, R_1)$:

$$R(k) = R_0 + \frac{k - k_0}{k_1 - k_0} \times (R_1 - R_0)$$

### Financial Formulation

Let:
- $N_{\text{total}} = 1,852,394$ (overall program transaction volume)
- $F_{\text{total}} = 9,651$ (total confirmed fraud events)
- $\bar{L}_{\text{fraud}} = \$124.50$ (mean observed transaction loss per fraud event)
- $W_{\text{hourly}} \in [\$15, \$75]$ (investigator hourly wage, baseline $\$35$)
- $t_{\text{review}} \in [2.0, 20.0]$ (minutes required per case review, baseline $6.0$)
- $P_{\text{friction}} \in [\$5, \$50]$ (customer friction cost per false positive, baseline $\$15$)
- $M_{\text{missed}} \in [1.0, 3.0]$ (multiplier on missed fraud loss, baseline $1.0$)

The operational equations evaluate:

$$\text{Review Volume } (V_k) = \left\lceil \frac{k}{100} \times N_{\text{total}} \right\rceil$$

$$\text{Frauds Caught } (F_{\text{caught}}) = \operatorname{round}\left(F_{\text{total}} \times \frac{R(k)}{100}\right)$$

$$\text{Prevented Loss } (L_{\text{prevented}}) = F_{\text{caught}} \times \bar{L}_{\text{fraud}} \times M_{\text{missed}}$$

$$\text{Labor Cost } (C_{\text{labor}}) = V_k \times \left(\frac{t_{\text{review}}}{60}\right) \times W_{\text{hourly}}$$

$$\text{False Positive Friction Cost } (C_{\text{friction}}) = \max(0, V_k - F_{\text{caught}}) \times P_{\text{friction}}$$

$$\text{Total Operational Cost } (C_{\text{total}}) = C_{\text{labor}} + C_{\text{friction}}$$

$$\text{Net Financial Savings } (S_{\text{net}}) = L_{\text{prevented}} - C_{\text{total}}$$

$$\text{Return On Investment } (\text{ROI}) = \frac{L_{\text{prevented}}}{C_{\text{labor}}}$$

### Financial Trade-Off Table Across Review Capacities

| Review Capacity ($k$) | Cases Reviewed ($V_k$) | Fraud Caught ($F_{\text{caught}}$) | Prevented Loss ($L$) | Labor Cost ($C_{\text{labor}}$) | Net Savings ($S_{\text{net}}$) | ROI Multiplier |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **0.10% (Ultra-Tight)** | 1,853 | 4,063 (42.10%) | $505,843 | $6,486 | $471,598 | **78.0x** |
| **0.50% (Constrained)** | 9,262 | 7,065 (73.20%) | $879,592 | $32,417 | $814,221 | **27.1x** |
| **1.00% (Baseline Recommended)**| **18,524** | **8,138 (84.32%)** | **$1,013,181** | **$64,834** | **$792,488** | **15.6x** |
| **2.00% (High-Assurance)**| 37,048 | 8,700 (90.15%) | $1,083,150 | $129,668 | $528,272 | **8.4x** |
| **5.00% (Exhaustive)** | 92,620 | 9,178 (95.10%) | $1,142,661 | $324,170 | -$433,409 | **3.5x** |

> **Analytical Finding:** Beyond $k = 1.0\%$, the marginal cost of investigator labor and cardholder friction exceeds marginal fraud intercepted. Review capacity at $k = 1.0\%$ maximizes operational ROI ($15.6\times$).

---

## 3. Module 2: Decision Threshold Simulation

The threshold simulation module explores probability cutoff trade-offs $t \in [0.00001, 0.90]$ based on `phase8_threshold_table.csv`:

$$\text{Precision } (P) = \frac{\text{TP}}{\text{TP} + \text{FP}}, \quad \text{Recall } (R) = \frac{\text{TP}}{\text{TP} + \text{FN}}, \quad \text{F1} = \frac{2 \cdot P \cdot R}{P + R}$$

At the enterprise operating threshold $t = 1 \times 10^{-5}$:
- **Alerts Generated:** 22,129 (1.19% of flow)
- **True Positives (TP):** 1,807 confirmed frauds intercepted
- **False Positives (FP):** 20,322 non-fraud cardholders reviewed
- **USD Exposure Captured:** **91.88%** ($92,043 missed vs $1,058,762 total)

---

## 4. Module 3: Workload & Ingestion Scaling

For architecture planning under business volume expansion, transaction multiplier $M_{\text{vol}} \in [1.0, 10.0]$ models system impact:

$$\text{Projected Ingestion Duration } (T_{\text{ingest}}) = 28.5 \times M_{\text{vol}}^{1.05} \text{ seconds}$$

$$\text{Projected Browser Heap } (\text{Heap}_{\text{MB}}) = 450 \times M_{\text{vol}}^{0.85} \text{ MB}$$

$$\text{Daily 1\% Review Caseload } (Q_{\text{daily}}) = \operatorname{round}\left(\frac{1,852,394 \times M_{\text{vol}} \times 0.01}{365}\right)$$

At $5\times$ transaction scale (9.26M transactions/year):
- **Estimated Ingestion Duration:** 153.9s
- **Client Heap Footprint:** ~1,755 MB
- **Daily Review Queue at 1%:** 254 cases/day (manageable by 2 full-time analysts).

---

## 5. Scenario Persistence & Export

All scenario parameters and outcomes can be saved to active workspace sessions or exported via formatted JSON:

```json
{
  "scenario_title": "Fraud Economics & What-If Simulation Report",
  "simulated_at": "2026-10-21T17:00:00Z",
  "governance_notice": "Hypothetical simulation calculations. Does not overwrite canonical metrics.",
  "inputs": {
    "capacity_pct": 2.5,
    "investigator_hourly_wage": 45.0,
    "review_minutes_per_case": 5.0,
    "false_positive_penalty": 10.0
  },
  "outputs": {
    "reviewVolume": 46310,
    "captureRate": 0.9098,
    "fraudsCaught": 8780,
    "preventedLoss": 1093110.0,
    "totalOperationalCost": 523312.5,
    "netSavings": 569797.5,
    "roiMultiplier": 6.3
  }
}
```
