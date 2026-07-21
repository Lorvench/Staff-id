"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import Button from "@/components/ui/Button";
import type { StaffDetail } from "@/lib/staff-service";

/**
 * Builds the staff ID card PDF in the browser.
 *
 * Client-side because everything the card needs is already on the page — a
 * round trip would only add a failure mode. The QR is rendered off-screen at
 * print resolution and handed to the PDF as a bitmap.
 */
export default function DownloadIdCardButton({ staff }: { staff: StaffDetail }) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setBusy(true);
    setError(null);

    try {
      const canvas = qrRef.current?.querySelector("canvas");
      if (!canvas) throw new Error("QR code isn't ready yet. Try again in a moment.");

      const [{ buildIdCardPdf }, photoDataUrl] = await Promise.all([
        import("@/lib/id-card-pdf"),
        toDataUrl(staff.photoUrl),
      ]);

      const doc = await buildIdCardPdf({
        staff,
        qrDataUrl: canvas.toDataURL("image/png"),
        photoDataUrl,
      });

      doc.save(`LHP-Staff-ID-${staff.stfId}.pdf`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn't build the card. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <Button type="button" onClick={handleDownload} loading={busy}>
        {!busy && <DownloadIcon />}
        Download ID card
      </Button>

      <p className="mt-2.5 text-xs text-ink-muted">
        Two-page PDF at badge size (54 × 86 mm) — front and back.
      </p>

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-disengaged-ink">
          {error}
        </p>
      )}

      {/*
        Off-screen at print resolution. `hidden` would stop the canvas painting,
        so it is positioned out of view instead.
      */}
      <div
        ref={qrRef}
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden"
      >
        <QRCodeCanvas
          value={staff.verificationUrl}
          size={512}
          level="M"
          marginSize={2}
          fgColor="#0f1115"
          bgColor="#ffffff"
        />
      </div>
    </div>
  );
}

/** Uploads are already data URLs; anything else has to be fetched and encoded. */
async function toDataUrl(src: string | null): Promise<string | null> {
  if (!src) return null;
  if (src.startsWith("data:")) return src;

  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();

    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    // A missing portrait is not a reason to fail the download — the card
    // falls back to the monogram.
    return null;
  }
}

function DownloadIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}
