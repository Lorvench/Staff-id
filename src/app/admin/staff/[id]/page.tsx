import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStaffById } from "@/lib/staff-service";
import StaffDetailView from "@/components/admin/StaffDetailView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Staff Record" };

type Props = { params: Promise<{ id: string }> };

export default async function AdminStaffDetailPage({ params }: Props) {
  const { id } = await params;
  const staff = await getStaffById(id);

  if (!staff) notFound();

  return <StaffDetailView initialStaff={staff} />;
}
