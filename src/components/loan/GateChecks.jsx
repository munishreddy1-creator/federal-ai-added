import React from "react";
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

const gateLabels = {
  cibil: "CIBIL Score Gate",
  spend: "Spend-to-Income Gate",
  dti: "DTI Ratio Gate",
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

export default function GateChecks({ gates, decision }) {
  if (!gates) return null;

  const decisionBg =
    decision === "APPROVE"
      ? "bg-green-600"
      : decision === "REJECT"
      ? "bg-red-600"
      : "bg-amber-600";

  return (
    <div className="bg-white rounded-xl shadow-lg p-5">
      <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
        <Shield className="w-5 h-5 text-blue-700" />
        Gate Checks
      </h3>
      <div className="space-y-3">
        {Object.entries(gates).map(([key, status]) => (
          <div
            key={key}
            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
          >
            <span className="text-sm font-medium text-muted-foreground">{gateLabels[key]}</span>
            <GateBadge status={status} />
          </div>
        ))}
        <div className="pt-2 flex items-center justify-between">
          <span className="text-sm font-bold">Final Decision</span>
          <span className={`${decisionBg} text-white text-sm font-bold px-4 py-1 rounded-full`}>
            {decision}
          </span>
        </div>
      </div>
    </div>
  );
}
