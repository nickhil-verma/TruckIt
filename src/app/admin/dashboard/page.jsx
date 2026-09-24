import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

export const metadata = {
  title: "Admin Command Center | TRUCKIT Finances & Commission Engine",
  description: "Monitor, audit, and simulate platform commissions and net profits across all bookings, customers, and verified truck drivers.",
};

export default function AdminDashboardPage() {
  return <AdminDashboardClient initialTab="dashboard" />;
}
