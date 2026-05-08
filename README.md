# FederalCreditPro — Local Setup

Retail loan underwriting & automated pricing platform. Zero cloud dependencies — runs fully locally.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open in browser
# http://localhost:5173
```

## Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── lib/
│   └── loanEngine.js          # All underwriting & pricing logic
├── components/loan/
│   ├── LoanInputForm.jsx      # Input form
│   ├── KPICards.jsx           # 8 animated KPI summary cards
│   ├── DerivedMetrics.jsx     # DTI, LTV, surplus, stress EMI
│   ├── GateChecks.jsx         # 7 pass/manual/reject gates
│   ├── ScoreBreakdown.jsx     # Weighted credit score breakdown
│   ├── NIMCard.jsx            # Net Interest Margin
│   ├── RiskPanel.jsx          # Risk reason codes + max safe loan
│   ├── AmortizationTable.jsx  # First 12 months schedule
│   └── MetricsTable.jsx       # Full detailed metrics table
└── pages/
    ├── LoanCalculator.jsx     # Main page (/)
    └── UnderwriterSummary.jsx # Summary page (/underwriter-summary)
```

## How It Works

### Loan Products
- **Housing Loan** — LTV cap 80%, CoF 6.5%
- **Auto Loan** — LTV cap 85%, CoF 7.0% (Festival season: −0.25% rate)
- **Gold Loan** — LTV cap 75%, CoF 6.0%

### Scoring Weights
| Component   | Weight |
|-------------|--------|
| CIBIL Score | 25%    |
| DTI Ratio   | 20%    |
| LTV Ratio   | 20%    |
| Income      | 10%    |
| Defaults    | 10%    |
| Spend Ratio | 10%    |
| Liquidity   | 5%     |

### Gate Checks (7 gates)
Each gate returns PASS / MANUAL REVIEW / REJECT:
1. **CIBIL** — ≥700 PASS, 650–699 MANUAL, <650 REJECT
2. **DTI** — ≤40% PASS, 40–55% MANUAL, >55% REJECT
3. **LTV** — within cap PASS, ≤5% over MANUAL, >5% REJECT
4. **Spend-to-Income** — ≤50% PASS, 50–70% MANUAL, >70% REJECT
5. **EMI Affordability** — EMI ≤50% surplus PASS
6. **Stress Test** — Stress EMI (+2%) ≤85% surplus PASS
7. **Residual Income** — After-EMI income ≥15% surplus PASS

Final decision: any REJECT → REJECT, any MANUAL → MANUAL REVIEW, all PASS → APPROVE.

### Underwriter Summary
After calculating, click **Underwriter Summary** in the header to see a printable one-page report. Use browser Print (Ctrl+P) to save as PDF.

## No External Dependencies
This app has no backend, no auth, no cloud SDK. Results are computed in-browser using pure JS math. The Underwriter Summary page reads from `localStorage`.

## Tech Stack
- React 18 + Vite 6
- Tailwind CSS v3
- Framer Motion (KPI card animations)
- React Router v6
- Lucide React (icons)
