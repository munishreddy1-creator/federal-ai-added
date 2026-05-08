import React from "react";
import { BarChart3 } from "lucide-react";

const scoreLabels = {
  cibil: { label: "CIBIL Score", weight: "25%" },
  dti: { label: "DTI Ratio", weight: "20%" },
  ltv: { label: "LTV Ratio", weight: "20%" },
  income: { label: "Income", weight: "10%" },
  defaults: { label: "Past Defaults", weight: "10%" },
  spend: { label: "Spend Ratio", weight: "10%" },
  liquidity: { label: "Liquidity", weight: "5%" },
};

function getScoreColor(score) {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-amber-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

export default function ScoreBreakdown({ scores, weightedScore }) {
  if (!scores) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-5">
      <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
        <BarChart3 className="w-5 h-5 text-blue-700" />
        Score Breakdown
        <span className="ml-auto text-sm font-normal text-muted-foreground">
          Weighted: <span className="font-bold text-foreground">{weightedScore?.toFixed(1)}</span>/100
        </span>
      </h3>
      <div className="space-y-3">
        {Object.entries(scores).map(([key, value]) => {
          const { label, weight } = scoreLabels[key];
          return (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {label} <span className="text-xs">({weight})</span>
                </span>
                <span className="font-semibold">{value}/100</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${getScoreColor(value)}`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
