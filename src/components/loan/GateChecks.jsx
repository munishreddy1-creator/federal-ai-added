import React from "react";
import { Shield, ShieldCheck, ShieldAlert, ShieldX, AlertTriangle } from "lucide-react";

const gateLabels = {
  cibil: "CIBIL Score Gate",
  spend: "Spend-to-Income Gate",
  dti: "Total DTI Gate",
  ltv: "LTV Cap Gate",
  emi: "EMI Affordability Gate",
  stress: "Stress Test (Rate +2%)",
  residual: "Residual Income Gate",  
};

function GateBadge({ status }) {
  if (status === "PASS") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
        <ShieldCheck className="w-3 h-3" /> PASS
      </span>
    );
  }
  if (status === "MANUAL") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
        <ShieldAlert className="w-3 h-3" /> MANUAL
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
      <ShieldX className="w-3 h-3" /> REJECT
    </span>
  );
}

export default function GateChecks({ gates, decision, result }) {
  if (!gates) return null;

  const decisionBg =
    decision === "APPROVE"
      ? "bg-green-600"
      : decision === "REJECT"
      ? "bg-red-600"
      : "bg-amber-600";

  const showCreditRiskWarning = result?.creditRisk?.hasCreditRisk && decision === "MANUAL_REVIEW";

  return (
    <div className="bg-white rounded-xl shadow-lg p-5">
      <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
        <Shield className="w-5 h-5 text-blue-700" />
        Gate Checks & Decision
      </h3>

      {/* Credit Risk Warning */}
      {showCreditRiskWarning && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Application moved to manual review</p>
            <p className="text-xs text-red-700 mt-1">Due to active credit risk. Please review further.</p>
          </div>
        </div>
      )}

      {/* Affordability Status */}
      {result?.projectedResidualIncome !== undefined && (
        <div className={`mb-4 p-3 rounded-lg border ${
          result.projectedResidualIncome > 0 
            ? "bg-green-50 border-green-200" 
            : "bg-red-50 border-red-200"
        }`}>
          <p className={`text-xs font-medium ${
            result.projectedResidualIncome > 0
              ? "text-green-700"
              : "text-red-700"
          }`}>
            Projected Residual Income: ₹{Math.round(result.projectedResidualIncome).toLocaleString("en-IN")} 
            {result.projectedResidualIncome <= 0 && (
              <span className="block mt-1 font-semibold">⚠️ Insufficient income after EMI – Not affordable</span>
            )}
          </p>
        </div>
      )}

      {/* Gate Results */}
      <div className="space-y-3 mb-4">
        {Object.entries(gates).map(([key, status]) => (
          <div
            key={key}
            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
          >
            <span className="text-sm font-medium text-muted-foreground">{gateLabels[key]}</span>
            <GateBadge status={status} />
          </div>
        ))}
      </div>

      {/* Final Decision */}
      <div className="pt-3 flex items-center justify-between">
        <span className="text-sm font-bold">Final Decision</span>
        <span className={`${decisionBg} text-white text-sm font-bold px-4 py-1.5 rounded-full`}>
          {decision}
        </span>
      </div>
    </div>
  );
}
