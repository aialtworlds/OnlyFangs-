import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { users, adminAuditLogs, adminPermissions } from "../../drizzle/schema";
import { eq, desc, and, inArray } from "drizzle-orm";

// Helper: Check if user is admin-master
function isAdminMaster(role: string): boolean {
  return role === "admin_master";
}

// Helper: Check if user is admin or admin-master
function isAdmin(role: string): boolean {
  return role === "admin" || role === "admin_master" || role === "sub_admin";
}

// Helper: Check if user is moderator or higher
function isModerator(role: string): boolean {
  return role === "moderator" || isAdmin(role);
}

// Helper: Log admin action
async function logAdminAction(
  adminId: number,
  action: string,
  targetType: string,
  targetId: number | null,
  details: Record<string, any>,
  reason?: string,
  ipAddress?: string,
  userAgent?: string
) {
  const db = getDb();
  await db.insert(adminAuditLogs).values({
    adminId,
    action,
    targetType,
    targetId,
    details,
    reason,
    ipAddress,
    userAgent,
    status: "success",
  });
}

export const adminRouter = router({
  // ── Admin Management ──────────────────────────────────────────

  // Promote user to admin (admin-master only)
  promoteToAdmin: protectedProcedure
    .input(z.object({
      userId: z.number(),
      adminLevel: z.enum(["admin", "sub_admin", "moderator"]),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdminMaster(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admin-master can promote users to admin",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const targetUser = await db.query.users.findFirst({
        where: eq(users.id, input.userId),
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Update user role
      await db.update(users).set({ role: input.adminLevel }).where(eq(users.id, input.userId));

      // Log action
      await logAdminAction(
        ctx.user.id,
        "promote_to_admin",
        "user",
        input.userId,
        { previousRole: targetUser.role, newRole: input.adminLevel },
        input.reason,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      return { success: true, message: `User promoted to ${input.adminLevel}` };
    }),

  // Demote admin (admin-master only)
  demoteAdmin: protectedProcedure
    .input(z.object({
      userId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdminMaster(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admin-master can demote admins",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const targetUser = await db.query.users.findFirst({
        where: eq(users.id, input.userId),
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (targetUser.role === "admin_master") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot demote admin-master",
        });
      }

      // Update user role back to user
      await db.update(users).set({ role: "user" }).where(eq(users.id, input.userId));

      // Log action
      await logAdminAction(
        ctx.user.id,
        "demote_admin",
        "user",
        input.userId,
        { previousRole: targetUser.role },
        input.reason,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      return { success: true, message: "Admin demoted to user" };
    }),

  // Get all admins (admin-master only)
  listAdmins: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdminMaster(ctx.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admin-master can list admins",
      });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const admins = await db.query.users.findMany({
      where: inArray(users.role, ["admin", "sub_admin", "moderator", "admin_master"]),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return admins;
  }),

  // ── Audit Logs ────────────────────────────────────────────────

  // Get audit logs (admin-master and admin can view all, moderators see limited)
  getAuditLogs: protectedProcedure
    .input(z.object({
      limit: z.number().max(500).default(50),
      offset: z.number().default(0),
      adminId: z.number().optional(),
      action: z.string().optional(),
      targetType: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (!isModerator(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and moderators can view audit logs",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const conditions = [];

      // Moderators can only see logs from their own actions
      if (ctx.user.role === "moderator") {
        conditions.push(eq(adminAuditLogs.adminId, ctx.user.id));
      } else if (input.adminId) {
        conditions.push(eq(adminAuditLogs.adminId, input.adminId));
      }

      if (input.action) {
        conditions.push(eq(adminAuditLogs.action, input.action));
      }

      if (input.targetType) {
        conditions.push(eq(adminAuditLogs.targetType, input.targetType));
      }

      const logs = await db.query.adminAuditLogs.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: desc(adminAuditLogs.createdAt),
        limit: input.limit,
        offset: input.offset,
      });

      return logs;
    }),

  // Get audit logs for specific admin (admin-master only)
  getAdminActivityLog: protectedProcedure
    .input(z.object({
      adminId: z.number(),
      limit: z.number().max(500).default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      if (!isAdminMaster(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admin-master can view other admins' activity",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const logs = await db.query.adminAuditLogs.findMany({
        where: eq(adminAuditLogs.adminId, input.adminId),
        orderBy: desc(adminAuditLogs.createdAt),
        limit: input.limit,
        offset: input.offset,
      });

      return logs;
    }),

  // ── Permissions ───────────────────────────────────────────────

  // Grant permission to admin (admin-master only)
  grantPermission: protectedProcedure
    .input(z.object({
      adminId: z.number(),
      permission: z.string(),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdminMaster(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admin-master can grant permissions",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.insert(adminPermissions).values({
        adminId: input.adminId,
        permission: input.permission,
        grantedBy: ctx.user.id,
        expiresAt: input.expiresAt,
      });

      await logAdminAction(
        ctx.user.id,
        "grant_permission",
        "admin",
        input.adminId,
        { permission: input.permission, expiresAt: input.expiresAt },
        undefined,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      return { success: true, message: "Permission granted" };
    }),

  // Revoke permission from admin (admin-master only)
  revokePermission: protectedProcedure
    .input(z.object({
      permissionId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdminMaster(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admin-master can revoke permissions",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const permission = await db.query.adminPermissions.findFirst({
        where: eq(adminPermissions.id, input.permissionId),
      });

      if (!permission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Permission not found",
        });
      }

      await db.delete(adminPermissions).where(eq(adminPermissions.id, input.permissionId));

      await logAdminAction(
        ctx.user.id,
        "revoke_permission",
        "admin",
        permission.adminId,
        { permission: permission.permission },
        undefined,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      return { success: true, message: "Permission revoked" };
    }),

  // Get admin permissions
  getAdminPermissions: protectedProcedure
    .input(z.object({
      adminId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      if (!isAdminMaster(ctx.user.role) && ctx.user.id !== input.adminId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot view other admin permissions",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const permissions = await db.query.adminPermissions.findMany({
        where: eq(adminPermissions.adminId, input.adminId),
      });

      return permissions;
    }),

  // ── Dashboard Stats ───────────────────────────────────────────

  // Get admin dashboard stats
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    if (!isModerator(ctx.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins and moderators can access dashboard",
      });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Get counts for dashboard
    const totalUsers = await db.query.users.findMany({
      columns: { id: true },
    });

    const totalAdmins = await db.query.users.findMany({
      where: inArray(users.role, ["admin", "sub_admin", "moderator", "admin_master"]),
      columns: { id: true },
    });

    const recentLogs = await db.query.adminAuditLogs.findMany({
      orderBy: desc(adminAuditLogs.createdAt),
      limit: 10,
    });

    return {
      totalUsers: totalUsers.length,
      totalAdmins: totalAdmins.length,
      recentActions: recentLogs.length,
      lastAction: recentLogs[0]?.createdAt || null,
    };
  }),
});
