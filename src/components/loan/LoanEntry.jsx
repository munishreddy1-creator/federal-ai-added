import React from "react";
import { Trash2, ChevronDown } from "lucide-react";

const LOAN_TYPES = [
  { value: "Business Loan", label: "Business Loan (Unsecured)" },
  { value: "Auto Loan", label: "Auto Loan (Secured)" },
  { value: "Personal Loan", label: "Personal Loan (Unsecured)" },
  { value: "Housing Loan", label: "Housing Loan (Secured)" },
  { value: "Gold Loan", label: "Gold Loan (Unsecured)" },
  { value: "Education Loan", label: "Education Loan (Unsecured)" },
  { value: "Loan Against Property", label: "Loan Against Property (Secured)" },
  { value: "Credit Card", label: "Credit Card (Unsecured)" },
  { value: "Agri / Crop Loan", label: "Agri / Crop Loan (Unsecured)" },
];

function calculateEMI(principal, annualRate, months) {
  if (!principal || !annualRate || !months || principal <= 0 || annualRate < 0 || months <= 0) {
    return null;
  }
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) {
    return principal / months;
  }
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, months);
  const denominator = Math.pow(1 + monthlyRate, months) - 1;
  return numerator / denominator;
}

function NumField({ label, value, onChange, suffix, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground/80 block">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={placeholder || "0"}
          className={`w-full h-11 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${suffix ? "pr-14" : ""}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">{suffix}</span>
        )}
      </div>
    </div>
  );
}

export default function LoanEntry({ loanIndex, loan, onUpdate, onRemove }) {
  const emi = calculateEMI(loan.amount, loan.interestRate, loan.tenure);
  const hasActiveDefault = loan.activeDefault > 0;

  return (
    <div className={`border rounded-lg p-4 space-y-4 ${hasActiveDefault ? "border-red-300 bg-red-50" : "border-border bg-white"}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-foreground">Loan {loanIndex + 1}</h4>
        <button
          onClick={() => onRemove(loanIndex)}
          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
          title="Remove loan"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Loan Type */}
      <div>
        <label className="text-sm font-medium text-foreground/80 block mb-1.5">Loan Type</label>
        <div className="relative">
          <select
            value={loan.type}
            onChange={(e) => onUpdate(loanIndex, "type", e.target.value)}
            className="w-full h-11 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8"
          >
            <option value="">Select Loan Type</option>
            {LOAN_TYPES.map((lt) => (
              <option key={lt.value} value={lt.value}>
                {lt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Loan Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <NumField
          label="Loan Amount (₹)"
          value={loan.amount}
          onChange={(v) => onUpdate(loanIndex, "amount", v)}
          placeholder="0"
        />
        <NumField
          label="Interest Rate (% p.a.)"
          value={loan.interestRate}
          onChange={(v) => onUpdate(loanIndex, "interestRate", v)}
          placeholder="0"
        />
        <NumField
          label="Tenure (months)"
          value={loan.tenure}
          onChange={(v) => onUpdate(loanIndex, "tenure", v)}
          placeholder="0"
        />
      </div>

      {/* EMI Display */}
      {emi !== null && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-muted-foreground mb-1">Calculated Monthly EMI (Approximation)</p>
          <p className="text-xl font-bold text-blue-700">₹{emi.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
        </div>
      )}

      {/* Default Information */}
      <div className="border-t pt-4">
        <h5 className="text-sm font-medium text-foreground mb-3">Default Information</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumField
            label="Past Default (EMIs missed)"
            value={loan.pastDefault}
            onChange={(v) => onUpdate(loanIndex, "pastDefault", v)}
            placeholder="0"
          />
          <NumField
            label="Active Default (overdue EMIs)"
            value={loan.activeDefault}
            onChange={(v) => onUpdate(loanIndex, "activeDefault", v)}
            placeholder="0"
          />
        </div>
      </div>

      {/* Active Default Warning */}
      {hasActiveDefault && (
        <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-xs font-semibold text-red-700">⚠️ This loan has active defaults</p>
        </div>
      )}
    </div>
  );
}
