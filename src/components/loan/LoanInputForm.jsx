import React from "react";
import { Calculator, IndianRupee } from "lucide-react";

function NumField({ label, value, onChange, prefix, suffix, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground/80 block">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{prefix}</span>
        )}
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={placeholder || "0"}
          className={`w-full h-11 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${prefix ? "pl-8" : ""} ${suffix ? "pr-14" : ""}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function collateralLabel(product) {
  if (product === "Housing Loan") return "Property Value (₹)";
  if (product === "Auto Loan") return "On-Road Price (₹)";
  return "Collateral Value (₹)";
}

export default function LoanInputForm({ form, setForm, onCalculate }) {
  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="rounded-xl shadow-lg border-0 overflow-hidden bg-white">
      <div className="bg-[hsl(224,58%,33%)] text-white px-5 py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <IndianRupee className="w-5 h-5" />
          Loan Application Details
        </h2>
      </div>
      <div className="p-5 space-y-5">
        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/80 block">Product</label>
            <select
              value={form.product}
              onChange={(e) => update("product", e.target.value)}
              className="w-full h-11 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Housing Loan">Housing Loan</option>
              <option value="Auto Loan">Auto Loan</option>
              <option value="Gold Loan">Gold Loan</option>
            </select>
          </div>
          {form.product === "Auto Loan" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80 block">Season</label>
              <select
                value={form.season}
                onChange={(e) => update("season", e.target.value)}
                className="w-full h-11 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Normal">Normal</option>
                <option value="Festival">Festival</option>
              </select>
            </div>
          )}
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumField label="Tenure (months)" value={form.tenure_months} onChange={(v) => update("tenure_months", v)} suffix="months" />
          <NumField label="CIBIL Score" value={form.cibil_score} onChange={(v) => update("cibil_score", v)} placeholder="300-900" />
          <NumField label="Monthly Income (₹)" value={form.monthly_income} onChange={(v) => update("monthly_income", v)} prefix="₹" />
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumField label="Monthly Obligations (₹)" value={form.monthly_obligations} onChange={(v) => update("monthly_obligations", v)} prefix="₹" />
          <NumField label="Past Defaults" value={form.past_defaults} onChange={(v) => update("past_defaults", v)} />
          <NumField label="Monthly Spends (₹)" value={form.monthly_spends} onChange={(v) => update("monthly_spends", v)} prefix="₹" />
        </div>

        {/* Row 4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumField label="Savings Balance (₹)" value={form.savings_balance} onChange={(v) => update("savings_balance", v)} prefix="₹" />
          <NumField label="Loan Amount (₹)" value={form.loan_amount} onChange={(v) => update("loan_amount", v)} prefix="₹" />
          <NumField label={collateralLabel(form.product)} value={form.collateral_value} onChange={(v) => update("collateral_value", v)} prefix="₹" />
        </div>

        {/* Applicant */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/80 block">Applicant Name</label>
            <input
              value={form.applicant_name || ""}
              onChange={(e) => update("applicant_name", e.target.value)}
              placeholder="Full Name"
              className="w-full h-11 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={onCalculate}
          className="w-full h-12 text-base font-semibold rounded-lg bg-[hsl(45,93%,47%)] text-[hsl(222,47%,11%)] hover:bg-yellow-400 transition-all flex items-center justify-center gap-2"
        >
          <Calculator className="w-5 h-5" />
          Calculate & Evaluate
        </button>
      </div>
    </div>
  );
}
