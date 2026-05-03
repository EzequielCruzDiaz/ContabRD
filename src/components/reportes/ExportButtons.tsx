"use client";

type MonthData = { mes: string; total: number; itbis: number };

type Props = {
  year: number;
  monthlyData: MonthData[];
  ingresosTotales: number;
  gastosTotales: number;
  itbisTotales: number;
  margenNeto: number;
  pendientes: number;
};

function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function download(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportButtons({
  year, monthlyData, ingresosTotales, gastosTotales, itbisTotales, margenNeto, pendientes,
}: Props) {

  function handleDossier() {
    const summary = [
      ["Resumen Anual", year],
      [""],
      ["Concepto", "Monto (DOP)"],
      ["Ingresos Totales",  ingresosTotales],
      ["Gastos Operativos", gastosTotales],
      ["ITBIS Acumulado",   itbisTotales],
      ["Margen Neto",       margenNeto],
      ["Pendiente de Pago", pendientes],
      [""],
      ["Detalle Mensual"],
      ["Mes", "Total", "ITBIS", "Neto"],
      ...monthlyData.map((m) => [m.mes, m.total, m.itbis, m.total - m.itbis]),
    ];
    download(toCsv(summary), `reporte-anual-${year}.csv`);
  }

  function handleExport() {
    const rows = [
      ["Mes", "Total (DOP)", "ITBIS (DOP)", "Neto (DOP)"],
      ...monthlyData.map((m) => [m.mes, m.total, m.itbis, m.total - m.itbis]),
    ];
    download(toCsv(rows), `datos-mensuales-${year}.csv`);
  }

  return (
    <div className="flex flex-wrap gap-4 pt-4">
      <button type="button" onClick={handleDossier} className="btn-secondary flex items-center gap-2 py-3">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        Descargar Dossier Completo (CSV)
      </button>
      <button type="button" onClick={handleExport} className="btn-secondary flex items-center gap-2 py-3">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Exportar Datos
      </button>
    </div>
  );
}
