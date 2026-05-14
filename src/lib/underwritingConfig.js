/**
 * FederalCreditPro — Centralized Underwriting Configuration
 * All business rules, thresholds, and constants defined here
 * Ensures consistency across UI, calculations, and exports
 */

// ─── RATE BANDS BY PRODUCT ─────────────────────────────────────────────────
export const RATE_BANDS = {
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

// ─── LTV CAPS BY PRODUCT ──────────────────────────────────────────────────
export const LTV_CAPS = {
  "Housing Loan": 80,
  "Auto Loan": {
    normal: 85,
    festive: 95,
  },
  "Gold Loan": 75,
};

// ─── LTV RANGE VALIDATION (Actual LTV) ─────────────────────────────────────
export const LTV_RANGE_RULES = {
  min: 25,
  max: 45,
  // LTV between 25-45% is standard processing
};

// ─── COST OF FUNDS (configurable) ──────────────────────────────────────────
export const COST_OF_FUNDS_OPTIONS = {
  "Housing Loan": [5.5, 6.0],
  "Auto Loan": [7.0, 5.6],
  "Gold Loan": [6.0, 5.5],
};

export const DEFAULT_COST_OF_FUNDS = {
  "Housing Loan": 5.5,
  "Auto Loan": 7.0,
  "Gold Loan": 6.0,
};

// ─── STRESS TEST CONFIGURATION ─────────────────────────────────────────────
export const STRESS_CONFIG = {
  rateShock: 2.0, // +2% rate shock
  multiplier: 1.15, // Alternative: 15% EMI multiplier
  maxEMIRatioOfSurplus: 0.85, // Stress EMI must be <= 85% of surplus
};

// ─── AGE-BASED LOAN ADJUSTMENTS ───────────────────────────────────────────
export const AGE_ADJUSTMENT_RULES = {
  minAgeForReduction: 45,
  maxAgeForReduction: 60,
  reductionMultiplier: 0.9, // Reduce by 10%
};

// ─── FESTIVAL DISCOUNT ────────────────────────────────────────────────────
export const FESTIVAL_DISCOUNT = 0.25; // 0.25% rate reduction

// ─── SCORING WEIGHTS ──────────────────────────────────────────────────────
export const SCORE_WEIGHTS = {
  cibil: 0.25,
  dti: 0.20,
  ltv: 0.20,
  income: 0.10,
  defaults: 0.10,
  spend: 0.10,
  liquidity: 0.05,
};

// ─── GATE THRESHOLDS ──────────────────────────────────────────────────────
export const GATE_THRESHOLDS = {
  cibil: {
    pass: 700,
    manual: 650,
  },
  dti: {
    pass: 0.4,
    manual: 0.55,
  },
  spend: {
    pass: 0.5,
    manual: 0.7,
  },
  ltv: {
    capMultiplier: {
      pass: 1.0,
      manual: 1.05,
    },
  },
  emi: {
    passRatio: 0.5,
    manualRatio: 0.65,
  },
  stress: {
    passRatio: 0.85,
    manualRatio: 1.0,
  },
  residual: {
    passRatio: 0.15,
    manualRatio: 0.0,
  },
};

// ─── AFFORDABILITY RULES ──────────────────────────────────────────────────
export const AFFORDABILITY_RULES = {
  // New rule: projectedResidualIncome > 0
  // projectedResidualIncome = income - obligations - spends - newEMI
  minProjectedResidualIncome: 0, // Must be strictly > 0
};

// ─── CREDIT RISK ESCALATION ───────────────────────────────────────────────
export const CREDIT_RISK_RULES = {
  // If any of these is true, escalate to MANUAL_REVIEW
  escalateIfActiveOverdue: true,
  escalateIfEMIDefault: true,
  escalateIfOverdueCount: true,
};

// ─── REJECTION THRESHOLDS ─────────────────────────────────────────────────
export const REJECTION_RULES = {
  maxPastDefaults: 1, // 2 or more defaults = auto-reject
};

// ─── DECISION ENGINE PRIORITY ─────────────────────────────────────────────
export const DECISION_ENGINE_PRIORITY = [
  "hardReject", // Hard reject rules (e.g., affordability, credit risk)
  "manualReview", // Manual review triggers
  "approve", // Default to approval if all pass
];

// ─── DECISION REASON CODE TEMPLATES ───────────────────────────────────────
export const DECISION_REASON_CODE_TEMPLATES = {
  // Hard Reject Reasons
  AFFORDABILITY_FAILURE: {
    code: "RC_AFFORDABILITY_FAIL",
    severity: "HIGH",
    impact: "REJECT",
    label: "Insufficient Projected Residual Income",
    category: "affordability",
  },
  ACTIVE_OVERDUE_PRESENT: {
    code: "RC_ACTIVE_OVERDUE",
    severity: "CRITICAL",
    impact: "MANUAL_REVIEW",
    label: "Active Overdue Amount Detected",
    category: "credit_risk",
  },
  EMI_DEFAULT_PRESENT: {
    code: "RC_EMI_DEFAULT",
    severity: "HIGH",
    impact: "MANUAL_REVIEW",
    label: "EMI Default History",
    category: "credit_risk",
  },
  OVERDUE_EMI_COUNT: {
    code: "RC_OVERDUE_EMI",
    severity: "HIGH",
    impact: "MANUAL_REVIEW",
    label: "Multiple Overdue EMIs",
    category: "credit_risk",
  },

  // Manual Review Reasons
  LOW_CIBIL: {
    code: "RC_LOW_CIBIL",
    severity: "MEDIUM",
    impact: "MANUAL_REVIEW",
    label: "Low CIBIL Score",
    category: "credit_quality",
  },
  HIGH_DTI: {
    code: "RC_HIGH_DTI",
    severity: "MEDIUM",
    impact: "MANUAL_REVIEW",
    label: "High Debt-to-Income Ratio",
    category: "affordability",
  },
  LTV_BREACH: {
    code: "RC_LTV_BREACH",
    severity: "MEDIUM",
    impact: "MANUAL_REVIEW",
    label: "LTV Cap Breached",
    category: "collateral",
  },
  HIGH_SPEND: {
    code: "RC_HIGH_SPEND",
    severity: "MEDIUM",
    impact: "MANUAL_REVIEW",
    label: "High Spend-to-Income Ratio",
    category: "affordability",
  },
  EMI_AFFORDABILITY: {
    code: "RC_EMI_AFFORD",
    severity: "MEDIUM",
    impact: "MANUAL_REVIEW",
    label: "EMI Affordability Concern",
    category: "affordability",
  },
  STRESS_TEST_FAIL: {
    code: "RC_STRESS_FAIL",
    severity: "MEDIUM",
    impact: "MANUAL_REVIEW",
    label: "Fails Stress Test",
    category: "stress_testing",
  },
  RESIDUAL_INCOME_LOW: {
    code: "RC_RESIDUAL_LOW",
    severity: "MEDIUM",
    impact: "MANUAL_REVIEW",
    label: "Low Residual Income",
    category: "affordability",
  },
  PAST_DEFAULTS: {
    code: "RC_PAST_DEFAULTS",
    severity: "HIGH",
    impact: "MANUAL_REVIEW",
    label: "Past Default History",
    category: "credit_quality",
  },
  AGE_BASED_REDUCTION: {
    code: "RC_AGE_REDUCTION",
    severity: "LOW",
    impact: "INFO",
    label: "Age-Based Loan Reduction Applied",
    category: "policy",
  },
  LTV_OUT_OF_RANGE: {
    code: "RC_LTV_RANGE",
    severity: "LOW",
    impact: "INFO",
    label: "Actual LTV Outside Standard Range",
    category: "policy",
  },
  FESTIVE_LTV_APPLIED: {
    code: "RC_FESTIVE_LTV",
    severity: "LOW",
    impact: "INFO",
    label: "Festive Season LTV Applied",
    category: "policy",
  },
};

// ─── OCCUPATION TYPES ─────────────────────────────────────────────────────
export const OCCUPATION_TYPES = {
  SALARIED: "SALARIED",
  SELF_EMPLOYED: "SELF_EMPLOYED",
};

// ─── OCCUPATION_TYPE_OPTIONS ──────────────────────────────────────────────
export const OCCUPATION_TYPE_OPTIONS = [
  { value: "SALARIED", label: "Salaried" },
  { value: "SELF_EMPLOYED", label: "Self-Employed" },
];

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────────

/**
 * Get LTV cap for a product considering festive season
 * @param {string} product - Product type (e.g., "Auto Loan")
 * @param {boolean} isFestiveSeason - Is festive season active?
 * @returns {number} LTV cap percentage
 */
export function getLTVCap(product, isFestiveSeason = false) {
  const cap = LTV_CAPS[product] || LTV_CAPS["Housing Loan"];
  
  if (typeof cap === "object" && cap.normal !== undefined) {
    return isFestiveSeason ? cap.festive : cap.normal;
  }
  
  return cap;
}

/**
 * Get default cost of funds for a product
 * @param {string} product - Product type
 * @param {number|null} customCoF - Optional custom CoF
 * @returns {number} Cost of funds percentage
 */
export function getCostOfFunds(product, customCoF = null) {
  if (customCoF !== null) return customCoF;
  return DEFAULT_COST_OF_FUNDS[product] || DEFAULT_COST_OF_FUNDS["Housing Loan"];
}

/**
 * Apply age-based loan reduction if applicable
 * @param {number} age - Applicant age
 * @param {number} eligibleLoan - Original eligible loan amount
 * @returns {object} { adjustedLoan, isAdjusted, reason }
 */
export function applyAgeBasedReduction(age, eligibleLoan) {
  const { minAgeForReduction, maxAgeForReduction, reductionMultiplier } = AGE_ADJUSTMENT_RULES;
  
  if (age >= minAgeForReduction && age <= maxAgeForReduction) {
    return {
      adjustedLoan: Math.round(eligibleLoan * reductionMultiplier),
      isAdjusted: true,
      reason: `Age ${age} years: Loan reduced by ${(1 - reductionMultiplier) * 100}%`,
    };
  }
  
  return {
    adjustedLoan: eligibleLoan,
    isAdjusted: false,
    reason: null,
  };
}

/**
 * Validate actual LTV is within standard range
 * @param {number} ltv - Actual LTV percentage
 * @returns {object} { isInRange, warning }
 */
export function validateLTVRange(ltv) {
  const { min, max } = LTV_RANGE_RULES;
  
  if (ltv < min || ltv > max) {
    return {
      isInRange: false,
      warning: `Actual LTV ${ltv.toFixed(1)}% is outside standard range (${min}%-${max}%)`,
    };
  }
  
  return { isInRange: true, warning: null };
}

/**
 * Check if customer has credit risk
 * @param {object} creditData - { activeOverdueAmount, emiDefaultCount, overdueEMICount }
 * @returns {boolean}
 */
export function hasCreditRisk(creditData) {
  const { activeOverdueAmount = 0, emiDefaultCount = 0, overdueEMICount = 0 } = creditData || {};
  return activeOverdueAmount > 0 || emiDefaultCount > 0 || overdueEMICount > 0;
}

/**
 * Get decision reason code template
 * @param {string} codeKey - Key from DECISION_REASON_CODE_TEMPLATES
 * @returns {object|null} Reason code template or null
 */
export function getReasonCodeTemplate(codeKey) {
  return DECISION_REASON_CODE_TEMPLATES[codeKey] || null;
}

export default {
  RATE_BANDS,
  LTV_CAPS,
  LTV_RANGE_RULES,
  COST_OF_FUNDS_OPTIONS,
  DEFAULT_COST_OF_FUNDS,
  STRESS_CONFIG,
  AGE_ADJUSTMENT_RULES,
  FESTIVAL_DISCOUNT,
  SCORE_WEIGHTS,
  GATE_THRESHOLDS,
  AFFORDABILITY_RULES,
  CREDIT_RISK_RULES,
  REJECTION_RULES,
  DECISION_ENGINE_PRIORITY,
  DECISION_REASON_CODE_TEMPLATES,
  OCCUPATION_TYPES,
  OCCUPATION_TYPE_OPTIONS,
  getLTVCap,
  getCostOfFunds,
  applyAgeBasedReduction,
  validateLTVRange,
  hasCreditRisk,
  getReasonCodeTemplate,
};
