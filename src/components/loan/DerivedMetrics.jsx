import React from "react";
import { Activity } from "lucide-react";

function fmt(n) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export default function DerivedMetrics({ result }) {
  if (!result) return null;

  const metrics = [
    { label: "DTI Ratio", value: `${(result.dti * 100).toFixed(1)}%`, desc: "Obligations / Income" },
    { label: "Spend-to-Income", value: `${(result.spendToIncome * 100).toFixed(1)}%`, desc: "Spends / Income" },
    { label: "LTV Ratio", value: `${result.ltv.toFixed(1)}%`, desc: `Cap: ${result.ltvCap}%` },
    { label: "Monthly Surplus", value: fmt(result.surplus), desc: "Income − Obligations − Spends" },
    {
      label: "Residual Income",
      value: fmt(result.residualIncome),
      desc: "After EMI too",
      highlight: result.residualIncome < 0 ? "red" : result.residualIncome < result.surplus * 0.15 ? "amber" : "green",
    },
    {
      label: "Stress EMI (+2%)",
      value: fmt(result.stressEMI),
      desc: `At ${result.stressRate?.toFixed(2)}% rate`,
      highlight: result.stressEMI > result.surplus ? "red" : "neutral",
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-5">
      <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
        <Activity className="w-5 h-5 text-blue-700" />
        Computed Ratios
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((m) => {
          const bg =
            m.highlight === "red"
              ? "bg-red-50 border border-red-200"
              : m.highlight === "amber"
              ? "bg-amber-50 border border-amber-200"
              : m.highlight === "green"
              ? "bg-green-50 border border-green-200"
              : "bg-slate-50";
          const textColor =
            m.highlight === "red"
              ? "text-red-700"
              : m.highlight === "amber"
              ? "text-amber-700"
              : m.highlight === "green"
              ? "text-green-700"
              : "text-foreground";
          return (
            <div key={m.label} className={`text-center p-3 rounded-lg ${bg}`}>
              <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
              <p className={`text-xl font-bold ${textColor}`}>{m.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{m.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
