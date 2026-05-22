import { GoogleGenAI } from "@google/genai";
import { config } from "../config";
import { IQuestionType, IGeneratedPaper } from "../models/Assignment";

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

interface GenerationInput {
  title: string;
  questionTypes: IQuestionType[];
  totalQuestions: number;
  totalMarks: number;
  additionalInstructions: string;
  uploadedFileContent?: string;
}

export async function generateQuestionPaper(
  input: GenerationInput
): Promise<IGeneratedPaper> {
  const sectionDescriptions = input.questionTypes
    .map(
      (qt, i) =>
        `Section ${String.fromCharCode(65 + i)}: ${qt.type} — ${qt.count} questions, ${qt.marks} marks each`
    )
    .join("\n");

  const contextBlock = input.uploadedFileContent
    ? `\n\nReference Material:\n${input.uploadedFileContent.slice(0, 4000)}`
    : "";

  const prompt = `You are an expert exam paper creator for schools. Generate a structured question paper with the following specifications:

Title/Subject: ${input.title}
Total Questions: ${input.totalQuestions}
Total Marks: ${input.totalMarks}

Sections:
${sectionDescriptions}

${input.additionalInstructions ? `Additional Instructions: ${input.additionalInstructions}` : ""}
${contextBlock}

IMPORTANT: Return ONLY valid JSON (no markdown, no code fences, no backticks) with this exact structure:
{
  "schoolName": "Delhi Public School, Sector-4, Bokaro",
  "subject": "${input.title}",
  "className": "5th",
  "timeAllowed": "45 minutes",
  "maxMarks": ${input.totalMarks},
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries X marks",
      "questionType": "Short Answer Questions",
      "marksPerQuestion": 2,
      "questions": [
        {
          "questionNumber": 1,
          "text": "Question text here",
          "difficulty": "Easy",
          "marks": 2,
          "type": "Short Answer Questions"
        }
      ]
    }
  ],
  "answerKey": [
    {
      "questionNumber": 1,
      "answer": "Detailed answer here"
    }
  ]
}

Rules:
- Each section corresponds to one question type
- Distribute difficulty: ~40% Easy, ~35% Moderate, ~25% Hard
- Questions must be academically sound and age-appropriate
- Include difficulty tags: "Easy", "Moderate", or "Hard"
- Answer key must cover ALL questions with detailed answers
- Question numbers must be sequential across all sections
- Return ONLY the JSON object, no extra text, no markdown`;

  const models = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
  ];
  let content: string | null = null;
  let lastError: Error | null = null;

  const callWithTimeout = (modelName: string, timeoutMs = 30000) => {
    return Promise.race([
      ai.models.generateContent({ model: modelName, contents: prompt }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  };

  for (const modelName of models) {
    try {
      console.log(`Trying model: ${modelName}`);
      const response = await callWithTimeout(modelName, 30000);
      content = response.text ?? null;
      if (content) {
        console.log(`Success with model: ${modelName}`);
        break;
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const msg = lastError.message;
      console.warn(`Model ${modelName} failed: ${msg.slice(0, 120)}`);
      const is503 = msg.includes("503") || msg.includes("high demand");
      if (is503) {
        console.log("High demand — retrying in 3s...");
        await new Promise((r) => setTimeout(r, 3000));
        try {
          const response = await callWithTimeout(modelName, 30000);
          content = response.text ?? null;
          if (content) {
            console.log(`Success with model: ${modelName} (retry)`);
            break;
          }
        } catch (retryErr) {
          lastError = retryErr instanceof Error ? retryErr : new Error(String(retryErr));
          console.warn(`Model ${modelName} retry failed: ${lastError.message.slice(0, 120)}`);
        }
      }
    }
  }

  if (!content) {
    throw lastError || new Error("All Gemini models failed");
  }

  const cleaned = content
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const paper: IGeneratedPaper = JSON.parse(cleaned);

  if (!paper.sections || paper.sections.length === 0) {
    throw new Error("Generated paper has no sections");
  }

  return paper;
}
