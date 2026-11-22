/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.PORT = "4001";
process.env.RATE_LIMIT_MAX = "1000";

// Global BullMQ mock for unit/integration tests running without live Redis
vi.mock("bullmq", () => ({
  Queue: vi.fn().mockImplementation((name: string, options: any) => ({
    name,
    options,
    add: vi.fn().mockImplementation((jobName: string, data: any, opts: any) =>
      Promise.resolve({ id: opts?.jobId || `mock_job_${Date.now()}`, name: jobName, data, opts })
    ),
    close: vi.fn().mockResolvedValue(undefined),
  })),
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Global Redis mock
vi.mock("../infrastructure/redis/redis-client", () => ({
  createRedisClient: vi.fn(() => ({
    on: vi.fn(),
    quit: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    status: "ready",
    duplicate: vi.fn(() => ({
      on: vi.fn(),
      quit: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn(),
      status: "ready",
    })),
  })),
}));

// Global NotificationModel mock for tests that trigger background notifications without live MongoDB
const globalMockNotifications: any[] = [];
function mockSetupQuery<T>(execFn: () => Promise<T> | T) {
  const queryObj: any = {
    populate: vi.fn(() => queryObj),
    sort: vi.fn(() => queryObj),
    skip: vi.fn(() => queryObj),
    limit: vi.fn(() => queryObj),
    lean: vi.fn(() => queryObj),
    select: vi.fn(() => queryObj),
    then: (resolve: (val: T) => any, reject?: (err: any) => any) => {
      try {
        return Promise.resolve(execFn()).then(resolve, reject);
      } catch (err) {
        if (reject) return Promise.reject(err).catch(reject);
        throw err;
      }
    },
  };
  return queryObj;
}

vi.mock("../modules/notification/models/notification.model", () => {
  const MockNotification: any = vi.fn((data: any) => ({
    _id: "mock_notif_id_" + Date.now(),
    isRead: false,
    readAt: null,
    actionUrl: "",
    data: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
    save: vi.fn().mockResolvedValue(data),
  }));

  MockNotification.create = vi.fn((data: any) => {
    const doc = MockNotification(data);
    globalMockNotifications.push(doc);
    return Promise.resolve(doc);
  });

  MockNotification.findOne = vi.fn(() => Promise.resolve(null));
  MockNotification.findById = vi.fn(() => Promise.resolve(null));
  MockNotification.find = vi.fn(() => mockSetupQuery(() => [...globalMockNotifications]));
  MockNotification.countDocuments = vi.fn(() => Promise.resolve(0));
  MockNotification.updateMany = vi.fn(() => Promise.resolve({ modifiedCount: 1 }));
  MockNotification.deleteOne = vi.fn(() => Promise.resolve({ deletedCount: 1 }));

  return { NotificationModel: MockNotification };
});

