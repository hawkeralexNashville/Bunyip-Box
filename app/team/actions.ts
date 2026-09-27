"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { database } from "@/lib/database";
import type { FormActionState } from "@/app/action-form";
import {
  createWorkspaceInvitation,
  revokeWorkspaceInvitation,
  type InitialListPermission,
} from "@/lib/invitations/service";
import { removeWorkspaceMember, setListPermission } from "@/lib/team/service";

export type InvitationActionState = { error: string | null; invitationUrl: string | null };

function invitationOrigin(): string {
  const origin = process.env.APP_URL;
  if (!origin || !origin.startsWith("https://")) throw new Error("APP_URL is not configured.");
  return origin.replace(/\/$/, "");
}

function invitationUrl(origin: string, token: string): string {
  return `${origin}/invite/${token}`;
}

function listPermissions(formData: FormData): InitialListPermission[] {
  const assignments: InitialListPermission[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("permission:") || (value !== "VIEWER" && value !== "MANAGER")) continue;
    assignments.push({ listId: key.slice("permission:".length), role: value });
  }
  return assignments;
}

export async function createInvitationAction(
  _state: InvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in again.", invitationUrl: null };
  try {
    const origin = invitationOrigin();
    const invitation = await createWorkspaceInvitation({
      ownerUserId: user.id,
      workspaceId: String(formData.get("workspaceId") ?? ""),
      email: String(formData.get("email") ?? ""),
      name: String(formData.get("name") ?? ""),
      listPermissions: listPermissions(formData),
    });
    revalidatePath("/team");
    return { error: null, invitationUrl: invitationUrl(origin, invitation.token) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Invitation could not be created.",
      invitationUrl: null,
    };
  }
}

export async function replaceInvitationAction(
  _state: InvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in again.", invitationUrl: null };
  const invitationId = String(formData.get("invitationId") ?? "");
  const existing = await database.workspaceInvitation.findUnique({
    where: { id: invitationId },
    select: {
      workspaceId: true,
      intendedEmail: true,
      intendedName: true,
      listPermissions: { select: { listId: true, role: true } },
    },
  });
  if (!existing) return { error: "Invitation is no longer available.", invitationUrl: null };
  try {
    const origin = invitationOrigin();
    const replacement = await createWorkspaceInvitation({
      ownerUserId: user.id,
      workspaceId: existing.workspaceId,
      email: existing.intendedEmail,
      name: existing.intendedName ?? undefined,
      listPermissions: existing.listPermissions.filter(
        (item): item is InitialListPermission => item.role === "VIEWER" || item.role === "MANAGER",
      ),
    });
    return { error: null, invitationUrl: invitationUrl(origin, replacement.token) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Invitation could not be replaced.",
      invitationUrl: null,
    };
  }
}

export async function revokeInvitationAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await revokeWorkspaceInvitation(user.id, String(formData.get("invitationId") ?? ""));
  revalidatePath("/team");
}

export async function setListPermissionAction(
  _state: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in again." };
  try {
    await setListPermission(
      user.id,
      String(formData.get("workspaceId") ?? ""),
      String(formData.get("membershipId") ?? ""),
      String(formData.get("listId") ?? ""),
      String(formData.get("role") ?? ""),
    );
    revalidatePath("/team");
    revalidatePath("/lists");
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Permission could not be changed." };
  }
}

export async function removeMemberAction(
  _state: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in again." };
  try {
    await removeWorkspaceMember(
      user.id,
      String(formData.get("workspaceId") ?? ""),
      String(formData.get("membershipId") ?? ""),
    );
    revalidatePath("/team");
    revalidatePath("/lists");
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Member could not be removed." };
  }
}
