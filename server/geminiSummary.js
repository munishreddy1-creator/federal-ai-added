const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

function currency(value) {
  return Math.round(value || 0).toLocaleString("en-IN");
}

function gateSummary(gates) {
  return Object.entries(gates)
    .map(([gate, status]) => `${gate.toUpperCase()}=${status}`)
    .join(", ");
}

function issueSummary(result) {
  const flaggedGates = Object.entries(result.gates)
    .filter(([, status]) => status !== "PASS")
    .map(([gate, status]) => `${gate.toUpperCase()} ${status}`);
  const risks = result.reasonCodes?.map((reason) => reason.label) || [];

  if (!flaggedGates.length && !risks.length) {
    return "No reason-coded risk factors identified; all gates pass.";
  }

  return [
    flaggedGates.length ? `Flagged gates: ${flaggedGates.join(", ")}.` : "All gates pass.",
    risks.length ? `Risk factors: ${risks.join(", ")}.` : "No reason-coded risk factors identified.",
  ].join(" ");
}

function buildUnderwriterSnapshot(form, result) {
  return [
    `Decision: ${result.decision} - ${result.decisionReason || "N/A"}`,
    `Recommended amount: INR ${currency(result.maxLoanProvided)}`,
    `Request: ${form.product}, INR ${currency(result.requestedLoanAmount)} requested for ${form.tenure_months} months at ${result.finalRate.toFixed(2)}% final rate.`,
    `Applicant: ${form.occupationType || "N/A"}; CIBIL ${form.cibil_score}; monthly income INR ${currency(form.monthly_income)}; existing EMI INR ${currency(result.existingEMI)}.`,
    `Affordability: new EMI INR ${currency(result.emi)}; total EMI INR ${currency(result.totalEMI)}; projected residual income INR ${currency(result.projectedResidualIncome)}; total DTI ${(result.totalDTI * 100).toFixed(2)}%.`,
    `Collateral: LTV ${result.ltv.toFixed(2)}% against ${result.ltvCap}% cap; pledged value INR ${currency(form.collateral_value)}.`,
    `Gates: ${gateSummary(result.gates)}.`,
    `Risk/action: ${issueSummary(result)}`,
  ].join("\n");
}

function buildFallbackNarrative(form, result) {
  const riskSentence = result.reasonCodes?.length
    ? `The main risk items are ${result.reasonCodes.map((reason) => reason.label).join(", ")}.`
    : "No reason-coded risk factors were identified.";

  return [
    "Applicant and request",
    `- ${form.occupationType || "N/A"} applicant requested ${form.product} of INR ${currency(result.requestedLoanAmount)} for ${form.tenure_months} months.`,
    `- The final rate is ${result.finalRate.toFixed(2)}% and the model recommends INR ${currency(result.maxLoanProvided)}.`,
    "",
    "Credit and affordability",
    `- CIBIL is ${form.cibil_score} with weighted credit score ${result.weightedScore.toFixed(1)}/100.`,
    `- Total EMI is INR ${currency(result.totalEMI)} and projected residual income after the new EMI is INR ${currency(result.projectedResidualIncome)}.`,
    `- Total DTI is ${(result.totalDTI * 100).toFixed(2)}%; LTV is ${result.ltv.toFixed(2)}% against a ${result.ltvCap}% cap.`,
    "",
    "Decision drivers",
    `- Final decision is ${result.decision} with reason ${result.decisionReason || "N/A"}.`,
    `- Gate results: ${gateSummary(result.gates)}.`,
    "",
    "Risk and action",
    `- ${riskSentence}`,
    `- Proceed according to the model decision and the recommended amount of INR ${currency(result.maxLoanProvided)}.`,
  ].join("\n");
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

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

export function createGeminiSummaryMiddleware(apiKey) {
  return async function geminiSummaryMiddleware(req, res) {
    if (req.method !== "POST") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    if (!apiKey) {
      sendJson(res, 500, { error: "Gemini API key is not configured on the server." });
      return;
    }

    try {
      const { form, result } = await readJsonBody(req);
      if (!form || !result) {
        sendJson(res, 400, { error: "Loan form and evaluation result are required." });
        return;
      }

      const snapshot = buildUnderwriterSnapshot(form, result);
      const fallbackSummary = buildFallbackNarrative(form, result);
      let summary = fallbackSummary;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(GEMINI_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: buildSummarizationPrompt(form, result) }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 700,
            },
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const data = await response.json();
        const generatedSummary = data.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || "")
          .join("")
          .trim();

        if (response.ok && generatedSummary) {
          summary = generatedSummary;
        }
      } catch {
        summary = fallbackSummary;
      }

      sendJson(res, 200, {
        snapshot,
        summary,
        timestamp: new Date().toLocaleString("en-IN"),
      });
    } catch (error) {
      sendJson(res, 500, { error: error.message || "Failed to summarize application." });
    }
  };
}
