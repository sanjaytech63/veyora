import { LogLevel } from "./logger.types";

export interface LoggerConfig {
  environment: string;
  isProduction: boolean;
  isTest: boolean;
  minLevel: LogLevel;
}

const LEVEL_WEIGHTS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export function shouldLog(currentLevel: LogLevel, targetLevel: LogLevel): boolean {
  return LEVEL_WEIGHTS[currentLevel] >= LEVEL_WEIGHTS[targetLevel];
}

export function getLoggerConfig(): LoggerConfig {
  const env = process.env["NODE_ENV"] || "development";
  const isProduction = env === "production";
  const isTest = env === "test";

  let minLevel: LogLevel = (process.env["LOG_LEVEL"] as LogLevel) || "debug";
  if (isProduction && !process.env["LOG_LEVEL"]) {
    minLevel = "info";
  }

  return {
    environment: env,
    isProduction,
    isTest,
    minLevel,
  };
}
