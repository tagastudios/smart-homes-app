import { onRequest } from "firebase-functions/v2/https";
import OpenAI from "openai";

export const testOpenAI = onRequest(
  {
    region: "us-east1",
  },
  async (req, res) => {
    console.log("=== SIMPLE OPENAI TEST STARTED ===");

    const apiKey =
      "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";

    console.log("API key length:", apiKey.length);
    console.log("API key exists:", !!apiKey);

    try {
      const openai = new OpenAI({
        apiKey: apiKey,
      });

      console.log("OpenAI client created");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: "Say 'OpenAI is working!' and nothing else.",
          },
        ],
        max_tokens: 10,
      });

      const response = completion.choices[0]?.message?.content;
      console.log("OpenAI response:", response);

      res.status(200).json({
        success: true,
        response: response,
        message: "OpenAI is working!",
      });
    } catch (error) {
      console.error("OpenAI error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);
