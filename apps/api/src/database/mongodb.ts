import mongoose from "mongoose";
import { env } from "../config/env";
import { logger } from "../config/logger";

interface MongoHealth {
  connected: boolean;
  state: string;
  latencyMs?: number;
}

const stateNames: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export class MongoDatabase {
  private static isConnected = false;

  public static get connected(): boolean {
    return MongoDatabase.isConnected;
  }

  public static async connect(retryCount = 0): Promise<void> {
    const maxRetries = env.NODE_ENV === "test" ? 1 : 5;
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);

    try {
      logger.info(
        { uri: env.MONGODB_URI.replace(/:([^:@]{1,})@/, ":****@") },
        "Connecting to MongoDB..."
      );

      mongoose.connection.on("connected", () => {
        MongoDatabase.isConnected = true;
        logger.info("MongoDB connection established successfully");
      });

      mongoose.connection.on("error", (err) => {
        logger.error({ error: err.message }, "MongoDB connection error encountered");
      });

      mongoose.connection.on("disconnected", () => {
        MongoDatabase.isConnected = false;
        logger.warn("MongoDB connection disconnected");
      });

      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });

      MongoDatabase.isConnected = true;
    } catch (error) {
      MongoDatabase.isConnected = false;
      const message = error instanceof Error ? error.message : String(error);
      logger.error({ error: message, retryCount }, "Failed to connect to MongoDB");

      if (retryCount < maxRetries && env.NODE_ENV !== "test") {
        logger.info({ retryDelay }, `Retrying MongoDB connection in ${retryDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return MongoDatabase.connect(retryCount + 1);
      }

      if (env.NODE_ENV === "production") {
        throw new Error(`Fatal: MongoDB connection failure - ${message}`);
      }
    }
  }

  public static async checkHealth(): Promise<MongoHealth> {
    const state = mongoose.connection.readyState;
    const isStateConnected = state === 1;

    if (!isStateConnected || !mongoose.connection.db) {
      return {
        connected: false,
        state: stateNames[state] ?? "unknown",
      };
    }

    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      const latencyMs = Date.now() - start;

      return {
        connected: true,
        state: "connected",
        latencyMs,
      };
    } catch {
      return {
        connected: false,
        state: "error",
      };
    }
  }

  public static async disconnect(): Promise<void> {
    if (mongoose.connection.readyState !== 0) {
      logger.info("Closing MongoDB connection...");
      await mongoose.disconnect();
      MongoDatabase.isConnected = false;
      logger.info("MongoDB connection closed gracefully");
    }
  }
}
