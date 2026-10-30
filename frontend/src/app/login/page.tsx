"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, inputCls, Notice } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));

    if (res?.ok) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }
    setError(data?.errors?.email?.[0] ?? data?.message ?? "Could not sign in. Try again.");
    setBusy(false);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_28rem]">
      <div className="hidden bg-side p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <span className="text-lg font-semibold tracking-tight">PeopleDesk</span>
        <div className="max-w-md">
          <p className="text-3xl font-semibold leading-tight tracking-tight">Every employee record, leave request and timesheet in one place.</p>
          <p className="mt-4 text-white/60">Built for HR teams who would rather resolve requests than chase them.</p>
        </div>
        <span className="text-xs text-white/40">Employee management system</span>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-muted">Use the email and password your HR team gave you.</p>
          </div>

          {error && <Notice>{error}</Notice>}

          <Field label="Email">
            {(id) => <input id={id} type="email" required autoComplete="username" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Field label="Password">
            {(id) => <input id={id} type="password" required autoComplete="current-password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />}
          </Field>

          <Button type="submit" loading={busy} className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
