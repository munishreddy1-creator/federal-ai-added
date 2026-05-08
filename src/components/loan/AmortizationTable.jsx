import React from "react";
import { Calendar } from "lucide-react";

function fmt(n) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function AmortizationTable({ amortization }) {
  if (!amortization || amortization.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <Calendar className="w-5 h-5 text-blue-700" />
          Amortization Preview (First 12 Months)
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <th className="px-4 py-3 text-center">Month</th>
              <th className="px-4 py-3 text-right">Payment</th>
              <th className="px-4 py-3 text-right">Principal</th>
              <th className="px-4 py-3 text-right">Interest</th>
              <th className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {amortization.map((row) => (
              <tr key={row.month} className="border-t border-gray-50 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2.5 text-center font-medium">{row.month}</td>
                <td className="px-4 py-2.5 text-right">{fmt(row.payment)}</td>
                <td className="px-4 py-2.5 text-right text-green-700 font-medium">{fmt(row.principal)}</td>
                <td className="px-4 py-2.5 text-right text-red-600">{fmt(row.interest)}</td>
                <td className="px-4 py-2.5 text-right font-semibold">{fmt(row.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
