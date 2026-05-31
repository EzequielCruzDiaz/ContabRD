import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { getUpcomingDgiiEvents } from "@/lib/dgii-calendar";
import AgendarCitaCard from "@/components/dashboard/AgendarCitaCard";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre, empresa_id")
    .eq("id", user!.id)
    .single();

  const empresaId = profile?.empresa_id ?? "";

  // KPIs
  const now = new Date();
  const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: facturasMes } = await supabase
    .from("facturas")
    .select("itbis, total, estado")
    .eq("empresa_id", empresaId)
    .gte("fecha_factura", mesInicio.split("T")[0]);

  const totalGastosMes = facturasMes?.reduce((s, f) => s + (f.total ?? 0), 0) ?? 0;
  const totalItbisMes  = facturasMes?.reduce((s, f) => s + (f.itbis ?? 0), 0) ?? 0;
  const pendientePago  = facturasMes
    ?.filter((f) => f.estado === "pendiente")
    .reduce((s, f) => s + (f.total ?? 0), 0) ?? 0;

  // Recent facturas
  const { data: recientes } = await supabase
    .from("facturas")
    .select("id, proveedor, ncf, rnc_proveedor, total, estado, fecha_factura")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(4);

  const dgiiCalendar = getUpcomingDgiiEvents(now, 4);

  const today = now.toLocaleDateString("es-DO", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="space-y-10">
      {/* Welcome banner — only for new users with no data */}
      {(!recientes || recientes.length === 0) && (
        <WelcomeBanner nombre={profile?.nombre} />
      )}

      {/* Page Header */}
      <div>
        <h2 className="font-display text-3xl font-extrabold text-primary tracking-tight">
          Panel de Control Fiscal
        </h2>
        <p className="text-on-surface-muted font-medium mt-1">
          Bienvenido{profile?.nombre ? `, ${profile.nombre}` : ""}. Indicadores clave al {today}.
        </p>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gastos del mes */}
        <div className="kpi-card kpi-card-navy">
          <div className="flex items-start justify-between mb-6">
            <div className="kpi-icon text-primary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
            <span className="label-section">Mes Actual</span>
          </div>
          <p className="label-section mb-1">Total Gastos</p>
          <p className="font-display text-3xl font-black text-primary">
            {formatCurrency(totalGastosMes)}
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-success text-sm font-semibold">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
            <span>Período actual</span>
          </div>
        </div>

        {/* ITBIS acumulado */}
        <div className="kpi-card kpi-card-blue">
          <div className="flex items-start justify-between mb-6">
            <div className="kpi-icon kpi-icon-blue">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3m18-3V6" />
              </svg>
            </div>
            <span className="label-section">Acumulado</span>
          </div>
          <p className="label-section mb-1">Total ITBIS</p>
          <p className="font-display text-3xl font-black text-primary">
            {formatCurrency(totalItbisMes)}
          </p>
          <p className="mt-4 text-sm text-on-surface-faint font-medium">Sujeto a deducciones</p>
        </div>

        {/* Pendiente de pago */}
        <div className="kpi-card kpi-card-amber">
          <div className="flex items-start justify-between mb-6">
            <div className="kpi-icon kpi-icon-amber">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="label-section text-warning">Urgente</span>
          </div>
          <p className="label-section mb-1">Pendiente de Pago</p>
          <p className="font-display text-3xl font-black text-primary">
            {formatCurrency(pendientePago)}
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-danger text-sm font-semibold">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span>Facturas pendientes</span>
          </div>
        </div>
      </section>

      {/* Main Grid: Recent + DGII Calendar */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Recent facturas — 8 cols */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-surface-low rounded-[var(--radius-card)] p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-lg font-bold text-primary tracking-tight">
                  Procesamiento Reciente
                </h3>
                <p className="text-sm text-on-surface-muted mt-0.5">
                  Últimas facturas validadas ante la DGII
                </p>
              </div>
              <Link href="/facturas" className="text-sm font-semibold text-primary hover:underline underline-offset-4">
                Ver todas
              </Link>
            </div>

            {recientes && recientes.length > 0 ? (
              <div className="space-y-3">
                {recientes.map((f) => (
                  <div key={f.id} className="recent-item">
                    <div className="flex items-center gap-4">
                      <div className="recent-item-icon">
                        <svg className="w-5 h-5 text-on-surface-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-primary text-sm">{f.proveedor ?? "Proveedor desconocido"}</p>
                        <p className="text-xs text-on-surface-faint mt-0.5">
                          NCF: {f.ncf ?? "—"} · {f.fecha_factura ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-display font-bold text-primary text-sm">
                        {formatCurrency(f.total ?? 0)}
                      </span>
                      <span className={f.estado === "registrado" ? "badge-success" : f.estado === "error" ? "badge-danger" : "badge-warning"}>
                        {f.estado === "registrado" ? "Válido" : f.estado === "error" ? "Error" : "Pendiente"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-on-surface-faint">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <p className="text-sm">No hay facturas registradas aún.</p>
                <Link href="/facturas" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
                  Subir primera factura
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-4">
            <Link href="/facturas" className="quick-action">
              <div className="quick-action-icon bg-success-light">
                <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-on-surface">Subir Factura</span>
            </Link>
            <Link href="/chat" className="quick-action">
              <div className="quick-action-icon bg-info-light">
                <svg className="w-5 h-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-on-surface">Asistente IA</span>
            </Link>
            <Link href="/consultas-dgii" className="quick-action">
              <div className="quick-action-icon bg-warning-light">
                <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-on-surface">Verificar NCF</span>
            </Link>
          </div>
        </div>

        {/* DGII Calendar — 4 cols */}
        <div className="lg:col-span-4 space-y-4">
          <div className="dgii-card">
            <div className="mb-4">
              <p className="label-section text-white/60">Calendario DGII</p>
              <h3 className="font-display font-bold text-white text-base mt-1">
                Próximos compromisos fiscales
              </h3>
            </div>
            <div>
              {dgiiCalendar.map((ev) => (
                <div key={`${ev.mes}-${ev.dia}-${ev.titulo}`} className="dgii-event">
                  <div className="dgii-date-badge">
                    <span>{ev.mes}</span>
                    <span className="text-base font-black leading-none">{ev.dia}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{ev.titulo}</p>
                      {ev.urgente && (
                        <span className="badge-warning text-[10px]">CRÍTICO</span>
                      )}
                    </div>
                    <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{ev.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/consultas-dgii"
              className="mt-4 block text-center text-xs font-bold text-white/70 hover:text-white transition-colors py-2"
            >
              VER CALENDARIO COMPLETO →
            </Link>
          </div>

          {/* Consultoría Premium */}
          <AgendarCitaCard />
        </div>
      </section>
    </div>
  );
}
