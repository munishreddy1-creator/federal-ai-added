/**
 * Gemini Summarization Client
 * Full module with Retry Logic, Banking Formatting, and Error Handling
 */

const GEMINI_API_KEY = "AIzaSyCuQQitPOKLmYsIpQIVy1ihHnDbaxNoidA"; 
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// --- HELPER FUNCTIONS ---

function currency(value) {
  const num = Number(value || 0);
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

function gateSummary(gates) {
  if (!gates) return "N/A";
  return Object.entries(gates)
    .map(([gate, status]) => `${gate.toUpperCase()}=${status}`)
    .join(", ");
}

// Helper: Exponential Backoff for "High Demand" errors
async function fetchWithRetry(url, options, retries = 5, backoff = 1000) {
  const response = await fetch(url, options);
  
  // Retry on 429 (Too Many Requests) or 503 (Service Unavailable)
  if (!response.ok && (response.status === 429 || response.status === 503) && retries > 0) {
    const jitter = Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, backoff + jitter));
    return fetchWithRetry(url, options, retries - 1, backoff * 2);
  }
  return response;
}

// --- DATA PREPARATION ---

function formatApplicationForSummarization(form, result) {
  return `
--- CREDIT APPRAISAL MEMORANDUM SOURCE DATA ---
APPLICANT: ${form.applicant_name || "N/A"} | Age: ${form.applicantAge || "N/A"} | Occupation: ${form.occupationType || "N/A"}
PRODUCT: ${form.product || "N/A"} | Tenure: ${form.tenure_months || "N/A"} months
CREDIT HISTORY: CIBIL: ${form.cibil_score || "N/A"} | Past Defaults: ${form.past_defaults || "No"} | Active Overdue: INR ${currency(result.activeOverdueAmount)}
INCOME/OBLIGATIONS: Monthly Income: INR ${currency(form.monthly_income)} | Existing EMI: INR ${currency(result.existingEMI)} | Spends: INR ${currency(form.monthly_spends)}
CASH FLOW: Surplus: INR ${currency(result.currentSurplus || result.surplus)} | Residual Income: INR ${currency(result.projectedResidualIncome)}
COLLATERAL: Value: INR ${currency(form.collateral_value)} | LTV: ${result.ltv?.toFixed(2) || 0}% (Cap: ${result.ltvCap}%)
DECISIONING: Status: ${result.decision} | Reason: ${result.decisionReason || "N/A"} | Interest Rate: ${result.finalRate?.toFixed(2) || 0}%
FINANCIAL RATIOS: DTI Current: ${(result.dti * 100).toFixed(2)}% | Total DTI: ${(result.totalDTI * 100).toFixed(2)}%
GATES: ${gateSummary(result.gates)}
----------------------------------------------`;
}

function buildSummarizationPrompt(form, result) {
  return `You are a Senior Credit Officer at an Indian Bank. Write a formal "Credit Appraisal Memorandum" (CAM) based on the provided data.

Structure:
1. EXECUTIVE SUMMARY: High-level decision and recommendation.
2. APPLICANT PROFILE & PURPOSE: Summary of applicant and loan requirement.
3. FINANCIAL ASSESSMENT & CASH FLOW: Analysis of income, debt-servicing capability (DTI), and surplus.
4. COLLATERAL & LTV ANALYSIS: Valuation, LTV ratio vs cap, and security coverage.
5. RISK ASSESSMENT & MITIGATION: Detail any identified risk factors (e.g., overdue EMIs, high DTI).
6. CREDIT RECOMMENDATION: Final approval/rejection, interest rate, and max loan amount.

Rules:
- Use a professional, analytical, and conservative tone.
- Weave the metrics into descriptive sentences; avoid bullet-point lists where possible.
- If gates show REJECT or MANUAL, explicitly state the cause.
- Keep the report concise and underwriter-focused.

SOURCE DATA:
${formatApplicationForSummarization(form, result)}`;
}

// --- MAIN EXPORT FUNCTION ---

export async function summarizeLoanApplication(form, result) {
  try {
    if (!form || !result) throw new Error("Loan form and evaluation result are required.");

    const prompt = buildSummarizationPrompt(form, result);

    const response = await fetchWithRetry(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1000,
        },
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || `Request failed with status ${response.status}`);
    }

    const summaryText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!summaryText) throw new Error("Received empty response from AI.");

    return {
      success: true,
      summary: summaryText,
      timestamp: new Date().toLocaleString("en-IN"),
    };
  } catch (error) {
    console.error("Summarization error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate credit memo.",
    };
  }
}
