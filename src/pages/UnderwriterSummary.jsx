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
  if (status === "PASS" || status === "✓ PASS")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200"><ShieldCheck className="w-3 h-3" />PASS</span>;
  if (status === "MANUAL")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200"><ShieldAlert className="w-3 h-3" />MANUAL</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200"><ShieldX className="w-3 h-3" />REJECT</span>;
}

// Summary Modal Component
function SummaryModal({ isOpen, onClose, summary, loading, error }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-slate-900 text-base">AI Executive Insights</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Box */}
        <div className="p-6 overflow-y-auto flex-1 text-sm leading-relaxed text-slate-700 space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground text-xs font-medium">Synthesizing credit evaluation notes...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
              <ShieldX className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Summary Generation Failed</p>
                <p className="text-xs text-red-600/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && summary && (
            <div className="whitespace-pre-line font-mono bg-slate-950 text-slate-200 p-4 rounded-lg border border-slate-800 text-xs shadow-inner">
              {summary.text || JSON.stringify(summary, null, 2)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium shadow transition-colors">
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}

const gateLabels = {
  cibil: "CIBIL Gate (Score ≥ 650)",
  spend: "Spend-to-Income Gate",
  dti: "DTI Gate (≤ 60%)",
  ltv: "LTV Gate (≤ 85%)",
  emi: "EMI Affordability Gate",
  stress: "Stress Test Gate",
  residual: "Residual Income Gate",
};

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

  const downloadNativeDocx = () => {
    if (!data) return;
    const { form, result } = data;

    const htmlTemplate = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>LOAN PROPOSAL</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.5; color: #1e293b; padding: 20px; }
          .title { text-align: center; font-size: 24px; font-weight: bold; color: #0f172a; margin-bottom: 2px; text-transform: uppercase; }
          .subtitle { text-align: center; font-size: 13px; color: #475569; margin-bottom: 15px; }
          .confidential { text-align: center; font-size: 10px; font-weight: bold; color: #94a3b8; letter-spacing: 2px; margin-bottom: 25px; }
          .section-title { font-size: 14px; font-weight: bold; background-color: #f1f5f9; padding: 6px; border-left: 4px solid #0f172a; color: #0f172a; text-transform: uppercase; margin-top: 25px; margin-bottom: 10px; }
          .sub-section-title { font-size: 12px; font-weight: bold; color: #334155; margin-top: 15px; margin-bottom: 5px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 5px; margin-bottom: 15px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; text-align: left; }
          th { background-color: #f8fafc; font-weight: bold; color: #0f172a; }
          .font-bold { font-weight: bold; }
          .highlight-green { background-color: #f0fdf4; color: #166534; font-weight: bold; }
          .highlight-red { background-color: #fef2f2; color: #991b1b; font-weight: bold; }
          ul { margin-top: 5px; margin-bottom: 15px; padding-left: 20px; font-size: 12px; }
          li { margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <div class="title">LOAN PROPOSAL</div>
        <div class="subtitle">Bank Credit Assessment & Underwriting Report</div>
        <div class="confidential font-bold">CONFIDENTIAL - FOR AUTHORIZED USE ONLY</div>

        <div class="sub-section-title">PROPOSAL DETAILS</div>
        <table>
          <tr>
            <td class="font-bold" style="background-color:#f8fafc; width:25%;">Proposal Number</td>
            <td>LN-2026-\${(form.savings_balance || 5847).toString().slice(-4)}</td>
            <td class="font-bold" style="background-color:#f8fafc; width:25%;">Proposal Date</td>
            <td>\${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td>
          </tr>
          <tr>
            <td class="font-bold" style="background-color:#f8fafc;">Loan Product</td>
            <td>\${form.product || "Secured Personal Loan"}</td>
            <td class="font-bold" style="background-color:#f8fafc;">Underwriter</td>
            <td>Credit Analysis Department</td>
          </tr>
        </table>

        <div class="section-title">1. EXECUTIVE SUMMARY</div>
        <p style="font-size:12px;">This document presents a comprehensive credit assessment and underwriting recommendation for a loan application evaluated through our standardized underwriting framework.</p>
        
        <div class="sub-section-title">Recommendation</div>
        <table>
          <tr>
            <td class="font-bold" style="background-color:#f8fafc; width:50%;">Decision</td>
            <td class="\\${result.decision === "APPROVE" || result.decision === "APPROVED" ? "highlight-green" : "highlight-red"}">\\${result.decision === "APPROVE" ? "APPROVED" : result.decision}</td>
          </tr>
        </table>

        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Recommended Loan Amount</td><td class="font-bold">\\${fmt(result.maxLoanProvided)}</td></tr>
            <tr><td>Loan Tenure</td><td>\\${form.tenure_months} months</td></tr>
            <tr><td>Interest Rate (Sanctioned)</td><td class="font-bold">\\${result.finalRate?.toFixed(2)}% p.a.</td></tr>
            <tr><td>Monthly EMI</td><td class="font-bold">\\${fmt(result.emi)}</td></tr>
          </tbody>
        </table>
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
  const decisionColor = result.decision === "APPROVE" || result.decision === "APPROVED" ? "bg-green-600" : result.decision === "REJECT" ? "bg-red-600" : "bg-amber-600";
  const decisionBorder = result.decision === "APPROVE" || result.decision === "APPROVED" ? "border-green-500" : result.decision === "REJECT" ? "border-red-500" : "border-amber-500";

  return (
    <div className="min-h-screen bg-[hsl(215,30%,97%)]">
      <SummaryModal isOpen={showSummaryModal} onClose={() => setShowSummaryModal(false)} summary={summary} loading={loading} error={error} />

      <header className="bg-[hsl(224,58%,33%)] text-white shadow-lg print:hidden">
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
              <FileText className="w-4 h-4" /> Download Proposal Word Doc
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-400 text-sm font-medium hover:bg-blue-700 transition-colors">
              <Printer className="w-4 h-4" /> Print / PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6 print:p-0">
        {/* Main Status Header */}
        <div className={`rounded-xl border-2 ${decisionBorder} bg-white shadow-lg p-6 flex items-center justify-between`}>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Final Underwriting Decision</p>
            <p className="text-3xl font-extrabold text-slate-900">{form.applicant_name || "Applicant"}</p>
            <p className="text-sm text-muted-foreground mt-1">{form.product || "Secured Personal Loan"} · {form.tenure_months} Months · {fmt(form.loan_amount)}</p>
          </div>
          <span className={`${decisionColor} text-white text-xl font-extrabold px-8 py-3 rounded-xl`}>
            {result.decision === "APPROVE" || result.decision === "APPROVED" ? "APPROVED" : result.decision}
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
            { label: "LTV Eligible Amount", value: fmt(result.ltvEligibleLoan) },
            { label: "Affordability Eligible", value: fmt(result.affordabilityEligibleLoan) },
            { label: "FIOR Eligible Amount", value: fmt(result.fiorEligibleLoan) },
            { label: "Projected Residual Income", value: fmt(result.projectedResidualIncome), highlight: result.projectedResidualIncome <= 0 ? "red" : "green" },
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
                <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-muted-foreground font-medium">{gateLabels[key] || key}</span>
                  <GateBadge status={status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Score Breakdown Section */}
        {result.scores && (
          <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-blue-700" /> Score Weights & Rate Breakdown
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(result.scores).map(([key, val]) => (
                <div key={key} className="p-3 bg-slate-50 rounded-lg text-center border border-gray-100">
                  <p className="text-xs text-muted-foreground capitalize mb-1">{key}</p>
                  <p className="text-lg font-bold text-slate-800">{val}/100</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Amortization Table */}
        {result.amortization && (
          <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-slate-900 text-base">Amortization Schedule (First 12 Months)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3 text-center">Month</th>
                    <th className="px-4 py-3 text-right">Payment</th>
                    <th className="px-4 py-3 text-right">Principal</th>
                    <th className="px-4 py-3 text-right">Interest</th>
                    <th className="px-4 py-3 text-right">Remaining Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {result.amortization.slice(0, 12).map((row) => (
                    <tr key={row.month} className="border-t border-gray-100 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-2.5 text-center font-medium text-slate-700">{row.month}</td>
                      <td className="px-4 py-2.5 text-right font-medium">{`₹${Math.round(row.payment).toLocaleString("en-IN")}`}</td>
                      <td className="px-4 py-2.5 text-right text-green-600">{`₹${Math.round(row.principal).toLocaleString("en-IN")}`}</td>
                      <td className="px-4 py-2.5 text-right text-red-500">{`₹${Math.round(row.interest).toLocaleString("en-IN")}`}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{`₹${Math.round(row.balance).toLocaleString("en-IN")}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
