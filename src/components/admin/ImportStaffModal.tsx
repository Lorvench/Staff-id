"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useUiStore } from "@/store/ui-store";
import type { StaffDetail } from "@/lib/staff-service";
import { createStaffSchema } from "@/lib/validation";
import { parseCsv, toCsv, downloadCsv } from "@/lib/csv";
import Button from "@/components/ui/Button";
import CsvDropzone from "@/components/ui/CsvDropzone";
import Modal from "@/components/ui/Modal";

type CreateResult = { staff: StaffDetail; tempPassword: string };

const REQUIRED = ["stfid", "name", "email", "dateengaged"] as const;
const OPTIONAL = ["roles", "venues"] as const;

type ParsedRow = {
  /** 1-based line number in the file, header included — for error messages. */
  line: number;
  values: Record<string, unknown>;
};

type ImportOutcome = {
  created: { name: string; stfId: string; email: string; tempPassword: string }[];
  failed: { line: number; label: string; message: string }[];
};

/** Splits a `a; b` or `a, b` cell into a trimmed list. */
const splitList = (raw: string): string[] =>
  raw
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * Bulk staff import from a spreadsheet export.
 *
 * Rows are validated client-side against the very same `createStaffSchema` the
 * API uses, then POSTed one at a time to the existing create endpoint — so every
 * row still gets server-side uniqueness checks, an audit entry, and a
 * server-generated temporary password. There is no bulk endpoint to bypass.
 *
 * Because each created account gets a one-time password that is never
 * recoverable, the result step *requires* downloading the credentials CSV before
 * the admin can walk away with usable logins.
 */
export default function ImportStaffModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);

  const reset = () => {
    setFileName("");
    setRows(null);
    setError(null);
    setOutcome(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const readFile = async (file: File) => {
    setError(null);
    setRows(null);
    setOutcome(null);
    setFileName(file.name);

    try {
      const grid = parseCsv(await file.text()).filter((r) =>
        r.some((cell) => cell.trim() !== ""),
      );
      if (grid.length < 2) {
        throw new Error("The file needs a header row and at least one data row.");
      }

      const header = grid[0].map((h) => h.trim().toLowerCase().replace(/[\s_-]/g, ""));
      const missing = REQUIRED.filter((col) => !header.includes(col));
      if (missing.length) {
        throw new Error(`Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`);
      }

      const at = (row: string[], col: string) => (row[header.indexOf(col)] ?? "").trim();

      setRows(
        grid.slice(1).map((row, i) => ({
          line: i + 2,
          values: {
            stfId: at(row, "stfid").toUpperCase(),
            name: at(row, "name"),
            email: at(row, "email"),
            dateEngaged: at(row, "dateengaged"),
            roles: header.includes("roles") ? splitList(at(row, "roles")) : [],
            venues: header.includes("venues") ? splitList(at(row, "venues")) : [],
            photoUrl: "",
          },
        })),
      );
    } catch (e) {
      setRows(null);
      setError(e instanceof Error ? e.message : "Could not read that file.");
    }
  };

  const runImport = useMutation({
    mutationFn: async (parsed: ParsedRow[]): Promise<ImportOutcome> => {
      const result: ImportOutcome = { created: [], failed: [] };

      for (const row of parsed) {
        const label = String(row.values.name || row.values.stfId || `Row ${row.line}`);

        // Validate with the API's own schema first, so a bad row reports a
        // field error rather than burning a request.
        const check = createStaffSchema.safeParse(row.values);
        if (!check.success) {
          const issue = check.error.issues[0];
          result.failed.push({
            line: row.line,
            label,
            message: `${issue.path.join(".") || "row"}: ${issue.message}`,
          });
          continue;
        }

        try {
          const created = await apiClient.post<CreateResult>("/api/admin/staff", check.data);
          result.created.push({
            name: created.staff.name,
            stfId: created.staff.stfId,
            email: check.data.email,
            tempPassword: created.tempPassword,
          });
        } catch (e) {
          result.failed.push({
            line: row.line,
            label,
            message: e instanceof ApiClientError ? e.message : "Request failed.",
          });
        }
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setOutcome(result);
      if (result.created.length) {
        pushToast(
          `Imported ${result.created.length} staff ${result.created.length === 1 ? "member" : "members"}.`,
        );
      }
    },
    onError: () => pushToast("Import failed.", "error"),
  });

  const downloadCredentials = () => {
    if (!outcome?.created.length) return;
    downloadCsv(
      "imported-staff-credentials.csv",
      toCsv(
        ["Name", "STF-ID", "Login email", "Temporary password"],
        outcome.created.map((c) => [c.name, c.stfId, c.email, c.tempPassword]),
      ),
    );
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Import staff from CSV"
      description={
        outcome
          ? "Import finished. Save the credentials before closing."
          : "Each row creates a staff record and its login account."
      }
    >
      {outcome ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-active-soft px-4 py-3 text-sm text-active-ink">
            <span className="font-bold">{outcome.created.length}</span> imported
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
              {outcome.failed.map((f) => (
                <div
                  key={`${f.line}-${f.label}`}
                  className="border-b border-paper-sunken px-3 py-2 text-[12.5px] text-ink-soft last:border-b-0"
                >
                  <span className="font-semibold text-disengaged">Row {f.line}</span>{" "}
                  {f.label} — {f.message}
                </div>
              ))}
            </div>
          )}

          {outcome.created.length > 0 && (
            <p className="rounded-xl bg-brand-soft px-3 py-2.5 text-xs leading-relaxed text-ink-soft">
              Each imported account has a one-time temporary password that cannot be shown
              again. Download them now — without it, these {outcome.created.length} people
              cannot sign in.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
            {outcome.created.length > 0 && (
              <Button onClick={downloadCredentials}>Download credentials</Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[13px] leading-relaxed text-ink-muted">
            Required columns{" "}
            <span className="font-mono text-[12px] text-brand">
              stfId, name, email, dateEngaged
            </span>
            ; optional <span className="font-mono text-[12px] text-brand">roles, venues</span>{" "}
            (separate multiple with <code>;</code>). Dates as{" "}
            <span className="font-mono text-[12px]">YYYY-MM-DD</span>.
          </p>

          <CsvDropzone
            fileName={fileName}
            invalid={Boolean(error)}
            onFile={(f) => void readFile(f)}
            onReject={(message) => {
              setRows(null);
              setError(message);
            }}
          />

          {error && (
            <p role="alert" className="text-[12.5px] font-medium text-disengaged">
              {error}
            </p>
          )}

          {rows && !error && (
            <p className="text-[13px] text-ink-soft">
              <span className="font-bold text-ink">{rows.length}</span>{" "}
              {rows.length === 1 ? "row" : "rows"} ready to import.
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-paper-sunken pt-4">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              disabled={!rows || Boolean(error)}
              loading={runImport.isPending}
              onClick={() => rows && runImport.mutate(rows)}
            >
              {runImport.isPending ? "Importing…" : "Import staff"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
