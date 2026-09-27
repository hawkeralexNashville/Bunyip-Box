import "server-only";

import { notFound } from "next/navigation";

import {
  canUseListCapability,
  canUseWorkspaceCapability,
  effectiveListRole,
  type EffectiveListRole,
  type ListCapability,
  type WorkspaceCapability,
} from "@/lib/auth/authorization-policy";
import { database } from "@/lib/database";

export class AuthorizationForbiddenError extends Error {
  constructor() {
    super("Forbidden");
    this.name = "AuthorizationForbiddenError";
  }
}

export async function requireWorkspaceCapability(
  userId: string,
  workspaceId: string,
  capability: WorkspaceCapability,
) {
  const membership = await database.workspaceMembership.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { id: true, role: true, workspace: { select: { id: true, name: true } } },
  });

  if (!membership) notFound();
  if (!canUseWorkspaceCapability(membership.role, capability)) {
    throw new AuthorizationForbiddenError();
  }

  return membership;
}

export async function requireListCapability(
  userId: string,
  listId: string,
  capability: ListCapability,
): Promise<{ id: string; name: string; workspaceId: string; role: EffectiveListRole }> {
  const list = await database.list.findUnique({
    where: { id: listId },
    select: {
      id: true,
      name: true,
      workspaceId: true,
      workspace: {
        select: {
          memberships: {
            where: { userId },
            take: 1,
            select: {
              role: true,
              listPermissions: {
                where: { listId },
                take: 1,
                select: { role: true },
              },
            },
          },
        },
      },
    },
  });

  const membership = list?.workspace.memberships[0];
  const role = effectiveListRole(membership?.role, membership?.listPermissions[0]?.role);

  // Missing Lists, cross-workspace IDs, non-members, and unassigned Members are
  // intentionally indistinguishable to callers.
  if (!list || !role) notFound();
  if (!canUseListCapability(role, capability)) throw new AuthorizationForbiddenError();

  return { id: list.id, name: list.name, workspaceId: list.workspaceId, role };
}
