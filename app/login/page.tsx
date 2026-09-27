import { redirect } from "next/navigation";
import Image from "next/image";

import { login } from "@/app/auth-actions";
import { AuthForm } from "@/app/auth-form";
import { getCurrentUser } from "@/lib/auth/session";
import { database } from "@/lib/database";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if ((await database.workspace.count()) === 0) redirect("/setup");
  if (await getCurrentUser()) redirect("/lists");

  return (
    <main>
      <section className="panel auth-panel">
        <Image className="auth-brand-mark" src="/brand/bunyip-box-mark.png" alt="Bunyip Box" width={72} height={72} priority />
        <p className="eyebrow">Private application</p>
        <h1>Log in to Bunyip Box</h1>
        <AuthForm action={login} mode="login" />
      </section>
    </main>
  );
}
