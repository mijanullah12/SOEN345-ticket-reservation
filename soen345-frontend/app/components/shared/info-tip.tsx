"use client";

import { useId } from "react";

export function InfoTip({
  text,
  label = "More info",
}: {
  text: string;
  label?: string;
}) {
  const tooltipId = useId();
  return (
    <span className="info-tip">
      <button
        type="button"
        className="info-tip-button"
        aria-label={label}
        aria-describedby={tooltipId}
        title={text}
      >
        i
      </button>
      <span id={tooltipId} role="tooltip" className="info-tip-text">
        {text}
      </span>
    </span>
  );
}
