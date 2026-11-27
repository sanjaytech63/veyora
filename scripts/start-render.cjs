#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Veyora Render Unified Runner
 *
 * Runs the Express API server and the BullMQ background worker inside a single
 * Render Web Service instance. This allows deploying on Render's 100% Free Tier
 * without requiring a credit card or a separate paid Background Worker instance.
 */

const { fork } = require("child_process");
const path = require("path");

const startWorker = process.env.ENABLE_EMBEDDED_WORKER !== "false";
let workerProcess = null;

if (startWorker) {
  try {
    const workerScript = path.resolve(__dirname, "../apps/worker/dist/index.js");
    console.log(`[Render Runner] Spawning embedded BullMQ worker from ${workerScript}...`);

    workerProcess = fork(workerScript, {
      stdio: "inherit",
      env: {
        ...process.env,
        CONCURRENCY: process.env.CONCURRENCY || "3",
      },
    });

    workerProcess.on("error", (err) => {
      console.error("[Render Runner] Background worker error:", err.message);
    });

    workerProcess.on("exit", (code, signal) => {
      console.warn(`[Render Runner] Background worker exited (code: ${code}, signal: ${signal})`);
    });
  } catch (err) {
    console.error("[Render Runner] Failed to spawn background worker:", err);
  }
}

// Forward termination signals to child process
const handleTermination = (signal) => {
  if (workerProcess && !workerProcess.killed) {
    try {
      workerProcess.kill(signal);
    } catch {
      // Ignore cleanup error
    }
  }
};

process.on("SIGINT", () => handleTermination("SIGINT"));
process.on("SIGTERM", () => handleTermination("SIGTERM"));
process.on("exit", () => handleTermination("SIGTERM"));

// Launch the Express API server in the main process
console.log("[Render Runner] Launching Veyora API server on port", process.env.PORT || 10000);
require(path.resolve(__dirname, "../apps/api/dist/server.js"));
