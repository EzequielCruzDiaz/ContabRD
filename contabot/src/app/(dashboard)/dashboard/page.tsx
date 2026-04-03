import KpiCard from "@/components/dashboard/KpiCard";
import ActivityFeed from "@/components/dashboard/ActivityFeed";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Facturas este mes" value="0" />
        <KpiCard title="ITBIS por pagar" value="RD$0" />
        <KpiCard title="Ingresos brutos" value="RD$0" />
      </div>
      <ActivityFeed />
    </div>
  );
}
