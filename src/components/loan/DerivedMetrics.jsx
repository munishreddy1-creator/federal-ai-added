import React from "react";
import { Activity } from "lucide-react";

function fmt(n) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export default function DerivedMetrics({ result }) {
  if (!result) return null;

  const metrics = [
    { label: "DTI Ratio", value: `${(result.dti * 100).toFixed(1)}%`, desc: "Obligations / Income" },
    { label: "Total DTI", value: `${(result.totalDTI * 100).toFixed(1)}%`, desc: "Including new EMI" },
    { label: "Spend-to-Income", value: `${(result.spendToIncome * 100).toFixed(1)}%`, desc: "Spends / Income" },
    { label: "LTV Ratio", value: `${result.ltv.toFixed(1)}%`, desc: `Cap: ${result.ltvCap}%` },
    {
      label: "Monthly Surplus",
      value: fmt(result.surplus),
      desc: "Income − Obligations − Spends",
      highlight: result.surplus < 0 ? "red" : "neutral",
    },
    {
      label: "Projected Residual Income",
      value: fmt(result.projectedResidualIncome),
      desc: "After new EMI",
      highlight: result.projectedResidualIncome <= 0 ? "red" : result.projectedResidualIncome < result.surplus * 0.15 ? "amber" : "green",
    },
    {
      label: "Current Residual",
      value: fmt(result.residualIncome),
      desc: "Before new EMI",
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
        Computed Ratios & Metrics
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-4">
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
              <p className={`text-lg font-bold ${textColor}`}>{m.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{m.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Credit Risk Indicators */}
      {result.creditRisk?.hasCreditRisk && (
        <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200">
          <h4 className="text-sm font-semibold text-red-800 mb-2">⚠️ Credit Risk Detected</h4>
          <div className="text-sm text-red-700 space-y-1">
            {result.activeOverdueAmount > 0 && (
              <p>• Active Overdue: ₹{Math.round(result.activeOverdueAmount).toLocaleString("en-IN")}</p>
            )}
            {result.emiDefaultCount > 0 && <p>• EMI Defaults: {result.emiDefaultCount}</p>}
            {result.overdueEMICount > 0 && <p>• Overdue EMIs: {result.overdueEMICount}</p>}
          </div>
        </div>
      )}

      {/* Age Adjustment */}
      {result.isAgeAdjusted && (
        <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-800 mb-1">📋 Age-Based Adjustment</h4>
          <p className="text-sm text-blue-700">{result.ageAdjustmentReason}</p>
        </div>
      )}

      {/* Festive Season Indicator */}
      {result.isFestiveSeason && (
        <div className="mt-6 p-4 rounded-lg bg-green-50 border border-green-200">
          <h4 className="text-sm font-semibold text-green-800 mb-1">🎉 Festive Season LTV Applied</h4>
          <p className="text-sm text-green-700">Auto Loan LTV cap raised to 95%</p>
        </div>
      )}
    </div>
  );
}
