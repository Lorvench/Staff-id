"use client";

import { useRef, useState } from "react";
import StaffPhoto from "@/components/StaffPhoto";
import Button from "@/components/ui/Button";
import { FieldLabel } from "@/components/ui/Field";

const MAX_DIMENSION = 512;
const JPEG_QUALITY = 0.82;

/**
 * Staff photo upload.
 *
 * The image is downscaled and re-encoded to JPEG in the browser, then stored as
 * a data URI on Staff.photoUrl. This keeps the feature dependency-free and works
 * on serverless (where there is no writable disk) without a blob-storage
 * account. The tradeoff is row size: a 512px JPEG lands around 40-70KB, which is
 * fine at this scale. If the roster grows into the thousands, move to object
 * storage (S3 / Vercel Blob / Cloudinary) and store a URL instead — only this
 * component and the photoUrl value change.
 */
export default function PhotoUpload({
  value,
  name,
  onChange,
}: {
  value: string;
  name: string;
  onChange: (dataUri: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setBusy(true);
    try {
      onChange(await downscaleToDataUri(file));
    } catch {
      setError("That image couldn't be processed. Try another file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <FieldLabel>Staff Photo</FieldLabel>
      <div className="mt-2 flex items-center gap-4">
        <StaffPhoto src={value || null} name={name || "?"} size={72} />

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={busy}
              onClick={() => inputRef.current?.click()}
            >
              {value ? "Replace" : "Upload photo"}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange("");
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-ink-faint">
            Square crop works best · resized to {MAX_DIMENSION}px automatically
          </p>
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-disengaged">{error}</p>}
    </div>
  );
}

/** Center-crops to a square, downscales, and encodes as a JPEG data URI. */
function downscaleToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const image = new window.Image();
      image.onerror = () => reject(new Error("decode failed"));
      image.onload = () => {
        const side = Math.min(image.width, image.height);
        const target = Math.min(side, MAX_DIMENSION);

        const canvas = document.createElement("canvas");
        canvas.width = target;
        canvas.height = target;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas context"));

        ctx.drawImage(
          image,
          (image.width - side) / 2,
          (image.height - side) / 2,
          side,
          side,
          0,
          0,
          target,
          target,
        );

        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      image.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
