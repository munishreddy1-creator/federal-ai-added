/**
 * DeepSeek Summarization Client (OpenRouter)
 */

// Helper function to format application text for summarization
function formatApplicationForSummarization(form, result) {
  return `
LOAN APPLICATION SUMMARY
=========================

APPLICANT INFORMATION:
- Name: ${form.applicant_name || 'N/A'}
- Product: ${form.product}
- Tenure: ${form.tenure_months} months
- CIBIL Score: ${form.cibil_score}
- Occupation: ${form.occupationType || 'N/A'}
- Age: ${form.applicantAge ? form.applicantAge + ' years' : 'N/A'}

FINANCIAL PROFILE:
- Monthly Income: ₹${Math.round(form.monthly_income).toLocaleString('en-IN')}
- Existing EMI: ₹${Math.round(result.existingEMI || 0).toLocaleString('en-IN')}
- Monthly Spends: ₹${Math.round(form.monthly_spends).toLocaleString('en-IN')}
- Savings Balance: ₹${Math.round(form.savings_balance).toLocaleString('en-IN')}
- Monthly Surplus: ₹${Math.round(result.surplus).toLocaleString('en-IN')}

CREDIT ASSESSMENT:
- Weighted Credit Score: ${result.weightedScore.toFixed(1)}/100
- CIBIL Score: ${form.cibil_score}
- Past Defaults: ${form.past_defaults}
- EMI Default Count: ${result.emiDefaultCount || 0}
- Overdue EMI Count: ${result.overdueEMICount || 0}
- Active Overdue Amount: ₹${Math.round(result.activeOverdueAmount || 0).toLocaleString('en-IN')}

LOAN DETAILS:
- Requested Loan Amount: ₹${Math.round(result.requestedLoanAmount).toLocaleString('en-IN')}
- Collateral Value: ₹${Math.round(form.collateral_value).toLocaleString('en-IN')}
- LTV Ratio: ${result.ltv.toFixed(2)}%
- LTV Cap: ${result.ltvCap}%
- New EMI: ₹${Math.round(result.emi).toLocaleString('en-IN')}
- Total EMI (with existing): ₹${Math.round(result.totalEMI).toLocaleString('en-IN')}

FINANCIAL RATIOS:
- DTI (Current): ${(result.dti * 100).toFixed(2)}%
- DTI (Total): ${(result.totalDTI * 100).toFixed(2)}%
- FIOR Ratio: ${(result.fiorRatio * 100).toFixed(2)}%
- Spend-to-Income Ratio: ${(result.spendToIncome * 100).toFixed(2)}%

GATE RESULTS:
- CIBIL Gate: ${result.gates.cibil}
- Spend-to-Income Gate: ${result.gates.spend}
- DTI Gate: ${result.gates.dti}
- LTV Gate: ${result.gates.ltv}
- EMI Affordability Gate: ${result.gates.emi}
- Stress Test Gate: ${result.gates.stress}
- Residual Income Gate: ${result.gates.residual}

UNDERWRITING DECISION:
- Decision: ${result.decision}
- Decision Reason: ${result.decisionReason || 'N/A'}
- Interest Rate: ${result.finalRate.toFixed(2)}%
- NIM: ${result.nimPct.toFixed(2)}%
- Max Eligible Loan: ₹${Math.round(result.maxEligibleLoan || result.maxLoanProvided).toLocaleString('en-IN')}

PROJECTIONS:
- Total Amount to be Paid: ₹${Math.round(result.totalAmountPaid).toLocaleString('en-IN')}
- Total Interest to be Paid: ₹${Math.round(result.totalInterestPaid).toLocaleString('en-IN')}
- Projected Residual Income: ₹${Math.round(result.projectedResidualIncome).toLocaleString('en-IN')}

RISK FACTORS:
${result.reasonCodes && result.reasonCodes.length > 0 
  ? result.reasonCodes.map(r => `- [${r.severity}] ${r.label}: ${r.detail}`).join('\n')
  : '- No risk factors identified'
}
`;
}

export function getApiKey() {
  return localStorage.getItem("openRouterApiKey") || import.meta.env.VITE_OPENROUTER_API_KEY || "";
}

export function saveApiKey(apiKey) {
  localStorage.setItem("openRouterApiKey", apiKey);
}

export function clearApiKey() {
  localStorage.removeItem("openRouterApiKey");
}

export async function summarizeLoanApplication(form, result, apiKey) {
  try {
    if (!form || !result) {
      throw new Error("Loan form and evaluation result are required.");
    }
    
    if (!apiKey) {
      throw new Error("API key is required");
    }

    const formattedData = formatApplicationForSummarization(form, result);
    const prompt = `You are an expert loan underwriter. Summarize the following loan application professionally.
Focus on: Financial profile, strengths, concerns, gate results, and risk factors.
Keep it 150-250 words. Do not make up any numbers. 

${formattedData}`;

    const response = await fetch("https://openrouter.io/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin, // Required by OpenRouter
        "X-Title": "FederalCreditPro" // Optional for OpenRouter
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      let errorText = response.statusText;
      try {
        const errData = await response.json();
        if (errData.error && errData.error.message) {
          errorText = errData.error.message;
        }
      } catch (e) {
        // Ignore JSON parse error on error response
      }
      if (response.status === 401) throw new Error("Error: Unauthorized. Check your API Key.");
      if (response.status === 429) throw new Error("Error: 429 Rate Limited. Try again later.");
      throw new Error(`Failed to fetch from OpenRouter: ${errorText}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error("Invalid API response format (not JSON).");
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid API response structure from OpenRouter.");
    }

    const summary = data.choices[0].message.content;

    return {
      success: true,
      summary,
      snapshot: formattedData,
      timestamp: new Date().toLocaleString("en-IN")
    };
  } catch (error) {
    console.error("Summarization error:", error);
    return {
      success: false,
      error: error.message || "Failed to summarize application"
    };
  }
}

export const summarizeUnderwriter = summarizeLoanApplication;
