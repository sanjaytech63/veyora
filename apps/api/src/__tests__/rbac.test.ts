/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createApp } from "../app";
import { hasPermission } from "../modules/rbac/permission-registry";
import { RoleService } from "../modules/rbac/services/role.service";
import { StaffService } from "../modules/rbac/services/staff.service";
import { AuditLogService } from "../modules/rbac/services/audit-log.service";

let mockUsers: any[] = [];
let mockRoles: any[] = [];
let mockAuditLogs: any[] = [];

const mockSuperadminSessionId = new mongoose.Types.ObjectId();
const mockAdminSessionId = new mongoose.Types.ObjectId();
const mockCustomerSessionId = new mongoose.Types.ObjectId();

function mockQuery<T>(execFn: () => Promise<T> | T) {
  const queryObj: any = {
    populate: vi.fn(() => queryObj),
    sort: vi.fn(() => queryObj),
    skip: vi.fn(() => queryObj),
    limit: vi.fn(() => queryObj),
    lean: vi.fn(() => Promise.resolve(execFn())),
    select: vi.fn(() => Promise.resolve(execFn())),
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

// 1. Mock Session Model
vi.mock("../modules/auth/models/session.model", () => ({
  Session: {
    findById: vi.fn((id: any) => {
      const idStr = id?.toString ? id.toString() : String(id);
      if (
        idStr === mockSuperadminSessionId.toString() ||
        idStr === mockAdminSessionId.toString() ||
        idStr === mockCustomerSessionId.toString()
      ) {
        return Promise.resolve({
          _id: new mongoose.Types.ObjectId(idStr),
          isRevoked: false,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        });
      }
      return Promise.resolve(null);
    }),
  },
}));

// 2. Mock Role Model
vi.mock("../modules/rbac/models/role.model", () => {
  const MockRole: any = vi.fn((data: any) => {
    const doc = {
      _id: new mongoose.Types.ObjectId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: vi.fn(function (this: any) {
        const idx = mockRoles.findIndex((r) => r._id?.toString() === this._id?.toString());
        if (idx >= 0) mockRoles[idx] = this;
        else mockRoles.push(this);
        return Promise.resolve(this);
      }),
    };
    return doc;
  });

  MockRole.find = vi.fn((filter?: any) =>
    mockQuery(() => {
      if (filter?._id?.$in) {
        const idStrings = filter._id.$in.map((id: any) => id.toString());
        return mockRoles.filter((r) => idStrings.includes(r._id.toString()));
      }
      return [...mockRoles];
    })
  );

  MockRole.findById = vi.fn((id: any) => {
    const idStr = id?.toString ? id.toString() : String(id);
    const role = mockRoles.find((r) => r._id.toString() === idStr);
    return Promise.resolve(role || null);
  });

  MockRole.findOne = vi.fn((filter: any) => {
    if (filter?.name) {
      return Promise.resolve(mockRoles.find((r) => r.name === filter.name) || null);
    }
    return Promise.resolve(mockRoles[0] || null);
  });

  MockRole.create = vi.fn((data: any) => {
    const doc = MockRole(data);
    mockRoles.push(doc);
    return Promise.resolve(doc);
  });

  MockRole.findOneAndUpdate = vi.fn((filter: any, update: any) => {
    const existing = mockRoles.find((r) => r.name === filter.name);
    if (existing) return Promise.resolve(existing);
    const newDoc = MockRole(update.$setOnInsert || update);
    mockRoles.push(newDoc);
    return Promise.resolve(newDoc);
  });

  MockRole.findByIdAndDelete = vi.fn((id: any) => {
    const idStr = id?.toString ? id.toString() : String(id);
    const idx = mockRoles.findIndex((r) => r._id.toString() === idStr);
    if (idx >= 0) mockRoles.splice(idx, 1);
    return Promise.resolve({ _id: id });
  });

  MockRole.countDocuments = vi.fn(() => Promise.resolve(mockRoles.length));

  return { Role: MockRole };
});

// 3. Mock User Model
vi.mock("../modules/auth/models/user.model", () => {
  const MockUser: any = vi.fn((data: any) => {
    const doc = {
      _id: new mongoose.Types.ObjectId(),
      ...data,
      assignedRoles: data.assignedRoles || [],
      customPermissions: data.customPermissions || [],
      permissions: data.permissions || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      save: vi.fn(function (this: any) {
        const idx = mockUsers.findIndex((u) => u._id?.toString() === this._id?.toString());
        if (idx >= 0) mockUsers[idx] = this;
        else mockUsers.push(this);
        return Promise.resolve(this);
      }),
    };
    return doc;
  });

  MockUser.find = vi.fn((filter?: any) =>
    mockQuery(() => {
      let results = [...mockUsers];
      if (filter?.role?.$in) {
        results = results.filter((u) => filter.role.$in.includes(u.role));
      }
      if (filter?.isActive !== undefined) {
        results = results.filter((u) => u.isActive === filter.isActive);
      }
      if (filter?.role && typeof filter.role === "string") {
        results = results.filter((u) => u.role === filter.role);
      }
      return results;
    })
  );

  MockUser.findById = vi.fn((id: any) => {
    const idStr = id?.toString ? id.toString() : String(id);
    const user = mockUsers.find((u) => u._id.toString() === idStr);
    return mockQuery(() => user || null);
  });

  MockUser.findOne = vi.fn((filter: any) => {
    if (filter?._id) {
      const idStr = filter._id?.toString ? filter._id.toString() : String(filter._id);
      const user = mockUsers.find((u) => u._id.toString() === idStr);
      return mockQuery(() => user || null);
    }
    if (filter?.email) {
      const user = mockUsers.find((u) => u.email === filter.email);
      return mockQuery(() => user || null);
    }
    return mockQuery(() => mockUsers[0] || null);
  });

  MockUser.create = vi.fn((data: any) => {
    const doc = MockUser(data);
    mockUsers.push(doc);
    return Promise.resolve(doc);
  });

  MockUser.findByIdAndDelete = vi.fn((id: any) => {
    const idStr = id?.toString ? id.toString() : String(id);
    const idx = mockUsers.findIndex((u) => u._id.toString() === idStr);
    if (idx >= 0) mockUsers.splice(idx, 1);
    return Promise.resolve({ _id: id });
  });

  MockUser.countDocuments = vi.fn((filter?: any) => {
    let count = mockUsers.length;
    if (filter?.role === "superadmin") {
      count = mockUsers.filter(
        (u) =>
          u.role === "superadmin" &&
          (filter.isActive === undefined || u.isActive === filter.isActive)
      ).length;
    } else if (filter?.role?.$in) {
      count = mockUsers.filter((u) => filter.role.$in.includes(u.role)).length;
    }
    return Promise.resolve(count);
  });

  MockUser.aggregate = vi.fn(() => Promise.resolve([]));

  return { User: MockUser };
});

// 4. Mock AuditLog Model
vi.mock("../modules/rbac/models/audit-log.model", () => {
  const MockAuditLog: any = vi.fn((data: any) => ({
    _id: new mongoose.Types.ObjectId(),
    ...data,
    createdAt: new Date(),
  }));

  MockAuditLog.create = vi.fn((data: any) => {
    const doc = MockAuditLog(data);
    mockAuditLogs.push(doc);
    return Promise.resolve(doc);
  });

  MockAuditLog.find = vi.fn(() => mockQuery(() => [...mockAuditLogs]));
  MockAuditLog.countDocuments = vi.fn(() => Promise.resolve(mockAuditLogs.length));

  return { AuditLog: MockAuditLog };
});

const app = createApp();

describe("Phase R — Veyora Administrative Authorization, Roles & Permissions", () => {
  let superadminToken: string;
  let adminWithRolesToken: string;
  let limitedAdminToken: string;
  let customerToken: string;

  const superadminId = new mongoose.Types.ObjectId();
  const fullAdminId = new mongoose.Types.ObjectId();
  const limitedAdminId = new mongoose.Types.ObjectId();

  const roleService = new RoleService();
  const staffService = new StaffService();
  const auditLogService = new AuditLogService();

  beforeEach(() => {
    mockUsers = [];
    mockRoles = [];
    mockAuditLogs = [];

    const secret = "veyora_jwt_access_secret_super_secure_32chars_min";

    superadminToken = jwt.sign(
      {
        sub: superadminId.toString(),
        email: "superadmin@veyora.luxury",
        role: "superadmin",
        permissions: ["*"],
        sessionId: mockSuperadminSessionId.toString(),
      },
      secret,
      { expiresIn: "1h" }
    );

    adminWithRolesToken = jwt.sign(
      {
        sub: fullAdminId.toString(),
        email: "security.director@veyora.luxury",
        role: "admin",
        permissions: [
          "roles:read",
          "roles:write",
          "roles:delete",
          "staff:read",
          "staff:write",
          "staff:delete",
          "audit:read",
          "products:read",
          "products:write",
          "orders:read",
          "orders:write",
          "coupons:read",
          "coupons:write",
        ],
        sessionId: mockAdminSessionId.toString(),
      },
      secret,
      { expiresIn: "1h" }
    );

    limitedAdminToken = jwt.sign(
      {
        sub: limitedAdminId.toString(),
        email: "catalog.editor@veyora.luxury",
        role: "admin",
        permissions: ["products:read", "products:write"],
        sessionId: mockAdminSessionId.toString(),
      },
      secret,
      { expiresIn: "1h" }
    );

    customerToken = jwt.sign(
      {
        sub: new mongoose.Types.ObjectId().toString(),
        email: "patron@luxury.com",
        role: "customer",
        permissions: [],
        sessionId: mockCustomerSessionId.toString(),
      },
      secret,
      { expiresIn: "1h" }
    );
  });

  describe("1. Granular Permission Engine (`hasPermission`)", () => {
    it("should allow exact permission match", () => {
      expect(hasPermission(["products:read", "orders:read"], "products:read")).toBe(true);
      expect(hasPermission(["products:read"], "orders:read")).toBe(false);
    });

    it("should allow root wildcard `*` to satisfy any permission", () => {
      expect(hasPermission(["*"], "products:delete")).toBe(true);
      expect(hasPermission(["*"], "roles:write")).toBe(true);
      expect(hasPermission(["*"], "settings:write")).toBe(true);
      expect(hasPermission(["manage:all"], "audit:read")).toBe(true);
    });

    it("should allow domain wildcards (e.g. `products:*`) to satisfy all domain actions", () => {
      expect(hasPermission(["products:*"], "products:read")).toBe(true);
      expect(hasPermission(["products:*"], "products:write")).toBe(true);
      expect(hasPermission(["products:*"], "products:delete")).toBe(true);
      expect(hasPermission(["products:*"], "orders:read")).toBe(false);
    });

    it("should treat write permission as satisfying read permission (Write implies Read)", () => {
      expect(hasPermission(["products:write"], "products:read")).toBe(true);
      expect(hasPermission(["categories:write"], "categories:read")).toBe(true);
      expect(hasPermission(["inventory:write"], "inventory:read")).toBe(true);
      expect(hasPermission(["orders:write"], "orders:read")).toBe(true);
      expect(hasPermission(["customers:write"], "customers:read")).toBe(true);
      expect(hasPermission(["staff:write"], "staff:read")).toBe(true);

      // Read does NOT imply write
      expect(hasPermission(["products:read"], "products:write")).toBe(false);
      // Write does NOT imply delete
      expect(hasPermission(["products:write"], "products:delete")).toBe(false);
    });

    it("should honor legacy aliases for backwards compatibility with existing phases", () => {
      expect(hasPermission(["manage:catalog"], "products:write")).toBe(true);
      expect(hasPermission(["catalog:manage"], "categories:write")).toBe(true);
      expect(hasPermission(["manage:orders"], "orders:cancel")).toBe(true);
      expect(hasPermission(["manage:orders"], "orders:update_status")).toBe(true);
      expect(hasPermission(["manage:coupons"], "coupons:write")).toBe(true);
      expect(hasPermission(["manage:inventory"], "inventory:read")).toBe(true);
      expect(hasPermission(["read:users"], "customers:read")).toBe(true);
      expect(hasPermission(["write:users"], "customers:write")).toBe(true);
      expect(hasPermission(["manage:shipping"], "shipping:read")).toBe(true);
      expect(hasPermission(["read:analytics"], "analytics:read")).toBe(true);
      expect(hasPermission(["manage:dashboard"], "analytics:read")).toBe(true);
    });
  });

  describe("2. Effective Permissions Computation", () => {
    it("should compute unified effective permissions across assigned roles and custom direct overrides", () => {
      const mockRoleA = {
        _id: new mongoose.Types.ObjectId(),
        name: "catalog_mgr",
        permissions: ["products:read", "products:write", "categories:read"],
      };
      const mockRoleB = {
        _id: new mongoose.Types.ObjectId(),
        name: "inventory_spec",
        permissions: ["inventory:read", "inventory:write"],
      };

      const mockUser: any = {
        role: "admin",
        customPermissions: ["coupons:read"],
        permissions: [],
      };

      const effective = staffService.computeEffectivePermissions(mockUser, [
        mockRoleA as any,
        mockRoleB as any,
      ]);

      expect(effective).toContain("products:read");
      expect(effective).toContain("products:write");
      expect(effective).toContain("categories:read");
      expect(effective).toContain("inventory:read");
      expect(effective).toContain("inventory:write");
      expect(effective).toContain("coupons:read");
      expect(effective.length).toBe(6);
    });

    it("should always grant wildcard `*` to superadmin", () => {
      const superadminUser: any = {
        role: "superadmin",
        customPermissions: [],
        permissions: [],
      };
      const effective = staffService.computeEffectivePermissions(superadminUser, []);
      expect(effective).toEqual(["*"]);
    });
  });

  describe("3. Role Management & Security Constraints", () => {
    it("should seed default administrative roles cleanly", async () => {
      await roleService.seedDefaultRoles();
      expect(mockRoles.length).toBeGreaterThanOrEqual(5);
      const superadminRole = mockRoles.find((r) => r.name === "superadmin");
      expect(superadminRole).toBeDefined();
      expect(superadminRole.isSystem).toBe(true);
    });

    it("should create a custom role with valid permissions", async () => {
      const actor = {
        id: superadminId.toString(),
        email: "superadmin@veyora.luxury",
        role: "superadmin",
      };
      const role = await roleService.createRole(actor, {
        name: "social_media_manager",
        displayName: "Social Media & Review Moderator",
        description: "Manages apparel reviews and promotions",
        permissions: ["products:read", "coupons:read"],
      });

      expect(role.name).toBe("social_media_manager");
      expect(role.permissions).toEqual(["products:read", "coupons:read"]);
      expect(role.isSystem).toBe(false);

      // Verify audit log emitted
      expect(mockAuditLogs.some((l) => l.action === "ROLE_CREATED")).toBe(true);
    });

    it("should reject creating role with duplicate name", async () => {
      const actor = {
        id: superadminId.toString(),
        email: "superadmin@veyora.luxury",
        role: "superadmin",
      };
      mockRoles.push({
        name: "order_dispatch",
        isSystem: false,
        _id: new mongoose.Types.ObjectId(),
      });

      await expect(
        roleService.createRole(actor, {
          name: "order_dispatch",
          displayName: "Duplicate Order Dispatch",
          permissions: ["orders:read"],
        })
      ).rejects.toThrow("already exists");
    });

    it("should prevent privilege escalation: non-superadmin cannot create role with unpossessed permissions", async () => {
      // limitedAdmin only has ["products:read", "products:write"]
      const actor = {
        id: limitedAdminId.toString(),
        email: "catalog.editor@veyora.luxury",
        role: "admin",
      };

      mockUsers.push({
        _id: limitedAdminId,
        role: "admin",
        permissions: ["products:read", "products:write"],
      });

      await expect(
        roleService.createRole(actor, {
          name: "escalated_role",
          displayName: "Escalated Role",
          permissions: ["payments:refund"], // not possessed!
        })
      ).rejects.toThrow("Privilege escalation prevented");
    });

    it("should prevent deletion of system roles", async () => {
      const actor = {
        id: superadminId.toString(),
        email: "superadmin@veyora.luxury",
        role: "superadmin",
      };
      const systemRoleId = new mongoose.Types.ObjectId();
      mockRoles.push({
        _id: systemRoleId,
        name: "admin",
        displayName: "Administrator",
        isSystem: true,
      });

      await expect(roleService.deleteRole(actor, systemRoleId.toString())).rejects.toThrow(
        "Cannot delete system roles"
      );
    });
  });

  describe("4. Staff Management & Least Privilege Enforcement", () => {
    it("should enroll new staff member and hash temporary credentials", async () => {
      const actor = {
        id: superadminId.toString(),
        email: "superadmin@veyora.luxury",
        role: "superadmin",
      };
      const roleId = new mongoose.Types.ObjectId();
      mockRoles.push({
        _id: roleId,
        name: "support_lead",
        displayName: "Support Lead",
        permissions: ["customers:read", "orders:read"],
      });

      const staff = await staffService.createStaff(actor, {
        email: "helena.support@veyora.luxury",
        firstName: "Helena",
        lastName: "Troy",
        role: "admin",
        assignedRoleIds: [roleId.toString()],
      });

      expect(staff.email).toBe("helena.support@veyora.luxury");
      expect(staff.effectivePermissions).toContain("customers:read");
      expect(staff.effectivePermissions).toContain("orders:read");

      // Verify audit log emitted
      expect(mockAuditLogs.some((l) => l.action === "STAFF_CREATED")).toBe(true);
    });

    it("should prevent non-superadmin from enrolling or promoting a superadmin", async () => {
      const actor = { id: fullAdminId.toString(), email: "admin@veyora.luxury", role: "admin" };

      await expect(
        staffService.createStaff(actor, {
          email: "rogue.superadmin@veyora.luxury",
          firstName: "Rogue",
          lastName: "Agent",
          role: "superadmin", // forbidden for regular admin!
        })
      ).rejects.toThrow("Only Superadmin can assign or create Superadmin staff members");
    });

    it("should prevent self-deactivation of administrative account", async () => {
      const actor = {
        id: fullAdminId.toString(),
        email: "security.director@veyora.luxury",
        role: "admin",
      };

      await expect(
        staffService.updateStaffStatus(
          actor,
          fullAdminId.toString(),
          false,
          "Accidental suspension"
        )
      ).rejects.toThrow("Cannot deactivate your own administrative account");
    });

    it("should prevent self-deletion of administrative account", async () => {
      const actor = {
        id: fullAdminId.toString(),
        email: "security.director@veyora.luxury",
        role: "admin",
      };

      await expect(staffService.deleteStaff(actor, fullAdminId.toString())).rejects.toThrow(
        "Cannot delete your own administrative account"
      );
    });

    it("should prevent deactivating the only remaining active Superadmin", async () => {
      const actor = {
        id: superadminId.toString(),
        email: "superadmin@veyora.luxury",
        role: "superadmin",
      };
      const otherSuperadminId = new mongoose.Types.ObjectId();

      mockUsers.push({
        _id: otherSuperadminId,
        role: "superadmin",
        isActive: true,
      });

      // Attempting to deactivate target which is the only active superadmin
      await expect(
        staffService.updateStaffStatus(actor, otherSuperadminId.toString(), false, "Retiring")
      ).rejects.toThrow("Cannot deactivate the only remaining active Superadmin account");
    });
  });

  describe("5. Route-Level Authorization & Access Restrictions", () => {
    it("should reject unauthenticated requests with 401 Unauthorized", async () => {
      const res = await request(app).get("/api/v1/admin/roles");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should reject customer role with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/v1/admin/roles")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should reject admin lacking required permission with 403 Forbidden", async () => {
      // limitedAdminToken only has products:read and products:write, lacks roles:read
      const res = await request(app)
        .get("/api/v1/admin/roles")
        .set("Authorization", `Bearer ${limitedAdminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Missing required permissions: [roles:read]");
    });

    it("should allow admin possessing required permission with 200 OK", async () => {
      // adminWithRolesToken has roles:read
      const res = await request(app)
        .get("/api/v1/admin/roles")
        .set("Authorization", `Bearer ${adminWithRolesToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should enforce granular permissions on business domains: reject coupons write when missing coupons:write", async () => {
      // limitedAdminToken only has products:read & products:write, lacks coupons:write
      const res = await request(app)
        .post("/api/v1/admin/coupons")
        .set("Authorization", `Bearer ${limitedAdminToken}`)
        .send({
          code: "SUMMER2026",
          type: "percentage",
          value: 20,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Missing required permissions: [coupons:write]");
    });

    it("should allow superadmin token to bypass all permission gates", async () => {
      const res = await request(app)
        .get("/api/v1/admin/staff")
        .set("Authorization", `Bearer ${superadminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("staff");
    });
  });

  describe("6. Audit Log Records & Querying", () => {
    it("should record security events and return paginated audit logs", async () => {
      const actor = {
        id: superadminId.toString(),
        email: "superadmin@veyora.luxury",
        role: "superadmin",
      };
      await auditLogService.log(
        actor,
        "SECURITY_POLICY_CHECK",
        "security",
        null,
        { test: true },
        "127.0.0.1"
      );

      const res = await auditLogService.queryLogs({ limit: 10 });
      expect(res.logs.length).toBeGreaterThan(0);
      expect(res.logs[0]?.action).toBe("SECURITY_POLICY_CHECK");
      expect(res.logs[0]?.ipAddress).toBe("127.0.0.1");
    });
  });
});
