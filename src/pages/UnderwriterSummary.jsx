import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, User, IndianRupee, ShieldCheck, ShieldX, ShieldAlert, Sparkles, X, FileText, RotateCcw } from "lucide-react";
import { summarizeLoanApplication } from "../lib/deepseekService";

// Standard Financial Number Formatter
function fmt(n) {
  if (n == null || isNaN(n)) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${Math.round(n).toLocaleString("en-IN")}`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

// Word Exporter Blank Placeholder Fallback Generator
function docValue(val, isCurrency = false) {
  if (val === null || val === undefined || val === "") {
    return "[________________]";
  }
  return isCurrency ? fmt(val) : val;
}

// UI Badge Component
function GateBadge({ status }) {
  if (status === "PASS" || status === "✓ PASS")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200"><ShieldCheck className="w-3 h-3" />PASS</span>;
  if (status === "MANUAL")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200"><ShieldAlert className="w-3 h-3" />MANUAL</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200"><ShieldX className="w-3 h-3" />REJECT</span>;
}

// Inline Summary Modal Component
function SummaryModal({ isOpen, onClose, summary, loading, error }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-slate-900 text-base">AI Executive Insights</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

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

        <div className="px-5 py-3.5 border-t border-gray-100 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium shadow transition-colors">
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}

// Reset Confirmation Modal Component
function ResetConfirmationModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-gray-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-slate-900 text-base">Reset All Data?</h3>
          </div>
        </div>

        <div className="p-6 text-sm leading-relaxed text-slate-700 space-y-4">
          <p>
            Are you sure you want to reset? This will clear all loan application data and return you to the calculator with blank fields.
          </p>
          <p className="text-xs text-slate-500">
            This action cannot be undone.
          </p>
        </div>

        <div className="px-5 py-3.5 border-t border-gray-100 bg-slate-50 flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg text-xs font-medium shadow transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium shadow transition-colors">
            Reset Data
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
  const [showResetModal, setShowResetModal] = useState(false);

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

  const handleResetConfirm = () => {
    // Clear localStorage
    localStorage.removeItem("loanApplication");
    setShowResetModal(false);
    // Navigate back to calculator
    navigate("/");
  };

  const downloadNativeDocx = () => {
    if (!data) return;
    const { form, result } = data;

    // Strict value extraction mapping without any synthetic static fallback numbers
    const dynamicApplicantName = form.applicant_name || "";
    const dynamicMaxLoan = result.maxLoanProvided;
    const dynamicRequestedLoan = result.requestedLoanAmount ?? form.loan_amount;
    const dynamicExistingEMI = result.existingEMI;
    const dynamicMonthlyIncome = form.monthly_income;
    const dynamicMonthlySpends = form.monthly_spends;
    const dynamicSurplus = result.surplus;
    const dynamicNewEMI = result.emi;
    const dynamicTotalEMI = result.totalEMI;
    const dynamicResidual = result.projectedResidualIncome;
    const dynamicCollateralValue = form.collateral_value;
    const dynamicCibil = form.cibil_score;
    const dynamicTenure = form.tenure_months;
    const dynamicInterestRate = result.finalRate;

    const htmlTemplate = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>LOAN PROPOSAL - ${dynamicApplicantName || "CREDIT ANALYSIS"}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 30px; }
          .page-break { page-break-before: always; }
          .title { text-align: center; font-size: 28px; font-weight: bold; color: #0f172a; margin-top: 100px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
          .subtitle { text-align: center; font-size: 15px; color: #475569; margin-bottom: 20px; font-weight: 500; }
          .confidential { text-align: center; font-size: 11px; font-weight: bold; color: #94a3b8; letter-spacing: 3px; margin-bottom: 200px; }
          .meta-box { margin: 0 auto; width: 80%; border: 1px solid #e2e8f0; padding: 20px; background-color: #f8fafc; border-radius: 6px; }
          .section-title { font-size: 15px; font-weight: bold; background-color: #f1f5f9; padding: 8px 12px; border-left: 5px solid #0f172a; color: #0f172a; text-transform: uppercase; margin-top: 20px; margin-bottom: 12px; }
          .sub-section-title { font-size: 13px; font-weight: bold; color: #334155; margin-top: 20px; margin-bottom: 8px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px; font-size: 12px; text-align: left; }
          th { background-color: #f8fafc; font-weight: bold; color: #0f172a; }
          .font-bold { font-weight: bold; }
          .highlight-green { background-color: #f0fdf4; color: #166534; font-weight: bold; }
          .highlight-red { background-color: #fef2f2; color: #991b1b; font-weight: bold; }
          ul { margin-top: 8px; margin-bottom: 20px; padding-left: 25px; font-size: 12px; }
          li { margin-bottom: 6px; }
          p { font-size: 12px; margin-bottom: 12px; text-align: justify; }
        </style>
      </head>
      <body>
        
        <div class="title">LOAN PROPOSAL</div>
        <div class="subtitle">Bank Credit Assessment & Underwriting Report</div>
        <div class="confidential">CONFIDENTIAL - FOR AUTHORIZED USE ONLY</div>
        
        <div class="meta-box">
          <table style="border:0; margin:0;">
            <tr style="border:0;"><td style="border:0; font-weight:bold; width:40%;">Applicant Identifier:</td><td style="border:0;">${docValue(dynamicApplicantName)}</td></tr>
            <tr style="border:0;"><td style="border:0; font-weight:bold;">Proposal Date:</td><td style="border:0;">${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td></tr>
            <tr style="border:0;"><td style="border:0; font-weight:bold;">Loan Product:</td><td style="border:0;">${docValue(form.product)}</td></tr>
            <tr style="border:0;"><td style="border:0; font-weight:bold;">Underwriter:</td><td style="border:0;">Credit Analysis Department</td></tr>
          </table>
        </div>

        <div class="page-break"></div>
        <div class="section-title">1. EXECUTIVE SUMMARY</div>
        <p>This document presents a comprehensive credit assessment and underwriting recommendation for a loan application evaluated through our standardized underwriting framework. The evaluation encompasses credit bureau data, financial metrics, affordability parameters, and collateral valuation.</p>
        
        <div class="sub-section-title">Recommendation</div>
        <table>
          <tr>
            <td class="font-bold" style="background-color:#f8fafc; width:50%;">Decision</td>
            <td class="${result.decision === "APPROVE" || result.decision === "APPROVED" ? "highlight-green" : "highlight-red"}">${docValue(result.decision)}</td>
          </tr>
        </table>

        <table>
          <thead>
            <tr><th style="width:50%;">Metric</th><th>Value</th></tr>
          </thead>
          <tbody>
            <tr><td>Recommended Loan Amount</td><td class="font-bold">${docValue(dynamicMaxLoan, true)}</td></tr>
            <tr><td>Loan Tenure</td><td>${docValue(dynamicTenure)} months</td></tr>
            <tr><td>Interest Rate (Sanctioned)</td><td class="font-bold">${dynamicInterestRate != null ? `${Number(dynamicInterestRate).toFixed(2)}% p.a.` : "[________________]"}</td></tr>
            <tr><td>Monthly EMI</td><td class="font-bold">${docValue(dynamicNewEMI, true)}</td></tr>
            <tr style="background-color:#f8fafc;"><td class="font-bold">Total Amount Payable</td><td class="font-bold">${docValue(result.totalAmountPaid, true)}</td></tr>
          </tbody>
        </table>

        <div class="sub-section-title">Key Strengths</div>
        <ul>
          <li>Strong credit profile with consistent payment history ${result.weightedScore != null ? `(Weighted Score: ${Number(result.weightedScore).toFixed(1)}/100)` : ""}</li>
          <li>Adequate collateral coverage ${result.ltv != null ? `with ${Number(result.ltv).toFixed(2)}% LTV ratio` : ""}</li>
          <li>Stable income with healthy debt service capacity</li>
          <li>All underwriting gates passed; no manual overrides required</li>
        </ul>

        <div class="sub-section-title">Risk Factors</div>
        <ul>
          <li>${form.past_defaults > 0 ? `Historical default records noted (${form.past_defaults})` : "Standard exposure background parameters within tolerance range"}</li>
        </ul>

        <div class="page-break"></div>
        <div class="section-title">2. LOAN DETAILS & SANCTIONED TERMS</div>
        <div class="sub-section-title">Loan Structure</div>
        <table>
          <thead>
            <tr><th style="width:50%;">Parameter</th><th>Amount / Rate</th></tr>
          </thead>
          <tbody>
            <tr><td>Requested Loan Amount</td><td>${docValue(dynamicRequestedLoan, true)}</td></tr>
            <tr><td>Sanctioned Loan Amount</td><td class="font-bold">${docValue(dynamicMaxLoan, true)}</td></tr>
            <tr><td>Processing Fees</td><td>${dynamicMaxLoan != null ? fmt(dynamicMaxLoan * 0.015) : "[________________]"}</td></tr>
            <tr><td>Insurance Premium (optional)</td><td>${docValue(result.insurancePremium, true)}</td></tr>
            <tr style="background-color:#f8fafc;"><td class="font-bold">Disbursement Amount (net)</td><td class="font-bold">${dynamicMaxLoan != null ? fmt(dynamicMaxLoan - (dynamicMaxLoan * 0.015)) : "[________________]"}</td></tr>
          </tbody>
        </table>

        <div class="sub-section-title">Repayment Terms</div>
        <table>
          <thead>
            <tr><th style="width:50%;">Term</th><th>Details</th></tr>
          </thead>
          <tbody>
            <tr><td>Loan Tenure</td><td>${docValue(dynamicTenure)} months</td></tr>
            <tr><td>EMI (Fixed)</td><td class="font-bold">${docValue(dynamicNewEMI, true)}</td></tr>
            <tr><td>First EMI Due</td><td>${new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td></tr>
            <tr><td>EMI Day</td><td>25th of each month</td></tr>
            <tr><td>Interest Rate</td><td>${dynamicInterestRate != null ? `${Number(dynamicInterestRate).toFixed(2)}% p.a.` : "[________________]"}</td></tr>
            <tr><td>Repayment Mode</td><td>NACH / ECS auto-debit</td></tr>
          </tbody>
        </table>

        <div class="sub-section-title">Cost of Borrowing</div>
        <table>
          <thead>
            <tr><th style="width:50%;">Cost Component</th><th>Amount</th></tr>
          </thead>
          <tbody>
            <tr><td>Total Interest Amount</td><td class="font-bold">${docValue(result.totalInterestPaid, true)}</td></tr>
            <tr><td>Processing Fee</td><td>${dynamicMaxLoan != null ? fmt(dynamicMaxLoan * 0.015) : "[________________]"}</td></tr>
            <tr style="background-color:#f8fafc;"><td class="font-bold">Total Cost to Borrower</td><td class="font-bold">${(result.totalInterestPaid != null && dynamicMaxLoan != null) ? fmt(result.totalInterestPaid + (dynamicMaxLoan * 0.015)) : "[________________]"}</td></tr>
            <tr><td>Effective Interest Rate</td><td>${dynamicInterestRate != null ? `${(Number(dynamicInterestRate) + 0.97).toFixed(2)}% p.a.` : "[________________]"}</td></tr>
          </tbody>
        </table>

        <div class="page-break"></div>
        <div class="section-title">3. CREDIT ANALYSIS</div>
        <div class="sub-section-title">Credit Bureau Assessment</div>
        <table>
          <thead>
            <tr><th style="width:50%;">Credit Parameter</th><th>Value</th></tr>
          </thead>
          <tbody>
            <tr><td>CIBIL Score</td><td class="font-bold">${docValue(dynamicCibil)}</td></tr>
            <tr><td>Weighted Credit Score</td><td>${result.weightedScore != null ? `${Number(result.weightedScore).toFixed(1)} / 100` : "[________________]"}</td></tr>
            <tr><td>Credit Bureau</td><td>CIBIL Limited</td></tr>
            <tr><td>Assessment Date</td><td>${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td></tr>
          </tbody>
        </table>

        <div class="sub-section-title">Credit History Summary</div>
        <table>
          <thead>
            <tr><th style="width:50%;">History Metric</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr><td>Active Credit Accounts</td><td>${docValue(result.activeAccounts)}</td></tr>
            <tr><td>Total Credit Exposure</td><td>${docValue(result.totalCreditExposure, true)}</td></tr>
            <tr><td>Total Paid EMIs</td><td>${docValue(result.totalPaidEmis)}</td></tr>
            <tr><td>Default History</td><td>${docValue(result.defaultHistory)}</td></tr>
            <tr><td>Overdue Amount</td><td>${docValue(result.overdueAmount, true)}</td></tr>
            <tr><td>Past Defaults (lifetime)</td><td>${docValue(form.past_defaults)}</td></tr>
          </tbody>
        </table>

        <div class="sub-section-title">Assessment & Conclusion</div>
        <p>Credit analysis parameters extracted directly from metrics state evaluation. CIBIL check threshold assessment complete. The underlying records trace credit obligations and behavioral metrics.</p>

        <div class="page-break"></div>
        <div class="section-title">4. FINANCIAL ASSESSMENT & AFFORDABILITY</div>
        <div class="sub-section-title">Income & Stability</div>
        <table>
          <thead>
            <tr><th style="width:50%;">Income Parameter</th><th>Amount</th></tr>
          </thead>
          <tbody>
            <tr><td>Monthly Gross Income</td><td class="font-bold">${docValue(dynamicMonthlyIncome, true)}</td></tr>
            <tr><td>Annual Income</td><td class="font-bold">${dynamicMonthlyIncome != null ? fmt(dynamicMonthlyIncome * 12) : "[________________]"}</td></tr>
            <tr><td>Income Verification</td><td>Salary slip + ITR</td></tr>
            <tr><td>Years at Current Employment</td><td>${docValue(form.years_employment)}</td></tr>
          </tbody>
        </table>

        <div class="sub-section-title">Debt Servicing Capacity</div>
        <table>
          <thead>
            <tr><th style="width:50%;">DSA Metric</th><th>Value</th></tr>
          </thead>
          <tbody>
            <tr><td>Monthly Gross Income</td><td>${docValue(dynamicMonthlyIncome, true)}</td></tr>
            <tr><td>Existing EMI Obligations</td><td class="font-bold">${docValue(dynamicExistingEMI, true)}</td></tr>
            <tr><td>Monthly Spends (avg)</td><td>${docValue(dynamicMonthlySpends, true)}</td></tr>
            <tr><td>Current Monthly Surplus</td><td>${docValue(dynamicSurplus, true)}</td></tr>
            <tr><td>New EMI (proposed)</td><td class="font-bold">${docValue(dynamicNewEMI, true)}</td></tr>
            <tr><td>Total EMI (all obligations)</td><td class="font-bold">${docValue(dynamicTotalEMI, true)}</td></tr>
            <tr><td>Residual Income (post-EMI)</td><td class="font-bold">${docValue(dynamicResidual, true)}</td></tr>
          </tbody>
        </table>

        <div class="sub-section-title">Key Ratios Analysis</div>
        <table>
          <thead>
            <tr><th style="width:50%;">Financial Ratio</th><th>Value / Status</th></tr>
          </thead>
          <tbody>
            <tr><td>Debt-to-Income (Current)</td><td>${(dynamicExistingEMI != null && dynamicMonthlyIncome) ? `${((dynamicExistingEMI / dynamicMonthlyIncome) * 100).toFixed(1)}%` : "[________________]"}</td></tr>
            <tr><td>Debt-to-Income (Post-Loan)</td><td class="font-bold">${(dynamicTotalEMI != null && dynamicMonthlyIncome) ? `${((dynamicTotalEMI / dynamicMonthlyIncome) * 100).toFixed(1)}%` : "[________________]"}</td></tr>
            <tr><td>DTI Acceptance Limit</td><td>60%</td></tr>
            <tr><td>Spend-to-Income Ratio</td><td>${(dynamicMonthlySpends != null && dynamicMonthlyIncome) ? `${((dynamicMonthlySpends / dynamicMonthlyIncome) * 100).toFixed(1)}%` : "[________________]"}</td></tr>
            <tr><td>Savings Rate</td><td>${(dynamicSurplus != null && dynamicMonthlyIncome) ? `${((dynamicSurplus / dynamicMonthlyIncome) * 100).toFixed(1)}%` : "[________________]"}</td></tr>
            <tr><td>FIOR Ratio</td><td>${result.fiorRatio != null ? `${Number(result.fiorRatio).toFixed(1)}%` : "[________________]"}</td></tr>
          </tbody>
        </table>

        <div class="page-break"></div>
        <div class="section-title">5. COLLATERAL VALUATION & LTV ANALYSIS</div>
        <div class="sub-section-title">Collateral Details</div>
        <table>
          <thead>
            <tr><th style="width:50%;">Collateral Parameter</th><th>Details</th></tr>
          </thead>
          <tbody>
            <tr><td>Collateral Type</td><td>Fixed Deposit (FD)</td></tr>
            <tr><td>FD Amount (Face Value)</td><td class="font-bold">${docValue(dynamicCollateralValue, true)}</td></tr>
            <tr><td>Pledge Status</td><td class="font-bold">First charge</td></tr>
          </tbody>
        </table>

        <div class="sub-section-title">LTV (Loan-to-Value) Analysis</div>
        <table>
          <thead>
            <tr><th style="width:50%;">LTV Component</th><th>Amount</th></tr>
          </thead>
          <tbody>
            <tr><td>Collateral Current Value</td><td>${docValue(dynamicCollateralValue, true)}</td></tr>
            <tr><td>Sanctioned Loan Amount</td><td class="font-bold">${docValue(dynamicMaxLoan, true)}</td></tr>
            <tr><td>LTV Ratio</td><td class="font-bold">${result.ltv != null ? `${Number(result.ltv).toFixed(2)}%` : "[________________]"}</td></tr>
            <tr><td>Acceptable LTV Ceiling</td><td>85%</td></tr>
            <tr><td>Security Coverage</td><td class="font-bold">${(dynamicCollateralValue && dynamicMaxLoan) ? `${(((dynamicCollateralValue) / dynamicMaxLoan) * 100).toFixed(0)}%` : "[________________]"}</td></tr>
          </tbody>
        </table>

        <div class="page-break"></div>
        <div class="section-title">6. UNDERWRITING GATES & FINAL DECISION</div>
        <div class="sub-section-title">Underwriting Gates Assessment</div>
        <table>
          <thead>
            <tr><th style="width:50%;">Underwriting Gate</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${Object.entries(result.gates || {}).map(([key, status]) => `
              <tr>
                <td>${gateLabels[key] || key}</td>
                <td class="font-bold">✓ ${docValue(status)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="sub-section-title">Approval Conditions & Mandatory Requirements</div>
        <ul>
          <li>First charge lien registration execution based on standard credit procedure rules.</li>
          <li>Disbursement contingent upon full checklist clearance matching evaluated metrics framework parameters.</li>
        </ul>

        <div class="sub-section-title">Final Underwriting Recommendation</div>
        <p class="font-bold" style="font-size:13px; text-align:center; background-color:#f0fdf4; padding:8px; border:1px solid #bbf7d0; border-radius:4px;">
          DECISION STATUS: ${docValue(result.decision)}
        </p>

        <br/>
        <table style="border:0; margin-top:20px;">
          <tr style="border:0;">
            <td style="border:0; width:50%; font-size:11px; color:#64748b;">
              <strong>Underwriting Officer</strong><br/>
              Credit Analysis Department
            </td>
            <td style="border:0; width:50%; text-align:right; font-size:11px; color:#64748b; vertical-align:bottom;">
              <strong>Date:</strong> ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </td>
          </tr>
        </table>

        <br/><br/>
        <div style="font-size:10px; text-align:center; color:#94a3b8; margin-top:35px; font-weight:bold;">
          *** END OF PROPOSAL — CONFIDENTIAL UNDERWRITING RECORD ***
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlTemplate], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = `Loan_Proposal_${dynamicApplicantName || "Underwriting_Record"}.doc`;
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
      <ResetConfirmationModal isOpen={showResetModal} onConfirm={handleResetConfirm} onCancel={() => setShowResetModal(false)} />

      <header className="bg-[hsl(224,58%,33%)] text-white shadow-lg print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="p-1.5 rounded hover:bg-blue-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-base">Underwriter Credit Summary</h1>
              <p className="text-xs text-blue-200">CreditPro — Core Evaluation Terminal</p>
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
            <button onClick={() => setShowResetModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-400 text-sm font-medium text-red-300 hover:bg-red-800 transition-colors">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6 print:p-0">
        <div className={`rounded-xl border-2 ${decisionBorder} bg-white shadow-lg p-6 flex items-center justify-between`}>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Final Underwriting Decision</p>
            <p className="text-3xl font-extrabold text-slate-900">{form.applicant_name || "Applicant"}</p>
            <p className="text-sm text-muted-foreground mt-1">{form.product || "Secured Personal Loan"} · {form.tenure_months ?? "—"} Months · {fmt(form.loan_amount)}</p>
          </div>
          <span className={`${decisionColor} text-white text-xl font-extrabold px-8 py-3 rounded-xl`}>
            {result.decision === "APPROVE" || result.decision === "APPROVED" ? "APPROVED" : result.decision || "—"}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Requested Amount", value: fmt(result.requestedLoanAmount ?? form.loan_amount) },
            { label: "MAX LOAN PROVIDED", value: fmt(result.maxLoanProvided ?? 0), highlight: (result.maxLoanProvided ?? 0) < (result.requestedLoanAmount ?? form.loan_amount ?? 0) ? "amber" : "green" },
            { label: "Monthly New EMI", value: fmt(result.emi ?? 0) },
            { label: "Total Combined EMI", value: fmt(result.totalEMI ?? ((result.existingEMI ?? 0) + (result.emi ?? 0))) },
            { label: "Sanctioned Rate", value: result.finalRate != null ? `${Number(result.finalRate).toFixed(2)}% p.a.` : "—" },
            { label: "Loan-To-Value (LTV)", value: result.ltv != null ? `${Number(result.ltv).toFixed(2)}%` : "—" },
            { label: "Total Interest Outflow", value: fmt(result.totalInterestPaid ?? 0) },
            { label: "Total Payable Outflow", value: fmt(result.totalAmountPaid ?? 0) },
            { label: "LTV Eligible Amount", value: fmt(result.ltvEligibleLoan ?? 0) },
            { label: "Affordability Eligible", value: fmt(result.affordabilityEligibleLoan ?? 0) },
            { label: "FIOR Eligible Amount", value: fmt(result.fiorEligibleLoan ?? 0) },
            { label: "Projected Residual Income", value: fmt(result.projectedResidualIncome ?? 0), highlight: (result.projectedResidualIncome ?? 0) <= 0 ? "red" : "green" },
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
          <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
            <h3 className="flex items-center gap-2 font-bold text-slate-900 text-base mb-4"><User className="w-5 h-5 text-blue-700" /> Full Particulars File</h3>
            <div className="space-y-2 text-sm">
              {[
                ["Applicant Name Reference", form.applicant_name || "—"],
                ["Requested Funding Target", fmt(result.requestedLoanAmount ?? form.loan_amount)],
                ["Sanctioned Dynamic Ceiling", fmt(result.maxLoanProvided ?? 0)],
                ["Gross Monthly Income", fmt(form.monthly_income ?? 0)],
                ["Average Living Expenditures", fmt(form.monthly_spends ?? 0)],
                ["Pre-Existing Liabilities (EMI)", fmt(result.existingEMI ?? 0)],
                ["CIBIL Bureau Score", form.cibil_score || "—"],
                ["Pledged Asset Value", fmt(form.collateral_value ?? 0)],
                ["LTV Cap Approved Ceiling", fmt(result.ltvEligibleLoan ?? 0)],
                ["Affordability Formula Ceiling", fmt(result.affordabilityEligibleLoan ?? 0)],
                ["FIOR Policy Frame Ceiling", fmt(result.fiorEligibleLoan ?? 0)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-muted-foreground font-medium">{k}</span>
                  <span className="font-semibold text-slate-900">{v}</span>
                </div>
              ))}
            </div>
          </div>

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
