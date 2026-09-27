import "server-only";

import { requireWorkspaceCapability } from "@/lib/auth/authorization";
import { database } from "@/lib/database";

export class TeamValidationError extends Error {}

export async function setListPermission(
  ownerUserId: string,
  workspaceId: string,
  membershipId: string,
  listId: string,
  role: string,
) {
  await requireWorkspaceCapability(ownerUserId, workspaceId, "list-permission:manage");
  if (role !== "VIEWER" && role !== "MANAGER" && role !== "NONE") {
    throw new TeamValidationError("Unsupported List permission.");
  }

  return database.$transaction(async (transaction) => {
    const [membership, list] = await Promise.all([
      transaction.workspaceMembership.findFirst({
        where: { id: membershipId, workspaceId },
        select: { role: true },
      }),
      transaction.list.findFirst({ where: { id: listId, workspaceId }, select: { id: true } }),
    ]);
    if (!membership || !list) throw new TeamValidationError("Member or List was not found.");
    if (membership.role === "OWNER") throw new TeamValidationError("Owner access is implicit and cannot be changed.");

    if (role === "NONE") {
      return transaction.listPermission.deleteMany({ where: { listId, membershipId, workspaceId } });
    }
    return transaction.listPermission.upsert({
      where: { listId_membershipId: { listId, membershipId } },
      create: { listId, membershipId, workspaceId, role },
      update: { role },
    });
  });
}

export async function removeWorkspaceMember(
  ownerUserId: string,
  workspaceId: string,
  membershipId: string,
) {
  await requireWorkspaceCapability(ownerUserId, workspaceId, "member:remove");
  return database.$transaction(async (transaction) => {
    const membership = await transaction.workspaceMembership.findFirst({
      where: { id: membershipId, workspaceId },
      select: { role: true, userId: true },
    });
    if (!membership) throw new TeamValidationError("Member was not found.");
    if (membership.role === "OWNER" || membership.userId === ownerUserId) {
      throw new TeamValidationError("The workspace Owner cannot be removed.");
    }
    await transaction.workspaceMembership.delete({ where: { id: membershipId } });
  });
}
