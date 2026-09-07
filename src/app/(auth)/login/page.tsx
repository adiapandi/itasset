"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Email or password is incorrect.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-sunken px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded bg-ink text-white font-mono text-sm">
            iA
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-ink">Sign in to iAsset</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Internal IT asset management. Use the account provided by your administrator.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-md border border-border bg-surface p-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-border px-3 py-2 text-sm focus-visible:outline-none"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-border px-3 py-2 text-sm focus-visible:outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="rounded bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-ink py-2 text-sm font-medium text-white transition-colors hover:bg-ink-soft disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
