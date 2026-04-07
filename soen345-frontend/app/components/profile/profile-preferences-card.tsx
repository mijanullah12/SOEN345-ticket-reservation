"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUserProfile } from "@/app/components/dashboard/use-user-profile";
import { InfoTip } from "@/app/components/shared/info-tip";
import { PaymentInfoModal } from "@/app/components/dashboard/payment-info-modal";
import { api } from "@/lib/api";
import type { NotificationChannel, UserProfile } from "@/lib/types";

export function ProfilePreferencesCard() {
  const { user, loading } = useUserProfile(true);
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredNotificationChannel, setPreferredNotificationChannel] =
    useState<NotificationChannel>("EMAIL");
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState("");
  const [payoutAccountId, setPayoutAccountId] = useState("");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setEmail(user.email ?? "");
    setPhone(user.phone ?? "");
    setPreferredNotificationChannel(
      user.preferredNotificationChannel ?? "EMAIL",
    );
    setDefaultPaymentMethodId(
      user.paymentInfo?.defaultPaymentMethodId ?? "",
    );
    setPayoutAccountId(user.paymentInfo?.payoutAccountId ?? "");
  }, [user]);

  async function saveProfile() {
    setMessage(null);
    setError(null);
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        firstName,
        lastName,
        email: email.trim() || null,
        phone: phone.trim() || null,
        preferredNotificationChannel,
      };
      if (currentUser.role === "ORGANIZER") {
        payload.paymentInfo = {
          payoutAccountId: payoutAccountId.trim() || null,
        };
      }

      const updated = await api<UserProfile>("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setMessage("Profile updated.");
      setFirstName(updated.firstName ?? "");
      setLastName(updated.lastName ?? "");
      setEmail(updated.email ?? "");
      setPhone(updated.phone ?? "");
      setPreferredNotificationChannel(
        updated.preferredNotificationChannel ?? "EMAIL",
      );
      setDefaultPaymentMethodId(
        updated.paymentInfo?.defaultPaymentMethodId ?? "",
      );
      setPayoutAccountId(updated.paymentInfo?.payoutAccountId ?? "");
      setIsEditing(false);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="dash-empty">Loading profile...</div>;
  }

  if (!user) {
    return <div className="dash-empty">Could not load profile.</div>;
  }

  const currentUser = user;

  function resetFormFromUser() {
    setFirstName(currentUser.firstName ?? "");
    setLastName(currentUser.lastName ?? "");
    setEmail(currentUser.email ?? "");
    setPhone(currentUser.phone ?? "");
    setPreferredNotificationChannel(
      currentUser.preferredNotificationChannel ?? "EMAIL",
    );
    setDefaultPaymentMethodId(
      currentUser.paymentInfo?.defaultPaymentMethodId ?? "",
    );
    setPayoutAccountId(currentUser.paymentInfo?.payoutAccountId ?? "");
  }

  function handleStartEditing() {
    resetFormFromUser();
    setMessage(null);
    setError(null);
    setIsEditing(true);
  }

  function handleCancelEditing() {
    resetFormFromUser();
    setMessage(null);
    setError(null);
    setIsEditing(false);
  }

  return (
    <section className="profile-card-neo">
      <div className="profile-top-actions">
        <Link href="/dashboard" className="dash-btn-solid profile-back-btn">
          Back to main dashboard
        </Link>
      </div>

      <header className="profile-card-head">
        <h2 className="profile-card-title">My profile</h2>
        <p className="profile-card-subtitle">
          {isEditing
            ? "Edit your details and save your profile changes."
            : "View your profile details and notification preference."}
        </p>
      </header>

      {isEditing ? (
        <div className="profile-grid org-form">
          <div className="form-group profile-field">
            <label htmlFor="profile-first-name">First name</label>
            <input
              id="profile-first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="form-group profile-field">
            <label htmlFor="profile-last-name">Last name</label>
            <input
              id="profile-last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="form-group profile-field">
            <label htmlFor="profile-email">Email</label>
            <input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={saving}
              placeholder="name@example.com"
            />
          </div>
          <div className="form-group profile-field">
            <label htmlFor="profile-phone">Phone number</label>
            <input
              id="profile-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={saving}
              placeholder="+15145551234"
            />
          </div>
          <div className="form-group profile-field">
            <label htmlFor="profile-role">Role</label>
            <input
              id="profile-role"
              value={currentUser.role ?? "CUSTOMER"}
              disabled
            />
          </div>
          <div className="form-group profile-field">
            <label htmlFor="profile-notification">
              Notification preference
            </label>
            <select
              id="profile-notification"
              value={preferredNotificationChannel}
              onChange={(e) =>
                setPreferredNotificationChannel(
                  e.target.value as NotificationChannel,
                )
              }
              disabled={saving}
            >
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
            </select>
          </div>
          {currentUser.role === "ORGANIZER" ? (
            <div className="form-group profile-field">
              <label htmlFor="profile-payout-account-id">
                Payout account ID
                <InfoTip text="Your payout account identifier from the payment provider (for example, Stripe acct_123) so you can receive funds." />
              </label>
              <input
                id="profile-payout-account-id"
                value={payoutAccountId}
                onChange={(e) => setPayoutAccountId(e.target.value)}
                disabled={saving}
                placeholder="acct_123"
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="profile-display-grid">
          <div className="profile-display-item">
            <p className="profile-display-label">First name</p>
            <p className="profile-display-value">{firstName || "-"}</p>
          </div>
          <div className="profile-display-item">
            <p className="profile-display-label">Last name</p>
            <p className="profile-display-value">{lastName || "-"}</p>
          </div>
          <div className="profile-display-item">
            <p className="profile-display-label">Email</p>
            <p className="profile-display-value">{email || "-"}</p>
          </div>
          <div className="profile-display-item">
            <p className="profile-display-label">Phone number</p>
            <p className="profile-display-value">{phone || "-"}</p>
          </div>
          <div className="profile-display-item">
            <p className="profile-display-label">Role</p>
            <p className="profile-display-value">
              {currentUser.role ?? "CUSTOMER"}
            </p>
          </div>
          <div className="profile-display-item">
            <p className="profile-display-label">Notification preference</p>
            <p className="profile-display-value">
              {preferredNotificationChannel}
            </p>
          </div>
          {currentUser.role !== "ORGANIZER" ? (
            <div className="profile-display-item">
              <p className="profile-display-label">Payment method</p>
              <p className="profile-display-value">
                {defaultPaymentMethodId || "-"}
              </p>
            </div>
          ) : null}
          {currentUser.role === "ORGANIZER" ? (
            <div className="profile-display-item">
              <p className="profile-display-label">Payout account ID</p>
              <p className="profile-display-value">
                {payoutAccountId || "-"}
              </p>
            </div>
          ) : null}
        </div>
      )}

      <div className="profile-action-row">
        {isEditing ? (
          <>
            <button
              type="button"
              className="dash-btn-solid dash-btn-accent profile-save-btn"
              onClick={() => void saveProfile()}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
            <button
              type="button"
              className="org-secondary-btn profile-cancel-btn"
              onClick={handleCancelEditing}
              disabled={saving}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="dash-btn-solid dash-btn-accent profile-save-btn"
              onClick={handleStartEditing}
            >
              Edit profile
            </button>
            {currentUser.role !== "ORGANIZER" ? (
              <button
                type="button"
                className="dash-btn-solid"
                onClick={() => setPaymentModalOpen(true)}
              >
                Add/update payment method
              </button>
            ) : null}
          </>
        )}
      </div>

      {message ? <p className="profile-feedback-ok">{message}</p> : null}
      {error ? <p className="profile-feedback-error">{error}</p> : null}

      {currentUser.role !== "ORGANIZER" ? (
        <PaymentInfoModal
          open={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onSaved={(updated) => {
            setDefaultPaymentMethodId(
              updated.paymentInfo?.defaultPaymentMethodId ?? "",
            );
            setMessage("Payment method updated.");
            setError(null);
          }}
        />
      ) : null}
    </section>
  );
}
