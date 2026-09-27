"use server";

import { redirect } from "next/navigation";

import {
  hashPassword,
  normalizeEmail,
  validatePassword,
  verifyPassword,
} from "@/lib/auth/credentials";
import {
  assertSessionConfiguration,
  createSession,
  getCurrentUser,
} from "@/lib/auth/session";
import { database } from "@/lib/database";
import {
  beginInvitationRedemptionAttempt,
  redeemWorkspaceInvitation,
} from "@/lib/invitations/service";

export type RedeemState = { error: string | null };
const GENERIC_ERROR = "This invitation cannot be redeemed.";

export async function redeemInvitationAction(
  _state: RedeemState,
  formData: FormData,
): Promise<RedeemState> {
  const token = String(formData.get("token") ?? "");
  try {
    assertSessionConfiguration();
    const currentUser = await getCurrentUser();
    let userId: string;
    if (currentUser) {
      const normalizedEmail = normalizeEmail(currentUser.email);
      const attemptId = await beginInvitationRedemptionAttempt(token, normalizedEmail);
      userId = await redeemWorkspaceInvitation({
        token,
        normalizedEmail,
        attemptId,
        authenticatedUserId: currentUser.id,
      });
    } else if (formData.get("mode") === "signup") {
      const name = String(formData.get("name") ?? "").trim();
      const email = String(formData.get("email") ?? "").trim();
      const normalizedEmail = normalizeEmail(email);
      const password = String(formData.get("password") ?? "");
      if (!name || name.length > 100 || !normalizedEmail.includes("@")) return { error: GENERIC_ERROR };
      if (password !== String(formData.get("passwordConfirmation") ?? "")) {
        return { error: "Passwords do not match." };
      }
      const passwordError = validatePassword(password);
      if (passwordError) return { error: passwordError };
      const attemptId = await beginInvitationRedemptionAttempt(token, normalizedEmail);
      userId = await redeemWorkspaceInvitation({
        token,
        normalizedEmail,
        attemptId,
        signup: { name, email, normalizedEmail, passwordHash: await hashPassword(password) },
      });
    } else {
      const normalizedEmail = normalizeEmail(String(formData.get("email") ?? ""));
      const password = String(formData.get("password") ?? "");
      const attemptId = await beginInvitationRedemptionAttempt(token, normalizedEmail);
      const user = await database.user.findUnique({ where: { normalizedEmail } });
      if (!user) {
        await hashPassword(password);
        return { error: GENERIC_ERROR };
      }
      if (!(await verifyPassword(password, user.passwordHash))) return { error: GENERIC_ERROR };
      userId = await redeemWorkspaceInvitation({
        token,
        normalizedEmail,
        attemptId,
        authenticatedUserId: user.id,
      });
    }
    await createSession(userId);
  } catch {
    return { error: GENERIC_ERROR };
  }
  redirect("/lists");
}
