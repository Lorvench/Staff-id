"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useUiStore } from "@/store/ui-store";
import type { TaxonomyItem, TaxonomyKind } from "@/lib/taxonomy-service";
import { taxonomyNameSchema } from "@/lib/validation";
import { parseCsv } from "@/lib/csv";
import Button from "@/components/ui/Button";
import CsvDropzone from "@/components/ui/CsvDropzone";
import Modal from "@/components/ui/Modal";

type Outcome = {
  created: string[];
  /** Names the server already had — a re-import is a no-op, not a failure. */
  duplicates: string[];
  failed: { name: string; message: string }[];
};

/**
 * Bulk create roles or venues from a one-column CSV.
 *
 * Names are validated client-side with the same `taxonomyNameSchema` the API
 * uses, deduped within the file, then POSTed one at a time to the existing
 * create endpoint — the unique index is still what settles a race between two
 * admins importing at once.
 *
 * A 409 is treated as "already there" rather than an error: importing a list
 * that overlaps what exists is the normal case, not a mistake.
 */
export default function ImportTaxonomyModal({
  kind,
  singular,
  plural,
  open,
  onClose,
}: {
  kind: TaxonomyKind;
  singular: string;
  plural: string;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  const [fileName, setFileName] = useState("");
  const [names, setNames] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const reset = () => {
    setFileName("");
    setNames(null);
    setError(null);
    setOutcome(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const readFile = async (file: File) => {
    setError(null);
    setNames(null);
    setOutcome(null);
    setFileName(file.name);

    try {
      const grid = parseCsv(await file.text()).filter((r) =>
        r.some((cell) => cell.trim() !== ""),
      );
      if (grid.length === 0) throw new Error("That file is empty.");

      // A `name` header is optional — a bare one-column list is the shape most
      // people paste out of a spreadsheet, so accept both.
      const header = grid[0].map((h) => h.trim().toLowerCase());
      const nameCol = header.indexOf("name");
      const hasHeader = nameCol >= 0;
      const col = hasHeader ? nameCol : 0;
      const body = hasHeader ? grid.slice(1) : grid;

      const seen = new Set<string>();
      const unique: string[] = [];
      for (const row of body) {
        const value = (row[col] ?? "").trim();
        if (!value) continue;
        const key = value.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(value);
      }

      if (unique.length === 0) {
        throw new Error(`No ${plural.toLowerCase()} found in that file.`);
      }

      setNames(unique);
    } catch (e) {
      setNames(null);
      setError(e instanceof Error ? e.message : "Could not read that file.");
    }
  };

  const runImport = useMutation({
    mutationFn: async (list: string[]): Promise<Outcome> => {
      const result: Outcome = { created: [], duplicates: [], failed: [] };

      for (const raw of list) {
        const check = taxonomyNameSchema.safeParse({ name: raw });
        if (!check.success) {
          result.failed.push({ name: raw, message: check.error.issues[0].message });
          continue;
        }

        try {
          await apiClient.post<TaxonomyItem>(`/api/admin/taxonomy/${kind}`, check.data);
          result.created.push(check.data.name);
        } catch (e) {
          if (e instanceof ApiClientError && e.code === "CONFLICT") {
            result.duplicates.push(check.data.name);
          } else {
            result.failed.push({
              name: raw,
              message: e instanceof ApiClientError ? e.message : "Request failed.",
            });
          }
        }
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setOutcome(result);
      if (result.created.length) {
        pushToast(
          `Imported ${result.created.length} ${result.created.length === 1 ? singular.toLowerCase() : plural.toLowerCase()}.`,
        );
      }
    },
    onError: () => pushToast("Import failed.", "error"),
  });

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Import ${plural.toLowerCase()} from CSV`}
      description={
        outcome
          ? "Import finished."
          : `One ${singular.toLowerCase()} per row. Existing entries are left alone.`
      }
    >
      {outcome ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-active-soft px-4 py-3 text-sm text-active-ink">
            <span className="font-bold">{outcome.created.length}</span> added
            {outcome.duplicates.length > 0 && (
              <>
                {" · "}
                <span className="font-bold">{outcome.duplicates.length}</span> already existed
              </>
            )}
            {outcome.failed.length > 0 && (
              <>
                {" · "}
                <span className="font-bold">{outcome.failed.length}</span> skipped
              </>
            )}
            .
          </div>

          {outcome.failed.length > 0 && (
            <div className="max-h-44 overflow-y-auto rounded-xl border border-paper-sunken">
              {outcome.failed.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="border-b border-paper-sunken px-3 py-2 text-[12.5px] text-ink-soft last:border-b-0"
                >
                  <span className="font-semibold text-disengaged">{f.name || "(blank)"}</span> —{" "}
                  {f.message}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleClose}>Done</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[13px] leading-relaxed text-ink-muted">
            A single <span className="font-mono text-[12px] text-brand">name</span> column —
            with or without a header row. Duplicates inside the file and{" "}
            {plural.toLowerCase()} that already exist are skipped automatically.
          </p>

          <CsvDropzone
            fileName={fileName}
            invalid={Boolean(error)}
            onFile={(f) => void readFile(f)}
            onReject={(message) => {
              setNames(null);
              setError(message);
            }}
          />

          {error && (
            <p role="alert" className="text-[12.5px] font-medium text-disengaged">
              {error}
            </p>
          )}

          {names && !error && (
            <div className="rounded-xl bg-paper-soft px-3 py-2.5">
              <p className="text-[13px] text-ink-soft">
                <span className="font-bold text-ink">{names.length}</span>{" "}
                {names.length === 1 ? singular.toLowerCase() : plural.toLowerCase()} ready.
              </p>
              <p className="mt-1 line-clamp-2 text-[12px] text-ink-muted">
                {names.slice(0, 8).join(" · ")}
                {names.length > 8 && ` · +${names.length - 8} more`}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-paper-sunken pt-4">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              disabled={!names || Boolean(error)}
              loading={runImport.isPending}
              onClick={() => names && runImport.mutate(names)}
            >
              {runImport.isPending ? "Importing…" : `Import ${plural.toLowerCase()}`}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
