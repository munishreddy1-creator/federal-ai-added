/**
 * FederalCreditPro — Loan Underwriting & Pricing Engine
 * Pure function architecture for reusable, deterministic calculations
 * All business rules sourced from underwritingConfig.js
 */

import {
  RATE_BANDS,
  SCORE_WEIGHTS,
  GATE_THRESHOLDS,
  FESTIVAL_DISCOUNT,
  STRESS_CONFIG,
  getLTVCap,
  getCostOfFunds,
  applyAgeBasedReduction,
  validateLTVRange,
  hasCreditRisk,
  evaluateFIORPolicy,
} from "./underwritingConfig.js";

// ─── Safe Number Coercion ─────────────────────────────────────────────────────
function toNum(val) {
  if (val === "" || val === null || val === undefined) return NaN;
  const n = Number(val);
  return isNaN(n) ? NaN : n;
}

function toNumOrZero(val) {
  if (val === "" || val === null || val === undefined) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : Math.max(0, n);
}

// ─── EMI Calculation ──────────────────────────────────────────────────────────
export function calcEMI(principal, annualRate, months) {
  if (!principal || principal <= 0) return 0;
  if (annualRate === 0) return Math.round(principal / months);
  const r = annualRate / 100 / 12;
  const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return Math.round(emi);
}

function calcPrincipalFromEMI(emi, annualRate, months) {
  if (emi <= 0 || months <= 0) return 0;
  if (annualRate === 0) return emi * months;
  const r = annualRate / 100 / 12;
  return (emi * (Math.pow(1 + r, months) - 1)) / (r * Math.pow(1 + r, months));
}

// ─── Amortization Schedule ────────────────────────────────────────────────────
export function buildAmortization(principal, annualRate, months, previewMonths = 12) {
  if (!principal || principal <= 0) return [];
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
  if (cibil === -1) return 65;
  if (cibil >= 750) return 100;
  if (cibil >= 700) return 90;
  if (cibil >= 650) return 70;
  if (cibil >= 600) return 50;
  return 30;
}

function scoreDTI(dti) {
  if (dti <= 0) return 100;
  if (dti <= 0.4) return 100;
  if (dti <= 0.5) return 80;
  if (dti <= 0.6) return 50;
  return 20;
}

// Rest of scoring rules
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
  if (spendToIncome <= 0) return 100;
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
export function calcWeightedScore(scores) {
  return (
    scores.cibil * SCORE_WEIGHTS.cibil +
    scores.dti * SCORE_WEIGHTS.dti +
    scores.ltv * SCORE_WEIGHTS.ltv +
    scores.income * SCORE_WEIGHTS.income +
    scores.defaults * SCORE_WEIGHTS.defaults +
    scores.spend * SCORE_WEIGHTS.spend +
    scores.liquidity * SCORE_WEIGHTS.liquidity
  );
}

// ─── Rate from Band ───────────────────────────────────────────────────────────
function getRateBand(product, cibil) {
  const bands = RATE_BANDS[product] || RATE_BANDS["Housing Loan"];
  const effectiveCibil = cibil === -1 ? 675 : cibil;
  for (const band of bands) {
    if (effectiveCibil >= band.min && effectiveCibil <= band.max) return band.rate;
  }
  return { min: 14, max: 16 };
}

function resolveFinalRate(band, weightedScore, season, customInterestRate = null) {
  if (customInterestRate !== null && customInterestRate !== undefined && customInterestRate !== "") {
    const requestedRate = Number(customInterestRate);
    const appliedRate = Math.min(Math.max(requestedRate, band.min), band.max);
    return {
      rate: appliedRate,
      validation: {
        isValid: requestedRate >= band.min && requestedRate <= band.max,
        requestedRate,
        appliedRate,
        min: band.min,
        max: band.max,
        message:
          requestedRate >= band.min && requestedRate <= band.max
            ? null
            : `Interest rate adjusted to allowed range ${band.min.toFixed(2)}%-${band.max.toFixed(2)}%.`,
      },
    };
  }
  const rate = finalRateFromScore(band, weightedScore, season);
  return {
    rate,
    validation: { isValid: true, requestedRate: null, appliedRate: rate, min: band.min, max: band.max, message: null },
  };
}

function finalRateFromScore(band, weightedScore, season) {
  const t = Math.max(0, Math.min(1, weightedScore / 100));
  const curve = Math.pow(1 - t, 0.237);
  let rate = band.min + curve * (band.max - band.min);
  if (season === "Festival") rate -= FESTIVAL_DISCOUNT;
  return Math.max(band.min - FESTIVAL_DISCOUNT, rate);
}

// ─── Gate Checks ──────────────────────────────────────────────────────────────
function runGates(form, derived) {
  const { cibil_score } = form;
  const { totalDTI, ltv, ltvCap, spendToIncome, surplus, emi, stressEMI, projectedResidualIncome } = derived;

  const gates = {};

  if (cibil_score === -1) gates.cibil = "MANUAL";
  else if (cibil_score >= GATE_THRESHOLDS.cibil.pass) gates.cibil = "PASS";
  else if (cibil_score >= GATE_THRESHOLDS.cibil.manual) gates.cibil = "MANUAL";
  else gates.cibil = "REJECT";

  if (spendToIncome <= GATE_THRESHOLDS.spend.pass) gates.spend = "PASS";
  else if (spendToIncome <= GATE_THRESHOLDS.spend.manual) gates.spend = "MANUAL";
  else gates.spend = "REJECT";

  if (totalDTI <= GATE_THRESHOLDS.dti.pass) gates.dti = "PASS";
  else if (totalDTI <= GATE_THRESHOLDS.dti.manual) gates.dti = "MANUAL";
  else gates.dti = "REJECT";

  if (ltv <= ltvCap * GATE_THRESHOLDS.ltv.capMultiplier.pass) gates.ltv = "PASS";
  else if (ltv <= ltvCap * GATE_THRESHOLDS.ltv.capMultiplier.manual) gates.ltv = "MANUAL";
  else gates.ltv = "REJECT";

  if (projectedResidualIncome > 0) gates.emi = "PASS";
  else gates.emi = "REJECT";

  if (surplus <= 0 || stressEMI <= surplus * GATE_THRESHOLDS.stress.passRatio) gates.stress = "PASS";
  else if (stressEMI <= surplus * GATE_THRESHOLDS.stress.manualRatio) gates.stress = "MANUAL";
  else gates.stress = "REJECT";

  const residualIncome = surplus - emi;
  if (surplus <= 0 || residualIncome >= surplus * GATE_THRESHOLDS.residual.passRatio) gates.residual = "PASS";
  else if (residualIncome >= GATE_THRESHOLDS.residual.manualRatio) gates.residual = "MANUAL";
  else gates.residual = "REJECT";

  return gates;
}

// ─── Decision Engine ──────────────────────────────────────────────────────────
export function evaluateFinalDecision(form, derived, gates) {
  const { past_defaults, cibil_score } = form;
  const { projectedResidualIncome, creditRisk } = derived;

  if (projectedResidualIncome <= 0) return { decision: "REJECT", reason: "AFFORDABILITY_FAILURE" };
  if (past_defaults >= 2) return { decision: "REJECT", reason: "EXCESSIVE_PAST_DEFAULTS" };
  if (creditRisk.hasCreditRisk && creditRisk.activeOverdueAmount > 0)
    return { decision: "REJECT", reason: "ACTIVE_OVERDUE_PAYMENT" };
  if (creditRisk.hasCreditRisk)
    return { decision: "MANUAL_REVIEW", reason: creditRisk.primaryReason || "CREDIT_RISK_DETECTED" };
  
  // FORCE MANUAL REVIEW FOR NEW TO CREDIT (-1) APPLICANTS
  if (Number(cibil_score) === -1) return { decision: "MANUAL_REVIEW", reason: "NEW_TO_CREDIT" };

  if (Object.values(gates).includes("REJECT")) return { decision: "REJECT", reason: "GATE_REJECTION" };
  if (Object.values(gates).includes("MANUAL")) return { decision: "MANUAL_REVIEW", reason: "GATE_MANUAL_REVIEW" };
  return { decision: "APPROVE", reason: "ALL_GATES_PASSED" };
}

// ─── Reason Codes ─────────────────────────────────────────────────────────────
export function generateReasonCodes(form, derived, gates, decision) {
  const reasons = [];
  const { cibil_score, past_defaults } = form;
  const { totalDTI, ltv, ltvCap, spendToIncome, surplus, emi, stressEMI, creditRisk, isFestiveSeason, isAgeAdjusted } = derived;

  if (creditRisk?.hasCreditRisk) {
    if (creditRisk.activeOverdueAmount > 0)
      reasons.push({ code: "RC_ACTIVE_OVERDUE", label: "Active Overdue Amount Detected", detail: `Active overdue: ₹${Math.round(creditRisk.activeOverdueAmount).toLocaleString("en-IN")}. Application escalated to manual review.`, severity: "CRITICAL", impact: "MANUAL_REVIEW" });
    if (creditRisk.emiDefaultCount > 0)
      reasons.push({ code: "RC_EMI_DEFAULT", label: "EMI Default History", detail: `${creditRisk.emiDefaultCount} EMI default(s) detected. Requires manual review.`, severity: "HIGH", impact: "MANUAL_REVIEW" });
    if (creditRisk.overdueEMICount > 0)
      reasons.push({ code: "RC_OVERDUE_EMI", label: "Multiple Overdue EMIs", detail: `${creditRisk.overdueEMICount} overdue EMI(s) on record. Manual review recommended.`, severity: "HIGH", impact: "MANUAL_REVIEW" });
  }

  if (Number(cibil_score) === -1) {
    reasons.push({ code: "RC_NEW_TO_CREDIT", label: "New to Credit / No History", detail: "Applicant has no historical credit record (CIBIL -1). Requiring standard manual policy verification.", severity: "LOW", impact: "MANUAL_REVIEW" });
  } else if (gates.cibil !== "PASS") {
    reasons.push({ code: "RC_LOW_CIBIL", label: "Low CIBIL Score", detail: `Score ${cibil_score} is below the preferred threshold of ${GATE_THRESHOLDS.cibil.pass}.`, severity: "MEDIUM", impact: gates.cibil === "REJECT" ? "REJECT" : "MANUAL_REVIEW" });
  }

  if (gates.dti !== "PASS") reasons.push({ code: "RC_HIGH_DTI", label: "High Debt-to-Income Ratio", detail: `Total DTI of ${(totalDTI * 100).toFixed(1)}% exceeds the ${GATE_THRESHOLDS.dti.pass * 100}% guideline.`, severity: "MEDIUM", impact: gates.dti === "REJECT" ? "REJECT" : "MANUAL_REVIEW" });
  if (gates.ltv !== "PASS") reasons.push({ code: "RC_LTV_BREACH", label: "LTV Cap Breached", detail: `LTV of ${ltv.toFixed(1)}% exceeds the ${ltvCap}% cap${isFestiveSeason ? " (festive season)" : ""} for ${form.product}.`, severity: "MEDIUM", impact: gates.ltv === "REJECT" ? "REJECT" : "MANUAL_REVIEW" });
  if (gates.spend !== "PASS") reasons.push({ code: "RC_HIGH_SPEND", label: "High Spend-to-Income Ratio", detail: `Spends are ${(spendToIncome * 100).toFixed(1)}% of income, indicating low savings discipline.`, severity: "MEDIUM", impact: gates.spend === "REJECT" ? "REJECT" : "MANUAL_REVIEW" });
  if (gates.emi !== "PASS") reasons.push({ code: "RC_EMI_AFFORD", label: "EMI Affordability Concern", detail: `EMI of ₹${Math.round(emi).toLocaleString("en-IN")} is high relative to monthly surplus of ₹${Math.round(surplus).toLocaleString("en-IN")}.`, severity: "MEDIUM", impact: gates.emi === "REJECT" ? "REJECT" : "MANUAL_REVIEW" });
  if (gates.stress !== "PASS") reasons.push({ code: "RC_STRESS_FAIL", label: "Fails Stress Test", detail: `At +2% rate shock, EMI would be ₹${Math.round(stressEMI).toLocaleString("en-IN")}, exceeding 85% of surplus.`, severity: "MEDIUM", impact: gates.stress === "REJECT" ? "REJECT" : "MANUAL_REVIEW" });
  if (gates.residual !== "PASS") reasons.push({ code: "RC_RESIDUAL_LOW", label: "Low Residual Income", detail: "After EMI deduction, remaining income is below minimum comfort threshold.", severity: "MEDIUM", impact: gates.residual === "REJECT" ? "REJECT" : "MANUAL_REVIEW" });
  if (past_defaults >= 1) reasons.push({ code: "RC_PAST_DEFAULTS", label: "Past Default History", detail: `${past_defaults} past default(s) recorded on credit file.`, severity: "HIGH", impact: past_defaults >= 2 ? "REJECT" : "MANUAL_REVIEW" });
  if (isAgeAdjusted) reasons.push({ code: "RC_AGE_REDUCTION", label: "Age-Based Loan Reduction Applied", detail: `Loan eligibility adjusted based on applicant age.`, severity: "LOW", impact: "INFO" });
  if (isFestiveSeason && form.product === "Auto Loan") reasons.push({ code: "RC_FESTIVE_LTV", label: "Festive Season LTV Applied", detail: `Auto Loan LTV cap increased to 95% for festive season.`, severity: "LOW", impact: "INFO" });

  return reasons;
}

function buildRiskReasons(form, derived, gates) {
  const reasons = [];
  if (Number(form.cibil_score) === -1) {
    reasons.push({ code: "RC01_NTC", label: "New to Credit Portfolio", detail: "No history found (-1). Forwarded for baseline parameter underwriting evaluation." });
  } else if (gates.cibil !== "PASS") {
    reasons.push({ code: "RC01", label: "Low CIBIL Score", detail: `Score ${form.cibil_score} is below the preferred threshold of 700.` });
  }
  if (gates.dti !== "PASS") reasons.push({ code: "RC02", label: "High Debt-to-Income Ratio", detail: `Total DTI of ${(derived.totalDTI * 100).toFixed(1)}% exceeds the 50% guideline.` });
  if (gates.ltv !== "PASS") reasons.push({ code: "RC03", label: "LTV Cap Breached", detail: `LTV of ${derived.ltv.toFixed(1)}% exceeds the ${derived.ltvCap}% cap for ${form.product}.` });
  if (gates.spend !== "PASS") reasons.push({ code: "RC04", label: "High Spend-to-Income Ratio", detail: `Spends are ${(derived.spendToIncome * 100).toFixed(1)}% of income, indicating low savings discipline.` });
  if (gates.emi !== "PASS") reasons.push({ code: "RC05", label: "EMI Affordability Concern", detail: `EMI of ₹${Math.round(derived.emi).toLocaleString("en-IN")} is high relative to monthly surplus.` });
  if (gates.stress !== "PASS") reasons.push({ code: "RC06", label: "Fails Stress Test", detail: `At +2% rate shock, EMI would be ₹${Math.round(derived.stressEMI).toLocaleString("en-IN")}, exceeding 85% of surplus.` });
  if (gates.residual !== "PASS") reasons.push({ code: "RC07", label: "Insufficient Residual Income", detail: "After EMI deduction, remaining income is below minimum comfort threshold." });
  if (form.past_defaults >= 1) reasons.push({ code: "RC08", label: "Past Default History", detail: `${form.past_defaults} past default(s) recorded on credit file.` });
  return reasons;
}

// ─── Max Safe Loan ────────────────────────────────────────────────────────────
function calcMaxSafeLoan(surplus, annualRate, months) {
  const stressRate = annualRate + 2;
  const maxStressEMI = surplus * 0.85;
  return calcPrincipalFromEMI(maxStressEMI, stressRate, months);
}

function minPositiveAmount(...amounts) {
  return Math.max(0, Math.min(...amounts.map((a) => Math.max(0, Number.isFinite(a) ? a : 0))));
}

function calculateEligibilityCaps({ requestedLoanAmount, collateralValue, ltvCap, surplus, finalRate, months, fiorSanction, adjustedLoanAmount }) {
  const ltvEligibleLoan = collateralValue > 0 ? collateralValue * (ltvCap / 100) : 0;
  const affordabilityEligibleLoan = calcMaxSafeLoan(surplus, finalRate, months);
  const underwritingEligibleLoan = adjustedLoanAmount;
  const fiorEligibleLoan =
    fiorSanction.status === "REJECTED" || fiorSanction.status === "MANUAL_REVIEW"
      ? 0
      : fiorSanction.approvedLoanAmount;
  const maxEligibleLoan = minPositiveAmount(requestedLoanAmount, ltvEligibleLoan, affordabilityEligibleLoan, underwritingEligibleLoan, fiorEligibleLoan);
  return {
    requestedLoanAmount,
    ltvEligibleLoan: Math.round(ltvEligibleLoan),
    affordabilityEligibleLoan: Math.round(affordabilityEligibleLoan),
    underwritingEligibleLoan: Math.round(underwritingEligibleLoan),
    fiorEligibleLoan: Math.round(fiorEligibleLoan),
    maxEligibleLoan: Math.round(maxEligibleLoan),
  };
}

// ─── Main Evaluate Function ───────────────────────────────────────────────────
export function evaluate(form) {
  const tenure_months = toNum(form.tenure_months);
  const cibil_score   = toNum(form.cibil_score);
  const loan_amount   = toNum(form.loan_amount);

  const monthly_income      = toNumOrZero(form.monthly_income);
  const monthly_obligations = toNumOrZero(form.monthly_obligations);
  const past_defaults       = toNumOrZero(form.past_defaults);
  const monthly_spends      = toNumOrZero(form.monthly_spends);
  const savings_balance     = toNumOrZero(form.savings_balance);
  const collateral_value    = toNumOrZero(form.collateral_value);
  const emiDefaultCount     = toNumOrZero(form.emiDefaultCount);
  const overdueEMICount     = toNumOrZero(form.overdueEMICount);
  const activeOverdueAmount = toNumOrZero(form.activeOverdueAmount);

  const product            = form.product || "Housing Loan";
  const isFestiveSeason    = form.isFestiveSeason || (form.season === "Festival");
  const applicantAge       = (form.applicantAge !== "" && form.applicantAge !== null && form.applicantAge !== undefined) ? Number(form.applicantAge) : null;
  const occupationType     = form.occupationType || "SALARIED";
  const customCostOfFunds  = form.customCostOfFunds ?? null;
  const customInterestRate = form.customInterestRate ?? null;
  const applicant_name     = form.applicant_name || "";

  if (isNaN(tenure_months) || isNaN(cibil_score) || isNaN(loan_amount)) {
    return {
      _error: true,
      _errorMessage: "Required fields (Tenure, CIBIL Score, Loan Amount) must be filled before evaluation.",
      decision: "INCOMPLETE",
      gates: {},
      scores: {},
      reasonCodes: [],
      riskReasons: [],
      amortization: [],
    };
  }

  const months = tenure_months > 0 ? tenure_months : 60;
  const isFestive = isFestiveSeason && product === "Auto Loan";
  const ltvCap = getLTVCap(product, isFestive);
  const costOfFunds = getCostOfFunds(product, customCostOfFunds);

  const effectiveExistingEMI = Math.max(0, monthly_obligations);
  const dti = monthly_income > 0 ? effectiveExistingEMI / monthly_income : 0;
  const spendToIncome = monthly_income > 0 ? monthly_spends / monthly_income : 0;
  const ltv = collateral_value > 0 ? (loan_amount / collateral_value) * 100 : 100;
  const surplus = monthly_income - effectiveExistingEMI - monthly_spends;

  const estimatedNewEMI = calcEMI(loan_amount, 0, months);
  const projectedResidualIncome = monthly_income - effectiveExistingEMI - monthly_spends - estimatedNewEMI;

  const creditRisk = {
    activeOverdueAmount,
    emiDefaultCount,
    overdueEMICount,
    hasCreditRisk: hasCreditRisk({ activeOverdueAmount, emiDefaultCount, overdueEMICount }),
    primaryReason:
      activeOverdueAmount > 0 ? "ACTIVE_OVERDUE_PRESENT"
      : emiDefaultCount > 0   ? "EMI_DEFAULT_PRESENT"
      : overdueEMICount > 0   ? "OVERDUE_EMI_COUNT"
      : null,
  };

  const ageAdjustment = applicantAge
    ? applyAgeBasedReduction(applicantAge, loan_amount)
    : { adjustedLoan: loan_amount, isAdjusted: false, reason: null };
  const isAgeAdjusted = ageAdjustment.isAdjusted;
  const adjustedLoanAmount = ageAdjustment.adjustedLoan;

  const ltvRangeValidation = validateLTVRange(ltv);

  const scores = {
    cibil:      scoreCIBIL(cibil_score),
    dti:        scoreDTI((effectiveExistingEMI + estimatedNewEMI) / (monthly_income || 1)),
    ltv:        scoreLTV(ltv, ltvCap),
    income:     scoreIncome(monthly_income),
    defaults:   scoreDefaults(past_defaults),
    spend:      scoreSpend(spendToIncome),
    liquidity:  scoreLiquidity(savings_balance, effectiveExistingEMI, monthly_spends),
  };
  const weightedScore = calcWeightedScore(scores);

  const rateBand = getRateBand(product, cibil_score);
  const rateResolution = resolveFinalRate(rateBand, weightedScore, isFestive ? "Festival" : "Normal", customInterestRate);
  const finalRate = rateResolution.rate;
  const interestRateValidation = rateResolution.validation;
  const stressRate = finalRate + 2;

  const emi = calcEMI(adjustedLoanAmount, finalRate, months);
  const stressEMI = calcEMI(adjustedLoanAmount, stressRate, months);
  const totalEMI = effectiveExistingEMI + emi;
  const totalObligations = totalEMI;
  const totalDTI = monthly_income > 0 ? totalObligations / monthly_income : 0;
  const fiorRatio = totalDTI;
  const residualIncome = surplus - emi;
  const projectedResidualIncomeActual = monthly_income - effectiveExistingEMI - monthly_spends - emi;

  const fiorSanction = evaluateFIORPolicy({
    fiorRatio,
    occupationType,
    requestedLoanAmount: adjustedLoanAmount,
    emi,
    finalRate,
    months,
  });

  const eligibility = calculateEligibilityCaps({
    requestedLoanAmount: loan_amount,
    collateralValue: collateral_value,
    ltvCap,
    surplus,
    finalRate,
    months,
    fiorSanction,
    adjustedLoanAmount,
  });
  const approvedLoanAmount = eligibility.maxEligibleLoan;
  const fiorAdjustmentReason = fiorSanction.reductionApplied ? fiorSanction.remarks : null;

  const derived = {
    dti,
    totalDTI,
    ltv,
    ltvCap,
    spendToIncome,
    surplus,
    currentSurplus: surplus,
    projectedResidualIncome: projectedResidualIncomeActual,
    emi,
    stressEMI,
    stressRate,
    residualIncome,
    creditRisk,
    isFestiveSeason: isFestive,
    isAgeAdjusted,
    ltvOutOfRange: !ltvRangeValidation.isInRange,
    fiorRatio,
  };

  const gates = runGates(form, derived);
  const decisionResult = evaluateFinalDecision(form, derived, gates);
  let decision = decisionResult.decision === "MANUAL_REVIEW" ? "MANUAL REVIEW" : decisionResult.decision;

  if (fiorSanction.status === "REJECTED") decision = "REJECT";
  else if (fiorSanction.status === "MANUAL_REVIEW" && decision !== "REJECT") decision = "MANUAL REVIEW";

  const reasonCodes = generateReasonCodes(form, derived, gates, decision);
  const riskReasons = buildRiskReasons(form, derived, gates);

  const finalEmi = approvedLoanAmount > 0 ? calcEMI(approvedLoanAmount, finalRate, months) : 0;
  const totalAmountPaid = finalEmi * months;
  const totalInterestPaid = totalAmountPaid - approvedLoanAmount;

  const nimPct = finalRate - costOfFunds;
  const nimAmount = (nimPct / 100 / 12) * approvedLoanAmount * months;
  const maxSafeLoanAmount = calcMaxSafeLoan(surplus, finalRate, months);
  const amortization = buildAmortization(approvedLoanAmount, finalRate, months, 12);

  return {
    applicant_name,
    product,
    isFestiveSeason: isFestive,
    occupationType,
    dti,
    totalDTI,
    spendToIncome,
    ltv,
    ltvCap,
    ltvOutOfRange: !ltvRangeValidation.isInRange,
    ltvRangeWarning: ltvRangeValidation.warning,
    surplus,
    currentSurplus: surplus,
    residualIncome,
    projectedResidualIncome: projectedResidualIncomeActual,
    existingEMI: effectiveExistingEMI,
    newEMI: emi,
    totalEMI,
    totalObligations,
    emi,
    stressEMI,
    stressRate,
    creditRisk,
    activeOverdueAmount,
    emiDefaultCount,
    overdueEMICount,
    applicantAge,
    isAgeAdjusted,
    adjustedLoanAmount,
    ageAdjustmentReason: ageAdjustment.reason,
    scores,
    weightedScore,
    rateBand,
    finalRate,
    selectedInterestRate: finalRate,
    interestRateValidation,
    costOfFunds,
    totalAmountPaid,
    totalInterestPaid,
    gates,
    decision,
    decisionReason: decisionResult.reason,
    reasonCodes,
    riskReasons,
    fiorRatio,
    fiorSanction,
    approvedLoanAmount,
    maxLoanProvided: eligibility.maxEligibleLoan,
    maxEligibleLoan: eligibility.maxEligibleLoan,
    ltvEligibleLoan: eligibility.ltvEligibleLoan,
    affordabilityEligibleLoan: eligibility.affordabilityEligibleLoan,
    underwritingEligibleLoan: eligibility.underwritingEligibleLoan,
    fiorEligibleLoan: eligibility.fiorEligibleLoan,
    requestedLoanAmount: eligibility.requestedLoanAmount,
    fiorAdjustmentReason,
    finalEmi,
    maxSafeLoanAmount,
    nimPct,
    nimAmount,
    amortization,
  };
}
