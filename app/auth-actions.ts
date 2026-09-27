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
  deleteSession,
} from "@/lib/auth/session";
import { database } from "@/lib/database";

export type AuthActionState = { error: string | null };

const GENERIC_LOGIN_ERROR = "Invalid email or password.";

export async function bootstrapOwner(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("passwordConfirmation") ?? "");

  if (!name || !email) return { error: "Name and email are required." };
  if (name.length > 100 || email.length > 320 || !email.includes("@")) {
    return { error: "Enter a valid name and email." };
  }
  if (password !== confirmation) return { error: "Passwords do not match." };
  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };

  // Fail before creating the one-time owner records if sessions are misconfigured.
  assertSessionConfiguration();

  const normalizedEmail = normalizeEmail(email);
  const passwordHash = await hashPassword(password);
  let userId: string;

  try {
    userId = await database.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('bunyip-box-owner-bootstrap'))`;
      if ((await transaction.workspace.count()) > 0) {
        throw new Error("BOOTSTRAP_COMPLETE");
      }

      const user = await transaction.user.create({
        data: {
          name,
          email,
          normalizedEmail,
          passwordHash,
        },
      });
      const workspace = await transaction.workspace.create({
        data: { name: "Bunyip Box", ownerUserId: user.id },
      });
      await transaction.workspaceMembership.create({
        data: { workspaceId: workspace.id, userId: user.id, role: "OWNER" },
      });
      return user.id;
    });
  } catch (error) {
    if (error instanceof Error && error.message === "BOOTSTRAP_COMPLETE") {
      return { error: "Owner setup has already been completed." };
    }
    return { error: "Owner setup could not be completed." };
  }

  await createSession(userId);
  redirect("/account");
}

export async function login(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  assertSessionConfiguration();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const user = await database.user.findUnique({ where: { normalizedEmail: email } });

  if (!user) {
    await hashPassword(password);
    return { error: GENERIC_LOGIN_ERROR };
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  await createSession(user.id);
  redirect("/account");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
