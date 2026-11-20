/**
 * Veyora Global Configuration Constants
 */

export const PORTS = {
  WEB: 3000,
  ADMIN: 3001,
  API: 4000,
} as const;

export const SERVICES = {
  NAME: "Veyora",
  VERSION: "0.1.0",
} as const;

export const DEFAULT_REDIS_CONFIG = {
  HOST: "127.0.0.1",
  PORT: 6379,
  PASSWORD: "veyora_redis_dev",
} as const;

export const DEFAULT_MONGO_CONFIG = {
  HOST: "127.0.0.1",
  PORT: 27017,
  DATABASE: "veyora_dev",
} as const;

export const QUEUES = {
  SYSTEM: "veyora-system",
  NOTIFICATIONS: "veyora-notifications",
  EVENTS: "veyora-events",
} as const;
