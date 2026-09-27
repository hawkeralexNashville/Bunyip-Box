CREATE TABLE "invitation_redemption_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tokenHash" CHAR(64) NOT NULL,
    "attemptedEmailHash" CHAR(64),
    "succeeded" BOOLEAN NOT NULL DEFAULT false,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invitation_redemption_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "invitation_redemption_attempts_token_hash_attempted_at_idx"
ON "invitation_redemption_attempts"("tokenHash", "attemptedAt");

ALTER TABLE "workspace_invitations"
ADD CONSTRAINT "workspace_invitations_token_version_check" CHECK ("tokenVersion" = 1),
ADD CONSTRAINT "workspace_invitations_token_hash_format_check" CHECK ("tokenHash" ~ '^[0-9a-f]{64}$'),
ADD CONSTRAINT "workspace_invitations_intended_email_normalized_check"
CHECK ("intendedEmail" = lower(btrim("intendedEmail")) AND length("intendedEmail") BETWEEN 3 AND 320),
ADD CONSTRAINT "workspace_invitations_terminal_state_check"
CHECK (NOT ("revokedAt" IS NOT NULL AND "redeemedAt" IS NOT NULL));
