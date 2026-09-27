import { redirect } from "next/navigation";

import { logout } from "@/app/auth-actions";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <section className="panel auth-panel account-panel">
      <p className="eyebrow">Authenticated workspace</p>
      <h1>Welcome, {user.name}</h1>
      <p className="lede">
        You are signed in as <strong>{user.email}</strong>. Your private Bunyip
        Box workspace is ready for the next Milestone 2 features.
      </p>
      <form action={logout}>
        <button className="button button-secondary sign-out-button" type="submit">
          Sign out
        </button>
      </form>
    </section>
  );
}
