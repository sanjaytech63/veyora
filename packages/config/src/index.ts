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

/**
 * BullMQ Centralized Queue Names
 */
export const QUEUES = {
  SYSTEM: "veyora:system",
  EMAIL: "veyora:email",
  NOTIFICATIONS: "veyora:notifications",
  ORDERS: "veyora:orders",
  PAYMENTS: "veyora:payments",
  EVENTS: "veyora:events",
} as const;

export type QueueNameValue = (typeof QUEUES)[keyof typeof QUEUES];

/**
 * Standardized BullMQ Default Job Configuration
 */
export const DEFAULT_QUEUE_OPTIONS = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
  removeOnComplete: {
    age: 24 * 60 * 60, // 24 hours
    count: 1000,
  },
  removeOnFail: {
    age: 7 * 24 * 60 * 60, // 7 days retention for debugging
    count: 5000,
  },
} as const;

/**
 * Standardized Socket.IO Room Helpers
 */
export const SOCKET_ROOMS = {
  user: (userId: string) => `user:${userId}`,
  adminOrders: "admin:orders",
  adminPayments: "admin:payments",
  adminInventory: "admin:inventory",
} as const;

/**
 * Standardized Socket.IO Event Contracts
 */
export const SOCKET_EVENTS = {
  SERVER_TO_CLIENT: {
    NOTIFICATION_NEW: "notification:new",
    NOTIFICATION_READ: "notification:read",
    NOTIFICATION_UNREAD_COUNT: "notification:unread-count",
    ORDER_UPDATED: "order:updated",
    PAYMENT_UPDATED: "payment:updated",
    SHIPMENT_UPDATED: "shipment:updated",
    ADMIN_ORDER_NEW: "admin:order:new",
    ADMIN_INVENTORY_UPDATED: "admin:inventory:updated",
  },
  CLIENT_TO_SERVER: {
    MARK_NOTIFICATION_READ: "notification:mark-read",
  },
} as const;
