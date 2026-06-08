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

// Rest of the scoring parameters unchanged
function scoreDTI(dti) {
  if (dti <= 0) return 100;
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

// Structural fallback flags
function scoreDefaults(defaults) {
  if (defaults === 0) return
