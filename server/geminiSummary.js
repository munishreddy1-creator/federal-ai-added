const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent";

// Simple in-memory cache (use Redis for production)
const summaryCache = new Map();

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

// OPTIMIZED: More concise data formatting to reduce token count
function formatApplicationForSummarization(form, result) {
  return `CREDIT SUMMARY DATA
==================

APPLICANT: ${form.applicant_name || "N/A"} | ${form.occupationType || "N/A"} | Age: ${form.applicantAge || "N/A"}
PRODUCT: ${form.product} for ${form.tenure_months} months

FINANCIAL:
- Monthly Income: INR ${currency(form.monthly_income)}
- Existing EMI: INR ${currency(result.existingEMI)}
- New EMI: INR ${currency(result.emi)}
- Total EMI: INR ${currency(result.totalEMI)}
- Residual Income (post-new EMI): INR ${currency(result.projectedResidualIncome)}
- Monthly Spends: INR ${currency(form.monthly_spends)}

CREDIT:
- CIBIL: ${form.cibil_score}
- Weighted Score: ${result.weightedScore.toFixed(1)}/100
- Past Defaults: ${form.past_defaults}
- EMI Defaults: ${result.emiDefaultCount || 0}
- Active Overdue: INR ${currency(result.activeOverdueAmount)}

LOAN:
- Requested: INR ${currency(result.requestedLoanAmount)}
- Collateral Value: INR ${currency(form.collateral_value)}
- LTV: ${result.ltv.toFixed(2)}% (Cap: ${result.ltvCap}%)
- Interest Rate: ${result.finalRate.toFixed(2)}%
- Total Interest: INR ${currency(result.totalInterestPaid)}

RATIOS:
- DTI (current): ${(result.dti * 100).toFixed(2)}%
- DTI (total): ${(result.totalDTI * 100).toFixed(2)}%
- Spend-to-Income: ${(result.spendToIncome * 100).toFixed(2)}%

GATES: ${gateSummary(result.gates)}
- CIBIL: ${result.gates.cibil}
- Spend-to-Income: ${result.gates.spend}
- DTI: ${result.gates.dti}
- LTV: ${result.gates.ltv}
- EMI Affordability: ${result.gates.emi}
- Stress Test: ${result.gates.stress}
- Residual Income: ${result.gates.residual}

DECISION:
- Decision: ${result.decision}
- Reason: ${result.decisionReason || "N/A"}
- Max Loan: INR ${currency(result.maxLoanProvided)}
- Approved Amount: INR ${currency(result.approvedLoanAmount)}

RISK FACTORS:
${result.reasonCodes?.length
  ? result.reasonCodes.map((reason) => `[${reason.severity}] ${reason.label}`).join("\n")
  : "None identified"}
`;
}

// OPTIMIZED: More concise prompt to reduce token count
function buildSummarizationPrompt(form, result) {
  return `Write a concise underwriting note using ONLY the data below. No inferences or invented details.

FORMAT:
Line 1: Decision: <decision> - <reason>
Line 2: Recommended amount: INR <MAX LOAN PROVIDED>

Then use these headings: "Applicant and request", "Credit and affordability", "Decision drivers", "Risk and action"

Each section: 1-3 bullet points max.

CONTENT REQUIREMENTS:
- Product, tenure, loan amount, CIBIL, monthly income
- Total EMI, residual income, final rate, LTV ratio
- Gate status (pass/fail)
- Risk factors if present
- Professional tone only

DATA:
${formatApplicationForSummarization(form, result)}

Return ONLY the underwriting note.`;
}

// Generate unique cache key for an application
function generateCacheKey(form, result) {
  const key = `${form.applicant_name}_${result.requestedLoanAmount}_${form.cibil_score}`;
  return Buffer.from(key).toString("base64");
}

// Retry logic with exponential backoff
async function retryWithBackoff(
  fetchFn,
  maxRetries = 3,
  initialDelayMs = 1000
) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error;

      // Check if it's a rate limit or quota error
      const isQuotaError =
        error.status === 429 ||
        error.message?.includes("RESOURCE_EXHAUSTED") ||
        error.message?.includes("QUOTA");

      // Only retry on quota/rate limit errors
      if (!isQuotaError && attempt > 0) {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        const delayMs = initialDelayMs * Math.pow(2, attempt);
        console.log(
          `Retry attempt ${attempt + 1}/${maxRetries} after ${delayMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

// Stream-based API call (handles large responses better)
async function callGeminiWithStreaming(prompt, apiKey) {
  let fullResponse = "";
  let retryCount = 0;
  const maxRetries = 3;
  let initialDelay = 2000;

  const attemptCall = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout for streaming

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 800,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Handle rate limit errors specifically
      if (response.status === 429 || response.status === 503) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(
          errorData.error?.message || "Rate limit exceeded"
        );
        error.status = response.status;
        throw error;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `API error: ${response.status}`
        );
      }

      // Process streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            const text = json.candidates?.[0]?.content?.parts
              ?.map((part) => part.text || "")
              .join("");
            if (text) fullResponse += text;
          } catch {
            // Skip non-JSON lines
          }
        }
      }

      return fullResponse.trim();
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  };

  // Retry logic
  while (retryCount < maxRetries) {
    try {
      return await attemptCall();
    } catch (error) {
      retryCount++;

      if (
        (error.status === 429 || error.message?.includes("Rate limit")) &&
        retryCount < maxRetries
      ) {
        const delayMs = initialDelay * Math.pow(2, retryCount - 1);
        console.log(
          `Rate limited. Retrying in ${delayMs}ms (attempt ${retryCount}/${maxRetries})...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        throw error;
      }
    }
  }
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

      // Check cache first
      const cacheKey = generateCacheKey(form, result);
      if (summaryCache.has(cacheKey)) {
        console.log("Using cached summary...");
        summary = summaryCache.get(cacheKey);
      } else {
        // Try Gemini API with streaming and retry logic
        try {
          const prompt = buildSummarizationPrompt(form, result);
          const generatedSummary = await callGeminiWithStreaming(
            prompt,
            apiKey
          );

          if (generatedSummary && generatedSummary.length > 10) {
            summary = generatedSummary;
            // Cache the result (max 100 entries)
            if (summaryCache.size > 100) {
              const firstKey = summaryCache.keys().next().value;
              summaryCache.delete(firstKey);
            }
            summaryCache.set(cacheKey, summary);
          }
        } catch (error) {
          console.error("Gemini API error:", error.message);
          // Fall back to template if API fails
          summary = fallbackSummary;
        }
      }

      sendJson(res, 200, {
        snapshot,
        summary,
        timestamp: new Date().toLocaleString("en-IN"),
        cached: summaryCache.has(cacheKey),
      });
    } catch (error) {
      sendJson(res, 500, {
        error: error.message || "Failed to summarize application.",
      });
    }
  };
}
