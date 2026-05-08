import React from "react";
import { TrendingUp } from "lucide-react";

function fmt(n) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

export default function NIMCard({ result }) {
  if (!result) return null;
  const { nimPct, nimAmount, finalRate, costOfFunds } = result;

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-l-green-500">
      <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
        <TrendingUp className="w-5 h-5 text-green-600" />
        Net Interest Margin (NIM) — Bank Earnings
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="text-center p-4 rounded-xl bg-green-50 border border-green-200">
          <p className="text-xs text-green-700 font-medium uppercase tracking-wide mb-1">NIM %</p>
          <p className="text-3xl font-bold text-green-700">{nimPct.toFixed(2)}%</p>
          <p className="text-xs text-muted-foreground mt-1">Lending Rate − Cost of Funds</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-blue-50 border border-blue-200">
          <p className="text-xs text-blue-700 font-medium uppercase tracking-wide mb-1">Total NIM Earned</p>
          <p className="text-3xl font-bold text-blue-700">{fmt(nimAmount)}</p>
          <p className="text-xs text-muted-foreground mt-1">Over full loan tenure</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-border space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Breakdown</p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Lending Rate</span>
            <span className="font-semibold">{finalRate.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cost of Funds</span>
            <span className="font-semibold text-red-600">− {costOfFunds.toFixed(2)}%</span>
          </div>
          <div className="h-px bg-gray-200 my-1" />
          <div className="flex justify-between text-sm font-bold">
            <span>NIM</span>
            <span className="text-green-700">{nimPct.toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
