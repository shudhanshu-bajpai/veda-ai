import { Worker } from "bullmq";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { isRedisAvailable, getRedisConnection } from "../services/redis";
import { cacheSet } from "../services/redis";
import { notifyAssignmentUpdate } from "../websocket";

interface PaperSection {
  title: string;
  instruction: string;
  questionType: string;
  questions: Array<{
    questionNumber: number;
    text: string;
    difficulty: string;
    marks: number;
  }>;
}

interface PaperData {
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: string;
  maxMarks: number;
  sections: PaperSection[];
  answerKey: Array<{ questionNumber: number; answer: string }>;
}

export async function generatePdfBuffer(paper: PaperData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await doc.embedFont(StandardFonts.TimesRomanBold);
  const italicFont = await doc.embedFont(StandardFonts.TimesRomanItalic);

  const PAGE_W = 595;
  const PAGE_H = 842;
  const MARGIN = 50;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  };

  const drawCentered = (
    text: string,
    size: number,
    f = boldFont
  ) => {
    const w = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (PAGE_W - w) / 2, y, size, font: f, color: rgb(0, 0, 0) });
    y -= size + 4;
  };

  const drawText = (
    text: string,
    size: number,
    f = font,
    x = MARGIN
  ) => {
    const words = text.split(" ");
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (f.widthOfTextAtSize(test, size) > CONTENT_W - (x - MARGIN)) {
        ensureSpace(size + 3);
        page.drawText(line, { x, y, size, font: f, color: rgb(0, 0, 0) });
        y -= size + 3;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      ensureSpace(size + 3);
      page.drawText(line, { x, y, size, font: f, color: rgb(0, 0, 0) });
      y -= size + 3;
    }
  };

  // Header
  drawCentered(paper.schoolName, 16);
  drawCentered(`Subject: ${paper.subject}`, 12, font);
  drawCentered(`Class: ${paper.className}`, 12, font);
  y -= 8;

  // Line
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 1.5,
    color: rgb(0, 0, 0),
  });
  y -= 14;

  // Time and marks
  page.drawText(`Time Allowed: ${paper.timeAllowed}`, {
    x: MARGIN, y, size: 11, font, color: rgb(0, 0, 0),
  });
  const marksText = `Maximum Marks: ${paper.maxMarks}`;
  const marksW = font.widthOfTextAtSize(marksText, 11);
  page.drawText(marksText, {
    x: PAGE_W - MARGIN - marksW, y, size: 11, font, color: rgb(0, 0, 0),
  });
  y -= 18;

  drawText("All questions are compulsory unless stated otherwise.", 10, italicFont);
  y -= 6;

  // Student info
  drawText("Name: _______________________", 11);
  drawText("Roll Number: ________________", 11);
  drawText(`Class: ${paper.className}  Section: __________`, 11);
  y -= 10;

  // Sections
  for (const section of paper.sections) {
    ensureSpace(50);
    y -= 6;
    drawCentered(section.title, 14);
    drawText(section.questionType, 11, boldFont);
    drawText(section.instruction, 10, italicFont);
    y -= 6;

    for (const q of section.questions) {
      ensureSpace(30);
      const prefix = `${q.questionNumber}. `;
      const tag = `[${q.difficulty}] `;
      const suffix = ` [${q.marks} Mark${q.marks > 1 ? "s" : ""}]`;
      drawText(`${prefix}${tag}${q.text}${suffix}`, 11, font, MARGIN + 10);
      y -= 2;
    }
  }

  // End of paper
  ensureSpace(30);
  y -= 8;
  page.drawLine({
    start: { x: MARGIN + 80, y: y + 4 },
    end: { x: PAGE_W - MARGIN - 80, y: y + 4 },
    thickness: 0.5,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 4;
  drawCentered("End of Question Paper", 11, boldFont);
  y -= 10;

  // Answer key
  if (paper.answerKey?.length) {
    ensureSpace(40);
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_W - MARGIN, y },
      thickness: 1.5,
      color: rgb(0, 0, 0),
    });
    y -= 16;
    drawText("Answer Key:", 13, boldFont);
    y -= 4;

    for (const ak of paper.answerKey) {
      ensureSpace(25);
      drawText(`${ak.questionNumber}. ${ak.answer}`, 10, font, MARGIN + 10);
      y -= 2;
    }
  }

  return doc.save();
}

export function startPdfWorker(): Worker | null {
  if (!isRedisAvailable()) {
    console.log("[Worker] Redis unavailable — PDF uses direct processing");
    return null;
  }

  const connection = getRedisConnection()!;

  const worker = new Worker(
    "pdf-generation",
    async (job) => {
      const { assignmentId, paperData } = job.data as {
        assignmentId: string;
        paperData: PaperData;
      };
      console.log(`[BullMQ PDF Worker] Processing job ${job.id} for ${assignmentId}`);

      const pdfBytes = await generatePdfBuffer(paperData);
      const base64 = Buffer.from(pdfBytes).toString("base64");

      await cacheSet(`pdf:${assignmentId}`, base64, 3600);

      notifyAssignmentUpdate(assignmentId, {
        status: "pdf_ready",
        message: "PDF generated successfully!",
      });

      console.log(`[BullMQ PDF Worker] Job ${job.id} completed`);
      return { success: true };
    },
    { connection, concurrency: 2 }
  );

  worker.on("failed", (job, err) => {
    console.error(`[BullMQ PDF Worker] Job ${job?.id} failed:`, err.message);
  });

  console.log("[BullMQ Worker] PDF worker started (concurrency: 2)");
  return worker;
}
