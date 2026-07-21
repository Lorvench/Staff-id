import type { Metadata } from "next";
import TaxonomyTable from "@/components/admin/TaxonomyTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Venues" };

export default function AdminVenuesPage() {
  return <TaxonomyTable kind="venues" />;
}
