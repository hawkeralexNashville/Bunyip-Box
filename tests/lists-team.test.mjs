import assert from "node:assert/strict";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import { effectiveListRole, canUseListCapability } from "../lib/auth/authorization-policy.ts";

const databaseUrl = process.env.LISTS_TEST_DATABASE_URL;

test("List roles enforce Owner, Manager, Viewer, and default-deny access", () => {
  assert.equal(effectiveListRole("OWNER", undefined), "OWNER");
  assert.equal(effectiveListRole("MEMBER", "MANAGER"), "MANAGER");
  assert.equal(effectiveListRole("MEMBER", "VIEWER"), "VIEWER");
  assert.equal(effectiveListRole("MEMBER", undefined), null);
  assert.equal(effectiveListRole(undefined, "MANAGER"), null);
  assert.equal(canUseListCapability("MANAGER", "list-pages:manage"), true);
  assert.equal(canUseListCapability("VIEWER", "list-pages:manage"), false);
});

test("PostgreSQL enforces List lifecycle, workspace isolation, permissions, and Owner lockout prevention", {
  skip: databaseUrl ? false : "LISTS_TEST_DATABASE_URL is not configured",
}, async () => {
  const database = new PrismaClient({ datasourceUrl: databaseUrl });
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const userIds = [];
  const workspaceIds = [];

  async function user(label) {
    const email = `${label}-${suffix}@example.com`;
    const created = await database.user.create({ data: { email, normalizedEmail: email, name: label, passwordHash: "test-only" } });
    userIds.push(created.id);
    return created;
  }

  async function workspace(owner, label) {
    return database.$transaction(async (transaction) => {
      const created = await transaction.workspace.create({ data: { name: label, ownerUserId: owner.id } });
      workspaceIds.push(created.id);
      const membership = await transaction.workspaceMembership.create({ data: { workspaceId: created.id, userId: owner.id, role: "OWNER" } });
      return { workspace: created, membership };
    });
  }

  try {
    const owner = await user("owner");
    const manager = await user("manager");
    const viewer = await user("viewer");
    const unassigned = await user("unassigned");
    const outsider = await user("outsider");
    const first = await workspace(owner, `Lists ${suffix}`);
    const second = await workspace(outsider, `Other ${suffix}`);
    const list = await database.list.create({ data: { workspaceId: first.workspace.id, name: "Country Music" } });
    const otherList = await database.list.create({ data: { workspaceId: second.workspace.id, name: "Private Other List" } });
    await assert.rejects(database.list.create({ data: { workspaceId: first.workspace.id, name: "Country Music" } }));

    const memberships = await Promise.all([manager, viewer, unassigned].map((member) => database.workspaceMembership.create({
      data: { workspaceId: first.workspace.id, userId: member.id, role: "MEMBER" },
    })));
    await database.listPermission.createMany({ data: [
      { workspaceId: first.workspace.id, listId: list.id, membershipId: memberships[0].id, role: "MANAGER" },
      { workspaceId: first.workspace.id, listId: list.id, membershipId: memberships[1].id, role: "VIEWER" },
    ] });

    async function visible(userId, listId) {
      return database.list.findFirst({ where: { id: listId, workspace: { memberships: { some: {
        userId,
        OR: [{ role: "OWNER" }, { role: "MEMBER", listPermissions: { some: { listId, role: { in: ["VIEWER", "MANAGER"] } } } }],
      } } } }, select: { id: true } });
    }
    assert.ok(await visible(owner.id, list.id));
    assert.ok(await visible(manager.id, list.id));
    assert.ok(await visible(viewer.id, list.id));
    assert.equal(await visible(unassigned.id, list.id), null);
    assert.equal(await visible(outsider.id, list.id), null);
    assert.equal(await visible(manager.id, otherList.id), null);

    await database.listPermission.update({ where: { listId_membershipId: { listId: list.id, membershipId: memberships[1].id } }, data: { role: "MANAGER" } });
    assert.equal((await database.listPermission.findUniqueOrThrow({ where: { listId_membershipId: { listId: list.id, membershipId: memberships[1].id } } })).role, "MANAGER");
    await database.listPermission.delete({ where: { listId_membershipId: { listId: list.id, membershipId: memberships[1].id } } });
    assert.equal(await visible(viewer.id, list.id), null);

    await assert.rejects(database.listPermission.create({ data: {
      workspaceId: second.workspace.id, listId: otherList.id, membershipId: memberships[0].id, role: "VIEWER",
    } }));
    await assert.rejects(database.workspaceMembership.delete({ where: { id: first.membership.id } }));

    await database.workspaceMembership.delete({ where: { id: memberships[0].id } });
    assert.equal(await visible(manager.id, list.id), null);
    await database.list.update({ where: { id: list.id }, data: { name: "Nashville" } });
    assert.equal((await database.list.findUniqueOrThrow({ where: { id: list.id } })).name, "Nashville");
    await database.list.delete({ where: { id: list.id } });
    assert.equal(await database.list.findUnique({ where: { id: list.id } }), null);
  } finally {
    for (const workspaceId of workspaceIds.reverse()) await database.workspace.delete({ where: { id: workspaceId } }).catch(() => {});
    if (userIds.length) await database.user.deleteMany({ where: { id: { in: userIds } } });
    await database.$disconnect();
  }
});
