/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { AuditLog, IAuditLog } from "../models/audit-log.model";
import { AuditLogDto, AuditLogListQuery } from "@veyora/types";

export interface LogActor {
  id: string;
  email: string;
  role: string;
}

export class AuditLogService {
  /**
   * Record an administrative audit log event
   */
  public async log(
    actor: LogActor,
    action: string,
    resource: string,
    resourceId?: string | null,
    details?: Record<string, unknown> | null,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<IAuditLog> {
    try {
      const logDoc = await AuditLog.create({
        actorId: new mongoose.Types.ObjectId(actor.id),
        actorEmail: actor.email,
        actorRole: actor.role,
        action,
        resource,
        resourceId: resourceId || null,
        details: details || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
      return logDoc;
    } catch {
      // Non-blocking log persistence failure
      return null as any;
    }
  }

  /**
   * Query bounded audit log history
   */
  public async queryLogs(query: AuditLogListQuery = {}): Promise<{
    logs: AuditLogDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page && query.page > 0 ? Number(query.page) : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(Number(query.limit), 100) : 50;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.actorId && mongoose.Types.ObjectId.isValid(query.actorId)) {
      filter.actorId = new mongoose.Types.ObjectId(query.actorId);
    }

    if (query.resource) {
      filter.resource = query.resource.toLowerCase();
    }

    if (query.action) {
      filter.action = query.action.toUpperCase();
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.createdAt.$lte = new Date(query.endDate);
      }
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    const logDtos: AuditLogDto[] = (logs as any[]).map((doc) => ({
      id: doc._id.toString(),
      actorId: doc.actorId?.toString() || "",
      actorEmail: doc.actorEmail,
      actorRole: doc.actorRole,
      action: doc.action,
      resource: doc.resource,
      resourceId: doc.resourceId || null,
      details: doc.details || null,
      ipAddress: doc.ipAddress || null,
      userAgent: doc.userAgent || null,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    }));

    return {
      logs: logDtos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

export const auditLogService = new AuditLogService();
