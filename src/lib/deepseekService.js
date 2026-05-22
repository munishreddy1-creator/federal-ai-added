/**
 * Updated Gemini Summarization Client
 * Includes Professional Banking Report Formatting & Retry Logic
 */

const GEMINI_API_KEY = "AIzaSyBXaf3BGRsmUuyHBTeKtzLW8Z3TwA5RAt8"; // WARNING: Move this to a backend proxy!
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Helper: Exponential Backoff Retry Logic
async function fetchWithRetry(url, options, retries = 5, backoff = 1000) {
  const response = await fetch(url, options);
  
  // If we hit "High Demand" (429) or "Service Unavailable" (503), wait and retry
  if (!response.ok && (response.status === 429 || response.status === 503) && retries > 0) {
    const jitter = Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, backoff + jitter));
    return fetchWithRetry(url, options, retries - 1, backoff * 2);
  }
  return response;
}

function formatApplicationForSummarization(form, result) {
  return `
--- SOURCE DATA FOR CREDIT APPRAISAL MEMORANDUM ---
APPLICANT: ${form.applicant_name} | Age: ${form.applicantAge} | Occupation: ${form.occupationType}
CREDIT PROFILE: CIBIL Score: ${form.cibil_score} | Past Defaults: ${form.past_defaults} | Overdue EMIs: ${result.overdueEMICount} | Active Overdue: INR ${currency(result.activeOverdueAmount)}
LOAN REQUEST: ${form.product} | Amount: INR ${currency(result.requestedLoanAmount)} | Tenure: ${form.tenure_months} months
FINANCIALS: Monthly Income: INR ${currency(form.monthly_income)} | Monthly Spends: INR ${currency(form.monthly_spends)} | Existing EMI: INR ${currency(result.existingEMI)}
CASH FLOW: Surplus: INR ${currency(result.currentSurplus)} | Residual Income: INR ${currency(result.projectedResidualIncome)} | DTI Ratio: ${(result.dti * 100).toFixed(2)}%
COLLATERAL: Value: INR ${currency(form.collateral_value)} | LTV Ratio: ${result.ltv.toFixed(2)}% (Cap: ${result.ltvCap}%)
DECISION: ${result.decision} | Reason: ${result.decisionReason} | Final Interest Rate: ${result.finalRate.toFixed(2)}% | Max Approved: INR ${currency(result.maxLoanProvided)}
--------------------------------------------------`;
}

function buildSummarizationPrompt(form, result) {
  return `You are a Senior Credit Officer. Write a formal "Credit Appraisal Memorandum" (CAM) based on the provided data.

Report Structure:
1. EXECUTIVE SUMMARY: High-level overview of the decision and core recommendation.
2. APPLICANT PROFILE & PURPOSE: Profile summary and loan purpose.
3. FINANCIAL ASSESSMENT & CASH FLOW: Analysis of income, obligations, and debt-servicing capability.
4. COLLATERAL & LTV ANALYSIS: Valuation check and security coverage assessment.
5. RISK ASSESSMENT & MITIGATION: Detail any risk factors identified in the source data.
6. CREDIT RECOMMENDATION: Final decision summary, interest rate, and approved amount.

Rules:
- Professional, analytical, and conservative tone.
- Weave metrics into narrative paragraphs; do not just provide a list of numbers.
- Ensure the decision rationale aligns exactly with the provided Source Data.

SOURCE DATA:
${formatApplicationForSummarization(form, result)}`;
}

export async function summarizeLoanApplication(form, result) {
  try {
    const prompt = buildSummarizationPrompt(form, result);

    const response = await fetchWithRetry(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1000 },
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "API Request Failed");

    return {
      success: true,
      summary: data.candidates[0].content.parts[0].text,
      timestamp: new Date().toLocaleString("en-IN"),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
