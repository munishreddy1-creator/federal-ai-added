/**
 * Summarization Client
 * The API key stays on the server behind /api/summarize.
 */

export async function summarizeLoanApplication(form, result) {
  try {
    if (!form || !result) {
      throw new Error("Loan form and evaluation result are required.");
    }

    const response = await fetch("/api/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ form, result }),
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      if (!response.ok) {
        throw new Error(`Summary request failed: ${response.statusText}`);
      }
      throw new Error("Invalid response format from server.");
    }

    if (!response.ok) {
      throw new Error(data.error || `Summary request failed: ${response.statusText}`);
    }

    if (!data.summary) {
      throw new Error("Invalid summary response.");
    }

    return {
      success: true,
      snapshot: data.snapshot,
      summary: data.summary,
      timestamp: data.timestamp,
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
