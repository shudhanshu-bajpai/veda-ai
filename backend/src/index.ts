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

app.use(
  cors({
    origin: [config.frontendUrl, "http://localhost:3000", "http://localhost:3001"],
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

    server.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
      console.log(`WebSocket at ws://localhost:${config.port}/ws`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
