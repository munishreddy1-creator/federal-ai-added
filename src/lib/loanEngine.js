/**
 * FederalCreditPro — Loan Underwriting & Pricing Engine
 * All business logic extracted from Base44 component field names & gate checks
 */

// ─── Rate Bands ────────────────────────────────────────────────────────────────
const RATE_BANDS = {
  "Housing Loan": [
    { min: 750, max: 900, rate: { min: 8.0, max: 9.5 } },
    { min: 700, max: 749, rate: { min: 8.5, max: 11.5 } },
    { min: 650, max: 699, rate: { min: 10.5, max: 12.0 } },
    { min: 300, max: 649, rate: { min: 12.0, max: 14.0 } },
  ],
  "Auto Loan": [
    { min: 750, max: 900, rate: { min: 9.0, max: 10.0 } },
    { min: 700, max: 749, rate: { min: 10.0, max: 11.5 } },
    { min: 650, max: 699, rate: { min: 11.5, max: 13.5 } },
    { min: 300, max: 649, rate: { min: 13.5, max: 16.0 } },
  ],
  "Gold Loan": [
    { min: 750, max: 900, rate: { min: 7.5, max: 8.5 } },
    { min: 700, max: 749, rate: { min: 8.5, max: 9.5 } },
    { min: 650, max: 699, rate: { min: 9.5, max: 11.0 } },
    { min: 300, max: 649, rate: { min: 11.0, max: 13.0 } },
  ],
};

// ─── LTV Caps ─────────────────────────────────────────────────────────────────
const LTV_CAPS = {
  "Housing Loan": 80,
  "Auto Loan": 85,
  "Gold Loan": 75,
};

// ─── Cost of Funds (benchmark) ────────────────────────────────────────────────
const COST_OF_FUNDS = {
  "Housing Loan": 5.5,
  "Auto Loan": 7.0,
  "Gold Loan": 6.0,
};

// ─── Festival season discount ─────────────────────────────────────────────────
const FESTIVAL_DISCOUNT = 0.25; // 0.25% rate reduction

// ─── EMI Calculation ──────────────────────────────────────────────────────────
export function calcEMI(principal, annualRate, months) {
  if (annualRate === 0) return Math.round(principal / months);
  const r = annualRate / 100 / 12;
  const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return Math.round(emi);
}

// ─── Amortization Schedule ────────────────────────────────────────────────────
export function buildAmortization(principal, annualRate, months, previewMonths = 12) {
  const r = annualRate / 100 / 12;
  const emi = calcEMI(principal, annualRate, months);
  const rows = [];
  let balance = principal;
  const limit = Math.min(previewMonths, months);
  for (let i = 1; i <= limit; i++) {
    const interest = balance * r;
    const principalPaid = emi - interest;
    balance -= principalPaid;
    rows.push({
      month: i,
      payment: emi,
      principal: principalPaid,
      interest,
      balance: Math.max(0, balance),
    });
  }
  return rows;
}

// ─── Score Components ─────────────────────────────────────────────────────────
function scoreCIBIL(cibil) {
  if (cibil >= 800) return 100;
  if (cibil >= 750) return 100;
  if (cibil >= 700) return 90;
  if (cibil >= 650) return 70;
  if (cibil >= 600) return 50;
  return 30;
}

function scoreDTI(dti) {
  if (dti <= 0) return 100; // No debt when no income
  if (dti <= 0.3) return 100;
  if (dti <= 0.4) return 100;
  if (dti <= 0.5) return 80;
  if (dti <= 0.6) return 50;
  return 20;
}

function scoreLTV(ltv, cap) {
  if (ltv <= cap * 0.8) return 100;
  if (ltv <= cap) return 70;
  if (ltv <= cap * 1.05) return 40;
  return 10;
}

function scoreIncome(income) {
  if (income >= 200000) return 100;
  if (income >= 100000) return 80;
  if (income >= 50000) return 60;
  if (income >= 25000) return 40;
  return 20;
}

function scoreDefaults(defaults) {
  if (defaults === 0) return 100;
  if (defaults === 1) return 40;
  return 5;
}

function scoreSpend(spendToIncome) {
  if (spendToIncome <= 0) return 100; // No spending when no income
  if (spendToIncome <= 0.3) return 100;
  if (spendToIncome <= 0.5) return 100;
  if (spendToIncome <= 0.7) return 70;
  return 30;
}

function scoreLiquidity(savings, monthlyObligations, monthlySpends) {
  const monthlyOutflow = monthlyObligations + monthlySpends;
  const months = monthlyOutflow > 0 ? savings / monthlyOutflow : 0;
  if (months >= 1.5) return 100;
  if (months >= 1) return 80;
  if (months >= 0.5) return 55;
  return 25;
}

// ─── Weighted Score ───────────────────────────────────────────────────────────
function calcWeightedScore(scores) {
  return (
    scores.cibil * 0.25 +
    scores.dti * 0.20 +
    scores.ltv * 0.20 +
    scores.income * 0.10 +
    scores.defaults * 0.10 +
    scores.spend * 0.10 +
    scores.liquidity * 0.05
  );
}

// ─── Rate from Band ───────────────────────────────────────────────────────────
function getRateBand(product, cibil) {
  const bands = RATE_BANDS[product] || RATE_BANDS["Housing Loan"];
  for (const band of bands) {
    if (cibil >= band.min && cibil <= band.max) return band.rate;
  }
  return { min: 14, max: 16 };
}

function finalRateFromScore(band, weightedScore, season) {
  // Map score to rate with a gradual curve: high-quality borrowers still retain strong pricing,
  // while lower quality profiles move closer to the top of the band.
  const t = Math.max(0, Math.min(1, weightedScore / 100));
  const curve = Math.pow(1 - t, 0.237);
  let rate = band.min + curve * (band.max - band.min);
  if (season === "Festival") rate -= FESTIVAL_DISCOUNT;
  return Math.max(band.min - FESTIVAL_DISCOUNT, rate);
}

// ─── Gate Checks ──────────────────────────────────────────────────────────────
function runGates(form, derived) {
  const { cibil_score, past_defaults } = form;
  const { dti, ltv, ltvCap, spendToIncome, surplus, emi, stressEMI } = derived;

  const gates = {};

  // CIBIL gate
  if (cibil_score >= 700) gates.cibil = "PASS";
  else if (cibil_score >= 650) gates.cibil = "MANUAL";
  else gates.cibil = "REJECT";

  // Spend-to-income gate
  if (spendToIncome <= 0.5) gates.spend = "PASS";
  else if (spendToIncome <= 0.7) gates.spend = "MANUAL";
  else gates.spend = "REJECT";

  // DTI gate
  if (dti <= 0.4) gates.dti = "PASS";
  else if (dti <= 0.55) gates.dti = "MANUAL";
  else gates.dti = "REJECT";

  // LTV gate
  if (ltv <= ltvCap) gates.ltv = "PASS";
  else if (ltv <= ltvCap * 1.05) gates.ltv = "MANUAL";
  else gates.ltv = "REJECT";

  // EMI affordability gate (EMI ≤ 50% of surplus, or PASS if surplus = 0)
  if (surplus <= 0 || emi <= surplus * 0.5) gates.emi = "PASS";
  else if (emi <= surplus * 0.65) gates.emi = "MANUAL";
  else gates.emi = "REJECT";

  // Stress test gate (stress EMI ≤ 85% of surplus, or PASS if surplus = 0)
  if (surplus <= 0 || stressEMI <= surplus * 0.85) gates.stress = "PASS";
  else if (stressEMI <= surplus) gates.stress = "MANUAL";
  else gates.stress = "REJECT";

  // Residual income gate
  const residualIncome = surplus - emi;
  if (surplus <= 0 || residualIncome >= surplus * 0.15) gates.residual = "PASS";
  else if (residualIncome >= 0) gates.residual = "MANUAL";
  else gates.residual = "REJECT";

  return gates;
}

// ─── Decision ─────────────────────────────────────────────────────────────────
function calcDecision(gates, past_defaults) {
  const values = Object.values(gates);
  if (past_defaults >= 2) return "REJECT";
  if (values.includes("REJECT")) return "REJECT";
  if (values.includes("MANUAL")) return "MANUAL REVIEW";
  return "APPROVE";
}

// ─── Risk Reason Codes ────────────────────────────────────────────────────────
function buildRiskReasons(form, derived, gates) {
  const reasons = [];

  if (gates.cibil !== "PASS") {
    reasons.push({
      code: "RC01",
      label: "Low CIBIL Score",
      detail: `Score ${form.cibil_score} is below the preferred threshold of 700.`,
    });
  }
  if (gates.dti !== "PASS") {
    reasons.push({
      code: "RC02",
      label: "High Debt-to-Income Ratio",
      detail: `DTI of ${(derived.dti * 100).toFixed(1)}% exceeds the 40% guideline.`,
    });
  }
  if (gates.ltv !== "PASS") {
    reasons.push({
      code: "RC03",
      label: "LTV Cap Breached",
      detail: `LTV of ${derived.ltv.toFixed(1)}% exceeds the ${derived.ltvCap}% cap for ${form.product}.`,
    });
  }
  if (gates.spend !== "PASS") {
    reasons.push({
      code: "RC04",
      label: "High Spend-to-Income Ratio",
      detail: `Spends are ${(derived.spendToIncome * 100).toFixed(1)}% of income, indicating low savings discipline.`,
    });
  }
  if (gates.emi !== "PASS") {
    reasons.push({
      code: "RC05",
      label: "EMI Affordability Concern",
      detail: `EMI of ₹${Math.round(derived.emi).toLocaleString("en-IN")} is high relative to monthly surplus.`,
    });
  }
  if (gates.stress !== "PASS") {
    reasons.push({
      code: "RC06",
      label: "Fails Stress Test",
      detail: `At +2% rate shock, EMI would be ₹${Math.round(derived.stressEMI).toLocaleString("en-IN")}, exceeding 85% of surplus.`,
    });
  }
  if (gates.residual !== "PASS") {
    reasons.push({
      code: "RC07",
      label: "Insufficient Residual Income",
      detail: "After EMI deduction, remaining income is below minimum comfort threshold.",
    });
  }
  if (form.past_defaults >= 1) {
    reasons.push({
      code: "RC08",
      label: "Past Default History",
      detail: `${form.past_defaults} past default(s) recorded on credit file.`,
    });
  }

  return reasons;
}

// ─── Max Safe Loan ────────────────────────────────────────────────────────────
function calcMaxSafeLoan(surplus, annualRate, months) {
  // Max loan where stress EMI (at +2%) ≤ 85% of surplus
  const stressRate = annualRate + 2;
  const maxStressEMI = surplus * 0.85;
  const r = stressRate / 100 / 12;
  if (r === 0) return maxStressEMI * months;
  return (maxStressEMI * (Math.pow(1 + r, months) - 1)) / (r * Math.pow(1 + r, months));
}

// ─── Main Evaluate Function ───────────────────────────────────────────────────
export function evaluate(form) {
  const {
    product,
    season,
    tenure_months,
    cibil_score,
    monthly_income,
    monthly_obligations,
    past_defaults,
    monthly_spends,
    savings_balance,
    loan_amount,
    collateral_value,
  } = form;

  const months = tenure_months || 60;
  const ltvCap = LTV_CAPS[product] || 80;
  const costOfFunds = COST_OF_FUNDS[product] || 6.5;

  // ── Derived ratios ──
  const dti = monthly_income > 0 ? monthly_obligations / monthly_income : 0;
  const spendToIncome = monthly_income > 0 ? monthly_spends / monthly_income : 0;
  const ltv = collateral_value > 0 ? (loan_amount / collateral_value) * 100 : 100;
  const surplus = monthly_income - monthly_obligations - monthly_spends;

  // ── Scores ──
  const scores = {
    cibil: scoreCIBIL(cibil_score),
    dti: scoreDTI(dti),
    ltv: scoreLTV(ltv, ltvCap),
    income: scoreIncome(monthly_income),
    defaults: scoreDefaults(past_defaults),
    spend: scoreSpend(spendToIncome),
    liquidity: scoreLiquidity(savings_balance, monthly_obligations, monthly_spends),
  };
  const weightedScore = calcWeightedScore(scores);

  // ── Rate ──
  const rateBand = getRateBand(product, cibil_score);
  const finalRate = finalRateFromScore(rateBand, weightedScore, season);
  const stressRate = finalRate + 2;

  // ── EMI ──
  const emi = calcEMI(loan_amount, finalRate, months);
  const stressEMI = calcEMI(loan_amount, stressRate, months);
  const residualIncome = surplus - emi;

  // ── Gates ──
  const derived = { dti, ltv, ltvCap, spendToIncome, surplus, emi, stressEMI, stressRate, residualIncome };
  const gates = runGates(form, derived);
  const decision = calcDecision(gates, past_defaults);
  const riskReasons = buildRiskReasons(form, derived, gates);

  // ── Totals ──
  const totalAmountPaid = emi * months;
  const totalInterestPaid = totalAmountPaid - loan_amount;

  // ── NIM ──
  const nimPct = finalRate - costOfFunds;
  const nimAmount = (nimPct / 100 / 12) * loan_amount * months;

  // ── Max safe loan ──
  const maxSafeLoanAmount = calcMaxSafeLoan(surplus, finalRate, months);

  // ── Amortization ──
  const amortization = buildAmortization(loan_amount, finalRate, months, 12);

  return {
    // ratios
    dti,
    spendToIncome,
    ltv,
    ltvCap,
    surplus,
    residualIncome,
    stressEMI,
    stressRate,
    // scoring
    scores,
    weightedScore,
    // rate
    rateBand,
    finalRate,
    costOfFunds,
    // EMI & totals
    emi,
    totalAmountPaid,
    totalInterestPaid,
    // decision
    gates,
    decision,
    riskReasons,
    maxSafeLoanAmount,
    // NIM
    nimPct,
    nimAmount,
    // amortization
    amortization,
  };
}
