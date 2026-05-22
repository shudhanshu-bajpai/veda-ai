import { Router, Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { config } from "../config";

const router = Router();
const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

const SYSTEM_PROMPT = `You are VedaAI, an expert AI teaching assistant. You help teachers with:
- Creating lesson plans and curriculum
- Explaining complex topics in simple terms
- Generating quiz questions and assessments
- Suggesting teaching strategies and methodologies
- Providing subject-specific guidance across all school subjects
- Helping with grading rubrics and evaluation criteria
- Recommending educational resources and activities

Be friendly, professional, and concise. Use bullet points and structured formatting when helpful.
Always respond in the context of education and teaching.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, history } = req.body as {
      message: string;
      history?: ChatMessage[];
    };

    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ success: false, message: "Message is required" });
      return;
    }

    const conversationParts: string[] = [SYSTEM_PROMPT, "\n"];

    if (history && history.length > 0) {
      const recent = history.slice(-10);
      for (const msg of recent) {
        conversationParts.push(
          `${msg.role === "user" ? "Teacher" : "VedaAI"}: ${msg.content}\n`
        );
      }
    }

    conversationParts.push(`Teacher: ${message}\nVedaAI:`);

    const models = ["gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-2.0-flash"];
    let responseText: string | null = null;
    let lastError: Error | null = null;

    for (const modelName of models) {
      try {
        const result = await ai.models.generateContent({
          model: modelName,
          contents: conversationParts.join("\n"),
        });
        responseText = result.text ?? null;
        if (responseText) break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const is503 =
          lastError.message.includes("503") ||
          lastError.message.includes("high demand");
        if (is503) {
          await new Promise((r) => setTimeout(r, 3000));
          try {
            const result = await ai.models.generateContent({
              model: modelName,
              contents: conversationParts.join("\n"),
            });
            responseText = result.text ?? null;
            if (responseText) break;
          } catch {
            // try next model
          }
        }
      }
    }

    if (!responseText) {
      throw lastError || new Error("All models failed");
    }

    res.json({ success: true, response: responseText });
  } catch (error) {
    console.error("Chat error:", error);
    const message =
      error instanceof Error ? error.message : "Chat request failed";
    res.status(500).json({ success: false, message });
  }
});

export default router;
