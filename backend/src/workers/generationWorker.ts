import { Worker } from "bullmq";
import { isRedisAvailable, getRedisConnection } from "../services/redis";
import { generateQuestionPaper } from "../services/openai";
import { cacheSet } from "../services/redis";
import { notifyAssignmentUpdate } from "../websocket";
import Assignment from "../models/Assignment";

export async function processGenerationDirectly(
  assignmentId: string
): Promise<void> {
  console.log(`[Direct] Processing assignment ${assignmentId}`);

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new Error(`Assignment not found: ${assignmentId}`);

  await Assignment.findByIdAndUpdate(assignmentId, { status: "processing" });
  notifyAssignmentUpdate(assignmentId, {
    status: "processing",
    message: "Generating question paper...",
  });

  try {
    const paper = await generateQuestionPaper({
      title: assignment.title,
      questionTypes: assignment.questionTypes,
      totalQuestions: assignment.totalQuestions,
      totalMarks: assignment.totalMarks,
      additionalInstructions: assignment.additionalInstructions,
      uploadedFileContent: assignment.uploadedFileContent,
    });

    await Assignment.findByIdAndUpdate(assignmentId, {
      status: "completed",
      generatedPaper: paper,
    });

    await cacheSet(`paper:${assignmentId}`, JSON.stringify(paper), 7200);

    notifyAssignmentUpdate(assignmentId, {
      status: "completed",
      message: "Question paper generated successfully!",
      paper,
    });

    console.log(`[Direct] Assignment ${assignmentId} completed`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    await Assignment.findByIdAndUpdate(assignmentId, {
      status: "failed",
      errorMessage: message,
    });
    notifyAssignmentUpdate(assignmentId, {
      status: "failed",
      message: `Generation failed: ${message}`,
    });
  }
}

async function processJob(assignmentId: string): Promise<{ success: boolean }> {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new Error(`Assignment not found: ${assignmentId}`);

  await Assignment.findByIdAndUpdate(assignmentId, { status: "processing" });
  notifyAssignmentUpdate(assignmentId, {
    status: "processing",
    message: "Generating question paper...",
  });

  const paper = await generateQuestionPaper({
    title: assignment.title,
    questionTypes: assignment.questionTypes,
    totalQuestions: assignment.totalQuestions,
    totalMarks: assignment.totalMarks,
    additionalInstructions: assignment.additionalInstructions,
    uploadedFileContent: assignment.uploadedFileContent,
  });

  await Assignment.findByIdAndUpdate(assignmentId, {
    status: "completed",
    generatedPaper: paper,
  });

  await cacheSet(`paper:${assignmentId}`, JSON.stringify(paper), 7200);

  notifyAssignmentUpdate(assignmentId, {
    status: "completed",
    message: "Question paper generated successfully!",
    paper,
  });

  return { success: true };
}

export function startGenerationWorker(): Worker | null {
  if (!isRedisAvailable()) {
    console.log("[Worker] Redis unavailable — generation uses direct processing");
    return null;
  }

  const connection = getRedisConnection()!;

  const worker = new Worker(
    "question-generation",
    async (job) => {
      const { assignmentId } = job.data as { assignmentId: string };
      console.log(`[BullMQ Worker] Processing job ${job.id} for assignment ${assignmentId}`);
      return processJob(assignmentId);
    },
    { connection, concurrency: 2 }
  );

  worker.on("completed", (job) =>
    console.log(`[BullMQ Worker] Job ${job.id} completed`)
  );

  worker.on("failed", async (job, err) => {
    console.error(`[BullMQ Worker] Job ${job?.id} failed:`, err.message);
    if (job) {
      const { assignmentId } = job.data as { assignmentId: string };
      await Assignment.findByIdAndUpdate(assignmentId, {
        status: "failed",
        errorMessage: err.message,
      });
      notifyAssignmentUpdate(assignmentId, {
        status: "failed",
        message: `Generation failed: ${err.message}`,
      });
    }
  });

  console.log("[BullMQ Worker] Generation worker started (concurrency: 2)");
  return worker;
}
