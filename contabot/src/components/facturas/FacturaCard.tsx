import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { Factura } from "@/types";

interface FacturaCardProps {
  factura: Factura;
}

export default function FacturaCard({ factura }: FacturaCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-gray-500">{factura.ncf}</p>
          <p className="mt-1 font-semibold text-gray-900">{factura.proveedor}</p>
          <p className="text-sm text-gray-500">{factura.fecha}</p>
        </div>
        <Badge variant={factura.estado === "procesada" ? "success" : "warning"}>
          {factura.estado}
        </Badge>
      </div>
      <div className="mt-4 flex justify-between text-sm">
        <span className="text-gray-500">Monto: <strong>RD${factura.monto.toLocaleString()}</strong></span>
        <span className="text-gray-500">ITBIS: <strong>RD${factura.itbis.toLocaleString()}</strong></span>
      </div>
    </Card>
  );
}
