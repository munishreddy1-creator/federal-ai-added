import React, { useState } from "react";
import { AlertCircle, CheckCircle, Plus } from "lucide-react";
import LoanEntry from "./LoanEntry";

export default function PreviousLoanCheck() {
  const [hasPreviousLoans, setHasPreviousLoans] = useState(null);
  const [numLoans, setNumLoans] = useState(null);
  const [loans, setLoans] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  // Step 1: Handle "Do you have previous loans?" response
  const handleHasPreviousLoansChange = (value) => {
    setHasPreviousLoans(value);
    if (value === "no") {
      // Skip to final submission
      setNumLoans(null);
      setLoans([]);
    } else {
      setNumLoans(null);
      setLoans([]);
    }
  };

  // Step 2: Handle number of loans selection
  const handleNumLoansChange = (value) => {
    const num = parseInt(value, 10);
    setNumLoans(num);
    // Initialize loans array with empty loan objects
    const newLoans = Array.from({ length: num }, () => ({
      type: "",
      amount: "",
      interestRate: "",
      tenure: "",
      pastDefault: "",
      activeDefault: "",
    }));
    setLoans(newLoans);
  };

  // Step 4 & 5: Update loan data
  const updateLoan = (loanIndex, field, value) => {
    const updatedLoans = [...loans];
    updatedLoans[loanIndex] = { ...updatedLoans[loanIndex], [field]: value };
    setLoans(updatedLoans);
  };

  // Remove a loan
  const removeLoan = (loanIndex) => {
    const updatedLoans = loans.filter((_, idx) => idx !== loanIndex);
    setLoans(updatedLoans);
    setNumLoans(updatedLoans.length);
  };

  // Step 6: Check if any loan has active defaults
  const hasAnyActiveDefault = loans.some((loan) => Number(loan.activeDefault) > 0);

  // Handle submission
  const handleSubmit = () => {
    // Validate all loans are filled if selected
    if (hasPreviousLoans === "yes" && loans.length > 0) {
      const allFilled = loans.every(
        (loan) => loan.type && loan.amount && loan.interestRate && loan.tenure
      );
      if (!allFilled) {
        alert("Please fill all loan details before submitting.");
        return;
      }
    }
    setSubmitted(true);
  };

  const canContinueWithoutLoans = hasPreviousLoans === "no";
  const allLoansComplete =
    hasPreviousLoans === "yes" &&
    loans.length > 0 &&
    loans.every((loan) => loan.type && loan.amount && loan.interestRate && loan.tenure);

  return (
    <div className="rounded-xl shadow-lg border-0 overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-[hsl(224,58%,33%)] text-white px-5 py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <CheckCircle className="w-5 h-5" />
          Previous Loan Information
        </h2>
      </div>

      <div className="p-5 space-y-6">
        {/* STEP 1: Do you have previous loans? */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Step 1: Previous Loan History
          </h3>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/80 block">
              Do you have any previous loans on your name?
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => handleHasPreviousLoansChange("yes")}
                className={`flex-1 h-10 rounded-lg font-medium transition-all ${
                  hasPreviousLoans === "yes"
                    ? "bg-blue-600 text-white border-2 border-blue-600"
                    : "bg-white border-2 border-border text-foreground hover:border-blue-400"
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => handleHasPreviousLoansChange("no")}
                className={`flex-1 h-10 rounded-lg font-medium transition-all ${
                  hasPreviousLoans === "no"
                    ? "bg-blue-600 text-white border-2 border-blue-600"
                    : "bg-white border-2 border-border text-foreground hover:border-blue-400"
                }`}
              >
                No
              </button>
            </div>
          </div>
        </div>

        {/* STEP 2 & 3: Number of loans and loan selection */}
        {hasPreviousLoans === "yes" && (
          <div className="space-y-3 border-t pt-6">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Step 2: Number of Previous Loans
            </h3>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80 block">
                How many previous loans do you have?
              </label>
              <div className="relative">
                <select
                  value={numLoans ?? ""}
                  onChange={(e) => handleNumLoansChange(e.target.value)}
                  className="w-full h-11 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Number of Loans</option>
                  <option value="1">1 Loan</option>
                  <option value="2">2 Loans</option>
                  <option value="3">3 Loans</option>
                  <option value="4">4 Loans (Maximum)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3, 4, 5: Loan entries */}
        {loans.length > 0 && (
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Step 3-5: Loan Details
            </h3>
            <div className="space-y-4">
              {loans.map((loan, idx) => (
                <LoanEntry
                  key={idx}
                  loanIndex={idx}
                  loan={loan}
                  onUpdate={updateLoan}
                  onRemove={removeLoan}
                />
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: Active Default Warning Banner */}
        {hasPreviousLoans === "yes" && hasAnyActiveDefault && (
          <div className="border-l-4 border-red-600 bg-red-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Manual Review Required</p>
                <p className="text-sm text-red-800 mt-1">
                  The application is suggested to be reviewed manually due to active defaults in one or more previous loans.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submission Status */}
        {submitted && (
          <div className="border-l-4 border-green-600 bg-green-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Submission Successful</p>
                <p className="text-sm text-green-800 mt-1">
                  Previous loan information has been recorded. Proceeding to next steps.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="border-t pt-6 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={!canContinueWithoutLoans && !allLoansComplete}
            className={`flex-1 h-11 rounded-lg font-semibold transition-all ${
              !canContinueWithoutLoans && !allLoansComplete
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
            }`}
          >
            {hasPreviousLoans === "no" ? "Continue without Previous Loans" : "Continue with Loan Information"}
          </button>
        </div>
      </div>
    </div>
  );
}
