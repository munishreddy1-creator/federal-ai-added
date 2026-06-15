// api/summarize.js (Server-side code)
import { GoogleGenAI } from "@google/genai"; // or standard fetch

export default async function handler(req, res) {
  // 1. Secret is safely read from server environment variables
  const apiKey = process.env.AQ.Ab8RN6IfwgnFYay6no-vbDc8or0I_OD6ZyvkrAlO9uYALtu1sQ; 
  
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { prompt } = req.body;

    // 2. Make the API call securely from the backend
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 700 }
      }),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
