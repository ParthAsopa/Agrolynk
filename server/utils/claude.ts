import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

console.log(
  "Gemini API Key:",
  apiKey ? `Loaded (${apiKey.substring(0, 6)}...)` : "NOT FOUND"
);

const ai = new GoogleGenAI({
  apiKey: apiKey || "",
});

export async function askGemini(prompt: string): Promise<string> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found in .env");
  }

  try {
    console.log("Sending request to Gemini...");

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    console.log("Gemini raw response received");

    const text = response.text;

    if (!text) {
      throw new Error("Gemini returned no text response");
    }

    console.log("Gemini Response:", text);

    const cleanedText = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    return cleanedText;
  } catch (error) {
    console.error("========== GEMINI API ERROR ==========");
    console.error(error);
    console.error("======================================");

    throw error;
  }
}