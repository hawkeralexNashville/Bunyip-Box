import type { PrismaClient } from "@prisma/client";

export class InvitationRedemptionError extends Error {
  constructor() {
    super("This invitation cannot be redeemed.");
    this.name = "InvitationRedemptionError";
  }
}

type SignupDetails = {
  email: string;
  normalizedEmail: string;
  name: string;
  passwordHash: string;
};

type RedemptionInput = {
  tokenHash: string;
  normalizedEmail: string;
  attemptId?: string;
  authenticatedUserId?: string;
  signup?: SignupDetails;
  now?: Date;
};

export async function redeemInvitationTransaction(
  database: PrismaClient,
  input: RedemptionInput,
): Promise<string> {
  const now = input.now ?? new Date();

  return database.$transaction(async (transaction) => {
    const invitation = await transaction.workspaceInvitation.findUnique({
      where: { tokenHash: input.tokenHash },
      include: { listPermissions: true },
    });

    if (
      !invitation ||
      invitation.revokedAt ||
      invitation.redeemedAt ||
      invitation.expiresAt <= now ||
      invitation.intendedEmail !== input.normalizedEmail
    ) {
      throw new InvitationRedemptionError();
    }

    let userId = input.authenticatedUserId;
    if (userId) {
      const user = await transaction.user.findUnique({
        where: { id: userId },
        select: { normalizedEmail: true },
      });
      if (!user || user.normalizedEmail !== invitation.intendedEmail) {
        throw new InvitationRedemptionError();
      }
    } else {
      if (!input.signup || input.signup.normalizedEmail !== invitation.intendedEmail) {
        throw new InvitationRedemptionError();
      }
      const user = await transaction.user.create({ data: input.signup });
      userId = user.id;
    }

    const consumed = await transaction.workspaceInvitation.updateMany({
      where: {
        id: invitation.id,
        revokedAt: null,
        redeemedAt: null,
        expiresAt: { gt: now },
      },
      data: { redeemedAt: now, redeemedByUserId: userId },
    });
    if (consumed.count !== 1) throw new InvitationRedemptionError();

    const membership = await transaction.workspaceMembership.upsert({
      where: {
        workspaceId_userId: { workspaceId: invitation.workspaceId, userId },
      },
      create: { workspaceId: invitation.workspaceId, userId, role: "MEMBER" },
      update: {},
    });

    for (const permission of invitation.listPermissions) {
      await transaction.listPermission.upsert({
        where: {
          listId_membershipId: { listId: permission.listId, membershipId: membership.id },
        },
        create: {
          workspaceId: invitation.workspaceId,
          listId: permission.listId,
          membershipId: membership.id,
          role: permission.role,
        },
        update: { role: permission.role },
      });
    }

    if (input.attemptId) {
      const completedAttempt = await transaction.invitationRedemptionAttempt.updateMany({
        where: { id: input.attemptId, tokenHash: input.tokenHash },
        data: { succeeded: true },
      });
      if (completedAttempt.count !== 1) throw new InvitationRedemptionError();
    }

    return userId;
  });
}
