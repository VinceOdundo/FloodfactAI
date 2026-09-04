"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { signInWithPassword } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<{ error: string | null }, FormData>(signInWithPassword, {
    error: null,
  });

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1.5 w-full rounded-xl border border-border bg-surface p-2.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-1.5 w-full rounded-xl border border-border bg-surface p-2.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>
      {state.error && (
        <p role="alert" className="rounded-lg border border-verified/25 bg-verified-bg px-3 py-2.5 text-sm text-verified">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
