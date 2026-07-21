"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useUiStore } from "@/store/ui-store";
import type { StaffDetail } from "@/lib/staff-service";
import { toCsv, downloadCsv } from "@/lib/csv";
import Button from "@/components/ui/Button";

type StaffList = {
  items: StaffDetail[];
  total: number;
  page: number;
  pageCount: number;
};

const HEADER = [
  "STF-ID",
  "Name",
  "Email",
  "Status",
  "Roles",
  "Venues",
  "Date engaged",
] as const;

/**
 * Exports the directory as it is currently filtered — what you see is what you
 * get. The list endpoint caps `pageSize` at 100, so this walks the pages rather
 * than asking for everything at once.
 */
export default function ExportButton() {
  const filters = useUiStore((s) => s.filters);
  const pushToast = useUiStore((s) => s.pushToast);
  const [exporting, setExporting] = useState(false);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows: StaffDetail[] = [];
      let page = 1;
      let pageCount = 1;

      do {
        const params = new URLSearchParams({ page: String(page), pageSize: "100" });
        if (filters.q) params.set("q", filters.q);
        if (filters.status) params.set("status", filters.status);
        if (filters.role) params.set("role", filters.role);
        if (filters.venue) params.set("venue", filters.venue);

        const data = await apiClient.get<StaffList>(`/api/admin/staff?${params}`);
        rows.push(...data.items);
        pageCount = data.pageCount;
        page += 1;
      } while (page <= pageCount);

      if (rows.length === 0) {
        pushToast("Nothing to export for these filters.", "error");
        return;
      }

      const body = rows.map((s) => [
        s.stfId,
        s.name,
        s.email,
        s.status,
        s.roles.join("; "),
        s.venues.join("; "),
        s.dateEngaged.slice(0, 10),
      ]);

      downloadCsv("staff-directory.csv", toCsv(HEADER, body));

      pushToast(`Exported ${rows.length} staff ${rows.length === 1 ? "record" : "records"}.`);
    } catch {
      pushToast("Export failed. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant="secondary" size="sm" loading={exporting} onClick={exportCsv}>
      {!exporting && (
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3v12M8 11l4 4 4-4M5 19h14" />
        </svg>
      )}
      <span className="hidden sm:inline">{exporting ? "Exporting…" : "Export"}</span>
    </Button>
  );
}
