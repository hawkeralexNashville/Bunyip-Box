import assert from "node:assert/strict";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import {
  InvitationRedemptionError,
  redeemInvitationTransaction,
} from "../lib/invitations/redemption-core.ts";
import {
  createInvitationToken,
  hashInvitationToken,
  INVITATION_EXPIRY_DAYS,
  parseInvitationToken,
} from "../lib/invitations/token.ts";

test("invitation tokens contain 256 bits and persist only as domain-separated hashes", () => {
  const token = createInvitationToken();
  const second = createInvitationToken();
  assert.equal(Buffer.from(token, "base64url").length, 32);
  assert.equal(parseInvitationToken(token), token);
  assert.equal(parseInvitationToken(`${token}extra`), null);
  assert.notEqual(token, second);
  assert.match(hashInvitationToken(token), /^[0-9a-f]{64}$/);
  assert.notEqual(hashInvitationToken(token), token);
  assert.notEqual(hashInvitationToken(token), hashInvitationToken(second));
});

const databaseUrl = process.env.INVITATION_TEST_DATABASE_URL;

test("PostgreSQL invitation redemption is email-bound, expiring, revocable, atomic, and single-use", {
  skip: databaseUrl ? false : "INVITATION_TEST_DATABASE_URL is not configured",
}, async () => {
  const database = new PrismaClient({ datasourceUrl: databaseUrl });
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const createdUserIds = [];
  let workspaceId;

  async function createUser(label) {
    const normalizedEmail = `${label}-${suffix}@example.com`;
    const user = await database.user.create({
      data: { email: normalizedEmail, normalizedEmail, name: label, passwordHash: "test-only" },
    });
    createdUserIds.push(user.id);
    return user;
  }

  async function createInvitation(email, options = {}) {
    const token = createInvitationToken();
    const invitation = await database.workspaceInvitation.create({
      data: {
        workspaceId,
        creatorMembershipId: options.creatorMembershipId,
        intendedEmail: email,
        tokenHash: hashInvitationToken(token),
        expiresAt: options.expiresAt ?? new Date(Date.now() + INVITATION_EXPIRY_DAYS * 86_400_000),
        revokedAt: options.revokedAt,
        listPermissions: options.listId ? {
          create: { workspaceId, listId: options.listId, role: "VIEWER" },
        } : undefined,
      },
    });
    return { invitation, token };
  }

  try {
    const owner = await createUser("owner");
    const ownerMembership = await database.$transaction(async (transaction) => {
      const workspace = await transaction.workspace.create({
        data: { name: `Invitation Test ${suffix}`, ownerUserId: owner.id },
      });
      workspaceId = workspace.id;
      return transaction.workspaceMembership.create({
        data: { workspaceId, userId: owner.id, role: "OWNER" },
      });
    });
    const list = await database.list.create({ data: { workspaceId, name: "Test List" } });

    const invited = await createUser("invited");
    const wrong = await createUser("wrong");
    const active = await createInvitation(invited.normalizedEmail, {
      creatorMembershipId: ownerMembership.id,
      listId: list.id,
    });

    await assert.rejects(
      redeemInvitationTransaction(database, {
        tokenHash: hashInvitationToken(active.token),
        normalizedEmail: wrong.normalizedEmail,
        authenticatedUserId: wrong.id,
      }),
      InvitationRedemptionError,
    );

    const concurrent = await Promise.allSettled([
      redeemInvitationTransaction(database, {
        tokenHash: hashInvitationToken(active.token),
        normalizedEmail: invited.normalizedEmail,
        authenticatedUserId: invited.id,
      }),
      redeemInvitationTransaction(database, {
        tokenHash: hashInvitationToken(active.token),
        normalizedEmail: invited.normalizedEmail,
        authenticatedUserId: invited.id,
      }),
    ]);
    assert.equal(concurrent.filter(({ status }) => status === "fulfilled").length, 1);
    assert.equal(concurrent.filter(({ status }) => status === "rejected").length, 1);

    const membership = await database.workspaceMembership.findUniqueOrThrow({
      where: { workspaceId_userId: { workspaceId, userId: invited.id } },
      include: { listPermissions: true },
    });
    assert.equal(membership.role, "MEMBER");
    assert.deepEqual(membership.listPermissions.map(({ role }) => role), ["VIEWER"]);
    await assert.rejects(
      redeemInvitationTransaction(database, {
        tokenHash: hashInvitationToken(active.token),
        normalizedEmail: invited.normalizedEmail,
        authenticatedUserId: invited.id,
      }),
      InvitationRedemptionError,
    );

    const expired = await createInvitation(wrong.normalizedEmail, {
      creatorMembershipId: ownerMembership.id,
      expiresAt: new Date(Date.now() - 1000),
    });
    const replaced = await createInvitation(wrong.normalizedEmail, {
      creatorMembershipId: ownerMembership.id,
      revokedAt: new Date(),
    });
    for (const candidate of [expired, replaced]) {
      await assert.rejects(
        redeemInvitationTransaction(database, {
          tokenHash: hashInvitationToken(candidate.token),
          normalizedEmail: wrong.normalizedEmail,
          authenticatedUserId: wrong.id,
        }),
        InvitationRedemptionError,
      );
    }
    const replacement = await createInvitation(wrong.normalizedEmail, {
      creatorMembershipId: ownerMembership.id,
    });
    assert.equal(
      await redeemInvitationTransaction(database, {
        tokenHash: hashInvitationToken(replacement.token),
        normalizedEmail: wrong.normalizedEmail,
        authenticatedUserId: wrong.id,
      }),
      wrong.id,
    );

    const stored = await database.workspaceInvitation.findUniqueOrThrow({
      where: { id: active.invitation.id },
      select: { tokenHash: true, expiresAt: true },
    });
    assert.notEqual(stored.tokenHash, active.token);
    const expectedExpiry = active.invitation.createdAt.getTime() + INVITATION_EXPIRY_DAYS * 86_400_000;
    assert.ok(Math.abs(stored.expiresAt.getTime() - expectedExpiry) < 5000);
  } finally {
    if (workspaceId) await database.workspace.delete({ where: { id: workspaceId } }).catch(() => {});
    if (createdUserIds.length) await database.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await database.$disconnect();
  }
});
