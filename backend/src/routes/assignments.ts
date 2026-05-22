import { Router, Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import Assignment from "../models/Assignment";
import { addGenerationJob, addPdfJob } from "../services/queue";
import { cacheGet, cacheSet, cacheDelete } from "../services/redis";
import { generatePdfBuffer } from "../workers/pdfWorker";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "text/plain",
      "image/png",
      "image/jpeg",
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

const questionTypeSchema = z.object({
  type: z.string().min(1, "Question type is required"),
  count: z.number().int().min(1, "At least 1 question required"),
  marks: z.number().int().min(1, "Marks must be at least 1"),
});

const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  questionTypes: z
    .array(questionTypeSchema)
    .min(1, "At least one question type required"),
  additionalInstructions: z.string().optional().default(""),
});

router.post(
  "/",
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const body =
        typeof req.body.data === "string"
          ? JSON.parse(req.body.data)
          : req.body;
      const validated = createAssignmentSchema.parse(body);

      const totalQuestions = validated.questionTypes.reduce(
        (sum, qt) => sum + qt.count,
        0
      );
      const totalMarks = validated.questionTypes.reduce(
        (sum, qt) => sum + qt.count * qt.marks,
        0
      );

      let uploadedFileName: string | undefined;
      let uploadedFileContent: string | undefined;

      if (req.file) {
        uploadedFileName = req.file.originalname;
        uploadedFileContent = req.file.buffer.toString("utf-8");
      }

      const assignment = await Assignment.create({
        title: validated.title,
        dueDate: new Date(validated.dueDate),
        questionTypes: validated.questionTypes,
        additionalInstructions: validated.additionalInstructions,
        totalQuestions,
        totalMarks,
        uploadedFileName,
        uploadedFileContent,
        status: "draft",
      });

      const jobId = await addGenerationJob(assignment._id.toString());
      assignment.jobId = jobId;
      assignment.status = "processing";
      await assignment.save();

      res.status(201).json({
        success: true,
        assignment: {
          id: assignment._id,
          title: assignment.title,
          status: assignment.status,
          jobId,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
        return;
      }
      console.error("Create assignment error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const cached = await cacheGet("assignments:list");
    if (cached) {
      res.json({ success: true, assignments: JSON.parse(cached) });
      return;
    }

    const assignments = await Assignment.find()
      .select("-generatedPaper -uploadedFileContent")
      .sort({ createdAt: -1 })
      .lean();

    await cacheSet("assignments:list", JSON.stringify(assignments), 60);
    res.json({ success: true, assignments });
  } catch (error) {
    console.error("List assignments error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const cached = await cacheGet(`assignment:${id}`);
    if (cached) {
      res.json({ success: true, assignment: JSON.parse(cached) });
      return;
    }

    const assignment = await Assignment.findById(id)
      .select("-uploadedFileContent")
      .lean();

    if (!assignment) {
      res.status(404).json({ success: false, message: "Assignment not found" });
      return;
    }

    if (assignment.status === "completed") {
      await cacheSet(`assignment:${id}`, JSON.stringify(assignment), 3600);
    }

    res.json({ success: true, assignment });
  } catch (error) {
    console.error("Get assignment error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post(
  "/:id/regenerate",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const assignment = await Assignment.findById(id);

      if (!assignment) {
        res.status(404).json({ success: false, message: "Assignment not found" });
        return;
      }

      assignment.status = "processing";
      assignment.generatedPaper = undefined;
      assignment.errorMessage = undefined;
      await assignment.save();

      await cacheDelete(`assignment:${id}`);
      await cacheDelete(`paper:${id}`);
      await cacheDelete("assignments:list");

      const jobId = await addGenerationJob(id);
      assignment.jobId = jobId;
      await assignment.save();

      res.json({
        success: true,
        message: "Regeneration started",
        jobId,
      });
    } catch (error) {
      console.error("Regenerate error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

router.get(
  "/:id/pdf",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Check cache first
      const cached = await cacheGet(`pdf:${id}`);
      if (cached) {
        const buffer = Buffer.from(cached, "base64");
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="question_paper_${id}.pdf"`);
        res.send(buffer);
        return;
      }

      const assignment = await Assignment.findById(id).lean();
      if (!assignment) {
        res.status(404).json({ success: false, message: "Assignment not found" });
        return;
      }
      if (!assignment.generatedPaper) {
        res.status(400).json({ success: false, message: "No generated paper yet" });
        return;
      }

      // Generate PDF via BullMQ or directly
      const paper = assignment.generatedPaper;
      const pdfBytes = await generatePdfBuffer(paper as unknown as Parameters<typeof generatePdfBuffer>[0]);

      // Cache the result
      const base64 = Buffer.from(pdfBytes).toString("base64");
      await cacheSet(`pdf:${id}`, base64, 3600);

      // Also queue for background caching if BullMQ available
      addPdfJob(id, paper as unknown as Record<string, unknown>).catch(() => {});

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="question_paper_${id}.pdf"`);
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({ success: false, message: "PDF generation failed" });
    }
  }
);

router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByIdAndDelete(id);

    if (!assignment) {
      res.status(404).json({ success: false, message: "Assignment not found" });
      return;
    }

    await cacheDelete(`assignment:${id}`);
    await cacheDelete(`paper:${id}`);
    await cacheDelete("assignments:list");

    res.json({ success: true, message: "Assignment deleted" });
  } catch (error) {
    console.error("Delete assignment error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
