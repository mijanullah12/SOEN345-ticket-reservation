"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";

type LoginFormProps = {
  redirect?: string;
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  useModalLinks?: boolean;
  showOrganizerLinks?: boolean;
};

export function LoginForm({
  redirect = "/dashboard",
  onSuccess,
  onSwitchToRegister,
  useModalLinks = false,
  showOrganizerLinks = true,
}: LoginFormProps) {
  const router = useRouter();

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
        body: JSON.stringify({ identifier, password, portal: "user" }),
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(redirect);
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Sign In</h1>
      <p className="auth-subtitle">
        Welcome back! Enter your credentials to continue.
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
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="auth-footer">
        Don't have an account?{" "}
        {useModalLinks ? (
          <button
            type="button"
            className="auth-link-btn"
            onClick={onSwitchToRegister}
          >
            Create one
          </button>
        ) : (
          <Link href="/dashboard">Create one</Link>
        )}
      </p>

      {showOrganizerLinks ? (
        <>
          <p className="auth-footer">
            Organizer access?{" "}
            <Link href="/organizer/login">Login as organizer</Link>
          </p>
          <p className="auth-footer">
            Need to create organizer accounts?{" "}
            <Link href="/organization/register">Create organizer account</Link>
          </p>
        </>
      ) : null}
    </div>
  );
}
