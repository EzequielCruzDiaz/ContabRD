import Badge from "@/components/ui/Badge";
import type { Factura } from "@/types";

interface FacturasTableProps {
  facturas?: Factura[];
}

export default function FacturasTable({ facturas = [] }: FacturasTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-4 py-3 text-left">NCF</th>
            <th className="px-4 py-3 text-left">Proveedor</th>
            <th className="px-4 py-3 text-left">Fecha</th>
            <th className="px-4 py-3 text-right">Monto</th>
            <th className="px-4 py-3 text-right">ITBIS</th>
            <th className="px-4 py-3 text-left">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {facturas.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                No hay facturas registradas
              </td>
            </tr>
          ) : (
            facturas.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono">{f.ncf}</td>
                <td className="px-4 py-3">{f.proveedor}</td>
                <td className="px-4 py-3">{f.fecha}</td>
                <td className="px-4 py-3 text-right">RD${f.monto.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">RD${f.itbis.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <Badge variant={f.estado === "procesada" ? "success" : "warning"}>
                    {f.estado}
                  </Badge>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
