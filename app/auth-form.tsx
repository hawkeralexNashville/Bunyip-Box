"use client";

import { useActionState } from "react";

import type { AuthActionState } from "./auth-actions";

type AuthFormProps = {
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  mode: "login" | "setup";
};

const initialState: AuthActionState = { error: null };

export function AuthForm({ action, mode }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="auth-form">
      {mode === "setup" ? (
        <label>
          Name
          <input name="name" autoComplete="name" required />
        </label>
      ) : null}
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete={mode === "setup" ? "new-password" : "current-password"}
          minLength={12}
          required
        />
      </label>
      {mode === "setup" ? (
        <label>
          Confirm password
          <input
            name="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </label>
      ) : null}
      {state.error ? <p role="alert">{state.error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "Please wait…" : mode === "setup" ? "Create owner" : "Log in"}
      </button>
    </form>
  );
}
