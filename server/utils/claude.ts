import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function askClaude(prompt: string): Promise<string> {
  // For development: if no API key is available,
  // return a mock response instead of crashing.
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY not found. Using mock response.");

    if (prompt.includes("selling price recommendation")) {
      return JSON.stringify({
        recommendedPrice: 29,
        priceRange: {
          min: 27,
          max: 31,
        },
        reason:
          "Grade A produce with this quantity may attract better buyer offers.",
      });
    }

    return JSON.stringify({
      matchScore: 94,
      reasons: [
        "Crop matches the company requirement",
        "Quantity is sufficient",
        "Quality matches the requirement",
      ],
      summary:
        "This listing is a strong match based on crop, quantity and quality.",
    });
  }

  const response = await anthropic.messages.create({
    model: process.env.CLAUDE_MODEL || "claude-sonnet-4-5",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const textBlock = response.content.find(
    (block) => block.type === "text",
  );

  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text response");
  }

  return textBlock.text;
}