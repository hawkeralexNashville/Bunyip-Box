import "server-only";

import { normalizeEmail } from "@/lib/auth/credentials";
import { requireWorkspaceCapability } from "@/lib/auth/authorization";
import { database } from "@/lib/database";
import { redeemInvitationTransaction } from "@/lib/invitations/redemption-core";
import {
  createInvitationToken,
  hashInvitationEmail,
  hashInvitationToken,
  INVITATION_EXPIRY_DAYS,
  INVITATION_TOKEN_VERSION,
  parseInvitationToken,
} from "@/lib/invitations/token";

const MAX_ATTEMPTS = 10;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

export type InitialListPermission = { listId: string; role: "VIEWER" | "MANAGER" };

function validateInviteEmail(email: string): string {
  const normalized = normalizeEmail(email);
  if (normalized.length < 3 || normalized.length > 320 || !normalized.includes("@")) {
    throw new Error("Enter a valid email address.");
  }
  return normalized;
}

export async function createWorkspaceInvitation(input: {
  ownerUserId: string;
  workspaceId: string;
  email: string;
  name?: string;
  listPermissions?: InitialListPermission[];
}) {
  const creator = await requireWorkspaceCapability(
    input.ownerUserId,
    input.workspaceId,
    "member:invite",
  );
  const intendedEmail = validateInviteEmail(input.email);
  const intendedName = input.name?.trim() || null;
  const assignments = input.listPermissions ?? [];
  const uniqueListIds = [...new Set(assignments.map(({ listId }) => listId))];
  if (uniqueListIds.length !== assignments.length) throw new Error("Duplicate List assignment.");
  if (assignments.some(({ role }) => role !== "VIEWER" && role !== "MANAGER")) {
    throw new Error("Invalid List permission.");
  }
  if (uniqueListIds.length) {
    const count = await database.list.count({
      where: { workspaceId: input.workspaceId, id: { in: uniqueListIds } },
    });
    if (count !== uniqueListIds.length) throw new Error("Invalid List assignment.");
  }

  const token = createInvitationToken();
  const tokenHash = hashInvitationToken(token);
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const invitation = await database.$transaction(async (transaction) => {
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${input.workspaceId}:${intendedEmail}`}))`;
    await transaction.workspaceInvitation.updateMany({
      where: {
        workspaceId: input.workspaceId,
        intendedEmail,
        revokedAt: null,
        redeemedAt: null,
      },
      data: { revokedAt: new Date() },
    });
    return transaction.workspaceInvitation.create({
      data: {
        workspaceId: input.workspaceId,
        creatorMembershipId: creator.id,
        intendedEmail,
        intendedName,
        tokenHash,
        tokenVersion: INVITATION_TOKEN_VERSION,
        expiresAt,
        listPermissions: {
          create: assignments.map(({ listId, role }) => ({
            workspaceId: input.workspaceId,
            listId,
            role,
          })),
        },
      },
      select: { id: true, expiresAt: true },
    });
  });

  return { ...invitation, token };
}

export async function revokeWorkspaceInvitation(
  ownerUserId: string,
  invitationId: string,
): Promise<void> {
  const invitation = await database.workspaceInvitation.findUnique({
    where: { id: invitationId },
    select: { workspaceId: true },
  });
  if (!invitation) throw new Error("Invitation not found.");
  await requireWorkspaceCapability(ownerUserId, invitation.workspaceId, "invitation:manage");
  const result = await database.workspaceInvitation.updateMany({
    where: { id: invitationId, revokedAt: null, redeemedAt: null },
    data: { revokedAt: new Date() },
  });
  if (result.count !== 1) throw new Error("Invitation is no longer pending.");
}

export async function redeemWorkspaceInvitation(input: {
  token: string;
  normalizedEmail: string;
  attemptId: string;
  authenticatedUserId?: string;
  signup?: { email: string; normalizedEmail: string; name: string; passwordHash: string };
}): Promise<string> {
  const token = parseInvitationToken(input.token);
  if (!token) throw new Error("This invitation cannot be redeemed.");
  const tokenHash = hashInvitationToken(token);
  const normalizedEmail = normalizeEmail(input.normalizedEmail);
  const userId = await redeemInvitationTransaction(database, {
    tokenHash,
    normalizedEmail,
    attemptId: input.attemptId,
    authenticatedUserId: input.authenticatedUserId,
    signup: input.signup,
  });
  return userId;
}

export async function beginInvitationRedemptionAttempt(
  tokenValue: string,
  email: string,
): Promise<string> {
  const token = parseInvitationToken(tokenValue);
  if (!token) throw new Error("This invitation cannot be redeemed.");
  const tokenHash = hashInvitationToken(token);
  const normalizedEmail = normalizeEmail(email);

  return database.$transaction(async (transaction) => {
    // Serialize the small rate-limit check per token without storing or logging
    // the plaintext token or trusting a client-provided network header.
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${tokenHash}))`;
    const since = new Date(Date.now() - ATTEMPT_WINDOW_MS);
    if (
      (await transaction.invitationRedemptionAttempt.count({
        where: { tokenHash, attemptedAt: { gt: since } },
      })) >= MAX_ATTEMPTS
    ) {
      throw new Error("This invitation cannot be redeemed.");
    }
    const attempt = await transaction.invitationRedemptionAttempt.create({
      data: {
        tokenHash,
        attemptedEmailHash: normalizedEmail ? hashInvitationEmail(normalizedEmail) : null,
      },
      select: { id: true },
    });
    return attempt.id;
  });
}

export async function inspectWorkspaceInvitation(tokenValue: string) {
  const token = parseInvitationToken(tokenValue);
  if (!token) return null;
  const invitation = await database.workspaceInvitation.findUnique({
    where: { tokenHash: hashInvitationToken(token) },
    select: {
      intendedName: true,
      expiresAt: true,
      revokedAt: true,
      redeemedAt: true,
      workspace: { select: { name: true } },
    },
  });
  if (
    !invitation ||
    invitation.revokedAt ||
    invitation.redeemedAt ||
    invitation.expiresAt <= new Date()
  ) return null;
  return invitation;
}
