"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

type StatusPopupProps = {
  open: boolean;
  title: string;
  detail?: string;
  onClose?: () => void;
  actionLabel?: string;
};

export function StatusPopup({
  open,
  title,
  detail,
  onClose,
  actionLabel = "OK",
}: StatusPopupProps) {
  useEffect(() => {
    console.log("✅ StatusPopup mounted, open =", open);
    return () => {
      console.log("❌ StatusPopup unmounted");
    };
  }, [open]);
  if (!open) {
    return null;
  }

  const popup = (
    <output className="status-popup-backdrop" aria-live="polite">
      <section className="status-popup" aria-label={title}>
        <div className="status-popup-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path
              d="M20 6 9 17l-5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="status-popup-title">{title}</p>
        {detail ? <p className="status-popup-detail">{detail}</p> : null}
        <button
          type="button"
          className="status-popup-action"
          onClick={() => {
            console.log("Button clicked inside StatusPopup");
            onClose?.();
          }}
        >
          {actionLabel}
        </button>
      </section>
    </output>
  );

  if (typeof document === "undefined") {
    return popup;
  }

  return createPortal(popup, document.body);
}
