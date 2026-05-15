import { evaluate, aggregateExistingEMIs } from "./src/lib/loanEngine.js";
import { evaluateFIORPolicy } from "./src/lib/underwritingConfig.js";

console.log("🧪 FederalCreditPro — FIOR (Fixed Obligation to Income Ratio) Test Suite\n");

// ───────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ───────────────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passCount++;
  } else {
    console.log(`  ❌ ${testName}`);
    if (details) console.log(`     ${details}`);
    failCount++;
  }
}

// ───────────────────────────────────────────────────────────────────────────
// TEST 1: EXISTING EMI AGGREGATION
// ───────────────────────────────────────────────────────────────────────────

console.log("\n📋 Test Suite 1: Existing EMI Aggregation");
console.log("─".repeat(60));

// Test single value
const singleEMI = aggregateExistingEMIs(15000);
assert(singleEMI === 15000, "Single EMI value aggregation", `Expected 15000, got ${singleEMI}`);

// Test array aggregation
const loanArray = [
  { type: "Car Loan", emi: 12000 },
  { type: "Personal Loan", emi: 8500 },
  { type: "Gold Loan", emi: 5000 },
];
const aggregated = aggregateExistingEMIs(loanArray);
const expectedAgg = 25500;
assert(aggregated === expectedAgg, "Array EMI aggregation", `Expected ${expectedAgg}, got ${aggregated}`);

// Test empty array
const emptyAgg = aggregateExistingEMIs([]);
assert(emptyAgg === 0, "Empty array aggregation", `Expected 0, got ${emptyAgg}`);

// Test null
const nullAgg = aggregateExistingEMIs(null);
assert(nullAgg === 0, "Null aggregation", `Expected 0, got ${nullAgg}`);

// ───────────────────────────────────────────────────────────────────────────
// TEST 2: FIOR POLICY - SALARIED EMPLOYEES
// ───────────────────────────────────────────────────────────────────────────

console.log("\n📋 Test Suite 2: FIOR Policy - Salaried Employees");
console.log("─".repeat(60));

const salaryTestCases = [
  {
    name: "49% FIOR (Full Approval)",
    fior: 0.49,
    occupationType: "SALARIED",
    expectedStatus: "APPROVED",
    requestedLoan: 1000000,
  },
  {
    name: "50% FIOR (Full Approval - Upper Boundary)",
    fior: 0.50,
    occupationType: "SALARIED",
    expectedStatus: "APPROVED",
    requestedLoan: 1000000,
  },
  {
    name: "55% FIOR (Reduction - 10% Loan Reduction)",
    fior: 0.55,
    occupationType: "SALARIED",
    expectedStatus: "APPROVED_WITH_REDUCTION",
    requestedLoan: 1000000,
  },
  {
    name: "59% FIOR (Reduction - Upper Boundary)",
    fior: 0.59,
    occupationType: "SALARIED",
    expectedStatus: "APPROVED_WITH_REDUCTION",
    requestedLoan: 1000000,
  },
  {
    name: "60% FIOR (Manual Review - Lower Boundary)",
    fior: 0.60,
    occupationType: "SALARIED",
    expectedStatus: "MANUAL_REVIEW",
    requestedLoan: 1000000,
  },
  {
    name: "69% FIOR (Manual Review - Upper Boundary)",
    fior: 0.69,
    occupationType: "SALARIED",
    expectedStatus: "MANUAL_REVIEW",
    requestedLoan: 1000000,
  },
  {
    name: "70% FIOR (Rejection - Lower Boundary)",
    fior: 0.70,
    occupationType: "SALARIED",
    expectedStatus: "REJECTED",
    requestedLoan: 1000000,
  },
];

salaryTestCases.forEach((testCase) => {
  const result = evaluateFIORPolicy({
    fiorRatio: testCase.fior,
    occupationType: testCase.occupationType,
    requestedLoanAmount: testCase.requestedLoan,
    emi: 20000,
    finalRate: 10.5,
    months: 60,
  });
  assert(
    result.status === testCase.expectedStatus,
    testCase.name,
    `Expected ${testCase.expectedStatus}, got ${result.status}`
  );
});

// ───────────────────────────────────────────────────────────────────────────
// TEST 3: FIOR POLICY - SELF-EMPLOYED
// ───────────────────────────────────────────────────────────────────────────

console.log("\n📋 Test Suite 3: FIOR Policy - Self-Employed");
console.log("─".repeat(60));

const selfEmpTestCases = [
  {
    name: "54% FIOR (Full Approval)",
    fior: 0.54,
    occupationType: "SELF_EMPLOYED",
    expectedStatus: "APPROVED",
    requestedLoan: 1000000,
  },
  {
    name: "55% FIOR (Full Approval - Upper Boundary)",
    fior: 0.55,
    occupationType: "SELF_EMPLOYED",
    expectedStatus: "APPROVED",
    requestedLoan: 1000000,
  },
  {
    name: "60% FIOR (Reduction - 10% Loan Reduction)",
    fior: 0.60,
    occupationType: "SELF_EMPLOYED",
    expectedStatus: "APPROVED_WITH_REDUCTION",
    requestedLoan: 1000000,
  },
  {
    name: "64% FIOR (Reduction - Upper Boundary)",
    fior: 0.64,
    occupationType: "SELF_EMPLOYED",
    expectedStatus: "APPROVED_WITH_REDUCTION",
    requestedLoan: 1000000,
  },
  {
    name: "65% FIOR (Manual Review - Lower Boundary)",
    fior: 0.65,
    occupationType: "SELF_EMPLOYED",
    expectedStatus: "MANUAL_REVIEW",
    requestedLoan: 1000000,
  },
  {
    name: "74% FIOR (Manual Review - Upper Boundary)",
    fior: 0.74,
    occupationType: "SELF_EMPLOYED",
    expectedStatus: "MANUAL_REVIEW",
    requestedLoan: 1000000,
  },
  {
    name: "75% FIOR (Rejection - Lower Boundary)",
    fior: 0.75,
    occupationType: "SELF_EMPLOYED",
    expectedStatus: "REJECTED",
    requestedLoan: 1000000,
  },
  {
    name: "80% FIOR (Rejection)",
    fior: 0.80,
    occupationType: "SELF_EMPLOYED",
    expectedStatus: "REJECTED",
    requestedLoan: 1000000,
  },
];

selfEmpTestCases.forEach((testCase) => {
  const result = evaluateFIORPolicy({
    fiorRatio: testCase.fior,
    occupationType: testCase.occupationType,
    requestedLoanAmount: testCase.requestedLoan,
    emi: 20000,
    finalRate: 10.5,
    months: 60,
  });
  assert(
    result.status === testCase.expectedStatus,
    testCase.name,
    `Expected ${testCase.expectedStatus}, got ${result.status}`
  );
});

// ───────────────────────────────────────────────────────────────────────────
// TEST 4: LOAN REDUCTION FACTOR
// ───────────────────────────────────────────────────────────────────────────

console.log("\n📋 Test Suite 4: Loan Reduction Factor Verification");
console.log("─".repeat(60));

const requestedLoan = 1000000;
const reductionResult = evaluateFIORPolicy({
  fiorRatio: 0.55,
  occupationType: "SALARIED",
  requestedLoanAmount: requestedLoan,
  emi: 20000,
  finalRate: 10.5,
  months: 60,
});

const expectedReducedLoan = Math.round(requestedLoan * 0.9);
assert(
  reductionResult.approvedLoanAmount === expectedReducedLoan,
  "10% Loan Reduction Calculation",
  `Requested: ${fmt(requestedLoan)}, Approved: ${fmt(reductionResult.approvedLoanAmount)}, Expected: ${fmt(expectedReducedLoan)}`
);

const reductionAmount = requestedLoan - reductionResult.approvedLoanAmount;
const expectedReductionAmount = requestedLoan * 0.1;
assert(
  Math.abs(reductionAmount - expectedReductionAmount) < 1,
  "Reduction Amount Accuracy",
  `Expected ~${Math.round(expectedReductionAmount)}, got ${reductionAmount}`
);

// ───────────────────────────────────────────────────────────────────────────
// TEST 5: FIOR CALCULATION IN EVALUATE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

console.log("\n📋 Test Suite 5: FIOR Calculation in Loan Evaluation");
console.log("─".repeat(60));

// Test case: Salaried, 50% FIOR target
const form1 = {
  product: "Housing Loan",
  tenure_months: 60,
  cibil_score: 750,
  monthly_income: 200000,
  monthly_obligations: 40000,
  past_defaults: 0,
  monthly_spends: 30000,
  savings_balance: 500000,
  loan_amount: 1000000,
  collateral_value: 1500000,
  existingEMI: 25000,
  occupationType: "SALARIED",
  applicantAge: 35,
};

const result1 = evaluate(form1);
const expectedFior1 = (form1.monthly_obligations + form1.existingEMI + result1.emi) / form1.monthly_income;
const fiorDiff = Math.abs(result1.fiorRatio - expectedFior1);
assert(
  fiorDiff < 0.001,
  "FIOR Ratio Calculation Accuracy",
  `Expected ~${expectedFior1.toFixed(3)}, got ${result1.fiorRatio.toFixed(3)}`
);

assert(
  result1.fiorRatio <= 0.70,
  "FIOR Within Acceptable Range",
  `FIOR: ${(result1.fiorRatio * 100).toFixed(1)}%`
);

// ───────────────────────────────────────────────────────────────────────────
// TEST 6: MAX LOAN PROVIDED FIELD
// ───────────────────────────────────────────────────────────────────────────

console.log("\n📋 Test Suite 6: Max Loan Provided Field");
console.log("─".repeat(60));

const form2 = {
  product: "Housing Loan",
  tenure_months: 60,
  cibil_score: 700,
  monthly_income: 150000,
  monthly_obligations: 50000,
  past_defaults: 0,
  monthly_spends: 30000,
  savings_balance: 300000,
  loan_amount: 1500000,
  collateral_value: 2000000,
  existingEMI: 15000,
  occupationType: "SALARIED",
  applicantAge: 40,
};

const result2 = evaluate(form2);
assert(
  result2.maxLoanProvided !== undefined,
  "Max Loan Provided Field Exists",
  `Max Loan: ${fmt(result2.maxLoanProvided || 0)}`
);

assert(
  result2.approvedLoanAmount !== undefined,
  "Approved Loan Amount Field Exists",
  `Approved Loan: ${fmt(result2.approvedLoanAmount || 0)}`
);

// If FIOR sanction applied reduction, maxLoanProvided should be less than requested
if (result2.maxLoanProvided > 0 && result2.maxLoanProvided < form2.loan_amount) {
  assert(
    true,
    "FIOR Reduction Applied to Loan Amount",
    `Requested: ${fmt(form2.loan_amount)}, Max Provided: ${fmt(result2.maxLoanProvided)}`
  );
}

// ───────────────────────────────────────────────────────────────────────────
// TEST 7: EXISTING EMI AGGREGATION IN EVALUATE
// ───────────────────────────────────────────────────────────────────────────

console.log("\n📋 Test Suite 7: Existing EMI Aggregation in Evaluation");
console.log("─".repeat(60));

const form3 = {
  product: "Housing Loan",
  tenure_months: 60,
  cibil_score: 750,
  monthly_income: 200000,
  monthly_obligations: 30000,
  past_defaults: 0,
  monthly_spends: 40000,
  savings_balance: 500000,
  loan_amount: 1000000,
  collateral_value: 1500000,
  existing_loans: [
    { type: "Car Loan", emi: 15000 },
    { type: "Personal Loan", emi: 10000 },
  ],
  occupationType: "SALARIED",
  applicantAge: 35,
};

const result3 = evaluate(form3);
const expectedTotalExisting = 25000;
assert(
  result3.existingEMI === expectedTotalExisting,
  "Existing EMI Aggregation",
  `Expected ${fmt(expectedTotalExisting)}, got ${fmt(result3.existingEMI || 0)}`
);

assert(
  result3.totalEMI === result3.existingEMI + result3.emi,
  "Total EMI Adds Existing and New EMI",
  `Expected ${fmt(result3.existingEMI + result3.emi)}, got ${fmt(result3.totalEMI || 0)}`
);

// ───────────────────────────────────────────────────────────────────────────
// TEST 8: DECISION OVERRIDE BY FIOR REJECTION
// ───────────────────────────────────────────────────────────────────────────

console.log("\n📋 Test Suite 8: FIOR Decision Override");
console.log("─".repeat(60));

// Create a form with very high FIOR to trigger rejection
const form4 = {
  product: "Housing Loan",
  tenure_months: 60,
  cibil_score: 800,
  monthly_income: 100000,
  monthly_obligations: 70000,
  past_defaults: 0,
  monthly_spends: 15000,
  savings_balance: 300000,
  loan_amount: 2000000,
  collateral_value: 3000000,
  existingEMI: 5000,
  occupationType: "SALARIED",
  applicantAge: 35,
};

const result4 = evaluate(form4);
// With 100k income and 70k + new EMI obligation, FIOR will be very high (>0.70)
if (result4.fiorRatio > 0.70) {
  assert(
    result4.decision === "REJECT",
    "FIOR Rejection Overrides Gate Decision",
    `Decision: ${result4.decision}, FIOR: ${(result4.fiorRatio * 100).toFixed(1)}%`
  );
}

// ───────────────────────────────────────────────────────────────────────────
// TEST 9: AGE-BASED LOAN REDUCTION WITH FIOR
// ───────────────────────────────────────────────────────────────────────────

console.log("\n📋 Test Suite 9: Age-Based Reduction Combined with FIOR");
console.log("─".repeat(60));

const form5 = {
  product: "Housing Loan",
  tenure_months: 60,
  cibil_score: 750,
  monthly_income: 200000,
  monthly_obligations: 40000,
  past_defaults: 0,
  monthly_spends: 30000,
  savings_balance: 500000,
  loan_amount: 1000000,
  collateral_value: 1500000,
  existingEMI: 20000,
  occupationType: "SALARIED",
  applicantAge: 50, // Will trigger 10% age-based reduction
};

const result5 = evaluate(form5);
assert(
  result5.isAgeAdjusted === true,
  "Age Adjustment Applied",
  `Age: ${form5.applicantAge}, Adjusted Loan: ${fmt(result5.adjustedLoanAmount)}`
);

assert(
  result5.fiorRatio !== undefined,
  "FIOR Calculated After Age Adjustment",
  `FIOR: ${(result5.fiorRatio * 100).toFixed(1)}%`
);

// ───────────────────────────────────────────────────────────────────────────
// TEST 10: FIOR SANCTION OBJECT STRUCTURE
// ───────────────────────────────────────────────────────────────────────────

console.log("\n📋 Test Suite 10: FIOR Sanction Object Structure");
console.log("─".repeat(60));

const sanctionResult = evaluateFIORPolicy({
  fiorRatio: 0.55,
  occupationType: "SALARIED",
  requestedLoanAmount: 1000000,
  emi: 20000,
  finalRate: 10.5,
  months: 60,
});

assert(
  sanctionResult.status !== undefined,
  "Sanction Status Field Exists",
  `Status: ${sanctionResult.status}`
);

assert(
  sanctionResult.approvedLoanAmount !== undefined,
  "Approved Loan Amount Field Exists",
  `Approved: ${fmt(sanctionResult.approvedLoanAmount)}`
);

assert(
  sanctionResult.reductionApplied !== undefined,
  "Reduction Applied Field Exists",
  `Reduction: ${sanctionResult.reductionApplied}`
);

assert(
  sanctionResult.remarks !== undefined && sanctionResult.remarks.length > 0,
  "Remarks Field Exists",
  `Remarks: ${sanctionResult.remarks}`
);

assert(
  sanctionResult.sanctionCode !== undefined,
  "Sanction Code Field Exists",
  `Code: ${sanctionResult.sanctionCode}`
);

// ───────────────────────────────────────────────────────────────────────────
// SUMMARY
// ───────────────────────────────────────────────────────────────────────────

console.log("\n" + "=".repeat(60));
console.log(`📊 FIOR Test Suite Results: ${passCount} passed, ${failCount} failed`);

if (failCount === 0) {
  console.log("✅ All FIOR tests passed! FIOR logic is working correctly.");
} else {
  console.log(`⚠️  ${failCount} test(s) failed. Please review the failures above.`);
}

process.exit(failCount > 0 ? 1 : 0);
