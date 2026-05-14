import React from "react";
import { AlertTriangle, AlertCircle, CheckCircle2, TrendingDown, IndianRupee } from "lucide-react";

function fmt(n) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export default function RiskPanel({ result, requestedLoanAmount }) {
  if (!result) return null;
  const { reasonCodes, maxSafeLoanAmount, creditRisk } = result;
  const isOverLeveraged = requestedLoanAmount > maxSafeLoanAmount;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Decision Reason Codes */}
      <div className="bg-white rounded-xl shadow-lg p-5">
        <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Decision & Risk Factors
        </h3>
        {reasonCodes && reasonCodes.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-700 font-medium">No risk flags identified. Profile looks healthy.</p>
          </div>
        ) : reasonCodes && reasonCodes.length > 0 ? (
          <div className="space-y-3">
            {reasonCodes.map((r) => {
              const bgColor =
                r.severity === "CRITICAL"
                  ? "bg-red-50 border-red-200"
                  : r.severity === "HIGH"
                  ? "bg-orange-50 border-orange-200"
                  : r.severity === "MEDIUM"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-blue-50 border-blue-200";
              const textColor =
                r.severity === "CRITICAL"
                  ? "text-red-800"
                  : r.severity === "HIGH"
                  ? "text-orange-800"
                  : r.severity === "MEDIUM"
                  ? "text-amber-800"
                  : "text-blue-800";
              const icon =
                r.severity === "CRITICAL" || r.severity === "HIGH" ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                );

              return (
                <div key={r.code} className={`flex items-start gap-3 p-3 rounded-lg border ${bgColor}`}>
                  <div className={textColor}>{icon}</div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${textColor}`}>{r.label}</p>
                    <p className={`text-xs mt-0.5 ${textColor.replace("800", "700")}`}>{r.detail}</p>
                  </div>
                  <span className={`ml-auto shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${bgColor.replace("bg-", "bg-").replace("50", "100")} ${textColor}`}>
                    {r.code}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Credit Risk Summary */}
        {creditRisk?.hasCreditRisk && (
          <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm font-semibold text-red-800 mb-2">🚨 Active Credit Risk</p>
            <ul className="text-sm text-red-700 space-y-1">
              {creditRisk.activeOverdueAmount > 0 && (
                <li>• Active Overdue: {fmt(creditRisk.activeOverdueAmount)}</li>
              )}
              {creditRisk.emiDefaultCount > 0 && <li>• EMI Defaults: {creditRisk.emiDefaultCount}</li>}
              {creditRisk.overdueEMICount > 0 && <li>• Overdue EMIs: {creditRisk.overdueEMICount}</li>}
            </ul>
          </div>
        )}
      </div>

      {/* Max Safe Loan */}
      <div className={`bg-white rounded-xl shadow-lg p-5 border-l-4 ${isOverLeveraged ? "border-l-red-500" : "border-l-green-500"}`}>
        <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
          <IndianRupee className="w-5 h-5 text-blue-700" />
          Loan Amount Recommendation
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-xl bg-slate-50">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Requested</p>
              <p className="text-2xl font-bold text-foreground">{fmt(requestedLoanAmount)}</p>
            </div>
            <div className={`text-center p-4 rounded-xl ${isOverLeveraged ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
              <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${isOverLeveraged ? "text-red-700" : "text-green-700"}`}>
                Max Safe Amount
              </p>
              <p className={`text-2xl font-bold ${isOverLeveraged ? "text-red-700" : "text-green-700"}`}>
                {fmt(maxSafeLoanAmount)}
              </p>
            </div>
          </div>

          {isOverLeveraged ? (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <TrendingDown className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">
                Requested amount <strong>{fmt(requestedLoanAmount)}</strong> exceeds the stress-tested safe limit of{" "}
                <strong>{fmt(maxSafeLoanAmount)}</strong>. Consider reducing the loan amount or extending the tenure.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <p className="text-xs text-green-700">
                Requested amount is within the safe lending range. Customer can comfortably service this loan even under a rate shock scenario.
              </p>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">
            * Max safe amount computed as maximum loan where stress EMI (at +2% rate shock) stays within 85% of monthly free cash flow.
          </p>
        </div>
      </div>
    </div>
  );
}
