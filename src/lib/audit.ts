import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export interface CreateAuditLogParams {
  actorId?: string | null;
  elderId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  tx?: Prisma.TransactionClient;
}

export async function createAuditLog({
  actorId,
  elderId,
  action,
  entity,
  entityId,
  before,
  after,
  tx,
}: CreateAuditLogParams) {
  const client = tx ?? prisma;
  try {
    return await client.auditLog.create({
      data: {
        actorId: actorId ?? null,
        elderId: elderId ?? null,
        action,
        entity,
        entityId,
        before: before ? (JSON.parse(JSON.stringify(before)) as Prisma.InputJsonValue) : Prisma.JsonNull,
        after: after ? (JSON.parse(JSON.stringify(after)) as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // Audit logging shouldn't crash non-critical paths, but if in transaction it will participate
    if (tx) {
      throw error;
    }
    return null;
  }
}
