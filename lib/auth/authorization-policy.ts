export const workspaceCapabilities = [
  "workspace:view",
  "workspace:update",
  "list:create",
  "list:rename",
  "list:delete",
  "member:invite",
  "member:remove",
  "list-permission:manage",
  "invitation:manage",
  "system:admin",
] as const;

export const listCapabilities = [
  "list:view",
  "list:search",
  "list:export",
  "list:configure",
  "list-pages:manage",
  "saved-state:manage-own",
] as const;

export type WorkspaceCapability = (typeof workspaceCapabilities)[number];
export type ListCapability = (typeof listCapabilities)[number];
export type WorkspaceRole = "OWNER" | "MEMBER";
export type EffectiveListRole = "OWNER" | "MANAGER" | "VIEWER";

const ownerWorkspaceCapabilities = new Set<WorkspaceCapability>(workspaceCapabilities);
const memberWorkspaceCapabilities = new Set<WorkspaceCapability>(["workspace:view"]);
const ownerListCapabilities = new Set<ListCapability>(listCapabilities);
const managerListCapabilities = new Set<ListCapability>([
  "list:view",
  "list:search",
  "list:export",
  "list:configure",
  "list-pages:manage",
  "saved-state:manage-own",
]);
const viewerListCapabilities = new Set<ListCapability>([
  "list:view",
  "list:search",
  "list:export",
  "saved-state:manage-own",
]);

export function canUseWorkspaceCapability(
  role: string | null | undefined,
  capability: WorkspaceCapability,
): boolean {
  if (role === "OWNER") return ownerWorkspaceCapabilities.has(capability);
  if (role === "MEMBER") return memberWorkspaceCapabilities.has(capability);
  return false;
}

export function effectiveListRole(
  membershipRole: string | null | undefined,
  explicitListRole: string | null | undefined,
): EffectiveListRole | null {
  if (membershipRole === "OWNER") return "OWNER";
  if (membershipRole !== "MEMBER") return null;
  if (explicitListRole === "MANAGER" || explicitListRole === "VIEWER") {
    return explicitListRole;
  }
  return null;
}

export function canUseListCapability(
  role: EffectiveListRole | null,
  capability: ListCapability,
): boolean {
  if (role === "OWNER") return ownerListCapabilities.has(capability);
  if (role === "MANAGER") return managerListCapabilities.has(capability);
  if (role === "VIEWER") return viewerListCapabilities.has(capability);
  return false;
}
