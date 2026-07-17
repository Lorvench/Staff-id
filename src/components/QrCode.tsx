"use client";

import { QRCodeSVG } from "qrcode.react";

interface QrCodeProps {
  /** The verification URL provided by the backend. Rendered verbatim. */
  value: string;
  size?: number;
}

/**
 * Renders a verification URL as a high-contrast QR code, framed in a
 * card-within-card so it doesn't feel bolted on. Never place on a colored
 * background — scanners rely on black-on-white contrast.
 */
export default function QrCode({ value, size = 176 }: QrCodeProps) {
  return (
    <div className="inline-flex flex-col items-center rounded-2xl border border-brand-soft bg-paper p-4 shadow-sm">
      <div className="rounded-lg bg-white p-1.5">
        <QRCodeSVG
          value={value}
          size={size}
          level="M"
          marginSize={0}
          fgColor="#0f1115"
          bgColor="#ffffff"
        />
      </div>
      <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
        Scan to verify
      </p>
    </div>
  );
}
