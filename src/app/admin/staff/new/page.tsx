import type { Metadata } from "next";
import CreateStaffForm from "@/components/admin/CreateStaffForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Onboard Staff" };

export default function NewStaffPage() {
  return <CreateStaffForm />;
}
