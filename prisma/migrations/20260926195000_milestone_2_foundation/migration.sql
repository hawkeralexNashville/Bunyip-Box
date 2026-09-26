CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Chicago',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workspaces" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workspace_memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workspace_memberships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "list_permissions" (
    "workspaceId" UUID NOT NULL,
    "listId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "list_permissions_pkey" PRIMARY KEY ("listId", "membershipId")
);

CREATE TABLE "workspace_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "creatorMembershipId" UUID NOT NULL,
    "intendedEmail" TEXT NOT NULL,
    "intendedName" TEXT,
    "tokenHash" CHAR(64) NOT NULL,
    "tokenVersion" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "redeemedByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workspace_invitations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invitation_list_permissions" (
    "invitationId" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "listId" UUID NOT NULL,
    "role" TEXT NOT NULL,
    CONSTRAINT "invitation_list_permissions_pkey" PRIMARY KEY ("invitationId", "listId")
);

CREATE UNIQUE INDEX "users_normalized_email_key" ON "users"("normalizedEmail");
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("tokenHash");
CREATE INDEX "sessions_user_id_expires_at_idx" ON "sessions"("userId", "expiresAt");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expiresAt");
CREATE UNIQUE INDEX "workspace_memberships_workspace_id_user_id_key" ON "workspace_memberships"("workspaceId", "userId");
CREATE UNIQUE INDEX "workspace_memberships_id_workspace_id_key" ON "workspace_memberships"("id", "workspaceId");
CREATE INDEX "workspace_memberships_user_id_idx" ON "workspace_memberships"("userId");
CREATE UNIQUE INDEX "workspace_single_owner_idx" ON "workspace_memberships"("workspaceId") WHERE "role" = 'OWNER';
CREATE UNIQUE INDEX "lists_workspace_id_name_key" ON "lists"("workspaceId", "name");
CREATE UNIQUE INDEX "lists_id_workspace_id_key" ON "lists"("id", "workspaceId");
CREATE INDEX "list_permissions_workspace_id_membership_id_idx" ON "list_permissions"("workspaceId", "membershipId");
CREATE UNIQUE INDEX "workspace_invitations_token_hash_key" ON "workspace_invitations"("tokenHash");
CREATE UNIQUE INDEX "workspace_invitations_id_workspace_id_key" ON "workspace_invitations"("id", "workspaceId");
CREATE INDEX "workspace_invitations_workspace_id_intended_email_idx" ON "workspace_invitations"("workspaceId", "intendedEmail");
CREATE INDEX "workspace_invitations_workspace_id_expires_at_idx" ON "workspace_invitations"("workspaceId", "expiresAt");
CREATE INDEX "invitation_list_permissions_workspace_id_list_id_idx" ON "invitation_list_permissions"("workspaceId", "listId");

ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_role_check" CHECK ("role" IN ('OWNER', 'MEMBER'));
ALTER TABLE "list_permissions" ADD CONSTRAINT "list_permissions_role_check" CHECK ("role" IN ('VIEWER', 'MANAGER'));
ALTER TABLE "invitation_list_permissions" ADD CONSTRAINT "invitation_list_permissions_role_check" CHECK ("role" IN ('VIEWER', 'MANAGER'));
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_redemption_state_check" CHECK (("redeemedAt" IS NULL) = ("redeemedByUserId" IS NULL));

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lists" ADD CONSTRAINT "lists_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "list_permissions" ADD CONSTRAINT "list_permissions_listId_workspaceId_fkey" FOREIGN KEY ("listId", "workspaceId") REFERENCES "lists"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "list_permissions" ADD CONSTRAINT "list_permissions_membershipId_workspaceId_fkey" FOREIGN KEY ("membershipId", "workspaceId") REFERENCES "workspace_memberships"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_creatorMembershipId_workspaceId_fkey" FOREIGN KEY ("creatorMembershipId", "workspaceId") REFERENCES "workspace_memberships"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_redeemedByUserId_fkey" FOREIGN KEY ("redeemedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invitation_list_permissions" ADD CONSTRAINT "invitation_list_permissions_invitationId_workspaceId_fkey" FOREIGN KEY ("invitationId", "workspaceId") REFERENCES "workspace_invitations"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invitation_list_permissions" ADD CONSTRAINT "invitation_list_permissions_listId_workspaceId_fkey" FOREIGN KEY ("listId", "workspaceId") REFERENCES "lists"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enforce the cross-table Owner invariant at transaction commit so bootstrap
-- can create the workspace and its Owner membership atomically in either order.
CREATE FUNCTION "enforce_workspace_owner_membership"() RETURNS TRIGGER AS $$
DECLARE
    affected_workspace_id UUID;
BEGIN
    IF TG_TABLE_NAME = 'workspaces' THEN
        affected_workspace_id := COALESCE(NEW."id", OLD."id");
    ELSE
        affected_workspace_id := COALESCE(NEW."workspaceId", OLD."workspaceId");
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "workspaces" w
        WHERE w."id" = affected_workspace_id
          AND NOT EXISTS (
              SELECT 1
              FROM "workspace_memberships" wm
              WHERE wm."workspaceId" = w."id"
                AND wm."userId" = w."ownerUserId"
                AND wm."role" = 'OWNER'
          )
    ) THEN
        RAISE EXCEPTION 'workspace owner must have its OWNER membership';
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER "workspaces_owner_membership_check"
AFTER INSERT OR UPDATE OF "ownerUserId" ON "workspaces"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "enforce_workspace_owner_membership"();

CREATE CONSTRAINT TRIGGER "workspace_memberships_owner_check"
AFTER INSERT OR UPDATE OR DELETE ON "workspace_memberships"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "enforce_workspace_owner_membership"();
