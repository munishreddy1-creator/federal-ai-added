// Frontend code (Safe for static deployment)
export async function summarizeLoanApplication(form, result) {
  try {
    if (!form || !result) throw new Error("Loan data required.");

    const snapshotData = formatApplicationForSummarization(form, result);
    const prompt = buildSummarizationPrompt(form, result);

    // CALL YOUR OWN BACKEND ENDPOINT, NOT GEMINI DIRECTLY
    const response = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    let data = await response.json();
    
    // ... rest of your processing logic remains identical ...
    const summaryText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    return { success: true, snapshot: snapshotData, summary: summaryText };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
