"use client";

import { useActionState } from "react";

import { redeemInvitationAction, type RedeemState } from "./actions";

const initialState: RedeemState = { error: null };

export function RedeemForm({ token, mode }: { token: string; mode: "authenticated" | "login" | "signup" }) {
  const [state, action, pending] = useActionState(redeemInvitationAction, initialState);
  return (
    <form action={action} className="auth-form">
      <input name="token" type="hidden" value={token} />
      <input name="mode" type="hidden" value={mode} />
      {mode === "signup" ? <label>Name<input name="name" required maxLength={100} /></label> : null}
      {mode !== "authenticated" ? (
        <label>Email<input name="email" type="email" required maxLength={320} /></label>
      ) : null}
      {mode !== "authenticated" ? (
        <label>Password<input name="password" type="password" required minLength={12} /></label>
      ) : null}
      {mode === "signup" ? (
        <label>Confirm password<input name="passwordConfirmation" type="password" required minLength={12} /></label>
      ) : null}
      {state.error ? <p role="alert">{state.error}</p> : null}
      <button type="submit" disabled={pending}>{pending ? "Please wait…" : "Accept invitation"}</button>
    </form>
  );
}
