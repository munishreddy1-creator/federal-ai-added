import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, User, IndianRupee, ShieldCheck, ShieldX, ShieldAlert, Sparkles, X, FileText } from "lucide-react";
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
// COMPONENT 1: LOAN PROPOSAL PRINT LAYOUT
// ============================================================================
function LoanProposalPrintLayout({ form, result }) {
  if (!form || !result) return null;

  const cur = (val) => val != null ? `₹${Math.round(val).toLocaleString("en-IN")}` : "—";
  const pct = (val) => val != null ? `${(val).toFixed(2)}%` : "—";

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
            <td className="p-2">{form.product}</td>
            <td className="p-2 font-bold bg-slate-50">Underwriter</td>
            <td className="p-2">Credit Analysis Department</td>
          </tr>
        </tbody>
      </table>

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
                  <td className="p-2 bg-slate-100">{cur(result.maxLoanProvided)}</td>
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
          </tbody>
        </table>
      </div>

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
              <td className="p-2">{cur(result.existingEMI || form.monthly_obligations)}</td>
              <td className="p-2 bg-slate-50 font-bold">Consolidated Aggregate Total EMI Load</td>
              <td className="p-2 font-bold">{cur(result.totalEMI || (result.emi + (form.existingEMI || 0)))}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-8">
        <h2 className="text-xs font-bold text-slate-950 bg-slate-100 p-1 mb-2 uppercase tracking-wider border-l-2 border-slate-900 pl-2">5. Core Risk Gate Assessment Matrix</h2>
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
// COMPONENT 3: MAIN UNDERWRITER ROUTE WORKSPACE
// ============================================================================
export default function UnderwriterSummary() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [isDocxReady, setIsDocxReady] = useState(false);

  // Load CDN Script assets on-the-fly dynamically without using local bash terminal installers
  useEffect(() => {
    const saved = localStorage.getItem("loanApplication");
    if (saved) {
      try { setData(JSON.parse(saved)); } catch {}
    }

    if (!window.docx) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/docx@8.5.0/build/index.js";
      script.async = true;
      script.onload = () => setIsDocxReady(true);
      document.body.appendChild(script);
    } else {
      setIsDocxReady(true);
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

  // CLIENT SIDE DIRECT DOCX BUILD GENERATOR
  const generateAndDownloadDocx = () => {
    if (!window.docx) {
      alert("Word Compilation engine asset is still fetching from CDN network. Please try again in a brief second.");
      return;
    }

    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel } = window.docx;

    const curVal = (v) => v != null ? `₹ ${Math.round(v).toLocaleString("en-IN")}` : "—";
    const pctVal = (v) => v != null ? `${v.toFixed(2)}%` : "—";
    
    const borderLayout = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
    const borders = { top: borderLayout, bottom: borderLayout, left: borderLayout, right: borderLayout, insideH: borderLayout, insideV: borderLayout };
    const padding = { top: 120, bottom: 120, left: 150, right: 150 };

    const doc = new Document({
      sections: [{
        children: [
          // HEADER TITLE
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: "LOAN PROPOSAL", bold: true, size: 48, color: "0F172A" })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: "Bank Credit Assessment & Underwriting Report", italic: true, size: 24, color: "475569" })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [new TextRun({ text: "CONFIDENTIAL - FOR AUTHORIZED USE ONLY", bold: true, size: 18, color: "94A3B8" })],
          }),

          // META MATRIX
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: "F8FAFC" }, margins: padding, children: [new Paragraph({ children: [new TextRun({ text: "Proposal Number", bold: true })] })] }),
                  new TableCell({ margins: padding, children: [new Paragraph(`LN-2026-${(form.savings_balance || 5847).toString().slice(-4)}`)] }),
                  new TableCell({ shading: { fill: "F8FAFC" }, margins: padding, children: [new Paragraph({ children: [new TextRun({ text: "Proposal Date", bold: true })] })] }),
                  new TableCell({ margins: padding, children: [new Paragraph(new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }))] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: "F8FAFC" }, margins: padding, children: [new Paragraph({ children: [new TextRun({ text: "Loan Product", bold: true })] })] }),
                  new TableCell({ margins: padding, children: [new Paragraph(form.product)] }),
                  new TableCell({ shading: { fill: "F8FAFC" }, margins: padding, children: [new Paragraph({ children: [new TextRun({ text: "Underwriter", bold: true })] })] }),
                  new TableCell({ margins: padding, children: [new Paragraph("Credit Analysis Department")] }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: "", spacing: { after: 300 } }),

          // SECTION 1
          new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 150 }, children: [new TextRun({ text: "1. EXECUTIVE SUMMARY", bold: true, size: 26 })] }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun(`This document presents a comprehensive credit assessment and underwriting recommendation for the loan application evaluated for ${form.applicant_name || "Applicant"} through our automated core retail underwriting framework.`)]
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "Recommendation Status: ", bold: true }),
              new TextRun({ text: result.decision === "APPROVE" ? "APPROVED" : "REJECTED", bold: true, color: result.decision === "APPROVE" ? "15803D" : "B91C1C" })
            ]
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: "F1F5F9" }, margins: padding, children: [new Paragraph({ children: [new TextRun({ text: "Metric Parameter", bold: true })] })] }),
                  new TableCell({ shading: { fill: "F1F5F9" }, margins: padding, children: [new Paragraph({ children: [new TextRun({ text: "Sanctioned Assessment Value", bold: true })] })] }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ margins: padding, children: [new Paragraph("Recommended Max Loan Allocation")] }),
                  new TableCell({ margins: padding, children: [new Paragraph({ children: [new TextRun({ text: curVal(result.maxLoanProvided), bold: true })] })] }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ margins: padding, children: [new Paragraph("Approved Loan Tenure")] }),
                  new TableCell({ margins: padding, children: [new Paragraph(`${form.tenure_months} months`)] }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ margins: padding, children: [new Paragraph("Interest Rate Index")] }),
                  new TableCell({ margins: padding, children: [new Paragraph({ children: [new TextRun({ text: pctVal(result.finalRate), bold: true })] })] }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ margins: padding, children: [new Paragraph("Calculated Monthly Instalment (EMI)")] }),
                  new TableCell({ margins: padding, children: [new Paragraph({ children: [new TextRun({ text: curVal(result.emi), bold: true })] })] }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: "F8FAFC" }, margins: padding, children: [new Paragraph("Aggregate Outflow Maturity Value")] }),
                  new TableCell({ shading: { fill: "F8FAFC" }, margins: padding, children: [new Paragraph({ children: [new TextRun({ text: curVal(result.totalAmountPaid), bold: true })] })] }),
                ]
              }),
            ]
          }),
          new Paragraph({ text: "", spacing: { after: 300 } }),

          // SECTION 2
          new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 150 }, children: [new TextRun({ text: "2. LOAN DETAILS & SANCTIONED TERMS", bold: true, size: 26 })] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: "F8FAFC" }, margins: padding, children: [new Paragraph("Requested Funding Capital")] }),
                  new TableCell({ margins: padding, children: [new Paragraph(curVal(form.loan_amount))] }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: "F8FAFC" }, margins: padding, children: [new Paragraph("Pledged Asset Margin Valuation")] }),
                  new TableCell({ margins: padding, children: [new Paragraph(curVal(form.collateral_value))] }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: "F8FAFC" }, margins: padding, children: [new Paragraph("Aggregate Yield Outflow Interest")] }),
                  new TableCell({ margins: padding, children: [new Paragraph(curVal(result.totalInterestPaid))] }),
                ]
              }),
            ]
          }),
          new Paragraph({ text: "", spacing: { after: 300 } }),

          // SECTION 3
          new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 150 }, children: [new TextRun({ text: "3. BUREAU PROFILE & CREDIT ANALYSIS", bold: true, size: 26 })] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: "F8FAFC" }, margins: padding, children: [new Paragraph("Bureau Score Index")] }),
                  new TableCell({ margins: padding, children: [new Paragraph(`${form.cibil_score} / 900`)] }),
                  new TableCell({ shading: { fill: "F8FAFC" }, margins: padding, children: [new Paragraph("Weighted Score Factor")] }),
                  new TableCell({ margins: padding, children: [new Paragraph(pctVal(result.weightedScore))] }),
                ]
              }),
            ]
          }),
          new Paragraph({ text: "", spacing: { after: 300 } }),

          // SECTION 4
          new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 150 }, children: [new TextRun({ text: "4. FINANCIAL SOLVENCY & AFFORDABILITY", bold: true, size: 26 })] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: "F8FAFC" }, margins: padding, children: [new Paragraph("Operating Net Monthly Income")] }),
                  new TableCell({ margins: padding, children: [new Paragraph(curVal(form.monthly_income))] }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: "F8FAFC" }, margins: padding, children: [new Paragraph("Post-Execution Debt-To-Income (DTI)")] }),
                  new TableCell({ margins: padding, children: [new Paragraph(pctVal(result.totalDTI * 100))] }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: "F8FAFC" }, margins: padding, children: [new Paragraph("Free Liquid Residual Income Pool")] }),
                  new TableCell({ margins: padding, children: [new Paragraph(curVal(result.projectedResidualIncome))] }),
                ]
              }),
            ]
          }),
          new Paragraph({ text: "", spacing: { after: 300 } }),

          // SECTION 5
          new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 150 }, children: [new TextRun({ text: "5. CORE RISK VALIDATION POLICY GATES", bold: true, size: 26 })] }),
          ...Object.entries(result.gates).map(([key, status]) => {
            return new Paragraph({
              bullet: { level: 0 },
              children: [
                new TextRun({ text: `${gateLabelsMap[key] || key}: `, bold: true }),
                new TextRun({ text: status === "PASS" ? "✓ PASS" : "🗙 REJECT", bold: true, color: status === "PASS" ? "15803D" : "B91C1C" })
              ]
            });
          }),
          new Paragraph({ text: "", spacing: { after: 400 } }),

          new Paragraph({ children: [new TextRun({ text: "RECOMMENDED FOR IMMEDIATE DISBURSEMENT", bold: true, size: 22, color: "15803D" })] }),
          new Paragraph({ children: [new TextRun({ text: "Credit Analysis Department Underwriting Officer" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300 }, children: [new TextRun({ text: "*** END OF PROPOSAL MANIFEST ***", size: 16, color: "94A3B8" })] }),
        ]
      }]
    });

    Packer.toBlob(doc).then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Loan_Proposal_${form.applicant_name || "Manifest"}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    });
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
                <p className="text-xs text-blue-200">FederalCreditPro — Automated Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSummarize} disabled={loading} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-400 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                <Sparkles className="w-4 h-4" /> Summary
              </button>

              {/* ACTION LINK WITH NO BASH/TERMINAL DEPENDENCIES AT ALL */}
              <button onClick={generateAndDownloadDocx} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-400 text-sm font-medium text-emerald-300 hover:bg-emerald-800 transition-colors">
                <FileText className="w-4 h-4" /> Download Word (.docx)
              </button>

              <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-400 text-sm font-medium hover:bg-blue-700 transition-colors">
                <Printer className="w-4 h-4" /> Print / PDF
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          <div className={`rounded-xl border-2 ${decisionBorder} bg-white shadow-lg p-6 flex items-center justify-between`}>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Final Underwriting Decision</p>
              <p className="text-3xl font-extrabold text-foreground">{form.applicant_name || "Applicant"}</p>
              <p className="text-sm text-muted-foreground mt-1">{form.product} · {form.tenure_months} months · {fmt(form.loan_amount)}</p>
            </div>
            <span className={`${decisionColor} text-white text-xl font-extrabold px-8 py-3 rounded-xl`}>{result.decision}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Monthly Income", value: fmt(form.monthly_income) },
              { label: "New EMI", value: fmt(result.emi) },
              { label: "Interest Rate", value: `${result.finalRate.toFixed(2)}%` },
              { label: "LTV Ratio", value: `${result.ltv.toFixed(1)}%` },
              { label: "Total DTI", value: `${(result.totalDTI * 100).toFixed(1)}%` },
              { label: "Projected Residual Income", value: fmt(result.projectedResidualIncome) },
              { label: "Total Interest Outflow", value: fmt(result.totalInterestPaid) },
              { label: "MAX LOAN PROVIDED", value: fmt(result.maxLoanProvided) },
            ].map((item) => (
              <div key={item.label} className="rounded-xl shadow p-4 bg-white">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{item.label}</p>
                <p className="text-lg font-bold text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-5">
              <h3 className="flex items-center gap-2 font-semibold text-base mb-4"><User className="w-5 h-5 text-blue-700" /> Applicant Particulars</h3>
              <div className="space-y-2 text-sm">
                {[
                  ["Applicant Name", form.applicant_name || "—"],
                  ["Loan Product Assigned", form.product],
                  ["Tenure Period", `${form.tenure_months} months`],
                  ["Raw Credit Bureau Score", form.cibil_score],
                  ["Pledged Core Value", fmt(form.collateral_value)],
                  ["Max Allocatable Capital", fmt(result.maxLoanProvided)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-muted-foreground font-medium">{k}</span>
                    <span className="font-semibold text-slate-900">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-5">
              <h3 className="flex items-center gap-2 font-semibold text-base mb-4"><ShieldCheck className="w-5 h-5 text-blue-700" /> Core Compliance Policy Gates</h3>
              <div className="space-y-2">
                {Object.entries(result.gates).map(([key, status]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-muted-foreground font-medium">{gateLabels[key]}</span>
                    <GateBadge status={status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      <LoanProposalPrintLayout form={form} result={result} />
    </div>
  );
}
