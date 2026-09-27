import type { Metadata } from "next";

import { getCurrentUser } from "@/lib/auth/session";
import { inspectWorkspaceInvitation } from "@/lib/invitations/service";

import { RedeemForm } from "./redeem-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await inspectWorkspaceInvitation(token);
  const user = await getCurrentUser();
  if (!invitation) {
    return <section className="panel auth-panel"><h1>Invitation unavailable</h1><p>This link is invalid, expired, revoked, or already used.</p></section>;
  }
  return (
    <section className="panel auth-panel">
      <p className="eyebrow">Private invitation</p>
      <h1>Join {invitation.workspace.name}</h1>
      <p>This single-use invitation expires in seven days. Use the exact email address the Owner invited.</p>
      {user ? (
        <RedeemForm token={token} mode="authenticated" />
      ) : (
        <div className="redeem-grid">
          <div><h2>Existing account</h2><RedeemForm token={token} mode="login" /></div>
          <div><h2>Create account</h2><RedeemForm token={token} mode="signup" /></div>
        </div>
      )}
    </section>
  );
}
