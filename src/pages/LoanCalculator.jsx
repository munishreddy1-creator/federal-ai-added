import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import { evaluate } from "../lib/loanEngine";
import LoanInputForm from "../components/loan/LoanInputForm";
import KPICards from "../components/loan/KPICards";
import DerivedMetrics from "../components/loan/DerivedMetrics";
import GateChecks from "../components/loan/GateChecks";
import ScoreBreakdown from "../components/loan/ScoreBreakdown";
import NIMCard from "../components/loan/NIMCard";
import RiskPanel from "../components/loan/RiskPanel";
import AmortizationTable from "../components/loan/AmortizationTable";
import MetricsTable from "../components/loan/MetricsTable";
import PreviousLoanCheck from "../components/loan/previousloancheck";

const DEFAULT_FORM = {
  product: "Housing Loan",
  isFestiveSeason: false,
  tenure_months: "",         // required — blank
  cibil_score: "",           // required — blank
  monthly_income: "",
  monthly_obligations: "",
  past_defaults: 0,
  monthly_spends: "",
  savings_balance: "",
  loan_amount: "",           // required — blank
  collateral_value: "",
  applicant_name: "",        // required — blank
  applicantAge: "",          // required — blank
  occupationType: "SALARIED",
  existingEMI: 0,
  emiDefaultCount: 0,
  overdueEMICount: 0,
  activeOverdueAmount: 0,
  customCostOfFunds: null,
  customInterestRate: null,
  stressMultiplier: null,
};

// Required fields and their display labels
const REQUIRED_FIELDS = {
  applicant_name: "Applicant Name",
  applicantAge: "Applicant Age",
  loan_amount: "Loan Amount",
  tenure_months: "Tenure (Months)",
  cibil_score: "CIBIL Score",
};

export default function LoanCalculator() {
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [result, setResult] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Restore form data from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("loanApplication");
    if (saved) {
      try {
        const { form: savedForm, result: savedResult } = JSON.parse(saved);
        setForm(savedForm);
        setResult(savedResult);
      } catch (e) {
        console.error("Error restoring form data:", e);
      }
    }
  }, []);

  const validate = () => {
    const errors = {};

    Object.entries(REQUIRED_FIELDS).forEach(([field, label]) => {
      const value = form[field];
      if (value === "" || value === null || value === undefined) {
        errors[field] = `${label} is required`;
      } else if (field !== "applicant_name" && isNaN(Number(value))) {
        errors[field] = `${label} must be a valid number`;
      } else if (field !== "applicant_name" && Number(value) <= 0) {
        errors[field] = `${label} must be greater than 0`;
      }
    });

    // Additional range checks
    if (form.cibil_score && (Number(form.cibil_score) < 300 || Number(form.cibil_score) > 900)) {
      errors.cibil_score = "CIBIL Score must be between 300 and 900";
    }
    if (form.applicantAge && (Number(form.applicantAge) < 18 || Number(form.applicantAge) > 75)) {
      errors.applicantAge = "Age must be between 18 and 75";
    }

    return errors;
  };

  const handleCalculate = () => {
    const errors = validate();

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Scroll to the top of the form so user sees errors
      document.getElementById("loan-input-form")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    // Clear any previous errors
    setValidationErrors({});

    const res = evaluate(form);
    setResult(res);
    // Save to localStorage for UnderwriterSummary
    localStorage.setItem("loanApplication", JSON.stringify({ form, result: res }));
    setTimeout(() => {
      document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[hsl(215,30%,97%)]">
      {/* Header */}
      <header className="bg-[hsl(224,58%,33%)] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[hsl(45,93%,47%)] rounded-lg flex items-center justify-center font-bold text-[hsl(222,47%,11%)] text-base">
              Cp
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">CreditPro</h1>
              <p className="text-xs text-blue-200">Underwriting engine</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/underwriter-summary")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-400 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Underwriter Summary
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Previous Loan Check */}
        <PreviousLoanCheck />

        {/* Input Form */}
        <div id="loan-input-form">
          <LoanInputForm
            form={form}
            setForm={setForm}
            onCalculate={handleCalculate}
            validationErrors={validationErrors}
            setValidationErrors={setValidationErrors}
          />
        </div>

        {/* Results */}
        {result && (
          <div id="results-section" className="space-y-6">
            {/* KPI Cards */}
            <KPICards result={result} />

            {/* Derived Metrics */}
            <DerivedMetrics result={result} />

            {/* Gate Checks + Score Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GateChecks gates={result.gates} decision={result.decision} result={result} />
              <ScoreBreakdown scores={result.scores} weightedScore={result.weightedScore} />
            </div>

            {/* Risk Panel */}
            <RiskPanel result={result} requestedLoanAmount={form.loan_amount} />

            {/* NIM */}
            <NIMCard result={result} />

            {/* Amortization */}
            <AmortizationTable amortization={result.amortization} />

            {/* Detailed Metrics Table */}
            <MetricsTable form={form} result={result} />
          </div>
        )}
      </main>
    </div>
  );
}
