import { redirect } from "next/navigation";
import Image from "next/image";

import { bootstrapOwner } from "@/app/auth-actions";
import { AuthForm } from "@/app/auth-form";
import { database } from "@/lib/database";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if ((await database.workspace.count()) > 0) redirect("/login");

  return (
    <main>
      <section className="panel auth-panel">
        <Image className="auth-brand-mark" src="/brand/bunyip-box-mark.png" alt="Bunyip Box" width={72} height={72} priority />
        <p className="eyebrow">Private setup</p>
        <h1>Create the Bunyip Box Owner</h1>
        <p>This one-time form creates the initial workspace and Owner account.</p>
        <AuthForm action={bootstrapOwner} mode="setup" />
      </section>
    </main>
  );
}
