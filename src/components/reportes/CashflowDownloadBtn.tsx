"use client";

type Props = {
  year: number;
  ingresos: number;
  gastos: number;
  margen: number;
  monthlyData: { mes: string; total: number; itbis: number }[];
};

export default function CashflowDownloadBtn({ year, ingresos, gastos, margen, monthlyData }: Props) {
  function handleDownload() {
    const rows: (string | number)[][] = [
      ["Flujo de Caja", year],
      [""],
      ["Concepto", "Monto (DOP)"],
      ["Entradas de Efectivo", ingresos],
      ["Salidas de Efectivo", gastos],
      ["Disponibilidad en Banco", margen],
      [""],
      ["Detalle Mensual"],
      ["Mes", "Ingresos", "ITBIS", "Neto"],
      ...monthlyData.map((m) => [m.mes, m.total, m.itbis, m.total - m.itbis]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flujo-caja-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      aria-label="Descargar flujo de caja"
      className="topbar-icon-btn"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    </button>
  );
}
