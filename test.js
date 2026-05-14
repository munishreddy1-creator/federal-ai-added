#!/usr/bin/env node

/**
 * FederalCreditPro — Comprehensive Test Suite
 * Validates loan underwriting engine across multiple scenarios
 */

import { evaluate } from './src/lib/loanEngine.js';

console.log('🧪 FederalCreditPro Test Suite\n');

// ─── Test Cases ────────────────────────────────────────────────────────────────
const testCases = [
  {
    name: 'Sample Case (Housing Loan, 700 CIBIL)',
    form: {
      product: 'Housing Loan',
      season: 'Normal',
      tenure_months: 120,
      cibil_score: 700,
      monthly_income: 1000000,
      monthly_obligations: 45000,
      past_defaults: 0,
      monthly_spends: 60000,
      savings_balance: 200000,
      loan_amount: 10000000,
      collateral_value: 20000000,
      applicant_name: 'Test Applicant',
    },
    expected: {
      weightedScore: 97.5,
      finalRate: 9.75,
      emi: 130779,
      surplus: 895000,
      ltv: 50.0,
      nimPct: 4.25,
      decision: 'APPROVE',
      riskReasons: 0,
      gates: { cibil: 'PASS', spend: 'PASS', dti: 'PASS', ltv: 'PASS', emi: 'PASS', stress: 'PASS', residual: 'PASS' },
    },
  },
  {
    name: 'Perfect Credit (Housing Loan, 800 CIBIL)',
    form: {
      product: 'Housing Loan',
      season: 'Normal',
      tenure_months: 60,
      cibil_score: 800,
      monthly_income: 200000,
      monthly_obligations: 20000,
      past_defaults: 0,
      monthly_spends: 30000,
      savings_balance: 500000,
      loan_amount: 1000000,
      collateral_value: 1500000,
    },
    expected: {
      weightedScore: 94,
      finalRate: 8.77,
      decision: 'APPROVE',
      riskReasons: 0,
    },
  },
  {
    name: 'High Risk (Housing Loan, 650 CIBIL)',
    form: {
      product: 'Housing Loan',
      season: 'Normal',
      tenure_months: 120,
      cibil_score: 650,
      monthly_income: 50000,
      monthly_obligations: 15000,
      past_defaults: 1,
      monthly_spends: 25000,
      savings_balance: 10000,
      loan_amount: 300000,
      collateral_value: 400000,
    },
    expected: {
      weightedScore: 72.75,
      finalRate: 11.6,
      decision: 'MANUAL REVIEW',
      riskReasons: 2,
    },
  },
  {
    name: 'Auto Loan (Festival Season)',
    form: {
      product: 'Auto Loan',
      season: 'Festival',
      tenure_months: 60,
      cibil_score: 750,
      monthly_income: 80000,
      monthly_obligations: 20000,
      past_defaults: 0,
      monthly_spends: 25000,
      savings_balance: 100000,
      loan_amount: 500000,
      collateral_value: 600000,
    },
    expected: {
      finalRate: 9.33,
      decision: 'APPROVE',
      riskReasons: 0,
    },
  },
  {
    name: 'Gold Loan (High LTV)',
    form: {
      product: 'Gold Loan',
      season: 'Normal',
      tenure_months: 36,
      cibil_score: 720,
      monthly_income: 60000,
      monthly_obligations: 10000,
      past_defaults: 0,
      monthly_spends: 20000,
      savings_balance: 50000,
      loan_amount: 300000,
      collateral_value: 400000, // LTV = 75%
    },
    expected: {
      ltv: 75.0,
      decision: 'APPROVE',
      riskReasons: 0,
    },
  },
  {
    name: 'Reject Case (Low CIBIL + High DTI)',
    form: {
      product: 'Housing Loan',
      season: 'Normal',
      tenure_months: 120,
      cibil_score: 600,
      monthly_income: 50000,
      monthly_obligations: 30000, // DTI = 60%
      past_defaults: 0,
      monthly_spends: 10000,
      savings_balance: 20000,
      loan_amount: 200000,
      collateral_value: 300000,
    },
    expected: {
      decision: 'REJECT',
      riskReasons: 2,
    },
  },
  {
    name: 'Edge Case (Zero Income)',
    form: {
      product: 'Housing Loan',
      season: 'Normal',
      tenure_months: 60,
      cibil_score: 700,
      monthly_income: 0,
      monthly_obligations: 0,
      past_defaults: 0,
      monthly_spends: 0,
      savings_balance: 100000,
      loan_amount: 100000,
      collateral_value: 200000,
    },
    expected: {
      dti: 0,
      spendToIncome: 0,
      surplus: 0,
      decision: 'REJECT',
      decisionReason: 'AFFORDABILITY_FAILURE',
    },
  },
];

// ─── Test Runner ───────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(actual, expected, tolerance = 0.01) {
  if (typeof expected === 'number' && typeof actual === 'number') {
    return Math.abs(actual - expected) <= tolerance;
  }
  if (Array.isArray(actual) && typeof expected === 'number') {
    return actual.length === expected;
  }
  if (typeof expected === 'object' && typeof actual === 'object') {
    return JSON.stringify(actual) === JSON.stringify(expected);
  }
  return actual === expected;
}

function runTest(testCase) {
  console.log(`\n📋 ${testCase.name}`);
  console.log('─'.repeat(50));

  try {
    const result = evaluate(testCase.form);

    let testPassed = true;
    const failures = [];

    for (const [key, expectedValue] of Object.entries(testCase.expected)) {
      const actualValue = result[key];
      if (!assert(actualValue, expectedValue)) {
        testPassed = false;
        failures.push(`${key}: expected ${expectedValue}, got ${actualValue}`);
      }
    }

    if (testPassed) {
      console.log('✅ PASSED');
      passed++;
    } else {
      console.log('❌ FAILED');
      failures.forEach(f => console.log(`   ${f}`));
      failed++;
    }

    // Show key metrics for each test
    console.log(`   Score: ${result.weightedScore?.toFixed(1)}/100`);
    console.log(`   Rate: ${result.finalRate?.toFixed(2)}%`);
    console.log(`   EMI: ₹${Math.round(result.emi).toLocaleString('en-IN')}`);
    console.log(`   Decision: ${result.decision}`);
    console.log(`   Risk Reasons: ${result.riskReasons.length}`);

  } catch (error) {
    console.log('❌ ERROR:', error.message);
    failed++;
  }
}

// ─── Run All Tests ─────────────────────────────────────────────────────────────
testCases.forEach(runTest);

console.log('\n' + '='.repeat(50));
console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 All tests passed! App is deployment ready.');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review and fix issues.');
  process.exit(1);
}
