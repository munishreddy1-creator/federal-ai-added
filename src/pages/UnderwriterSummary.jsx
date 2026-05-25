import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, User, IndianRupee, ShieldCheck, ShieldX, ShieldAlert, Sparkles, X, FileText } from "lucide-react";
import { summarizeLoanApplication } from "../lib/deepseekService";

// Standard Financial Number Formatter
function fmt(n) {
  if (n == null) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${Math.round(n).toLocaleString("en-IN")}`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

// UI Badge Component
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

// ============================================================================
// COMPONENT 1: COMPREHENSIVE LOAN PROPOSAL PRINT LAYOUT
// ============================================================================
function LoanProposalPrintLayout({ form, result }) {
  if (!form || !result) return null;

  return (
    <div className="hidden print:block p-12 bg-white text-black font-sans text-[11px] leading-relaxed max-w-[800px] mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-wide uppercase">LOAN PROPOSAL</h1>
        <p className="text-xs font-medium text-slate-700 mt-0.5">Bank Credit Assessment & Underwriting Report</p>
        <p className="text-[9px] text-slate-400 tracking-widest mt-1.5 uppercase font-semibold">CONFIDENTIAL - FOR AUTHORIZED USE ONLY</p>
      </div>

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
            <td className="p-2">{form.product || "Secured Personal Loan"}</td>
            <td className="p-2 font-bold bg-slate-50">Underwriter</td>
            <td className="p-2">Credit Analysis Department</td>
          </tr>
        </tbody>
      </table>

      <div className="mb-6">
        <h2 className="text-xs font-bold text-slate-950 bg-slate-100 p-1 mb-2 uppercase tracking-wider border-l-2 border-slate-900 pl-2">1. EXECUTIVE SUMMARY</h2>
        <div className="flex items-center gap-2 mb-3">
          <span className="font-bold text-slate-900">Recommendation Status:</span>
          <span className={`px-3 py-0.5 rounded text-[10px] font-black tracking-widest ${
            result.decision === "APPROVE" ? "bg-green-100 text-green-800 border border-green-300" : "bg-red-100 text-red-800 border border-red-300"
          }`}>
            {result.decision}
          </span>
        </div>

        <table className="w-full border border-slate-300 mb-4">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-300 font-bold text-slate-900">
              <td className="p-2 w-1/2">Financial Parameter</td>
              <td className="p-2 w-1/2">Value Assessment</td>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-300">
              <td className="p-2">Requested Loan Amount</td>
              <td className="p-2">{fmt(result.requestedLoanAmount)}</td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="p-2">MAX LOAN PROVIDED</td>
              <td className="p-2 font-bold text-slate-900">{fmt(result.maxLoanProvided)}</td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="p-2">Loan Tenure</td>
              <td className="p-2">{form.tenure_months} months</td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="p-2">Interest Rate</td>
              <td className="p-2 font-bold text-slate-900">{result.finalRate?.toFixed(2)}%</td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="p-2">Monthly New EMI</td>
              <td className="p-2 font-bold text-slate-900">{fmt(result.emi)}</td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="p-2">Total Combined EMI</td>
              <td className="p-2">{fmt(result.totalEMI || result.existingEMI + result.emi)}</td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="p-2">Total Interest Outflow</td>
              <td className="p-2 text-red-700">{fmt(result.totalInterestPaid)}</td>
            </tr>
            <tr>
              <td className="p-2 font-semibold bg-slate-50">Total Amount Payable</td>
              <td className="p-2 font-bold text-slate-900 bg-slate-50">{fmt(result.totalAmountPaid)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-6">
        <h2 className="text-xs font-bold text-slate-950 bg-slate-100 p-1 mb-2 uppercase tracking-wider border-l-2 border-slate-900 pl-2">2. INCOME & AFFORDABILITY LIMITS</h2>
        <table className="w-full border border-slate-300">
          <tbody>
            <tr className="border-b border-slate-300">
              <td className="p-2 bg-slate-50 font-bold">Monthly Gross Income</td>
              <td className="p-2">{fmt(form.monthly_income)}</td>
              <td className="p-2 bg-slate-50 font-bold">Monthly Spends</td>
              <td className="p-2">{fmt(form.monthly_spends)}</td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="p-2 bg-slate-50 font-bold">LTV Eligible Amount</td>
              <td className="p-2 font-semibold">{fmt(result.ltvEligibleLoan)}</td>
              <td className="p-2 bg-slate-50 font-bold">Affordability Eligible</td>
              <td className="p-2 font-semibold">{fmt(result.affordabilityEligibleLoan)}</td>
            </tr>
            <tr>
              <td className="p-2 bg-slate-50 font-bold">FIOR Eligible Amount</td>
              <td className="p-2 font-semibold">{fmt(result.fiorEligibleLoan)}</td>
              <td className="p-2 bg-slate-50 font-bold">Projected Residual Income</td>
              <td className="p-2 font-bold text-green-700">{fmt(result.projectedResidualIncome)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-6">
        <h2 className="text-xs font-bold text-slate-950 bg-slate-100 p-1 mb-2 uppercase tracking-wider border-l-2 border-slate-900 pl-2">3. RISK & RATIO CROSS-EXAMINATION</h2>
        <table className="w-full border border-slate-300">
          <tbody>
            <tr className="border-b border-slate-300">
              <td className="p-2 font-bold bg-slate-50">Current DTI Ratio</td>
              <td className="p-2">{(result.dti * 100).toFixed(1)}%</td>
              <td className="p-2 font-bold bg-slate-50">Total Combined DTI</td>
              <td className="p-2 font-bold">{(result.totalDTI * 100).toFixed(1)}%</td>
            </tr>
            <tr>
              <td className="p-2 font-bold bg-slate-50">Loan-To-Value (LTV)</td>
              <td className="p-2">{result.ltv?.toFixed(1)}%</td>
              <td className="p-2 font-bold bg-slate-50">Net Interest Margin (NIM)</td>
              <td className="p-2 text-green-700">{result.nimPct?.toFixed(2)}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-6">
        <h2 className="text-xs font-bold text-slate-950 bg-slate-100 p-1 mb-2 uppercase tracking-wider border-l-2 border-slate-900 pl-2">4. REGULATORY POLICY GATE CHECKS</h2>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {Object.entries(result.gates || {}).map(([key, status]) => (
            <div key={key} className="flex justify-between items-center py-1 px-2 border border-slate-200 bg-slate-50 rounded text-[10px]">
              <span className="font-medium text-slate-700">{gateLabels[key] || key}</span>
              <span className={`font-bold ${status === "PASS" ? "text-green-700" : "text-red-700"}`}>{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT 2: AI SUMMARY TEXT MODAL WINDOW
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
            <p className="text-xs text-muted-foreground text-right font-medium">
              Generated at: {summary.timestamp || new Date().toLocaleTimeString()}
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
              <button onClick={onClose} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
// COMPONENT 3: MAIN WORKSPACE ENTRY
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

  // NATIVE PROTOCOL BLOB COMPILATION ENGINE
  const downloadNativeDocx = () => {
    if (!data) return;
    const { form, result } = data;

    // Direct clean architectural structure template
    const htmlTemplate = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Loan Assessment Proposal Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.5; color: #1e293b; padding: 20px; }
          .title { text-align: center; font-size: 24px; font-weight: bold; color: #0f172a; margin-bottom: 2px; text-transform: uppercase; }
          .subtitle { text-align: center; font-size: 13px; color: #475569; margin-bottom: 15px; }
          .confidential { text-align: center; font-size: 10px; font-weight: bold; color: #94a3b8; letter-spacing: 2px; margin-bottom: 25px; }
          h2 { font-size: 14px; font-weight: bold; background-color: #f1f5f9; padding: 6px; border-left: 4px solid #0f172a; color: #0f172a; text-transform: uppercase; margin-top: 25px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; text-align: left; }
          th { background-color: #f8fafc; font-weight: bold; color: #0f172a; }
          .font-bold { font-weight: bold; }
          .highlight-green { background-color: #f0fdf4; color: #166534; font-weight: bold; }
          .highlight-red { background-color: #fef2f2; color: #991b1b; font-weight: bold; }
          .badge { font-weight: bold; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
          .badge-pass { color: #166534; background-color: #dcfce7; }
          .badge-manual { color: #9a3412; background-color: #ffedd5; }
          .badge-reject { color: #991b1b; background-color: #fee2e2; }
        </style>
      </head>
      <body>
        <div class="title">LOAN PROPOSAL</div>
        <div class="subtitle">Bank Credit Assessment & Underwriting Report</div>
        <div class="confidential">CONFIDENTIAL - FOR AUTHORIZED USE ONLY</div>

        <table>
          <tr>
            <td class="font-bold" style="background-color:#f8fafc; width:25%;">Proposal Number</td>
            <td>LN-2026-${(form.savings_balance || 5847).toString().slice(-4)}</td>
            <td class="font-bold" style="background-color:#f8fafc; width:25%;">Proposal Date</td>
            <td>${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td>
          </tr>
          <tr>
            <td class="font-bold" style="background-color:#f8fafc;">Loan Product</td>
            <td>${form.product || "Secured Personal Loan"}</td>
            <td class="font-bold" style="background-color:#f8fafc;">Underwriter</td>
            <td>Credit Analysis Department</td>
          </tr>
        </table>

        <h2>1. Executive Recommendation Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Evaluation Parameter Matrix</th>
              <th>Sanction Value Assessment</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Applicant Name Reference</td><td class="font-bold">${form.applicant_name || "—"}</td></tr>
            <tr><td>Underwriting Decision Status</td><td class="${result.decision === "APPROVE" ? "highlight-green" : "highlight-red"}">${result.decision}</td></tr>
            <tr><td>Requested Funding Amount</td><td>${fmt(result.requestedLoanAmount)}</td></tr>
            <tr class="highlight-green"><td>MAX LOAN PROVIDED (Sanctioned)</td><td>${fmt(result.maxLoanProvided)}</td></tr>
            <tr><td>Target Term Tenure</td><td>${form.tenure_months} Months</td></tr>
            <tr><td>Derivation Base Interest Rate</td><td class="font-bold">${result.finalRate?.toFixed(2)}% p.a.</td></tr>
            <tr><td>Monthly Base Installment (EMI)</td><td class="font-bold">${fmt(result.emi)}</td></tr>
            <tr><td>Total Fixed Monthly Outflow (Combined EMI)</td><td>${fmt(result.totalEMI || result.existingEMI + result.emi)}</td></tr>
            <tr><td>Total Aggregated Interest Payment</td><td style="color:#991b1b;">${fmt(result.totalInterestPaid)}</td></tr>
            <tr style="background-color:#f8fafc;"><td class="font-bold">Total Capital Repayment Value</td><td class="font-bold">${fmt(result.totalAmountPaid)}</td></tr>
          </tbody>
        </table>

        <h2>2. Metrics Profile & Allocation Thresholds</h2>
        <table>
          <tbody>
            <tr>
              <td class="font-bold" style="background-color:#f8fafc;">Gross Monthly Income</td><td>${fmt(form.monthly_income)}</td>
              <td class="font-bold" style="background-color:#f8fafc;">Unleveraged Monthly Spends</td><td>${fmt(form.monthly_spends)}</td>
            </tr>
            <tr>
              <td class="font-bold" style="background-color:#f8fafc;">Property / Pledged Asset Value</td><td>${fmt(form.collateral_value)}</td>
              <td class="font-bold" style="background-color:#f8fafc;">Calculated LTV Margin Ratio</td><td class="font-bold">${result.ltv?.toFixed(1)}%</td>
            </tr>
            <tr>
              <td class="font-bold" style="background-color:#f8fafc;">LTV Eligible Cap Limit</td><td>${fmt(result.ltvEligibleLoan)}</td>
              <td class="font-bold" style="background-color:#f8fafc;">Affordability Eligible Cap</td><td>${fmt(result.affordabilityEligibleLoan)}</td>
            </tr>
            <tr>
              <td class="font-bold" style="background-color:#f8fafc;">FIOR Eligible Cap Limit</td><td>${fmt(result.fiorEligibleLoan)}</td>
              <td class="font-bold" style="background-color:#f8fafc;">Projected Free Residual Income</td><td class="highlight-green">${fmt(result.projectedResidualIncome)}</td>
            </tr>
            <tr>
              <td class="font-bold" style="background-color:#f8fafc;">Current Isolated DTI</td><td>${(result.dti * 100).toFixed(1)}%</td>
              <td class="font-bold" style="background-color:#f8fafc;">Total Post-Loan DTI</td><td class="font-bold">${(result.totalDTI * 100).toFixed(1)}%</td>
            </tr>
            <tr>
              <td class="font-bold" style="background-color:#f8fafc;">Weighted Risk Score Index</td><td>${result.weightedScore?.toFixed(1)}%</td>
              <td class="font-bold" style="background-color:#f8fafc;">Net Interest Margin Spread (NIM)</td><td style="color:#166534; font-weight:bold;">${result.nimPct?.toFixed(2)}%</td>
            </tr>
          </tbody>
        </table>

        <h2>3. Regulatory Underwriting Gates</h2>
        <table>
          <thead>
            <tr>
              <th>Compliance Rule Gate Target</th>
              <th>Verification Status</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(result.gates || {}).map(([key, status]) => `
              <tr>
                <td>${gateLabels[key] || key}</td>
                <td><span class="badge ${status === "PASS" ? "badge-pass" : status === "MANUAL" ? "badge-manual" : "badge-reject"}">${status}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <br/><br/>
        <div style="font-size:11px; text-align:center; color:#94a3b8; margin-top:30px;">
          *** END OF PROPOSAL DOCUMENT — TRANSACTED VIA FEDERALCREDITPRO ***
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlTemplate], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = `Loan_Proposal_${form.applicant_name || "Assessment"}.doc`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
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
      <SummaryModal isOpen={showSummaryModal} onClose={() => setShowSummaryModal(false)} summary={summary} loading={loading} error={error} />

      <div className="print:hidden">
        <header className="bg-[hsl(224,58%,33%)] text-white shadow-lg">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/")} className="p-1.5 rounded hover:bg-blue-700 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-bold text-base">Underwriter Credit Summary</h1>
                <p className="text-xs text-blue-200">FederalCreditPro — Core Evaluation Terminal</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSummarize} disabled={loading} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-400 text-sm font-medium hover:bg-blue-700 transition-colors">
                <Sparkles className="w-4 h-4" /> Summary
              </button>

              <button onClick={downloadNativeDocx} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-400 text-sm font-medium text-emerald-300 hover:bg-emerald-800 transition-colors">
                <FileText className="w-4 h-4" /> Word Document
              </button>

              <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-400 text-sm font-medium hover:bg-blue-700 transition-colors">
                <Printer className="w-4 h-4" /> Print / PDF
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          {/* Main Status Header */}
          <div className={`rounded-xl border-2 ${decisionBorder} bg-white shadow-lg p-6 flex items-center justify-between`}>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Final Underwriting Decision</p>
              <p className="text-3xl font-extrabold text-slate-900">{form.applicant_name || "Applicant"}</p>
              <p className="text-sm text-muted-foreground mt-1">{form.product || "Secured Personal Loan"} · {form.tenure_months} Months · {fmt(form.loan_amount)}</p>
            </div>
            <span className={`${decisionColor} text-white text-xl font-extrabold px-8 py-3 rounded-xl`}>
              {result.decision}
            </span>
          </div>

          {/* Core Metrics Overview Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Requested Amount", value: fmt(result.requestedLoanAmount) },
              { label: "MAX LOAN PROVIDED", value: fmt(result.maxLoanProvided), highlight: result.maxLoanProvided < result.requestedLoanAmount ? "amber" : "green" },
              { label: "Monthly New EMI", value: fmt(result.emi) },
              { label: "Total Combined EMI", value: fmt(result.totalEMI || result.existingEMI + result.emi) },
              { label: "Sanctioned Rate", value: `${result.finalRate?.toFixed(2)}% p.a.` },
              { label: "Loan-To-Value (LTV)", value: `${result.ltv?.toFixed(1)}%` },
              { label: "Total Interest Outflow", value: fmt(result.totalInterestPaid) },
              { label: "Total Payable Outflow", value: fmt(result.totalAmountPaid) },
              { label: "Monthly Income Inflow", value: fmt(form.monthly_income) },
              { label: "Monthly Spends Outgo", value: fmt(form.monthly_spends) },
              { label: "Current Isolated DTI", value: `${(result.dti * 100).toFixed(1)}%` },
              { label: "Total Combined DTI", value: `${(result.totalDTI * 100).toFixed(1)}%` },
              { label: "Projected Residual Income", value: fmt(result.projectedResidualIncome), highlight: result.projectedResidualIncome <= 0 ? "red" : "green" },
              { label: "Net Margin Spread (NIM)", value: `${result.nimPct?.toFixed(2)}%` },
              { label: "Property / Pledged Value", value: fmt(form.collateral_value) },
              { label: "LTV Eligible Amount", value: fmt(result.ltvEligibleLoan) },
              { label: "Affordability Eligible", value: fmt(result.affordabilityEligibleLoan) },
              { label: "FIOR Eligible Amount", value: fmt(result.fiorEligibleLoan) },
              { label: "Monthly Balance Surplus", value: fmt(result.surplus) },
              { label: "Credit Score Index", value: `${result.weightedScore?.toFixed(1)}/100` },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl shadow p-4 border ${
                item.highlight === "red" ? "bg-red-50 border-red-200 text-red-700" : 
                item.highlight === "green" ? "bg-green-50 border-green-200 text-green-700" : 
                item.highlight === "amber" ? "bg-amber-50 border-amber-200 text-amber-700" :
                "bg-white border-gray-100"
              }`}>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{item.label}</p>
                <p className="text-lg font-bold text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Complete Data Parameter List */}
            <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
              <h3 className="flex items-center gap-2 font-bold text-slate-900 text-base mb-4"><User className="w-5 h-5 text-blue-700" /> Full Particulars File</h3>
              <div className="space-y-2 text-sm">
                {[
                  ["Applicant Name Reference", form.applicant_name || "—"],
                  ["Requested Funding Target", fmt(result.requestedLoanAmount)],
                  ["Sanctioned Dynamic Ceiling", fmt(result.maxLoanProvided)],
                  ["Gross Monthly Income", fmt(form.monthly_income)],
                  ["Average Living Expenditures", fmt(form.monthly_spends)],
                  ["Pre-Existing Liabilities (EMI)", fmt(result.existingEMI || 0)],
                  ["CIBIL Bureau Score", form.cibil_score || "—"],
                  ["Weighted System Risk Score", `${result.weightedScore?.toFixed(2)}%`],
                  ["Pledged Asset Value", fmt(form.collateral_value)],
                  ["LTV Cap Approved Ceiling", fmt(result.ltvEligibleLoan)],
                  ["Affordability Formula Ceiling", fmt(result.affordabilityEligibleLoan)],
                  ["FIOR Policy Frame Ceiling", fmt(result.fiorEligibleLoan)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-muted-foreground font-medium">{k}</span>
                    <span className="font-semibold text-slate-900">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance Policy Checks */}
            <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
              <h3 className="flex items-center gap-2 font-bold text-slate-900 text-base mb-4"><ShieldCheck className="w-5 h-5 text-blue-700" /> Underwriting Core Compliance Gates</h3>
              <div className="space-y-2">
                {Object.entries(result.gates || {}).map(([key, status]) => (
                  <div key={key} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-slate-700 font-medium">{gateLabels[key] || key}</span>
                    <GateBadge status={status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Hidden print asset frame mapping layout onto local platform PDF tools */}
      <LoanProposalPrintLayout form={form} result={result} />
    </div>
  );
}
