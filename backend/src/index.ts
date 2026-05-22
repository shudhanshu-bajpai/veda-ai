import express from "express";
import cors from "cors";
import http from "http";
import mongoose from "mongoose";
import { config } from "./config";
import { setupWebSocket } from "./websocket";
import { initRedis } from "./services/redis";
import { initQueues } from "./services/queue";
import { startGenerationWorker } from "./workers/generationWorker";
import { startPdfWorker } from "./workers/pdfWorker";
import assignmentRoutes from "./routes/assignments";
import chatRoutes from "./routes/chat";

const app = express();
const server = http.createServer(app);

// Allow:
//  - the configured production frontend URL
//  - localhost (any port) during dev
//  - any Vercel preview / production deployment (*.vercel.app)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // server-to-server, curl, etc.
      const allowed =
        origin === config.frontendUrl ||
        /^http:\/\/localhost(:\d+)?$/.test(origin) ||
        /\.vercel\.app$/.test(origin);
      callback(null, allowed);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/assignments", assignmentRoutes);
app.use("/api/chat", chatRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

setupWebSocket(server);

async function start() {
  // Required env vars — fail fast with a clear message if missing.
  const missing: string[] = [];
  if (!process.env.MONGODB_URI) missing.push("MONGODB_URI");
  if (!process.env.GEMINI_API_KEY) missing.push("GEMINI_API_KEY");
  if (missing.length) {
    console.error(
      `\n[FATAL] Missing required env vars: ${missing.join(", ")}\n` +
        `Set them in the Render dashboard (Service → Environment) and redeploy.\n`
    );
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 10_000,
    });
    console.log("Connected to MongoDB");

    await initRedis();
    initQueues();
    startGenerationWorker();
    startPdfWorker();

    server.listen(config.port, "0.0.0.0", () => {
      console.log(`Server listening on port ${config.port}`);
      console.log(`WebSocket on ws://0.0.0.0:${config.port}/ws`);
    });
  } catch (error) {
    const err = error as Error & { code?: string; reason?: unknown };
    console.error("\n[FATAL] Failed to start server:");
    console.error(`  message: ${err.message}`);
    if (err.code) console.error(`  code:    ${err.code}`);
    if (err.message?.includes("ENOTFOUND") || err.message?.includes("ServerSelection")) {
      console.error(
        "\nLikely cause: MongoDB can't be reached. Check:\n" +
          "  1. MONGODB_URI is correct (try it locally with mongosh)\n" +
          "  2. Atlas → Network Access allows 0.0.0.0/0 (or this host's IP)\n"
      );
    }
    if (err.message?.includes("Authentication failed") || err.message?.includes("bad auth")) {
      console.error(
        "\nLikely cause: MongoDB credentials are wrong. Check the username/password in MONGODB_URI.\n"
      );
    }
    process.exit(1);
  }
}

start();
