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
    { metric: "CIBIL Gate", value: <GateBadge status={result.gates.cibil} /> },
    { metric: "DTI", value: `${(result.dti * 100).toFixed(1)}%`, gate: <GateBadge status={result.gates.dti} /> },
    { metric: "LTV", value: `${result.ltv.toFixed(1)}% (Cap: ${result.ltvCap}%)`, gate: <GateBadge status={result.gates.ltv} /> },
    { metric: "Spend-to-Income", value: `${(result.spendToIncome * 100).toFixed(1)}%`, gate: <GateBadge status={result.gates.spend} /> },
    { metric: "EMI Affordability", value: `${fmt(result.emi)} / ${fmt(result.surplus)} surplus`, gate: <GateBadge status={result.gates.emi} /> },
    { metric: "Weighted Score", value: `${result.weightedScore.toFixed(1)} / 100` },
    { metric: "Rate Band", value: `${result.rateBand.min}% – ${result.rateBand.max}%` },
    { metric: "Final Rate", value: `${result.finalRate.toFixed(2)}%` },
    { metric: "Monthly EMI", value: fmt(result.emi) },
    { metric: "Total Interest Paid", value: fmt(result.totalInterestPaid) },
    { metric: "Total Amount Payable", value: `${fmt(result.totalAmountPaid)} (Principal + Interest)` },
    { metric: "Monthly Surplus", value: fmt(result.surplus) },
    { metric: "Decision", value: result.decision },
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
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2.5 font-medium text-muted-foreground">{row.metric}</td>
                <td className="px-4 py-2.5 font-semibold">{row.value}</td>
                <td className="px-4 py-2.5">{row.gate || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
