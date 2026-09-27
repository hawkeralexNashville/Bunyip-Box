import { createHash, randomBytes } from "node:crypto";

export const INVITATION_TOKEN_BYTES = 32;
export const INVITATION_TOKEN_VERSION = 1;
export const INVITATION_EXPIRY_DAYS = 7;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const TOKEN_DOMAIN = `bunyip-box:workspace-invitation:v${INVITATION_TOKEN_VERSION}:`;

export function createInvitationToken(): string {
  return randomBytes(INVITATION_TOKEN_BYTES).toString("base64url");
}

export function parseInvitationToken(value: string): string | null {
  return TOKEN_PATTERN.test(value) ? value : null;
}

export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(TOKEN_DOMAIN).update(token).digest("hex");
}

export function hashInvitationEmail(email: string): string {
  return createHash("sha256")
    .update("bunyip-box:invitation-attempt-email:v1:")
    .update(email)
    .digest("hex");
}
