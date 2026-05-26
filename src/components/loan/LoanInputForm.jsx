import React, { useState } from "react";
import { Calculator, IndianRupee, ChevronDown } from "lucide-react";
import { COST_OF_FUNDS_OPTIONS, OCCUPATION_TYPE_OPTIONS } from "../../lib/underwritingConfig";

function NumField({ label, value, onChange, prefix, suffix, placeholder, info }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground/80 block">{label}</label>
        {info && <span className="text-xs text-muted-foreground">{info}</span>}
      </div>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{prefix}</span>
        )}
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            // FIXED: Allows the minus sign string to remain active so underwriters can type -1 cleanly
            if (val === "-") {
              onChange(val);
              return;
            }
            onChange(val === "" ? "" : Number(val));
          }}
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

function SelectField({ label, value, onChange, options, info }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground/80 block">{label}</label>
        {info && <span className="text-xs text-muted-foreground">{info}</span>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({ label, checked, onChange, info }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-slate-50 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-border accent-blue-600"
      />
      <div className="flex-1">
        <label className="text-sm font-medium text-foreground/80 block cursor-pointer">{label}</label>
        {info && <p className="text-xs text-muted-foreground mt-0.5">{info}</p>}
      </div>
    </div>
  );
}

function collateralLabel(product) {
  if (product === "Housing Loan" || product === "Loan Against Property") return "Pledged Property Value (₹)";
  if (product === "Auto Loan") return "On-Road Price (₹)";
  return "Collateral Value (₹)";
}

export default function LoanInputForm({ form, setForm, onCalculate }) {
  const [expandAdvanced, setExpandAdvanced] = useState(false);
  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));
  const costOfFundsOptions = COST_OF_FUNDS_OPTIONS[form.product] || [];

  return (
    <div className="rounded-xl shadow-lg border-0 overflow-hidden bg-white">
      <div className="bg-[hsl(224,58%,33%)] text-white px-5 py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <IndianRupee className="w-5 h-5" />
          Loan Application Details
        </h2>
      </div>
      <div className="p-5 space-y-5">
        {/* Row 1: Product & Season */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            label="Product"
            value={form.product}
            onChange={(v) => update("product", v)}
            options={[
              { value: "Housing Loan", label: "Housing Loan" },
              { value: "Loan Against Property", label: "Loan Against Property" },
              { value: "Auto Loan", label: "Auto Loan" },
              { value: "Gold Loan", label: "Gold Loan" },
            ]}
          />
          {form.product === "Auto Loan" && (
            <SelectField
              label="Season"
              value={form.isFestiveSeason ? "Festival" : "Normal"}
              onChange={(v) => update("isFestiveSeason", v === "Festival")}
              options={[
                { value: "Normal", label: "Normal (85% LTV)" },
                { value: "Festival", label: "Festival (95% LTV)" },
              ]}
              info="Festive season allows higher LTV"
            />
          )}
        </div>

        {/* Row 2: Tenure, CIBIL, Income */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumField label="Tenure (months)" value={form.tenure_months} onChange={(v) => update("tenure_months", v)} suffix="months" />
          {/* UPDATED PLACEHOLDER TO ALERT USERS TO THE NEW -1 OPTION */}
          <NumField label="CIBIL Score" value={form.cibil_score} onChange={(v) => update("cibil_score", v)} placeholder="300-900 or -1" />
          <NumField label="Monthly Income (₹)" value={form.monthly_income} onChange={(v) => update("monthly_income", v)} prefix="₹" />
        </div>

        {/* Row 3: Obligations, Defaults, Spends */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumField label="FOIR - Existing Monthly Obligations (₹)" value={form.monthly_obligations} onChange={(v) => update("monthly_obligations", v)} prefix="₹" info="Total existing fixed obligations. Use this OR Existing EMI below — do not enter the same amount in both." />
          <NumField label="Past Defaults" value={form.past_defaults} onChange={(v) => update("past_defaults", v)} />
          <NumField label="Monthly Spends (₹)" value={form.monthly_spends} onChange={(v) => update("monthly_spends", v)} prefix="₹" />
        </div>

        {/* Row 4: Savings, Loan, Collateral */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumField label="Savings Balance (₹)" value={form.savings_balance} onChange={(v) => update("savings_balance", v)} prefix="₹" />
          <NumField label="Loan Amount (₹)" value={form.loan_amount} onChange={(v) => update("loan_amount", v)} prefix="₹" />
          <NumField label={collateralLabel(form.product)} value={form.collateral_value} onChange={(v) => update("collateral_value", v)} prefix="₹" />
        </div>

        {/* Row 5: Applicant Name */}
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
          <NumField
            label="Age (years)"
            value={form.applicantAge}
            onChange={(v) => update("applicantAge", v)}
            info="For age-based adjustments"
          />
        </div>

        {/* Advanced Options */}
        <div className="border-t border-gray-100 pt-5">
          <button
            onClick={() => setExpandAdvanced(!expandAdvanced)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 mb-4"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${expandAdvanced ? "rotate-180" : ""}`} />
            Advanced Options
          </button>

          {expandAdvanced && (
            <div className="space-y-5 bg-slate-50 p-4 rounded-lg">
              {/* Credit Profile */}
              <div className="border-b border-gray-100 pb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Credit Profile</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <NumField
                    label="Existing EMI (₹/month)"
                    value={form.existingEMI}
                    onChange={(v) => update("existingEMI", v)}
                    prefix="₹"
                    info="From other loans. Use this OR FOIR above — not both for the same obligations."
                  />
                  <NumField
                    label="EMI Default Count"
                    value={form.emiDefaultCount}
                    onChange={(v) => update("emiDefaultCount", v)}
                    info="Number of EMI defaults"
                  />
                  <NumField
                    label="Overdue EMI Count"
                    value={form.overdueEMICount}
                    onChange={(v) => update("overdueEMICount", v)}
                    info="Number of overdue EMIs"
                  />
                </div>
                <div className="mt-4">
                  <NumField
                    label="Active Overdue Amount (₹)"
                    value={form.activeOverdueAmount}
                    onChange={(v) => update("activeOverdueAmount", v)}
                    prefix="₹"
                    info="Currently overdue amount"
                  />
                </div>
              </div>

              {/* Configuration */}
              <div className="border-b border-gray-100 pb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Configuration</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField
                    label="Occupation Type"
                    value={form.occupationType || "SALARIED"}
                    onChange={(v) => update("occupationType", v)}
                    options={OCCUPATION_TYPE_OPTIONS}
                    info="For scoring & filtering"
                  />
                  {costOfFundsOptions.length > 1 && (
                    <SelectField
                      label="Cost of Funds (%)"
                      value={form.customCostOfFunds || ""}
                      onChange={(v) => update("customCostOfFunds", v ? parseFloat(v) : null)}
                      options={[
                        { value: "", label: "Auto (Default)" },
                        ...costOfFundsOptions.map((c) => ({ value: c.toString(), label: `${c}%` })),
                      ]}
                      info="For NIM calculation"
                    />
                  )}
                  <NumField
                    label="Custom Interest Rate (%)"
                    value={form.customInterestRate}
                    onChange={(v) => update("customInterestRate", v)}
                    suffix="%"
                    placeholder={form.product === "Loan Against Property" ? "8.15 - 10.50" : "Auto"}
                    info={form.product === "Loan Against Property" ? "Allowed LAP range: 8.15% to 10.50%" : "Optional override within product band"}
                  />
                </div>
              </div>

              {/* Stress Testing */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Stress Testing</h4>
                <NumField
                  label="Stress EMI Multiplier"
                  value={form.stressMultiplier}
                  onChange={(v) => update("stressMultiplier", v)}
                  suffix="x"
                  placeholder="1.15"
                  info="Alternative to +2% rate shock (e.g., 1.15 = 15%)"
                />
              </div>
            </div>
          )}
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
