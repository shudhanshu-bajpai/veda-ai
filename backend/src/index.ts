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
  try {
    await mongoose.connect(config.mongodbUri);
    console.log("Connected to MongoDB");

    await initRedis();

    // Initialize BullMQ queues (generation + PDF)
    initQueues();

    // Start BullMQ workers
    startGenerationWorker();
    startPdfWorker();

    server.listen(config.port, "0.0.0.0", () => {
      console.log(`Server listening on port ${config.port}`);
      console.log(`WebSocket on ws://0.0.0.0:${config.port}/ws`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
