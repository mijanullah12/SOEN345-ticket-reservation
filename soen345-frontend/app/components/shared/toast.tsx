"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type ToastVariant = "success" | "error";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

const TOAST_DURATION = 4500;

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startExit = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(item.id), 300);
  }, [item.id, onDismiss]);

  useEffect(() => {
    timerRef.current = setTimeout(startExit, TOAST_DURATION);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startExit]);

  return (
    <output
      className={`toast-card toast-${item.variant}${exiting ? " toast-exit" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="toast-icon" aria-hidden="true">
        {item.variant === "success" ? (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        )}
      </span>
      <span className="toast-message">{item.message}</span>
      <button
        type="button"
        className="toast-close"
        onClick={startExit}
        aria-label="Dismiss"
      >
        &times;
      </button>
    </output>
  );
}

export function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  if (typeof document === "undefined" || toasts.length === 0) return null;

  return createPortal(
    <div className="toast-container" aria-label="Notifications">
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  );
}

let counter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant) => {
    const id = `toast-${++counter}-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}
