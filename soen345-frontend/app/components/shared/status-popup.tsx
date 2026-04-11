"use client";

import { createPortal } from "react-dom";
import {useEffect} from "react";

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
    <div className="status-popup-backdrop" role="status" aria-live="polite">
      <div className="status-popup" aria-label={title}>
        <div className="status-popup-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
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
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return popup;
  }

  return createPortal(popup, document.body);
}
