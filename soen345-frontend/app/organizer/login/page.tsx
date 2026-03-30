"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api } from "@/lib/api";

function OrganizerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/organization/register";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password, portal: "organizer" }),
      });
      router.push(redirect);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Organizer Sign In</h1>
      <p className="auth-subtitle">
        Sign in with an organizer-enabled account to create organizer users.
      </p>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="identifier">Email or Phone</label>
          <input
            id="identifier"
            type="text"
            placeholder="you@example.com or +14155552671"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? "Signing in..." : "Login as organizer"}
        </button>
      </form>

      <p className="auth-footer">
        Need organizer account creation?{" "}
        <Link href="/organization/register">
          Go to organization registration
        </Link>
      </p>
      <p className="auth-footer">
        Back to regular login? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}

export default function OrganizerLoginPage() {
  return (
    <main className="auth-container">
      <Suspense>
        <OrganizerLoginForm />
      </Suspense>
    </main>
  );
}
