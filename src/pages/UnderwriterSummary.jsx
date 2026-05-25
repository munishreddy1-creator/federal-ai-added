import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, User, IndianRupee, ShieldCheck, ShieldX, ShieldAlert, Sparkles, X } from "lucide-react";
import { summarizeLoanApplication } from "../lib/deepseekService";

// Standard Financial Number Formatter
function fmt(n) {
  if (n == null) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

// UI Dash Badge Component
function GateBadge({ status }) {
  if (status === "PASS")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200"><ShieldCheck className="w-3 h-3" />PASS</span>;
  if (status === "MANUAL")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200"><ShieldAlert className="w-3 h-3" />MANUAL</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200"><ShieldX className="w-3 h-3" />REJECT</span>;
}

const gateLabels = {
  cibil: "CIBIL Score Gate",
  spend: "Spend-to-Income Gate",
  dti: "Total DTI Gate",
  ltv: "LTV Cap Gate",
  emi: "EMI Affordability Gate",
  stress: "Stress Test (Rate +2%)",
  residual: "Residual Income Gate",
};

// Print Layout Dictionary Mapping
const gateLabelsMap = {
  cibil: "CIBIL Gate (Score ≥ 650)",
  spend: "Spend-to-Income Gate",
  dti: "Total DTI Gate (≤ 60%)",
  ltv: "LTV Cap Gate (≤ 85%)",
  emi: "EMI Affordability Gate",
  stress: "Stress Test Gate (Rate +2%)",
  residual: "Residual Income Gate",
};

// ============================================================================
// COMPONENT 1: LOAN PROPOSAL PRINT LAYOUT (IN-FILE TO PREVENT BUNDLING ERRORS)
// ============================================================================
function LoanProposalPrintLayout({ form, result }) {
  if (!form || !result) return null;

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
      <div className="mb-6">
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

// ============================================================================
// COMPONENT 2: SUMMARY TEXT MODAL WINDOW
// ============================================================================
function SummaryModal({ isOpen, onClose, summary, loading, error }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 max-h-screen overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between sticky top-0 bg-white pb-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            AI Summary
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-block animate-spin mb-3">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-muted-foreground">Generating AI summary...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-semibold mb-1">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {summary && !loading && (
          <div className="space-y-4">
            {summary.snapshot && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap">{summary.snapshot}</p>
              </div>
            )}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">{summary.summary}</p>
            </div>
            <p className="text-xs text-muted-foreground text-right">
              Generated at: {summary.timestamp}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(summary.summary);
                  alert("Summary copied to clipboard!");
                }}
                className="flex-1 px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT 3: MAIN ROUTE ROUTER INTERFACE
// ============================================================================
export default function UnderwriterSummary() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("loanApplication");
    if (saved) {
      try { setData(JSON.parse(saved)); } catch {}
    }
  }, []);

  const handleSummarize = async () => {
    setLoading(true);
    setError(null);
    setShowSummaryModal(true);

    const result = await summarizeLoanApplication(data.form, data.result);
    
    setLoading(false);
    if (result.success) {
      setSummary(result);
    } else {
      setError(result.error);
      setSummary(null);
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-[hsl(215,30%,97%)] flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-lg">No loan application evaluated yet.</p>
        <button onClick={() => navigate("/")} className="px-4 py-2 bg-[hsl(224,58%,33%)] text-white rounded-lg text-sm font-medium hover:opacity-90">
          Go to Calculator
        </button>
      </div>
    );
  }

  const { form, result } = data;
  const decisionColor = result.decision === "APPROVE" ? "bg-green-600" : result.decision === "REJECT" ? "bg-red-600" : "bg-amber-600";
  const decisionBorder = result.decision === "APPROVE" ? "border-green-500" : result.decision === "REJECT" ? "border-red-500" : "border-amber-500";

  return (
    <div className="min-h-screen bg-[hsl(215,30%,97%)]">
      {/* Modals */}
      <SummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        summary={summary}
        loading={loading}
        error={error}
      />

      {/* WORKSTATION ROUTE VIEW LAYER (HIDDEN AUTOMATICALLY BY PRINT ENGINE) */}
      <div className="print:hidden">
        {/* Header */}
        <header className="bg-[hsl(224,58%,33%)] text-white shadow-lg">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/")} className="p-1.5 rounded hover:bg-blue-700 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-bold text-base">Underwriter Credit Summary</h1>
                <p className="text-xs text-blue-200">FederalCreditPro — Loan Assessment Report</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSummarize}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-400 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" /> 
                {loading ? "Summarizing..." : "Summarize"}
              </button>
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-400 text-sm font-medium hover:bg-blue-700 transition-colors">
                <Printer className="w-4 h-4" /> Print / PDF
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          {/* Decision Banner */}
          <div className={`rounded-xl border-2 ${decisionBorder} bg-white shadow-lg p-6 flex items-center justify-between`}>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Final Underwriting Decision</p>
              <p className="text-3xl font-extrabold text-foreground">{form.applicant_name || "Applicant"}</p>
              <p className="text-sm text-muted-foreground mt-1">{form.product} · {form.tenure_months} months · {fmt(form.loan_amount)}</p>
            </div>
            <span className={`${decisionColor} text-white text-xl font-extrabold px-8 py-3 rounded-xl`}>
              {result.decision}
            </span>
          </div>

          {/* Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Monthly Income", value: fmt(form.monthly_income) },
              { label: "Existing EMI", value: fmt(result.existingEMI) },
              { label: "New EMI", value: fmt(result.emi) },
              { label: "Total EMI", value: fmt(result.totalEMI || result.existingEMI + result.emi) },
              { label: "Monthly Surplus", value: fmt(result.surplus) },
              { label: "Projected Residual Income", value: fmt(result.projectedResidualIncome), highlight: result.projectedResidualIncome <= 0 ? "red" : "green" },
              { label: "Interest Rate", value: `${result.finalRate.toFixed(2)}%` },
              { label: "Credit Score", value: `${result.weightedScore.toFixed(1)}/100` },
              { label: "LTV Ratio", value: `${result.ltv.toFixed(1)}%` },
              { label: "Current DTI", value: `${(result.dti * 100).toFixed(1)}%` },
              { label: "Total DTI", value: `${(result.totalDTI * 100).toFixed(1)}%` },
              { label: "NIM", value: `${result.nimPct.toFixed(2)}%` },
              { label: "Total Payable", value: fmt(result.totalAmountPaid) },
              { label: "Total Interest", value: fmt(result.totalInterestPaid) },
              { label: "Requested Loan Amount", value: fmt(result.requestedLoanAmount) },
              { label: "Property / Pledged Value", value: fmt(form.collateral_value) },
              { label: "LTV Eligible Amount", value: fmt(result.ltvEligibleLoan) },
              { label: "Affordability Eligible Amount", value: fmt(result.affordabilityEligibleLoan) },
              { label: "FIOR Eligible Amount", value: fmt(result.fiorEligibleLoan) },
              { label: "MAX LOAN PROVIDED", value: fmt(result.maxLoanProvided), highlight: result.maxLoanProvided < result.requestedLoanAmount ? "amber" : "green" },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl shadow p-4 ${
                item.highlight === "red" ? "bg-red-50 border border-red-200" : 
                item.highlight === "green" ? "bg-green-50 border border-green-200" : 
                item.highlight === "amber" ? "bg-amber-50 border border-amber-200" :
                "bg-white"
              }`}>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{item.label}</p>
                <p className={`text-lg font-bold ${
                  item.highlight === "red" ? "text-red-700" : 
                  item.highlight === "green" ? "text-green-700" : 
                  item.highlight === "amber" ? "text-amber-700" :
                  "text-foreground"
                }`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Applicant Details & Credit Summary side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Applicant Details */}
            <div className="bg-white rounded-xl shadow-lg p-5">
              <h3 className="flex items-center gap-2 font-semibold text-base mb-4">
                <User className="w-5 h-5 text-blue-700" /> Applicant Details
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  ["Name", form.applicant_name || "—"],
                  ["Product", form.product],
                  ["Tenure", `${form.tenure_months} months`],
                  ["CIBIL Score", form.cibil_score],
                  ["Occupation", form.occupationType || "—"],
                  ["Age", form.applicantAge ? `${form.applicantAge} years` : "—"],
                  ["Monthly Income", fmt(form.monthly_income)],
                  ["Existing Obligations (used in DTI/FIOR)", fmt(result.existingEMI || 0)],
                  ["Monthly Spends", fmt(form.monthly_spends)],
                  ["Savings Balance", fmt(form.savings_balance)],
                  ["Requested Loan Amount", fmt(result.requestedLoanAmount)],
                  ["Property / Pledged Value", fmt(form.collateral_value)],
                  ["LTV Eligible Amount", fmt(result.ltvEligibleLoan)],
                  ["Affordability Eligible Amount", fmt(result.affordabilityEligibleLoan)],
                  ["FIOR Eligible Amount", fmt(result.fiorEligibleLoan)],
                  ["MAX LOAN PROVIDED", fmt(result.maxLoanProvided)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-muted-foreground font-medium">{k}</span>
                    <span className="font-semibold">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Credit Summary */}
            <div className="bg-white rounded-xl shadow-lg p-5">
              <h3 className="flex items-center gap-2 font-semibold text-base mb-4">
                <ShieldCheck className="w-5 h-5 text-blue-700" /> Credit Summary
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  ["Past Defaults", form.past_defaults, form.past_defaults > 0 ? "amber" : "white"],
                  ...(form.activeOverdueAmount > 0 ? [["Active Overdue", fmt(form.activeOverdueAmount), "red"]] : []),
                  ...(form.emiDefaultCount > 0 ? [["EMI Defaults", form.emiDefaultCount, "orange"]] : []),
                  ...(form.overdueEMICount > 0 ? [["Overdue EMIs", form.overdueEMICount, "orange"]] : []),
                  ["Current Residual Income", fmt(result.currentSurplus), result.currentSurplus > 0 ? "green" : "red"],
                  ["Projected Residual Income", fmt(result.projectedResidualIncome), result.projectedResidualIncome > 0 ? "green" : "red"],
                ].map(([k, v, color]) => {
                  const bgClass = color === "red" ? "bg-red-50 border-red-200" : 
                                 color === "green" ? "bg-green-50 border-green-200" : 
                                 color === "amber" ? "bg-amber-50 border-amber-200" : 
                                 color === "orange" ? "bg-orange-50 border-orange-200" : "bg-white";
                  const textClass = color === "red" ? "text-red-700" : 
                                   color === "green" ? "text-green-700" : 
                                   color === "amber" ? "text-amber-700" : 
                                   color === "orange" ? "text-orange-700" : "text-foreground";
                  return (
                    <div key={k} className={`flex justify-between py-2 px-2 rounded border ${bgClass}`}>
                      <span className="text-muted-foreground font-medium">{k}</span>
                      <span className={`font-semibold ${textClass}`}>{v}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gate Checks */}
            <div className="bg-white rounded-xl shadow-lg p-5">
              <h3 className="flex items-center gap-2 font-semibold text-base mb-4">
                <ShieldCheck className="w-5 h-5 text-blue-700" /> Gate Checks & Decision
              </h3>
              <div className="space-y-2">
                {Object.entries(result.gates).map(([key, status]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-muted-foreground font-medium">{gateLabels[key]}</span>
                    <GateBadge status={status} />
                  </div>
                ))}
              </div>
              
              {/* Key Metrics for Decision */}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                {result.creditRisk?.hasCreditRisk && (
                  <div className="flex justify-between p-2 rounded bg-red-50 text-red-700 border border-red-200">
                    <span className="font-medium">⚠️ Credit Risk</span>
                    <span className="font-semibold">YES</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="bg-white rounded-xl shadow-lg p-5">
            <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-blue-700" /> Score Breakdown &amp; Rate Derivation
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {Object.entries(result.scores).map(([key, val]) => (
                <div key={key} className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-muted-foreground capitalize mb-1">{key}</p>
                  <p className="text-lg font-bold">{val}/100</p>
                  <div className="h-1.5 rounded-full bg-gray-200 mt-1 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${val}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Rate Band</p>
                <p className="font-bold">{result.rateBand.min}% – {result.rateBand.max}%</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Final Rate</p>
                <p className="font-bold text-yellow-700">{result.finalRate.toFixed(2)}%</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">NIM</p>
                <p className="font-bold text-green-700">{result.nimPct.toFixed(2)}%</p>
              </div>
            </div>
          </div>

          {/* Decision Reason Codes & Risk Factors */}
          {(result.reasonCodes && result.reasonCodes.length > 0) && (
            <div className="bg-white rounded-xl shadow-lg p-5">
              <h3 className="font-semibold text-base mb-4 text-amber-700">📋 Decision Reason Codes & Risk Factors</h3>
              <div className="space-y-3">
                {result.reasonCodes.map((r) => {
                  const bgColor =
                    r.severity === "CRITICAL" ? "bg-red-50 border-red-200" :
                    r.severity === "HIGH" ? "bg-orange-50 border-orange-200" :
                    r.severity === "MEDIUM" ? "bg-amber-50 border-amber-200" :
                    "bg-blue-50 border-blue-200";
                  return (
                    <div key={r.code} className={`flex items-start gap-3 p-3 rounded-lg border ${bgColor}`}>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${bgColor.replace("50", "100")}`}>
                        {r.code}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{r.label}</p>
                        <p className="text-xs mt-0.5">{r.detail}</p>
                      </div>
                      <span className={`text-xs font-semibold shrink-0 px-2 py-1 rounded whitespace-nowrap ${
                        r.severity === "CRITICAL" || r.severity === "HIGH" ? "bg-red-100 text-red-700" :
                        r.severity === "MEDIUM" ? "bg-amber-100 text-amber-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {r.severity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Amortization preview */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-base">Amortization Schedule (First 12 Months)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-muted-foreground uppercase">
                    <th className="px-4 py-3 text-center">Month</th>
                    <th className="px-4 py-3 text-right">Payment</th>
                    <th className="px-4 py-3 text-right">Principal</th>
                    <th className="px-4 py-3 text-right">Interest</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {result.amortization.map((row) => (
                    <tr key={row.month} className="border-t border-gray-50 hover:bg-slate-50">
                      <td className="px-4 py-2 text-center font-medium">{row.month}</td>
                      <td className="px-4 py-2 text-right">{`₹${Math.round(row.payment).toLocaleString("en-IN")}`}</td>
                      <td className="px-4 py-2 text-right text-green-700">{`₹${Math.round(row.principal).toLocaleString("en-IN")}`}</td>
                      <td className="px-4 py-2 text-right text-red-600">{`₹${Math.round(row.interest).toLocaleString("en-IN")}`}</td>
                      <td className="px-4 py-2 text-right font-semibold">{`₹${Math.round(row.balance).toLocaleString("en-IN")}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground pb-6">
            Generated by FederalCreditPro · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </main>
      </div>

      {/* DYNAMIC BLUEPRINT LOADER (ACTIVATED ONLY DURING NATIVE PRINT ACTIONS) */}
      <LoanProposalPrintLayout form={form} result={result} />
    </div>
  );
}
