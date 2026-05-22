/**
 * Gemini Summarization Client
 * Calls the Gemini API directly from the browser to support static deployments.
 */

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export function getApiKey() {
  return localStorage.getItem("geminiApiKey") || import.meta.env.VITE_GEMINI_API_KEY || "";
}

export function saveApiKey(apiKey) {
  localStorage.setItem("geminiApiKey", apiKey);
}

export function clearApiKey() {
  localStorage.removeItem("geminiApiKey");
}

function currency(value) {
  return Math.round(value || 0).toLocaleString("en-IN");
}

function gateSummary(gates) {
  return Object.entries(gates)
    .map(([gate, status]) => `${gate.toUpperCase()}=${status}`)
    .join(", ");
}

function formatApplicationForSummarization(form, result) {
  return `
UNDERWRITER CREDIT SUMMARY SOURCE DATA
======================================

APPLICANT INFORMATION:
- Name: ${form.applicant_name || "N/A"}
- Product: ${form.product}
- Tenure: ${form.tenure_months} months
- CIBIL Score: ${form.cibil_score}
- Occupation: ${form.occupationType || "N/A"}
- Age: ${form.applicantAge ? `${form.applicantAge} years` : "N/A"}

FINANCIAL PROFILE:
- Monthly Income: INR ${currency(form.monthly_income)}
- Existing EMI: INR ${currency(result.existingEMI)}
- Monthly Spends: INR ${currency(form.monthly_spends)}
- Savings Balance: INR ${currency(form.savings_balance)}
- Current Monthly Surplus: INR ${currency(result.currentSurplus || result.surplus)}
- Projected Residual Income After New EMI: INR ${currency(result.projectedResidualIncome)}

CREDIT ASSESSMENT:
- Weighted Credit Score: ${result.weightedScore.toFixed(1)}/100
- Past Defaults: ${form.past_defaults}
- EMI Default Count: ${result.emiDefaultCount || 0}
- Overdue EMI Count: ${result.overdueEMICount || 0}
- Active Overdue Amount: INR ${currency(result.activeOverdueAmount)}

LOAN DETAILS:
- Requested Loan Amount: INR ${currency(result.requestedLoanAmount)}
- Collateral Value: INR ${currency(form.collateral_value)}
- LTV Ratio: ${result.ltv.toFixed(2)}%
- LTV Cap: ${result.ltvCap}%
- New EMI: INR ${currency(result.emi)}
- Total EMI: INR ${currency(result.totalEMI)}
- Total Payable: INR ${currency(result.totalAmountPaid)}
- Total Interest: INR ${currency(result.totalInterestPaid)}

FINANCIAL RATIOS:
- DTI Current: ${(result.dti * 100).toFixed(2)}%
- DTI Total: ${(result.totalDTI * 100).toFixed(2)}%
- FIOR Ratio: ${(result.fiorRatio * 100).toFixed(2)}%
- Spend-to-Income Ratio: ${(result.spendToIncome * 100).toFixed(2)}%

GATE RESULTS:
- Gate Summary: ${gateSummary(result.gates)}
- CIBIL Gate: ${result.gates.cibil}
- Spend-to-Income Gate: ${result.gates.spend}
- DTI Gate: ${result.gates.dti}
- LTV Gate: ${result.gates.ltv}
- EMI Affordability Gate: ${result.gates.emi}
- Stress Test Gate: ${result.gates.stress}
- Residual Income Gate: ${result.gates.residual}

UNDERWRITING DECISION:
- Decision: ${result.decision}
- Decision Reason: ${result.decisionReason || "N/A"}
- Interest Rate: ${result.finalRate.toFixed(2)}%
- NIM: ${result.nimPct.toFixed(2)}%
- LTV Eligible Amount: INR ${currency(result.ltvEligibleLoan)}
- Affordability Eligible Amount: INR ${currency(result.affordabilityEligibleLoan)}
- FIOR Eligible Amount: INR ${currency(result.fiorEligibleLoan)}
- Underwriting Eligible Amount: INR ${currency(result.underwritingEligibleLoan)}
- MAX LOAN PROVIDED: INR ${currency(result.maxLoanProvided)}
- Final Approved Loan Amount: INR ${currency(result.approvedLoanAmount)}
- FIOR Sanction Status: ${result.fiorSanction?.status || "N/A"}
- FIOR Adjustment Reason: ${result.fiorAdjustmentReason || "None"}

RISK FACTORS:
${result.reasonCodes?.length
  ? result.reasonCodes.map((reason) => `- [${reason.severity}] ${reason.label}: ${reason.detail}`).join("\n")
  : "- No risk factors identified"}
`;
}

function buildSummarizationPrompt(form, result) {
  return `You are writing the underwriting note for the exact credit summary below.

Rules:
- Use only the supplied source data. Do not infer missing values, invent policy rules, or contradict the final decision.
- The first line must be "Decision: <decision> - <decision reason>" using the supplied decision and decision reason.
- The next line must be "Recommended amount: INR <amount>" using MAX LOAN PROVIDED.
- Then write these headings exactly: "Applicant and request", "Credit and affordability", "Decision drivers", "Risk and action".
- Under each heading write 1-3 concise bullet points.
- Mention the product, requested loan amount, tenure, CIBIL score, monthly income, total EMI, projected residual income, final interest rate, LTV ratio and LTV cap.
- Summarize gate results. If every gate passes, say all gates pass. If any gate is MANUAL or REJECT, name those gates and statuses.
- Mention risk factors only when they appear in the source data. If none are present, say no reason-coded risk factors were identified.
- Keep the note professional and underwriter-facing. Avoid marketing language, markdown emphasis, and generic praise.

SOURCE DATA:
${formatApplicationForSummarization(form, result)}

Return only the underwriting note.`;
}

export async function summarizeLoanApplication(form, result, apiKey) {
  try {
    if (!form || !result) {
      throw new Error("Loan form and evaluation result are required.");
    }
    
    if (!apiKey) {
      throw new Error("API key is required");
    }

    const snapshotData = formatApplicationForSummarization(form, result);
    const prompt = buildSummarizationPrompt(form, result);

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 700,
        },
      }),
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error("Invalid response format from server.");
    }

    if (!response.ok) {
      throw new Error(data.error?.message || `Summary request failed: ${response.statusText}`);
    }

    const summaryText = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!summaryText) {
      throw new Error("Invalid summary response from Gemini.");
    }

    return {
      success: true,
      snapshot: snapshotData,
      summary: summaryText,
      timestamp: new Date().toLocaleString("en-IN"),
    };
  } catch (error) {
    console.error("Summarization error:", error);
    return {
      success: false,
      error: error.message || "Failed to summarize application",
    };
  }
}

export const summarizeUnderwriter = summarizeLoanApplication;
