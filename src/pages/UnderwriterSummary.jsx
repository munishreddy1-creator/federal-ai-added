import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, User, IndianRupee, ShieldCheck, ShieldX, ShieldAlert } from "lucide-react";

function fmt(n) {
  if (n == null) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function GateBadge({ status }) {
  if (status === "PASS")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200"><ShieldCheck className="w-3 h-3" />PASS</span>;
  if (status === "MANUAL")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200"><ShieldAlert className="w-3 h-3" />MANUAL</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200"><ShieldX className="w-3 h-3" />REJECT</span>;
}

const gateLabels = {
  cibil: "CIBIL Score Gate",
  spend: "Spend-to-Income Gate",
  dti: "DTI Ratio Gate",
  ltv: "LTV Cap Gate",
  emi: "EMI Affordability Gate",
  stress: "Stress Test (Rate +2%)",
  residual: "Residual Income Gate",
};

export default function UnderwriterSummary() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("loanApplication");
    if (saved) {
      try { setData(JSON.parse(saved)); } catch {}
    }
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-[hsl(215,30%,97%)] flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-lg">No loan application evaluated yet.</p>
        <button onClick={() => navigate("/")} className="px-4 py-2 bg-[hsl(224,58%,33%)] text-white rounded-lg text-sm font-medium hover:opacity-90">
          Go to Calculator
        </button>
      </div>
    );
  }

  const { form, result } = data;
  const decisionColor = result.decision === "APPROVE" ? "bg-green-600" : result.decision === "REJECT" ? "bg-red-600" : "bg-amber-600";
  const decisionBorder = result.decision === "APPROVE" ? "border-green-500" : result.decision === "REJECT" ? "border-red-500" : "border-amber-500";

  return (
    <div className="min-h-screen bg-[hsl(215,30%,97%)]">
      {/* Header */}
      <header className="bg-[hsl(224,58%,33%)] text-white shadow-lg print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="p-1.5 rounded hover:bg-blue-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-base">Underwriter Credit Summary</h1>
              <p className="text-xs text-blue-200">FederalCreditPro — Loan Assessment Report</p>
            </div>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-400 text-sm font-medium hover:bg-blue-700 transition-colors">
            <Printer className="w-4 h-4" /> Print / PDF
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Decision Banner */}
        <div className={`rounded-xl border-2 ${decisionBorder} bg-white shadow-lg p-6 flex items-center justify-between`}>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Final Underwriting Decision</p>
            <p className="text-3xl font-extrabold text-foreground">{form.applicant_name || "Applicant"}</p>
            <p className="text-sm text-muted-foreground mt-1">{form.product} · {form.tenure_months} months · {fmt(form.loan_amount)}</p>
          </div>
          <span className={`${decisionColor} text-white text-xl font-extrabold px-8 py-3 rounded-xl`}>
            {result.decision}
          </span>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Monthly EMI", value: fmt(result.emi) },
            { label: "Interest Rate", value: `${result.finalRate.toFixed(2)}%` },
            { label: "Credit Score", value: `${result.weightedScore.toFixed(1)}/100` },
            { label: "Monthly Surplus", value: fmt(result.surplus) },
            { label: "Total Payable", value: fmt(result.totalAmountPaid) },
            { label: "Total Interest", value: fmt(result.totalInterestPaid) },
            { label: "LTV Ratio", value: `${result.ltv.toFixed(1)}%` },
            { label: "NIM", value: `${result.nimPct.toFixed(2)}%` },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl shadow p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{item.label}</p>
              <p className="text-lg font-bold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Applicant & Gate Checks side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applicant Details */}
          <div className="bg-white rounded-xl shadow-lg p-5">
            <h3 className="flex items-center gap-2 font-semibold text-base mb-4">
              <User className="w-5 h-5 text-blue-700" /> Applicant Details
            </h3>
            <div className="space-y-2 text-sm">
              {[
                ["Name", form.applicant_name || "—"],
                ["Product", form.product],
                ["Tenure", `${form.tenure_months} months`],
                ["CIBIL Score", form.cibil_score],
                ["Monthly Income", fmt(form.monthly_income)],
                ["Monthly Obligations", fmt(form.monthly_obligations)],
                ["Monthly Spends", fmt(form.monthly_spends)],
                ["Savings Balance", fmt(form.savings_balance)],
                ["Loan Amount", fmt(form.loan_amount)],
                ["Collateral Value", fmt(form.collateral_value)],
                ["Past Defaults", form.past_defaults],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-muted-foreground font-medium">{k}</span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gate Checks */}
          <div className="bg-white rounded-xl shadow-lg p-5">
            <h3 className="flex items-center gap-2 font-semibold text-base mb-4">
              <ShieldCheck className="w-5 h-5 text-blue-700" /> Gate Checks
            </h3>
            <div className="space-y-2">
              {Object.entries(result.gates).map(([key, status]) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-muted-foreground font-medium">{gateLabels[key]}</span>
                  <GateBadge status={status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-5">
          <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-blue-700" /> Score Breakdown &amp; Rate Derivation
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {Object.entries(result.scores).map(([key, val]) => (
              <div key={key} className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-muted-foreground capitalize mb-1">{key}</p>
                <p className="text-lg font-bold">{val}/100</p>
                <div className="h-1.5 rounded-full bg-gray-200 mt-1 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${val}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Rate Band</p>
              <p className="font-bold">{result.rateBand.min}% – {result.rateBand.max}%</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Final Rate</p>
              <p className="font-bold text-yellow-700">{result.finalRate.toFixed(2)}%</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">NIM</p>
              <p className="font-bold text-green-700">{result.nimPct.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        {/* Risk Reasons */}
        {result.riskReasons.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-5">
            <h3 className="font-semibold text-base mb-4 text-amber-700">Risk Reason Codes</h3>
            <div className="space-y-3">
              {result.riskReasons.map((r) => (
                <div key={r.code} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-300 px-1.5 py-0.5 rounded shrink-0 mt-0.5">{r.code}</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">{r.label}</p>
                    <p className="text-xs text-amber-700 mt-0.5">{r.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Amortization preview */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-base">Amortization Schedule (First 12 Months)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-muted-foreground uppercase">
                  <th className="px-4 py-3 text-center">Month</th>
                  <th className="px-4 py-3 text-right">Payment</th>
                  <th className="px-4 py-3 text-right">Principal</th>
                  <th className="px-4 py-3 text-right">Interest</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {result.amortization.map((row) => (
                  <tr key={row.month} className="border-t border-gray-50 hover:bg-slate-50">
                    <td className="px-4 py-2 text-center font-medium">{row.month}</td>
                    <td className="px-4 py-2 text-right">{`₹${Math.round(row.payment).toLocaleString("en-IN")}`}</td>
                    <td className="px-4 py-2 text-right text-green-700">{`₹${Math.round(row.principal).toLocaleString("en-IN")}`}</td>
                    <td className="px-4 py-2 text-right text-red-600">{`₹${Math.round(row.interest).toLocaleString("en-IN")}`}</td>
                    <td className="px-4 py-2 text-right font-semibold">{`₹${Math.round(row.balance).toLocaleString("en-IN")}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground pb-6">
          Generated by FederalCreditPro · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </main>
    </div>
  );
}
