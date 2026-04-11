"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusPopup } from "@/app/components/shared/status-popup";
import { api } from "@/lib/api";
import {
  buildDisplayName,
  consumeAuthFeedback,
  persistLoginFeedback,
} from "@/lib/auth-feedback";
import type { LoginResponse } from "@/lib/types";

type OrganizerLoginFormProps = {
  redirect?: string;
  onSuccess?: () => void;
  onSwitchToOrgRegister?: () => void;
  useModalLinks?: boolean;
};

export function OrganizerLoginForm({
  redirect = "/organizer/dashboard",
  onSuccess,
  onSwitchToOrgRegister,
  useModalLinks = false,
}: OrganizerLoginFormProps) {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginPopupName, setLoginPopupName] = useState<string | null>(null);
  const [signupPopupName, setSignupPopupName] = useState<string | null>(null);

  useEffect(() => {
    const feedback = consumeAuthFeedback();
    if (!feedback || feedback.kind !== "signup") {
      return;
    }

    setSignupPopupName(
      buildDisplayName(feedback.firstName, feedback.lastName) || "Organizer",
    );
  }, []);

  function acknowledgeLoginSuccess() {
    setLoginPopupName(null);
    if (onSuccess) {
      onSuccess();
      return;
    }
    if (typeof window !== "undefined") {
      window.location.assign(redirect);
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api<{ user?: LoginResponse["user"] }>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ identifier, password, portal: "organizer" }),
        },
      );
      persistLoginFeedback(response.user);
      setLoginPopupName(
        buildDisplayName(response.user?.firstName, response.user?.lastName) ||
          "Organizer",
      );
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
        Sign in with an organizer-enabled account to manage events.
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
        {useModalLinks ? (
          <button
            type="button"
            className="auth-link-btn"
            onClick={onSwitchToOrgRegister}
          >
            Go to organization registration
          </button>
        ) : (
          <Link href="/organization/register">
            Go to organization registration
          </Link>
        )}
      </p>
      <p className="auth-footer">
        Back to regular login? <Link href="/dashboard">Sign in</Link>
      </p>
      <StatusPopup
        open={Boolean(loginPopupName || signupPopupName)}
        title={loginPopupName ? "Successful log in" : "Successful sign up"}
        detail={
          loginPopupName
            ? `Welcome back, ${loginPopupName}.`
            : signupPopupName
              ? `Organizer account created for ${signupPopupName}. You can sign in now.`
              : undefined
        }
        onClose={
          loginPopupName
            ? acknowledgeLoginSuccess
            : () => setSignupPopupName(null)
        }
      />
    </div>
  );
}
