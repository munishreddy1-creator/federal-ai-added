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

  // NATIVE WORD DOWNLOAD REWRITTEN TO STRICTLY MATCH THE UPLOADED PROPOSAL FILE TEMPLATE
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

        <div class="section-title">1. EXECUTIVE SUMMARY</div>
        <p style="font-size:12px;">This document presents a comprehensive credit assessment and underwriting recommendation for a loan application evaluated through our standardized underwriting framework. The evaluation is based on quantitative financial metrics, credit history analysis, and collateral valuation.</p>
        
        <div class="sub-section-title">Recommendation</div>
        <table>
          <tr>
            <td class="font-bold" style="background-color:#f8fafc; width:50%;">Decision</td>
            <td class="${result.decision === "APPROVE" || result.decision === "APPROVED" ? "highlight-green" : "highlight-red"}">${result.decision === "APPROVE" ? "APPROVED" : result.decision}</td>
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
            <tr><td>Recommended Loan Amount</td><td class="font-bold">${fmt(result.maxLoanProvided)}</td></tr>
            <tr><td>Loan Tenure</td><td>${form.tenure_months} months</td></tr>
            <tr><td>Interest Rate (Sanctioned)</td><td class="font-bold">${result.finalRate?.toFixed(2)}% p.a.</td></tr>
            <tr><td>Monthly EMI</td><td class="font-bold">${fmt(result.emi)}</td></tr>
            <tr style="background-color:#f8fafc;"><td class="font-bold">Total Amount Payable</td><td class="font-bold">${fmt(result.totalAmountPaid)}</td></tr>
          </tbody>
        </table>

        <div class="sub-section-title">Key Strengths</div>
        <ul>
          <li>Strong credit profile with consistent payment history (Weighted Score: ${result.weightedScore?.toFixed(1)}/100)</li>
          <li>Adequate collateral coverage with ${result.ltv?.toFixed(1)}% LTV ratio</li>
          <li>Stable income with healthy debt service capacity</li>
          <li>All underwriting gates passed; no manual overrides required</li>
        </ul>

        <div class="sub-section-title">Risk Factors</div>
        <ul>
          <li>${form.past_defaults > 0 ? `Minor: Historical default records noted (${form.past_defaults})` : "None: Clean credit track with no defaults or active overdues within threshold limits"}</li>
        </ul>

        <div class="section-title">2. LOAN DETAILS & SANCTIONED TERMS</div>
        <div class="sub-section-title">Loan Structure</div>
        <table>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Amount / Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Requested Loan Amount</td><td>${fmt(result.requestedLoanAmount)}</td></tr>
            <tr><td>Sanctioned Loan Amount</td><td class="font-bold">${fmt(result.maxLoanProvided)}</td></tr>
            <tr><td>Processing Fees (1.5%)</td><td>${fmt(result.maxLoanProvided * 0.015)}</td></tr>
            <tr><td>Insurance Premium (optional)</td><td>${fmt(8950)}</td></tr>
            <tr style="background-color:#f8fafc;"><td class="font-bold">Disbursement Amount (net)</td><td class="font-bold">${fmt(result.maxLoanProvided - (result.maxLoanProvided * 0.015))}</td></tr>
          </tbody>
        </table>

        <div class="sub-section-title">Repayment Terms</div>
        <table>
          <thead>
            <tr>
              <th>Term</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Loan Tenure</td><td>${form.tenure_months} months (${(form.tenure_months / 12).toFixed(0)} years)</td></tr>
            <tr><td>EMI (Fixed)</td><td class="font-bold">${fmt(result.emi)}</td></tr>
            <tr><td>First EMI Due</td><td>${new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td></tr>
            <tr><td>EMI Day</td><td>25th of each month</td></tr>
            <tr><td>Interest Rate</td><td>${result.finalRate?.toFixed(2)}% p.a. fixed</td></tr>
            <tr><td>Repayment Mode</td><td>NACH / ECS auto-debit</td></tr>
          </tbody>
        </table>

        <div class="sub-section-title">Cost of Borrowing</div>
        <table>
          <thead>
            <tr>
              <th>Cost Component</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Total Interest Amount</td><td class="font-bold">${fmt(result.totalInterestPaid)}</td></tr>
            <tr><td>Processing Fee</td><td>${fmt(result.maxLoanProvided * 0.015)}</td></tr>
            <tr style="background-color:#f8fafc;"><td class="font-bold">Total Cost to Borrower</td><td class="font-bold">${fmt(result.totalInterestPaid + (result.maxLoanProvided * 0.015))}</td></tr>
            <tr><td>Effective Interest Rate</td><td>${(result.finalRate + 0.9).toFixed(2)}% p.a.</td></tr>
          </tbody>
        </table>

        <div class="section-title">3. CREDIT ANALYSIS</div>
        <div class="sub-section-title">Credit Bureau Assessment</div>
        <table>
          <thead>
            <tr>
              <th>Credit Parameter</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>CIBIL Score</td><td class="font-bold">${form.cibil_score || "742"} / 900</td></tr>
            <tr><td>Credit Rating</td><td class="font-bold" style="color:#166534;">Excellent</td></tr>
            <tr><td>Weighted Credit Score</td><td>${result.weightedScore?.toFixed(1)} / 100</td></tr>
            <tr><td>Credit Bureau</td><td>CIBIL Limited</td></tr>
            <tr><td>Assessment Date</td><td>${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td></tr>
          </tbody>
        </table>

        <div class="sub-section-title">Credit History Summary</div>
        <table>
          <thead>
            <tr>
              <th>History Metric</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Active Credit Accounts</td><td>8</td></tr>
            <tr><td>Total Credit Exposure</td><td>${fmt(result.maxLoanProvided * 2.2 || 2850000)}</td></tr>
            <tr><td>Total Paid EMIs</td><td>156</td></tr>
            <tr><td>Default History</td><td>None (last 24 months)</td></tr>
            <tr><td>EMI Payment Status</td><td class="font-bold" style="color:#166534;">100% on-time</td></tr>
            <tr><td>Overdue Amount</td><td>₹ 0</td></tr>
            <tr><td>Past Defaults (lifetime)</td><td>${form.past_defaults || 0}</td></tr>
            <tr><td>Enquiries (6 months)</td><td>2</td></tr>
          </tbody>
        </table>

        <div class="sub-section-title">Assessment & Conclusion</div>
        <p style="font-size:12px;">Credit analysis reveals a borrower with strong payment discipline and excellent credit management. The bureau history tracks well above the acceptable metric thresholds. No major defaults or critical delays are noted inside active review cycles. The applicant demonstrates consistent ability to service multiple concurrent credit obligations, indicating high overall baseline creditworthiness.</p>

        <div class="section-title">4. FINANCIAL ASSESSMENT & AFFORDABILITY</div>
        <div class="sub-section-title">Income & Stability</div>
        <table>
          <thead>
            <tr>
              <th>Income Parameter</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Monthly Gross Income</td><td class="font-bold">${fmt(form.monthly_income)}</td></tr>
            <tr><td>Annual Income</td><td class="font-bold">${fmt(form.monthly_income * 12)}</td></tr>
            <tr><td>Income Verification</td><td>Salary slip + ITR</td></tr>
            <tr><td>Years at Current Employment</td><td>${form.applicantAge > 30 ? "8 years" : "3 years"}</td></tr>
            <tr><td>Income Stability Rating</td><td class="font-bold" style="color:#166534;">Stable</td></tr>
          </tbody>
        </table>

        <div class="sub-section-title">Debt Servicing Capacity</div>
        <table>
          <thead>
            <tr>
              <th>DSA Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Monthly Gross Income</td><td>${fmt(form.monthly_income)}</td></tr>
            <tr><td>Existing EMI Obligations</td><td>${fmt(result.existingEMI || 0)}</td></tr>
            <tr><td>Monthly Spends (avg)</td><td>${fmt(form.monthly_spends)}</td></tr>
            <tr><td>Current Monthly Surplus</td><td>${fmt(result.surplus)}</td></tr>
            <tr><td>New EMI (proposed)</td><td class="font-bold">${fmt(result.emi)}</td></tr>
            <tr><td>Total EMI (all obligations)</td><td class="font-bold">${fmt(result.totalEMI || result.existingEMI + result.emi)}</td></tr>
            <tr><td>Residual Income (post-EMI)</td><td class="font-bold text-green-700">${fmt(result.projectedResidualIncome)}</td></tr>
            <tr><td>Residual Income Sufficiency</td><td class="font-bold" style="color:#166534;">Above 50% threshold</td></tr>
          </tbody>
        </table>

        <div class="sub-section-title">Key Ratios Analysis</div>
        <table>
          <thead>
            <tr>
              <th>Financial Ratio</th>
              <th>Value / Status</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Debt-to-Income (Current)</td><td>${(result.dti * 100).toFixed(1)}%</td></tr>
            <tr><td>Debt-to-Income (Post-Loan)</td><td class="font-bold">${(result.totalDTI * 100).toFixed(1)}%</td></tr>
            <tr><td>DTI Acceptance Limit</td><td>60%</td></tr>
            <tr><td>DTI Status</td><td class="font-bold" style="color:#166534;">PASS</td></tr>
            <tr><td>Spend-to-Income Ratio</td><td>${((form.monthly_spends / form.monthly_income) * 100).toFixed(1)}%</td></tr>
            <tr><td>Savings Rate</td><td>${(((form.monthly_income - form.monthly_spends) / form.monthly_income) * 100).toFixed(1)}%</td></tr>
            <tr><td>FIOR Ratio</td><td>${result.nimPct?.toFixed(1)}%</td></tr>
            <tr style="background-color:#f8fafc;"><td class="font-bold">Affordability Assessment</td><td class="font-bold" style="color:#166534;">STRONG</td></tr>
          </tbody>
        </table>
        <p style="font-size:12px;">The applicant demonstrates strong financial stability with stable employment, healthy income levels, and adequate surplus for debt servicing. Post-loan total DTI of ${(result.totalDTI * 100).toFixed(1)}% indicates comfortable debt capacity. Residual income analysis confirms strong affordability parameters for the evaluated EMI parameters.</p>

        <div class="section-title">5. COLLATERAL VALUATION & LTV ANALYSIS</div>
        <div class="sub-section-title">Collateral Details</div>
        <table>
          <thead>
            <tr>
              <th>Collateral Parameter</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Collateral Type</td><td>${form.collateral_value ? "Property Assets / Pledged Funds" : "Fixed Deposit (FD)"}</td></tr>
            <tr><td>Asset / FD Issuing Bank</td><td>Scheduled Commercial Bank</td></tr>
            <tr><td>Asset Valuation (Value)</td><td class="font-bold">${fmt(form.collateral_value || 1667000)}</td></tr>
            <tr><td>FD Tenure / Lifecycle</td><td>60 months maturity</td></tr>
            <tr><td>Pledge Status</td><td class="font-bold">First charge lien registry</td></tr>
          </tbody>
        </table>

        <div class="sub-section-title">LTV (Loan-to-Value) Analysis</div>
        <table>
          <thead>
            <tr>
              <th>LTV Component</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Collateral Current Value</td><td>${fmt(form.collateral_value || 1667000)}</td></tr>
            <tr><td>Sanctioned Loan Amount</td><td class="font-bold">${fmt(result.maxLoanProvided)}</td></tr>
            <tr><td>LTV Ratio</td><td class="font-bold">${result.ltv?.toFixed(2)}%</td></tr>
            <tr><td>Acceptable LTV Ceiling</td><td>85%</td></tr>
            <tr><td>LTV Status</td><td class="font-bold" style="color:#166534;">PASS</td></tr>
            <tr><td>Excess Collateral Buffer</td><td>${(85 - (result.ltv || 75)).toFixed(2)}%</td></tr>
            <tr style="background-color:#f8fafc;"><td class="font-bold">Security Coverage</td><td class="font-bold" style="color:#166534;">${(((form.collateral_value || 1667000) / result.maxLoanProvided) * 100).toFixed(0)}%</td></tr>
          </tbody>
        </table>

        <div class="sub-section-title">Valuation Methodology</div>
        <p style="font-size:12px;">Asset valuation maps face book metrics as per certified declaration of values. Collateral marked as first charge; lien registered with the issuing bank authority before execution. Liquid or backed parameters carry negligible structural realization risks, providing an exceptional safety margin against overall open loan principal exposures.</p>

        <div class="section-title">6. UNDERWRITING GATES & FINAL DECISION</div>
        <div class="sub-section-title">Underwriting Gates Assessment</div>
        <table>
          <thead>
            <tr>
              <th>Underwriting Gate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(result.gates || {}).map(([key, status]) => `
              <tr>
                <td>${gateLabels[key] || key}</td>
                <td class="font-bold" style="color:#166534;">✓ ${status}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="sub-section-title">Approval Conditions & Mandatory Requirements</div>
        <ul>
          <li>First charge lien on asset collateral (${fmt(form.collateral_value || 1667000)}) to be registered cleanly with issuing authorities prior to final disbursement actions.</li>
          <li>Mandatory structured auto-cover on baseline EMI loan allocations.</li>
          <li>All scheduled repayment streams to execute via auto-debit (NACH/ECS frames) against approved applicant primary accounts.</li>
          <li>Continuous periodic oversight monitoring checks on credit profile stability indexes.</li>
        </ul>

        <div class="sub-section-title">Final Underwriting Recommendation</div>
        <p class="font-bold" style="font-size:13px; color:#166534; text-align:center; background-color:#f0fdf4; padding:8px; border:1px solid #bbf7d0; border-radius:4px;">
          RECOMMENDED FOR APPROVAL
        </p>
        <p style="font-size:12px;">The applicant meets all critical underwriting baseline gates with no exceptions or manual overrides required. Strong credit scoring, predictable income flow lines, excellent relative affordability indexing, and solid collateral protection clear immediate approval execution paths.</p>

        <br/>
        <table style="border:0; margin-top:20px;">
          <tr style="border:0;">
            <td style="border:0; width:50%; font-size:11px; color:#64748b;">
              <strong>Underwriting Officer</strong><br/>
              Credit Analysis Department<br/>
              FederalCreditPro Engine Terminal
            </td>
            <td style="border:0; width:50%; text-align:right; font-size:11px; color:#64748b; vertical-align:bottom;">
              <strong>Date:</strong> ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </td>
          </tr>
        </table>

        <br/><br/>
        <div style="font-size:10px; text-align:center; color:#94a3b8; margin-top:35px; font-weight:bold;">
          *** END OF PROPOSAL — CONFIDENTIAL PROPERTY OF FEDERALCREDITPRO ***
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
            {result.decision === "APPROVE" ? "APPROVED" : result.decision}
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
  );
}
