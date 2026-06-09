// components/loan/LoanProposalPrintLayout.jsx
import React from 'react';

// Shared structural configuration maps your gate objects cleanly to matching status indicators
const gateLabelsMap = {
  cibil: "CIBIL Gate (Score ≥ 650)",
  spend: "Spend-to-Income Gate",
  dti: "Total DTI Gate (≤ 60%)",
  ltv: "LTV Cap Gate (≤ 85%)",
  emi: "EMI Affordability Gate",
  stress: "Stress Test Gate (Rate +2%)",
  residual: "Residual Income Gate",
};

export default function LoanProposalPrintLayout({ form, result }) {
  if (!form || !result) return null;

  // Clean inline financial formatting string helpers
  const cur = (val) => val != null ? `₹${Math.round(val).toLocaleString("en-IN")}` : "—";
  const pct = (val) => val != null ? `${(val).toFixed(2)}%` : "—";

  return (
    <div className="hidden print:block p-12 bg-white text-black font-sans text-[11px] leading-relaxed max-w-[800px] mx-auto">
      
      {/* HEADER SECTION */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-wide uppercase">LOAN PROPOSAL</h1>
        <p className="text-xs font-medium text-slate-700 mt-0.5">Bank Credit Assessment & Underwriting Report</p>
        <p className="text-[9px] text-slate-400 tracking-widest mt-1.5 uppercase font-semibold">CONFIDENTIAL - FOR AUTHORIZED USE ONLY</p>
      </div>

      {/* METADATA SUMMARY TABLE */}
      <table className="w-full border border-slate-300 mb-6">
        <tbody>
          <tr className="border-b border-slate-300">
            <td className="p-2 font-bold bg-slate-50 w-1/4">Proposal Number</td>
            <td className="p-2 w-1/4 font-mono">LN-2026-{(form.savings_balance || 5847).toString().slice(-4)}</td>
            <td className="p-2 font-bold bg-slate-50 w-1/4">Proposal Date</td>
            <td className="p-2 w-1/4">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td>
          </tr>
          <tr className="border-b border-slate-300">
            <td className="p-2 font-bold bg-slate-50">Loan Product</td>
            <td className="p-2">{form.product}</td>
            <td className="p-2 font-bold bg-slate-50">Underwriter</td>
            <td className="p-2">Credit Analysis Department</td>
          </tr>
        </tbody>
      </table>

      {/* 1. EXECUTIVE SUMMARY */}
      <div className="mb-6">
        <h2 className="text-xs font-bold text-slate-950 bg-slate-100 p-1 mb-2 uppercase tracking-wider border-l-2 border-slate-900 pl-2">1. Executive Summary</h2>
        <p className="mb-3 text-slate-800">
          This document presents a comprehensive credit assessment and underwriting recommendation for the loan application evaluated for <strong>{form.applicant_name || "Applicant"}</strong> through our automated core retail underwriting framework.
        </p>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="font-bold text-slate-900">Final Recommendation Status:</span>
          <span className={`px-3 py-0.5 rounded text-[10px] font-black tracking-widest ${
            result.decision === "APPROVE" ? "bg-green-100 text-green-800 border border-green-300" : "bg-red-100 text-red-800 border border-red-300"
          }`}>
            {result.decision === "APPROVE" ? "APPROVED" : "REJECTED"}
          </span>
        </div>

        <table className="w-full border border-slate-300 mb-4">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-300 font-bold text-slate-900">
              <td className="p-2 w-1/2">Metric Parameter</td>
              <td className="p-2 w-1/2">Sanctioned Assessment Value</td>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-300">
              <td className="p-2">Recommended Max Loan Allocation</td>
              <td className="p-2 font-bold text-slate-900">{cur(result.maxLoanProvided)}</td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="p-2">Requested Funding Capital</td>
              <td className="p-2">{cur(form.loan_amount)}</td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="p-2">Approved Loan Tenure</td>
              <td className="p-2">{form.tenure_months} months</td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="p-2">Interest Rate (Sanctioned Pricing Index)</td>
              <td className="p-2 font-bold text-slate-900">{pct(result.finalRate)}</td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="p-2">Calculated Monthly Instalment (EMI)</td>
              <td className="p-2 font-bold text-slate-900">{cur(result.emi)}</td>
            </tr>
            <tr>
              <td className="p-2 font-semibold bg-slate-50">Aggregate Outflow Maturity Value (Total Payable)</td>
              <td className="p-2 font-bold text-slate-900 bg-slate-50">{cur(result.totalAmountPaid)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 2. LOAN DETAILS & REPAYMENT EXPOSURE */}
      <div className="mb-6">
        <h2 className="text-xs font-bold text-slate-950 bg-slate-100 p-1 mb-2 uppercase tracking-wider border-l-2 border-slate-900 pl-2">2. Loan Structure & Pricing Spread</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <table className="w-full border border-slate-300">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="p-2 bg-slate-50 font-medium">Net Pledged Asset Margin</td>
                  <td className="p-2">{cur(form.collateral_value)}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-2 bg-slate-50 font-medium">LTV Eligible Ceiling</td>
                  <td className="p-2">{cur(result.ltvEligibleLoan)}</td>
                </tr>
                <tr className="font-bold border-t border-slate-400">
                  <td className="p-2 bg-slate-100">Affordability Allocation Cap</td>
                  <td className="p-2 bg-slate-100">{cur(result.affordabilityEligibleLoan)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <table className="w-full border border-slate-300">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="p-2 bg-slate-50 font-medium">Aggregate Interest Yield</td>
                  <td className="p-2 text-red-700 font-medium">{cur(result.totalInterestPaid)}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-2 bg-slate-50 font-medium">Model Derived Base Spread (NIM)</td>
                  <td className="p-2 text-green-700 font-bold">{pct(result.nimPct)}</td>
                </tr>
                <tr className="font-bold border-t border-slate-400">
                  <td className="p-2 bg-slate-100">Assigned Pricing Band Max Limit</td>
                  <td className="p-2 bg-slate-100">{result.rateBand?.max || 0}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. CREDIT PROFILE ANALYSIS */}
      <div className="mb-6">
        <h2 className="text-xs font-bold text-slate-950 bg-slate-100 p-1 mb-2 uppercase tracking-wider border-l-2 border-slate-900 pl-2">3. Bureau Profile & Credit Risk Grade</h2>
        <table className="w-full border border-slate-300 mb-2">
          <tbody>
            <tr className="border-b border-slate-300">
              <td className="p-2 font-bold bg-slate-50 w-1/4">Bureau Raw Score Index</td>
              <td className="p-2 w-1/4 font-bold text-slate-900">{form.cibil_score} / 900</td>
              <td className="p-2 font-bold bg-slate-50 w-1/4">Weighted Scoring Factor</td>
              <td className="p-2 w-1/4 font-bold text-blue-800">{pct(result.weightedScore)}</td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="p-2 font-bold bg-slate-50">Historical Delinquency Vol</td>
              <td className="p-2 font-semibold text-amber-800">{form.past_defaults || 0} Incident(s)</td>
              <td className="p-2 font-bold bg-slate-50">Active Overdue Liability Exposure</td>
              <td className="p-2 font-medium text-red-700">{cur(form.activeOverdueAmount || 0)}</td>
            </tr>
            <tr>
              <td className="p-2 font-bold bg-slate-50">Unpaid Cycle Counter (EMI Defaults)</td>
              <td className="p-2">{form.emiDefaultCount || 0} instance(s)</td>
              <td className="p-2 font-bold bg-slate-50">Current Unresolved Overdue Count</td>
              <td className="p-2">{form.overdueEMICount || 0}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. FINANCIAL CAPACITY & RATIO METRICS */}
      <div className="mb-6">
        <h2 className="text-xs font-bold text-slate-950 bg-slate-100 p-1 mb-2 uppercase tracking-wider border-l-2 border-slate-900 pl-2">4. Financial Solvency & Residual Leverage</h2>
        <table className="w-full border border-slate-300">
          <tbody>
            <tr className="border-b border-slate-300">
              <td className="p-2 bg-slate-50 font-bold">Verified Monthly Operating Inflow</td>
              <td className="p-2 font-semibold">{cur(form.monthly_income)}</td>
              <td className="p-2 bg-slate-50 font-bold">Unleveraged Direct Outgoings (Spends)</td>
              <td className="p-2">{cur(form.monthly_spends)}</td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="p-2 bg-slate-50 font-bold">Pre-Existing Obligation Vol (EMI)</td>
              <td className="p-2">{cur(form.existingEMI || form.monthly_obligations)}</td>
              <td className="p-2 bg-slate-50 font-bold">Consolidated Aggregate Total EMI Load</td>
              <td className="p-2 font-bold">{cur(result.totalEMI || (result.emi + (form.existingEMI || 0)))}</td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="p-2 bg-slate-50 font-bold">Pre-Application Native Debt To Income (DTI)</td>
              <td className="p-2">{pct(result.dti * 100)}</td>
              <td className="p-2 bg-slate-50 font-bold">Post-Execution Aggregate Net DTI Limit</td>
              <td className="p-2 font-bold text-slate-900">{pct(result.totalDTI * 100)}</td>
            </tr>
            <tr>
              <td className="p-2 bg-slate-50 font-bold">Calculated Liquid Net Surplus Pool</td>
              <td className="p-2 font-semibold text-green-700">{cur(result.surplus)}</td>
              <td className="p-2 bg-slate-50 font-bold">Projected Free Liquid Residual Income</td>
              <td className="p-2 font-bold text-blue-900">{cur(result.projectedResidualIncome)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 5. RISK COLLATERAL BOUNDS */}
      <div className="mb-6 page-break-before">
        <h2 className="text-xs font-bold text-slate-950 bg-slate-100 p-1 mb-2 uppercase tracking-wider border-l-2 border-slate-900 pl-2">5. Pledged Asset Security Coverage</h2>
        <table className="w-full border border-slate-300">
          <tbody>
            <tr className="border-b border-slate-300">
              <td className="p-2 bg-slate-50 font-bold w-1/4">Assessed Collateral Core Valuation</td>
              <td className="p-2 w-1/4 font-semibold">{cur(form.collateral_value)}</td>
              <td className="p-2 bg-slate-50 font-bold w-1/4">Evaluated Net Loan to Value (LTV) Ratio</td>
              <td className="p-2 w-1/4 font-bold text-slate-900">{pct(result.ltv)}</td>
            </tr>
            <tr>
              <td className="p-2 bg-slate-50 font-bold">FIOR Structured Eligible Multiplier</td>
              <td className="p-2">{cur(result.fiorEligibleLoan)}</td>
              <td className="p-2 bg-slate-50 font-bold">Retained Liquid Capital Cushion (Savings)</td>
              <td className="p-2">{cur(form.savings_balance)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 6. COMPLIANCE ASSESSMENT GATES & POLICY SANCTIONS */}
      <div className="mb-8">
        <h2 className="text-xs font-bold text-slate-950 bg-slate-100 p-1 mb-2 uppercase tracking-wider border-l-2 border-slate-900 pl-2">6. Core Risk Gate Assessment Matrix</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-2">
          {Object.entries(result.gates).map(([key, status]) => (
            <div key={key} className="flex justify-between items-center py-1.5 px-3 border border-slate-200 bg-slate-50 rounded">
              <span className="font-medium text-slate-700">{gateLabelsMap[key] || key}</span>
              <span className={`font-extrabold tracking-wider ${
                status === "PASS" ? "text-green-700" : status === "MANUAL" ? "text-amber-700" : "text-red-700"
              }`}>
                {status === "PASS" ? "✓ PASS" : status === "MANUAL" ? "⚠ MANUAL" : "🗙 REJECT"}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <p className="font-bold text-slate-900 mb-1">Standard Operational Closing Covenants:</p>
          <ul className="list-decimal pl-4 space-y-1 text-slate-700">
            <li>Lien processing and verification registration checks must be completed against specified property files prior to any core line allocation.</li>
            <li>Direct auto-debit assignment parameters must explicitly bind to verified income deposit structures.</li>
            <li>Adverse variance inside active credit profiles greater than a 50-point bureau reduction indices triggers automated manual reassessment limits.</li>
          </ul>
        </div>

        {/* SIGNATURE RUN BLOCK */}
        <div className="border-t border-slate-400 pt-5 flex justify-between items-center mt-12">
          <div>
            <p className="font-bold text-slate-900 uppercase">RECOMMENDED BY AUTHORIZED WORKSTATION ASSET CONTROL</p>
            <p className="text-slate-500 font-medium">Underwriting Validation Officer | FederalCreditPro Suite Execution</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-800">Verification Engine Log Token</p>
            <p className="font-mono text-slate-400 text-[10px]">FCP-MD5-{(form.loan_amount || 100).toString(16).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-center text-[9px] text-slate-400 border-t border-dotted border-slate-300 pt-3 uppercase tracking-widest font-semibold">
        *** SECURE ARCHIVAL RECORD MANIFEST — END OF RETAIL PROPOSAL DOCUMENT ***
      </div>
    </div>
  );
}
