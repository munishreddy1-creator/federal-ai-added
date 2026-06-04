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

function docValue(val, isCurrency = false) {
  if (val === null || val === undefined || val === "") {
    return "[________________]";
  }
  return isCurrency ? fmt(val) : val;
}

function GateBadge({ status }) {
  if (status === "PASS" || status === "✓ PASS")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200"><ShieldCheck className="w-3 h-3" />PASS</span>;
  if (status === "MANUAL")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200"><ShieldAlert className="w-3 h-3" />MANUAL</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200"><ShieldX className="w-3 h-3" />REJECT</span>;
}

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
          <p>Are you sure you want to reset? This will clear all loan application data and return you to the calculator with blank fields.</p>
          <p className="text-xs text-slate-500">This action cannot be undone.</p>
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
    localStorage.removeItem("loanApplication");
    setShowResetModal(false);
    navigate("/");
  };

  const downloadNativeDocx = () => {
    if (!data) return;
    const { form, result } = data;

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
        <p>This document presents a comprehensive credit assessment and underwriting recommendation for a loan application evaluated through our standardized underwriting framework.</p>
        <div class="sub-section-title">Recommendation</div>
        <table>
          <tr>
            <td class="font-bold" style="background-color:#f8fafc; width:50%;">Decision</td>
            <td class="${result.decision === "APPROVE" || result.decision === "APPROVED" ? "highlight-green" : "highlight-red"}">${docValue(result.decision)}</td>
          </tr>
        </table>
        <table>
          <thead><tr><th style="width:50%;">Metric</th><th>Value</th></tr></thead>
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
          <li>Strong credit profile ${result.weightedScore != null ? `(Wei
