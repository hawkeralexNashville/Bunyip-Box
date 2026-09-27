"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";

export type FormActionState = { error: string | null };

export function ActionForm({
  action,
  children,
  className = "inline-form",
  submitLabel = "Save",
}: {
  action: (state: FormActionState, formData: FormData) => Promise<FormActionState>;
  children: ReactNode;
  className?: string;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  return (
    <form action={formAction} className={className}>
      {children}
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <button className="button button-primary" disabled={pending} type="submit">
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
