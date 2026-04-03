import FacturasTable from "@/components/dashboard/FacturasTable";

export default function FacturasPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Facturas</h1>
      <FacturasTable />
    </div>
  );
}
