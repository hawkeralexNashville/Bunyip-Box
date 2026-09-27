"use client";

import { useActionState } from "react";

import type { InvitationActionState } from "./actions";

const initialState: InvitationActionState = { error: null, invitationUrl: null };

export function InvitationForm({
  action,
  children,
  compact = false,
}: {
  action: (state: InvitationActionState, data: FormData) => Promise<InvitationActionState>;
  children: React.ReactNode;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <form action={formAction} className={compact ? "invitation-inline" : "auth-form"}>
      {children}
      <button type="submit" disabled={pending}>
        {pending ? "Please wait…" : compact ? "Replace link" : "Create invitation"}
      </button>
      {state.error ? <p role="alert">{state.error}</p> : null}
      {state.invitationUrl ? (
        <div className="invitation-result" role="status">
          <strong>Copy this link now—it will not be shown again.</strong>
          <input aria-label="Invitation URL" readOnly value={state.invitationUrl} />
        </div>
      ) : null}
    </form>
  );
}
