import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { database } from "@/lib/database";

import {
  createInvitationAction,
  replaceInvitationAction,
  revokeInvitationAction,
} from "./actions";
import { InvitationForm } from "./invitation-form";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const membership = await database.workspaceMembership.findFirst({
    where: { userId: user.id, role: "OWNER" },
    select: {
      workspace: {
        select: {
          id: true,
          name: true,
          lists: { orderBy: { name: "asc" }, select: { id: true, name: true } },
          invitations: {
            where: { revokedAt: null, redeemedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: "desc" },
            select: { id: true, intendedEmail: true, intendedName: true, expiresAt: true },
          },
        },
      },
    },
  });
  if (!membership) notFound();
  const { workspace } = membership;

  return (
    <section className="team-page">
      <p className="eyebrow">Owner controls</p>
      <h1>Invite your team</h1>
      <p className="lede">
        Bunyip Box does not email invitations. Copy the single-use link and share it
        securely with the intended recipient. Possession of the link permits an
        attempt, but the account email must exactly match the invited address.
      </p>

      <div className="team-grid">
        <div className="team-card">
          <h2>Create invitation</h2>
          <InvitationForm action={createInvitationAction}>
            <input name="workspaceId" type="hidden" value={workspace.id} />
            <label>Name (optional)<input name="name" maxLength={100} /></label>
            <label>Email<input name="email" type="email" maxLength={320} required /></label>
            {workspace.lists.length ? (
              <fieldset>
                <legend>Initial List permissions (optional)</legend>
                {workspace.lists.map((list) => (
                  <label key={list.id}>
                    {list.name}
                    <select name={`permission:${list.id}`} defaultValue="">
                      <option value="">No access</option>
                      <option value="VIEWER">Viewer</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  </label>
                ))}
              </fieldset>
            ) : null}
          </InvitationForm>
        </div>

        <div className="team-card">
          <h2>Pending invitations</h2>
          {workspace.invitations.length ? (
            <ul className="invitation-list">
              {workspace.invitations.map((invitation) => (
                <li key={invitation.id}>
                  <div><strong>{invitation.intendedEmail}</strong><span>{invitation.intendedName}</span></div>
                  <small>Expires {invitation.expiresAt.toLocaleString("en-US", { timeZone: "UTC" })} UTC</small>
                  <InvitationForm action={replaceInvitationAction} compact>
                    <input name="invitationId" type="hidden" value={invitation.id} />
                  </InvitationForm>
                  <form action={revokeInvitationAction}>
                    <input name="invitationId" type="hidden" value={invitation.id} />
                    <button className="button button-secondary" type="submit">Revoke</button>
                  </form>
                </li>
              ))}
            </ul>
          ) : <p>No pending invitations.</p>}
        </div>
      </div>
    </section>
  );
}
