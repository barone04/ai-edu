"use client";

import { buttonStyles } from "./ui";

export function PrintButton({ label = "In phiếu" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={buttonStyles.primary}>
      {label}
    </button>
  );
}
