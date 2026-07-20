import type { Metadata } from "next";
import StaffTable from "@/components/admin/StaffTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Staff Directory" };

export default function AdminHomePage() {
  return <StaffTable />;
}
