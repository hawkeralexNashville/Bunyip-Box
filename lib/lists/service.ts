import "server-only";

import { Prisma } from "@prisma/client";

import { requireListCapability, requireWorkspaceCapability } from "@/lib/auth/authorization";
import { database } from "@/lib/database";

export const LIST_NAME_MAX_LENGTH = 100;

export class ListValidationError extends Error {}

function normalizedListName(value: string): string {
  const name = value.trim().replace(/\s+/g, " ");
  if (!name || name.length > LIST_NAME_MAX_LENGTH) {
    throw new ListValidationError(`List names must be between 1 and ${LIST_NAME_MAX_LENGTH} characters.`);
  }
  return name;
}

function duplicateListError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new ListValidationError("A List with that name already exists in this workspace.");
  }
  throw error;
}

export async function listDashboardForUser(userId: string) {
  const membership = await database.workspaceMembership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, workspace: { select: { id: true, name: true } } },
  });
  if (!membership) return null;

  const lists = await database.list.findMany({
    where: {
      workspaceId: membership.workspace.id,
      ...(membership.role === "OWNER" ? {} : {
        permissions: { some: { membershipId: membership.id, role: { in: ["VIEWER", "MANAGER"] } } },
      }),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      pages: { select: { facebookPageId: true } },
      permissions: membership.role === "OWNER" ? false : {
        where: { membershipId: membership.id },
        take: 1,
        select: { role: true },
      },
    },
  });
  const uniquePageIds = new Set(lists.flatMap((list) => list.pages.map((page) => page.facebookPageId)));
  return {
    workspace: membership.workspace,
    isOwner: membership.role === "OWNER",
    uniquePageCount: uniquePageIds.size,
    lists: lists.map((list) => ({
      id: list.id,
      name: list.name,
      pageCount: list.pages.length,
      role: membership.role === "OWNER" ? "OWNER" : list.permissions[0]?.role,
    })),
  };
}

export async function createList(userId: string, workspaceId: string, value: string) {
  await requireWorkspaceCapability(userId, workspaceId, "list:create");
  try {
    return await database.list.create({ data: { workspaceId, name: normalizedListName(value) } });
  } catch (error) {
    duplicateListError(error);
  }
}

export async function renameList(userId: string, listId: string, value: string) {
  const list = await requireListCapability(userId, listId, "list:view");
  await requireWorkspaceCapability(userId, list.workspaceId, "list:rename");
  try {
    return await database.list.update({ where: { id: listId }, data: { name: normalizedListName(value) } });
  } catch (error) {
    duplicateListError(error);
  }
}

export async function deleteList(userId: string, listId: string, confirmation: string) {
  const list = await requireListCapability(userId, listId, "list:view");
  await requireWorkspaceCapability(userId, list.workspaceId, "list:delete");
  if (confirmation.trim() !== list.name) {
    throw new ListValidationError("Enter the List name exactly to confirm deletion.");
  }
  await database.list.delete({ where: { id: listId } });
}

export async function listDetailForUser(userId: string, listId: string) {
  const authorized = await requireListCapability(userId, listId, "list:view");
  const list = await database.list.findUnique({
    where: { id: authorized.id },
    select: {
      id: true,
      name: true,
      pages: {
        orderBy: { facebookPage: { name: "asc" } },
        select: { facebookPage: { select: { id: true, name: true, facebookPageId: true } } },
      },
    },
  });
  if (!list) return null;
  return { ...list, role: authorized.role, canManagePages: authorized.role !== "VIEWER" };
}
