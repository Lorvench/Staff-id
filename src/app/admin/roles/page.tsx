import type { Metadata } from "next";
import TaxonomyTable from "@/components/admin/TaxonomyTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Roles" };

export default function AdminRolesPage() {
  return <TaxonomyTable kind="roles" />;
}
