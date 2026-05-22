import { Queue, QueueEvents } from "bullmq";
import { isRedisAvailable, getRedisConnection } from "./redis";

let generationQueue: Queue | null = null;
let pdfQueue: Queue | null = null;
let generationEvents: QueueEvents | null = null;

const QUEUE_DEFAULTS = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 2000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 },
};

export function initQueues(): void {
  if (!isRedisAvailable()) {
    console.log("Redis unavailable — BullMQ queues not created");
    return;
  }

  const connection = getRedisConnection()!;

  generationQueue = new Queue("question-generation", {
    connection,
    defaultJobOptions: QUEUE_DEFAULTS,
  });

  pdfQueue = new Queue("pdf-generation", {
    connection,
    defaultJobOptions: {
      ...QUEUE_DEFAULTS,
      attempts: 2,
    },
  });

  generationEvents = new QueueEvents("question-generation", { connection });

  generationEvents.on("completed", ({ jobId }) => {
    console.log(`[BullMQ] Generation job ${jobId} completed`);
  });

  generationEvents.on("failed", ({ jobId, failedReason }) => {
    console.error(`[BullMQ] Generation job ${jobId} failed: ${failedReason}`);
  });

  console.log("BullMQ queues initialized (generation + pdf)");
}

export function getGenerationQueue(): Queue | null {
  return generationQueue;
}

export function getPdfQueue(): Queue | null {
  return pdfQueue;
}

export async function addGenerationJob(assignmentId: string): Promise<string> {
  if (generationQueue) {
    const job = await generationQueue.add(
      "generate",
      { assignmentId },
      { jobId: `gen-${assignmentId}-${Date.now()}` }
    );
    console.log(`[BullMQ] Generation job queued: ${job.id}`);
    return job.id!;
  }

  // Fallback: direct processing (imported lazily to avoid circular deps)
  const { processGenerationDirectly } = await import("../workers/generationWorker");
  const jobId = `direct-${assignmentId}-${Date.now()}`;
  processGenerationDirectly(assignmentId).catch((err) =>
    console.error("Direct generation failed:", err)
  );
  return jobId;
}

export async function addPdfJob(
  assignmentId: string,
  paperData: Record<string, unknown>
): Promise<string> {
  if (pdfQueue) {
    const job = await pdfQueue.add(
      "generate-pdf",
      { assignmentId, paperData },
      { jobId: `pdf-${assignmentId}-${Date.now()}` }
    );
    console.log(`[BullMQ] PDF job queued: ${job.id}`);
    return job.id!;
  }

  return `pdf-direct-${assignmentId}-${Date.now()}`;
}
