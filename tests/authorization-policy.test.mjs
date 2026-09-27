import assert from "node:assert/strict";
import test from "node:test";

import {
  canUseListCapability,
  canUseWorkspaceCapability,
  effectiveListRole,
  listCapabilities,
  workspaceCapabilities,
} from "../lib/auth/authorization-policy.ts";

test("workspace permission matrix is default-deny", () => {
  for (const capability of workspaceCapabilities) {
    assert.equal(canUseWorkspaceCapability("OWNER", capability), true);
    assert.equal(
      canUseWorkspaceCapability("MEMBER", capability),
      capability === "workspace:view",
    );
    assert.equal(canUseWorkspaceCapability(null, capability), false);
    assert.equal(canUseWorkspaceCapability("FUTURE_ROLE", capability), false);
  }
});

test("effective List role requires an active supported membership and permission", () => {
  assert.equal(effectiveListRole("OWNER", null), "OWNER");
  assert.equal(effectiveListRole("MEMBER", "MANAGER"), "MANAGER");
  assert.equal(effectiveListRole("MEMBER", "VIEWER"), "VIEWER");
  assert.equal(effectiveListRole("MEMBER", null), null);
  assert.equal(effectiveListRole("MEMBER", "OWNER"), null);
  assert.equal(effectiveListRole("FUTURE_ROLE", "MANAGER"), null);
  assert.equal(effectiveListRole(null, "MANAGER"), null);
});

test("List permission matrix grants only documented capabilities", () => {
  const viewerCapabilities = new Set([
    "list:view",
    "list:search",
    "list:export",
    "saved-state:manage-own",
  ]);

  for (const capability of listCapabilities) {
    assert.equal(canUseListCapability("OWNER", capability), true);
    assert.equal(canUseListCapability("MANAGER", capability), true);
    assert.equal(
      canUseListCapability("VIEWER", capability),
      viewerCapabilities.has(capability),
    );
    assert.equal(canUseListCapability(null, capability), false);
  }
});
