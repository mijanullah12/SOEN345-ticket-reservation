"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUserProfile } from "@/app/components/dashboard/use-user-profile";
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
  }, [user]);

  async function saveProfile() {
    setMessage(null);
    setError(null);
    setSaving(true);
    try {
      const updated = await api<UserProfile>("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          firstName,
          lastName,
          email: email.trim() || null,
          phone: phone.trim() || null,
          preferredNotificationChannel,
        }),
      });
      setMessage("Profile updated.");
      setFirstName(updated.firstName ?? "");
      setLastName(updated.lastName ?? "");
      setEmail(updated.email ?? "");
      setPhone(updated.phone ?? "");
      setPreferredNotificationChannel(
        updated.preferredNotificationChannel ?? "EMAIL",
      );
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

  function resetFormFromUser() {
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setEmail(user.email ?? "");
    setPhone(user.phone ?? "");
    setPreferredNotificationChannel(
      user.preferredNotificationChannel ?? "EMAIL",
    );
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
            <input id="profile-role" value={user.role ?? "CUSTOMER"} disabled />
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
            <p className="profile-display-value">{user.role ?? "CUSTOMER"}</p>
          </div>
          <div className="profile-display-item">
            <p className="profile-display-label">Notification preference</p>
            <p className="profile-display-value">
              {preferredNotificationChannel}
            </p>
          </div>
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
          <button
            type="button"
            className="dash-btn-solid dash-btn-accent profile-save-btn"
            onClick={handleStartEditing}
          >
            Edit profile
          </button>
        )}
      </div>

      {message ? <p className="profile-feedback-ok">{message}</p> : null}
      {error ? <p className="profile-feedback-error">{error}</p> : null}
    </section>
  );
}
