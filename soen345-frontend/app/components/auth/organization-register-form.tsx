"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { persistSignupFeedback } from "@/lib/auth-feedback";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FieldError {
  field: string;
  message: string;
}

const INITIAL_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

type OrganizationRegisterFormProps = {
  redirectToOrganizerLogin?: string;
  onSuccess?: () => void;
  onSwitchToOrgLogin?: () => void;
  useModalLinks?: boolean;
};

export function OrganizationRegisterForm({
  redirectToOrganizerLogin = "/organizer/login",
  onSuccess,
  onSwitchToOrgLogin,
  useModalLinks = false,
}: OrganizationRegisterFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [loading, setLoading] = useState(false);

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate(): string | null {
    if (!form.email && !form.phone) {
      return "Either email or phone number is required.";
    }
    if (form.password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(form.password)) {
      return "Password must contain at least one letter and one number.";
    }
    if (form.password !== form.confirmPassword) {
      return "Passwords do not match.";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors([]);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const payload: Record<string, string> = {
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password,
      };
      if (form.email) payload.email = form.email;
      if (form.phone) payload.phone = form.phone;

      await api("/api/auth/register-organizer", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      persistSignupFeedback({
        firstName: form.firstName,
        lastName: form.lastName,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(redirectToOrganizerLogin);
      }
    } catch (err: unknown) {
      const apiErr = err as {
        message?: string;
        fieldErrors?: FieldError[];
      };
      setError(
        apiErr.message ?? "Organization registration failed. Please try again.",
      );
      if (apiErr.fieldErrors?.length) setFieldErrors(apiErr.fieldErrors);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Organization Registration</h1>
      <p className="auth-subtitle">
        Create an organizer account for organization management.
      </p>

      {error && <div className="auth-error">{error}</div>}

      {fieldErrors.length > 0 && (
        <ul className="auth-field-errors">
          {fieldErrors.map((fe) => (
            <li key={fe.field}>
              <strong>{fe.field}:</strong> {fe.message}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              type="text"
              placeholder="John"
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              type="text"
              placeholder="Doe"
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone (E.164 format)</label>
          <input
            id="phone"
            type="tel"
            placeholder="+14155552671"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Min 8 chars, 1 letter + 1 number"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            required
          />
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? "Creating organization..." : "Register Organization"}
        </button>
      </form>

      <p className="auth-footer">
        Already have an organizer account?{" "}
        {useModalLinks ? (
          <button
            type="button"
            className="auth-link-btn"
            onClick={onSwitchToOrgLogin}
          >
            Login as organizer
          </button>
        ) : (
          <Link href="/organizer/login">Login as organizer</Link>
        )}
      </p>
    </div>
  );
}
