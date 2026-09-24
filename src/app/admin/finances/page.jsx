import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

export const metadata = {
  title: "Platform Finances & Take-Rate Simulator | TRUCKIT Admin",
  description: "Granular booking financial ledgers, dynamic take-rate simulation, and verified driver settlement audits.",
};

export default function AdminFinancesPage() {
  return <AdminDashboardClient initialTab="finances" />;
}
