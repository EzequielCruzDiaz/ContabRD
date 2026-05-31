import SessionGuard from "@/components/dashboard/SessionGuard";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionGuard>
      <DashboardShell>{children}</DashboardShell>
    </SessionGuard>
  );
}
