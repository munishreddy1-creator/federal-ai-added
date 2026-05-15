import React from "react";
import { ClipboardList } from "lucide-react";

function fmt(n) {
  if (n == null) return "—";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function GateBadge({ status }) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  const cls =
    status === "PASS"
      ? "bg-green-100 text-green-700 border-green-200"
      : status === "MANUAL"
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-red-100 text-red-700 border-red-200";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {status}
    </span>
  );
}

export default function MetricsTable({ form, result }) {
  if (!result) return null;

  const rows = [
    { metric: "Product", value: form.product },
    { metric: "Applicant Age", value: form.applicantAge ? `${form.applicantAge} years` : "—" },
    { metric: "Occupation Type", value: form.occupationType || "—" },
    ...(result.isAgeAdjusted ? [{ metric: "Age-Based Adjustment", value: result.ageAdjustmentReason }] : []),
    ...(result.isFestiveSeason ? [{ metric: "🎉 Festive Season", value: "LTV Cap: 95%" }] : []),
    { metric: "CIBIL Score", value: `${form.cibil_score}` },
    { metric: "CIBIL Gate", value: <GateBadge status={result.gates.cibil} /> },
    { metric: "DTI (Current)", value: `${(result.dti * 100).toFixed(1)}%` },
    { metric: "DTI (Total with Existing + New EMI)", value: `${(result.totalDTI * 100).toFixed(1)}%`, gate: <GateBadge status={result.gates.dti} /> },
    { metric: "LTV", value: `${result.ltv.toFixed(1)}% (Cap: ${result.ltvCap}%)`, gate: <GateBadge status={result.gates.ltv} /> },
    { metric: "Spend-to-Income", value: `${(result.spendToIncome * 100).toFixed(1)}%`, gate: <GateBadge status={result.gates.spend} /> },
    { metric: "Existing EMI", value: fmt(result.existingEMI) },
    { metric: "New EMI", value: fmt(result.emi) },
    { metric: "Total EMI", value: fmt(result.totalEMI) },
    { metric: "Requested Loan Amount", value: fmt(result.requestedLoanAmount) },
    { metric: "LTV Eligible Amount", value: fmt(result.ltvEligibleLoan) },
    { metric: "Affordability Eligible Amount", value: fmt(result.affordabilityEligibleLoan) },
    { metric: "FIOR Eligible Amount", value: fmt(result.fiorEligibleLoan) },
    { metric: "Underwriting Eligible Amount", value: fmt(result.underwritingEligibleLoan) },
    { metric: "MAX LOAN PROVIDED", value: fmt(result.maxLoanProvided), highlight: result.maxLoanProvided < result.requestedLoanAmount ? "amber" : "green" },
    { metric: "EMI Affordability", value: `${fmt(result.emi)} / ${fmt(result.surplus)} surplus`, gate: <GateBadge status={result.gates.emi} /> },
    { metric: "Monthly Surplus", value: fmt(result.surplus) },
    { metric: "Residual Income (Current)", value: fmt(result.residualIncome) },
    { metric: "Projected Residual Income", value: `${fmt(result.projectedResidualIncome)}`, highlight: result.projectedResidualIncome <= 0 ? "red" : "green" },
    { metric: "Stress Test", value: `${fmt(result.stressEMI)} at ${result.stressRate?.toFixed(2)}%`, gate: <GateBadge status={result.gates.stress} /> },
    ...(result.creditRisk?.hasCreditRisk ? [
      { metric: "🚨 Active Overdue Amount", value: fmt(result.activeOverdueAmount), highlight: "red" },
      { metric: "EMI Default Count", value: result.emiDefaultCount },
      { metric: "Overdue EMI Count", value: result.overdueEMICount },
    ] : []),
    { metric: "Weighted Credit Score", value: `${result.weightedScore.toFixed(1)} / 100` },
    { metric: "Rate Band", value: `${result.rateBand.min}% – ${result.rateBand.max}%` },
    { metric: "Final Rate", value: `${result.finalRate.toFixed(2)}%` },
    { metric: "Cost of Funds", value: `${result.costOfFunds}%` },
    { metric: "NIM", value: `${result.nimPct.toFixed(2)}%` },
    { metric: "Total Interest Paid", value: fmt(result.totalInterestPaid) },
    { metric: "Total Amount Payable", value: `${fmt(result.totalAmountPaid)} (Principal + Interest)` },
    { metric: "Max Safe Loan Amount", value: fmt(result.maxSafeLoanAmount) },
    { metric: "Decision", value: result.decision },
    { metric: "Decision Reason", value: result.decisionReason || "—" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <ClipboardList className="w-5 h-5 text-blue-700" />
          Detailed Metrics
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Metric</th>
              <th className="px-4 py-3 text-left">Value</th>
              <th className="px-4 py-3 text-left">Gate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const bgColor = row.highlight === "red" ? "bg-red-50" : row.highlight === "green" ? "bg-green-50" : row.highlight === "amber" ? "bg-amber-50" : "hover:bg-slate-50";
              const textColor = row.highlight === "red" ? "text-red-700" : row.highlight === "green" ? "text-green-700" : row.highlight === "amber" ? "text-amber-700" : "text-foreground";
              return (
                <tr key={i} className={`border-t border-gray-50 ${bgColor} transition-colors`}>
                  <td className="px-4 py-2.5 font-medium text-muted-foreground">{row.metric}</td>
                  <td className={`px-4 py-2.5 font-semibold ${textColor}`}>{row.value}</td>
                  <td className="px-4 py-2.5">{row.gate || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
