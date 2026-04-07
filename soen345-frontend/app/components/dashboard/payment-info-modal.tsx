"use client";

import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import { useUserProfile } from "@/app/components/dashboard/use-user-profile";
import { InfoTip } from "@/app/components/shared/info-tip";
import { api } from "@/lib/api";
import type { UserProfile } from "@/lib/types";

type PaymentInfoModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (user: UserProfile) => void;
};

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
);

export function PaymentInfoModal({
  open,
  onClose,
  onSaved,
}: PaymentInfoModalProps) {
  const publishableKeyMissing =
    !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.trim().length === 0;

  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="dash-auth-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="dash-auth-backdrop"
        aria-label="Close payment info modal"
        onClick={onClose}
      />
      <div className="dash-auth-modal-card dash-auth-container">
        <button
          type="button"
          className="dash-auth-modal-close dash-btn-solid"
          aria-label="Close"
          onClick={onClose}
        >
          Close
        </button>
        <div className="auth-card">
          <h2 className="auth-title">Add payment method</h2>
          <p className="auth-subtitle">
            Use Stripe test cards (for example, 4242 4242 4242 4242) with any
            future expiry and any CVC.
          </p>
          {publishableKeyMissing ? (
            <p className="profile-feedback-error">
              Stripe publishable key is missing. Set{" "}
              <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>.
            </p>
          ) : (
            <Elements stripe={stripePromise}>
              <PaymentInfoForm onSaved={onSaved} onClose={onClose} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentInfoForm({
  onSaved,
  onClose,
}: {
  onSaved: (user: UserProfile) => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { user, loading } = useUserProfile(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function savePaymentMethod() {
    if (!stripe || !elements) return;
    setMessage(null);
    setError(null);
    setSaving(true);
    try {
      const setupIntent = await api<{ clientSecret: string }>(
        "/api/payments/setup-intent",
        { method: "POST" },
      );
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card input not ready.");
      }
      const result = await stripe.confirmCardSetup(setupIntent.clientSecret, {
        payment_method: { card: cardElement },
      });
      if (result.error) {
        throw new Error(result.error.message ?? "Card setup failed.");
      }
      const paymentMethodId =
        typeof result.setupIntent?.payment_method === "string"
          ? result.setupIntent.payment_method
          : null;
      if (!paymentMethodId) {
        throw new Error("Payment method could not be saved.");
      }
      const updated = await api<UserProfile>("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          paymentInfo: { defaultPaymentMethodId: paymentMethodId },
        }),
      });
      setMessage("Payment method saved.");
      onSaved(updated);
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? "Could not save payment method.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="dash-empty">Loading profile...</p>;
  }

  if (!user) {
    return <p className="dash-empty">Could not load profile.</p>;
  }

  return (
    <div className="auth-form">
      <div className="form-group">
        <label htmlFor="stripe-card-element">
          Card details
          <InfoTip text="Use test cards like 4242 4242 4242 4242. Any future expiry and any CVC will work in test mode." />
        </label>
        <div id="stripe-card-element" className="stripe-card-field">
          <CardElement
            options={{
              hidePostalCode: true,
              style: {
                base: {
                  fontSize: "15px",
                  color: "var(--dash-text)",
                  "::placeholder": { color: "var(--dash-text-muted)" },
                },
                invalid: { color: "#b91c1c" },
              },
            }}
          />
        </div>
      </div>
      <button
        type="button"
        className="auth-btn"
        onClick={() => void savePaymentMethod()}
        disabled={saving || !stripe}
      >
        {saving ? "Saving..." : "Save payment method"}
      </button>
      {message ? <p className="profile-feedback-ok">{message}</p> : null}
      {error ? <p className="profile-feedback-error">{error}</p> : null}
    </div>
  );
}
