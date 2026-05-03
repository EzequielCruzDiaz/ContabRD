"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

type MonthData = { mes: string; total: number; itbis: number };

type Props = { monthlyData: MonthData[] };

export default function MonthlySummary({ monthlyData }: Props) {
  const [showAll, setShowAll] = useState(false);

  const withData = monthlyData.filter((m) => m.total > 0).reverse();
  const displayed = showAll ? [...monthlyData].reverse() : withData.slice(0, 3);

  return (
    <div className="col-span-12 lg:col-span-6 bg-surface-low rounded-(--radius-card) p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-lg font-bold text-primary">
          Resumen Mensual: Ingresos vs Gastos
        </h3>
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="text-sm font-semibold text-primary hover:underline underline-offset-4"
        >
          {showAll ? "Ver menos ↑" : "Ver todo →"}
        </button>
      </div>
      <div className="space-y-3">
        {displayed.length > 0 ? displayed.map((m) => {
          const gastoPct = m.total > 0 ? Math.round((m.itbis / m.total) * 100) : 0;
          const netoPct  = 100 - gastoPct;
          return (
            <div key={m.mes} className="bg-surface-lowest p-4 rounded-xl">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-primary">{m.mes}</span>
                <span className="text-on-surface-muted">
                  {m.total > 0 ? (
                    <>Neto: <span className="text-success font-bold">{formatCurrency(m.total - m.itbis)}</span></>
                  ) : (
                    <span className="text-on-surface-faint">Sin movimientos</span>
                  )}
                </span>
              </div>
              <div className="h-2 w-full bg-surface-high rounded-full overflow-hidden flex">
                <div className="h-full bg-primary rounded-l-full" style={{ width: `${netoPct}%` }} />
                <div className="h-full bg-warning rounded-r-full" style={{ width: `${gastoPct}%` }} />
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-8 text-on-surface-faint text-sm">
            No hay datos de períodos anteriores.
          </div>
        )}
      </div>
    </div>
  );
}
