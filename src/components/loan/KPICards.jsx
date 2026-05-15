import React from "react";
import { TrendingUp, Percent, IndianRupee, ShieldCheck, BarChart3, Wallet, Receipt } from "lucide-react";
import { motion } from "framer-motion";

function fmt(n, decimals = 2) {
  if (n == null) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(decimals)}`;
}

const kpiConfig = [
  { key: "emi", label: "New EMI", icon: IndianRupee, format: (v) => fmt(v), color: "text-blue-700", info: "Proposed loan EMI" },
  { key: "existingEMI", label: "Existing EMI", icon: IndianRupee, format: (v) => fmt(v), color: "text-slate-600", info: "From existing loans" },
  { key: "totalEMI", label: "Total EMI (Existing + New)", icon: IndianRupee, format: (v) => fmt(v), color: "text-purple-600", info: "Total monthly EMI obligations (existing loans + new loan)" },
  { key: "fiorRatio", label: "FIOR Ratio", icon: Percent, format: (v) => `${(v * 100)?.toFixed(1)}%`, color: "text-orange-600", info: "Fixed Obligation to Income Ratio" },
  { key: "finalRate", label: "Interest Rate", icon: Percent, format: (v) => `${v?.toFixed(2)}%`, color: "text-yellow-600" },
  { key: "weightedScore", label: "Credit Score", icon: BarChart3, format: (v) => `${v?.toFixed(1)}/100`, color: "text-purple-600" },
  { key: "surplus", label: "Monthly Surplus", icon: Wallet, format: (v) => fmt(v), color: "text-green-600", info: "Available discretionary income" },
  { key: "projectedResidualIncome", label: "Projected Residual", icon: TrendingUp, format: (v) => fmt(v), color: "text-emerald-600", info: "After new EMI" },
  { key: "ltv", label: "LTV Ratio", icon: TrendingUp, format: (v) => `${v?.toFixed(1)}%`, color: "text-slate-600" },
  { key: "maxLoanProvided", label: "MAX LOAN PROVIDED", icon: IndianRupee, format: (v) => fmt(v), color: "text-blue-600", info: "Maximum eligible sanctioned amount" },
  { key: "decision", label: "Decision", icon: ShieldCheck, format: (v) => v, color: "text-blue-700" },
  { key: "totalInterestPaid", label: "Total Interest", icon: Receipt, format: (v) => fmt(v), color: "text-red-600" },
  { key: "totalAmountPaid", label: "Total Payable", icon: IndianRupee, format: (v) => fmt(v), color: "text-slate-600" },
];

export default function KPICards({ result }) {
  if (!result) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
      {kpiConfig.map(({ key, label, icon: Icon, format, color, info }, idx) => {
        const val = result[key];
        const isDecision = key === "decision";
        const decisionColor =
          val === "APPROVE" ? "text-green-600" : val === "REJECT" ? "text-red-600" : "text-amber-600";

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-xl p-3 shadow-md hover:shadow-lg transition-shadow group relative"
            title={info}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-blue-50">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider leading-tight">
                {label}
              </span>
            </div>
            <p className={`text-lg font-bold ${isDecision ? decisionColor : "text-foreground"}`}>
              {format(val)}
            </p>
            {info && (
              <p className="text-[10px] text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {info}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
