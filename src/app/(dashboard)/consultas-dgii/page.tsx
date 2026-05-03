"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { getUpcomingDgiiEvents } from "@/lib/dgii-calendar";
import type { Declaracion } from "@/types";

// ── Types ────────────────────────────────────────────────────────────────────

type NcfResult = { valid: boolean; reason?: string; data?: Record<string, unknown> } | null;
type RncResult = { rnc?: string; nombre?: string; estado?: string; [k: string]: unknown } | null;
type ApiStatus = "idle" | "loading" | "done" | "error";

// ── Helpers ──────────────────────────────────────────────────────────────────

const TIPOS = ["IT-1", "IR-17", "606", "607", "IR-2", "TSS"] as const;
const MESES_LARGO = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function calcVencimiento(tipo: string, mes: number, anio: number): string {
  // mes is 1-indexed
  let d: Date;
  if (tipo === "IR-17") {
    d = new Date(mes === 12 ? anio + 1 : anio, mes === 12 ? 0 : mes, 10);
  } else if (tipo === "IR-2") {
    d = new Date(anio + 1, 3, 30);
  } else if (tipo === "TSS") {
    d = new Date(mes === 12 ? anio + 1 : anio, mes === 12 ? 0 : mes, 0);
  } else {
    // IT-1, 606, 607: 20th of following month
    d = new Date(mes === 12 ? anio + 1 : anio, mes === 12 ? 0 : mes, 20);
  }
  const dow = d.getDay();
  if (dow === 6) d.setDate(d.getDate() + 2);
  else if (dow === 0) d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function estadoBadge(estado: string) {
  if (estado === "aceptada")  return "badge-success";
  if (estado === "rechazada") return "badge-danger";
  if (estado === "pendiente") return "badge-warning";
  return "badge-warning";
}

// ── Component ────────────────────────────────────────────────────────────────

const BLANK_FORM = {
  tipo:           "IT-1" as string,
  periodo_mes:    new Date().getMonth() + 1,
  periodo_anio:   new Date().getFullYear(),
  fecha_envio:    new Date().toISOString().split("T")[0],
  estado:         "enviada",
  numero_confirmacion: "",
  monto_declarado:     "",
  notas:               "",
};

export default function ConsultasDGIIPage() {

  // ── Declaraciones ──
  const [declaraciones,   setDeclaraciones]   = useState<Declaracion[]>([]);
  const [loadingDecl,     setLoadingDecl]     = useState(true);
  const [empresaId,       setEmpresaId]       = useState<string | null>(null);

  // ── Form modal ──
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState(BLANK_FORM);
  const [saving,    setSaving]    = useState(false);
  const [saveErr,   setSaveErr]   = useState<string | null>(null);

  // ── NCF validator ──
  const [ncf,       setNcf]       = useState("");
  const [ncfRnc,    setNcfRnc]    = useState("");
  const [ncfStatus, setNcfStatus] = useState<ApiStatus>("idle");
  const [ncfResult, setNcfResult] = useState<NcfResult>(null);

  // ── RNC lookup ──
  const [rnc,       setRnc]       = useState("");
  const [rncStatus, setRncStatus] = useState<ApiStatus>("idle");
  const [rncResult, setRncResult] = useState<RncResult>(null);
  const [rncError,  setRncError]  = useState<string | null>(null);

  // ── Calendar ──
  const upcomingEvents = getUpcomingDgiiEvents(new Date(), 5);

  // ── Load declaraciones ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoadingDecl(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles").select("empresa_id").eq("id", user.id).single();
    const eid = profile?.empresa_id ?? null;
    setEmpresaId(eid);
    if (!eid) { setLoadingDecl(false); return; }
    const { data } = await supabase
      .from("declaraciones")
      .select("*")
      .eq("empresa_id", eid)
      .order("created_at", { ascending: false });
    setDeclaraciones((data ?? []) as Declaracion[]);
    setLoadingDecl(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Compliance metrics ──────────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];
  const pendientes  = declaraciones.filter((d) => d.estado === "pendiente").length;
  const alertas     = declaraciones.filter(
    (d) => d.estado === "pendiente" && d.fecha_vencimiento && d.fecha_vencimiento < today
  ).length;
  const deuda = declaraciones
    .filter((d) => d.estado === "pendiente" && d.fecha_vencimiento && d.fecha_vencimiento < today)
    .reduce((s, d) => s + (d.monto_declarado ?? 0), 0);

  const proximoEvento = upcomingEvents[0];

  // ── Save declaration ────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setSaveErr(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !empresaId) { setSaveErr("Sesión expirada."); setSaving(false); return; }

    const vencimiento = calcVencimiento(form.tipo, form.periodo_mes, form.periodo_anio);

    const { error } = await supabase.from("declaraciones").insert({
      empresa_id:          empresaId,
      usuario_id:          user.id,
      tipo:                form.tipo,
      periodo_mes:         form.periodo_mes,
      periodo_anio:        form.periodo_anio,
      fecha_envio:         form.fecha_envio || null,
      fecha_vencimiento:   vencimiento,
      estado:              form.estado,
      numero_confirmacion: form.numero_confirmacion || null,
      monto_declarado:     form.monto_declarado ? Number(form.monto_declarado) : null,
      notas:               form.notas || null,
    });

    if (error) { setSaveErr(error.message); setSaving(false); return; }
    setShowModal(false);
    setForm(BLANK_FORM);
    load();
    setSaving(false);
  }

  // ── NCF / RNC handlers ──────────────────────────────────────────────────
  async function handleValidateNcf() {
    if (!ncf.trim()) return;
    setNcfStatus("loading"); setNcfResult(null);
    try {
      const res  = await fetch("/api/dgii/ncf", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rnc: ncfRnc, ncf }),
      });
      const body = await res.json();
      setNcfStatus(res.ok ? "done" : "error");
      setNcfResult(res.ok ? body : { valid: false, reason: body.error });
    } catch {
      setNcfStatus("error");
      setNcfResult({ valid: false, reason: "Error de red." });
    }
  }

  async function handleRncSearch() {
    if (!rnc.trim()) return;
    setRncStatus("loading"); setRncResult(null); setRncError(null);
    try {
      const res  = await fetch("/api/dgii/rnc", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rnc }),
      });
      const body = await res.json();
      if (res.ok) { setRncStatus("done"); setRncResult(body); }
      else        { setRncStatus("error"); setRncError(body.error); }
    } catch {
      setRncStatus("error"); setRncError("Error de red.");
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-primary tracking-tight">
            Consultas DGII
          </h2>
          <p className="text-on-surface-muted mt-1">Dirección General de Impuestos Internos</p>
        </div>
        <button
          type="button"
          onClick={() => { setForm(BLANK_FORM); setSaveErr(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2 py-2.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Registrar Declaración
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">

        {/* Compliance Status — 7 cols */}
        <div className="col-span-12 lg:col-span-7 bg-surface-lowest rounded-(--radius-card) p-8 shadow-card">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="label-section mb-1">Fiscal Standing</p>
              <h3 className="font-display text-2xl font-bold text-primary">Compliance Status</h3>
            </div>
            <div className="text-right">
              <p className={`font-display text-2xl font-black ${alertas > 0 ? "text-danger" : pendientes > 0 ? "text-warning" : "text-success"}`}>
                {alertas > 0 ? "Vencido" : pendientes > 0 ? "Pendiente" : "Al Día"}
              </p>
              <p className="text-xs text-on-surface-faint mt-1">Última verificación: Hoy</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-5 bg-surface-low rounded-xl">
              <p className="text-xs font-semibold text-on-surface-faint mb-2">Declaraciones Pendientes</p>
              <p className={`font-display text-2xl font-black ${pendientes > 0 ? "text-warning" : "text-primary"}`}>
                {loadingDecl ? "—" : pendientes}
              </p>
            </div>
            <div className="p-5 bg-surface-low rounded-xl">
              <p className="text-xs font-semibold text-on-surface-faint mb-2">Alertas Activas</p>
              <p className={`font-display text-2xl font-black ${alertas > 0 ? "text-danger" : "text-primary"}`}>
                {loadingDecl ? "—" : alertas}
              </p>
            </div>
            <div className="p-5 bg-surface-low rounded-xl">
              <p className="text-xs font-semibold text-on-surface-faint mb-2">Deuda Tributaria</p>
              <p className={`font-display text-2xl font-black ${deuda > 0 ? "text-danger" : "text-primary"}`}>
                {loadingDecl ? "—" : formatCurrency(deuda)}
              </p>
            </div>
          </div>

          {proximoEvento && (
            <div className="mt-6 flex items-center justify-between p-4 rounded-xl bg-warning-light">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                </svg>
                <span className="text-sm font-semibold text-warning-text">
                  Próximo: {proximoEvento.titulo} — {proximoEvento.dia} {proximoEvento.mes}
                </span>
              </div>
              {proximoEvento.urgente && (
                <span className="badge-warning text-[10px]">CRÍTICO</span>
              )}
            </div>
          )}
        </div>

        {/* NCF Validator — 5 cols */}
        <div className="col-span-12 lg:col-span-5 editorial-gradient text-white rounded-(--radius-card) p-8 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 opacity-10">
            <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
            </svg>
          </div>
          <h3 className="font-display text-xl font-bold mb-3">Validador NCF</h3>
          <p className="text-white/70 text-sm mb-5 leading-relaxed">
            Ingrese el RNC del emisor (opcional) y el NCF para verificar contra la DGII.
          </p>
          <div className="space-y-3">
            <input
              type="text"
              value={ncfRnc}
              onChange={(e) => { setNcfRnc(e.target.value); setNcfResult(null); setNcfStatus("idle"); }}
              placeholder="RNC del Emisor (opcional)"
              className="w-full rounded-xl py-3 px-4 text-primary bg-white placeholder:text-on-surface-faint outline-none focus:ring-2 focus:ring-success/50 text-sm font-mono"
            />
            <input
              type="text"
              value={ncf}
              onChange={(e) => { setNcf(e.target.value); setNcfResult(null); setNcfStatus("idle"); }}
              onKeyDown={(e) => e.key === "Enter" && handleValidateNcf()}
              placeholder="Ej. B0100000001"
              className="w-full rounded-xl py-3 px-4 text-primary bg-white placeholder:text-on-surface-faint outline-none focus:ring-2 focus:ring-success/50 text-sm font-mono"
              aria-label="Número de Comprobante Fiscal"
            />
            {ncfStatus !== "idle" && ncfResult && (
              <div className={ncfResult.valid ? "badge-success py-2 px-3 text-sm" : "badge-danger py-2 px-3 text-sm"}>
                {ncfResult.valid ? "✓ " : "✗ "}
                {ncfResult.reason ?? (ncfResult.valid ? "NCF válido en DGII" : "NCF inválido")}
              </div>
            )}
            <button
              type="button"
              onClick={handleValidateNcf}
              disabled={ncfStatus === "loading" || !ncf.trim()}
              className="w-full py-3 bg-success text-white font-bold rounded-xl hover:opacity-90 transition-opacity text-sm disabled:opacity-60"
            >
              {ncfStatus === "loading" ? "Consultando DGII..." : "Validar Comprobante"}
            </button>
          </div>
        </div>

        {/* RNC Consultation — 4 cols */}
        <div className="col-span-12 lg:col-span-4 bg-surface-lowest rounded-(--radius-card) p-8 shadow-card flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-surface-low rounded-xl flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <h3 className="font-display text-xl font-bold text-primary mb-2">Consulta de RNC</h3>
            <p className="text-sm text-on-surface-muted mb-6 leading-relaxed">
              Busque datos oficiales de empresas en el registro de la DGII.
            </p>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={rnc}
              onChange={(e) => { setRnc(e.target.value); setRncResult(null); setRncError(null); setRncStatus("idle"); }}
              onKeyDown={(e) => e.key === "Enter" && handleRncSearch()}
              placeholder="Ingrese número de RNC"
              className="input-field font-mono"
              aria-label="Número de RNC"
            />
            {rncStatus === "done" && rncResult && (
              <div className="bg-surface-low rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-faint">RNC</span>
                  <span className="font-mono font-semibold text-primary">{rncResult.rnc ?? rnc}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-on-surface-faint shrink-0">Nombre</span>
                  <span className="font-semibold text-primary text-right">{String(rncResult.nombre ?? "—")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-faint">Estado</span>
                  <span className={rncResult.estado === "ACTIVO" ? "badge-success" : "badge-warning"}>
                    {String(rncResult.estado ?? "—")}
                  </span>
                </div>
              </div>
            )}
            {rncStatus === "error" && rncError && (
              <p className="text-xs text-danger bg-surface-low p-3 rounded-lg">{rncError}</p>
            )}
            <button
              type="button"
              onClick={handleRncSearch}
              disabled={rncStatus === "loading" || !rnc.trim()}
              className="btn-secondary w-full py-3 text-sm disabled:opacity-60"
            >
              {rncStatus === "loading" ? "Consultando DGII..." : "Buscar en el Registro"}
            </button>
          </div>
        </div>

        {/* Historial de Declaraciones — 8 cols */}
        <div className="col-span-12 lg:col-span-8 bg-surface-lowest rounded-(--radius-card) shadow-card overflow-hidden">
          <div className="px-8 py-5 flex items-center justify-between sidebar-divider">
            <h3 className="font-display text-lg font-bold text-primary">Historial de Declaraciones</h3>
            <span className="text-xs text-on-surface-faint">{declaraciones.length} registros</span>
          </div>

          {loadingDecl ? (
            <div className="text-center py-12 text-on-surface-faint text-sm">Cargando...</div>
          ) : declaraciones.length === 0 ? (
            <div className="text-center py-12 text-on-surface-faint">
              <p className="text-sm">No hay declaraciones registradas.</p>
              <button
                type="button"
                onClick={() => { setForm(BLANK_FORM); setSaveErr(null); setShowModal(true); }}
                className="mt-3 text-sm font-semibold text-primary hover:underline"
              >
                Registrar primera declaración
              </button>
            </div>
          ) : (
            <table className="facturas-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Período</th>
                  <th>Fecha Envío</th>
                  <th>Vencimiento</th>
                  <th>Monto</th>
                  <th className="text-center">Estado</th>
                  <th><span className="sr-only">Confirmación</span></th>
                </tr>
              </thead>
              <tbody>
                {declaraciones.map((d) => (
                  <tr key={d.id}>
                    <td className="font-semibold text-primary">{d.tipo}</td>
                    <td className="text-on-surface-muted">
                      {d.periodo_mes ? `${MESES_LARGO[d.periodo_mes - 1]} ${d.periodo_anio}` : "—"}
                    </td>
                    <td className="text-on-surface-muted">{d.fecha_envio ?? "—"}</td>
                    <td className={`text-on-surface-muted ${d.fecha_vencimiento && d.fecha_vencimiento < today && d.estado === "pendiente" ? "text-danger font-semibold" : ""}`}>
                      {d.fecha_vencimiento ?? "—"}
                    </td>
                    <td className="text-on-surface-muted">
                      {d.monto_declarado != null ? formatCurrency(d.monto_declarado) : "—"}
                    </td>
                    <td className="text-center">
                      <span className={estadoBadge(d.estado)}>{d.estado}</span>
                    </td>
                    <td className="text-xs text-on-surface-faint font-mono">
                      {d.numero_confirmacion ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Official Resources */}
          <div className="px-8 py-5 bg-surface-low flex flex-wrap items-center gap-4">
            <p className="label-section shrink-0">Recursos Oficiales</p>
            {[
              { label: "Oficina Virtual (OVT)", href: "https://dgii.gov.do/oficinavirtualtributaria" },
              { label: "Consultas Públicas",    href: "https://www.dgii.gov.do/informacionTributaria/consultas" },
              { label: "Calendario Fiscal",     href: "https://dgii.gov.do/legislacion/resoluciones/Paginas/Resoluciones.aspx" },
            ].map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold text-primary hover:underline underline-offset-4">
                {link.label} ↗
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Modal: Registrar Declaración ──────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-lowest rounded-(--radius-card) shadow-card w-full max-w-lg p-8 space-y-6">

            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-primary">Registrar Declaración</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="topbar-icon-btn"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">

              {/* Tipo */}
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="decl-tipo" className="label-section block mb-2">Tipo de Formulario</label>
                <select
                  id="decl-tipo"
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="input-field w-full"
                >
                  {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Estado */}
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="decl-estado" className="label-section block mb-2">Estado</label>
                <select
                  id="decl-estado"
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  className="input-field w-full"
                >
                  <option value="enviada">Enviada</option>
                  <option value="aceptada">Aceptada</option>
                  <option value="rechazada">Rechazada</option>
                  <option value="pendiente">Pendiente</option>
                </select>
              </div>

              {/* Período mes */}
              <div>
                <label htmlFor="decl-mes" className="label-section block mb-2">Mes del Período</label>
                <select
                  id="decl-mes"
                  value={form.periodo_mes}
                  onChange={(e) => setForm({ ...form, periodo_mes: Number(e.target.value) })}
                  className="input-field w-full"
                >
                  {MESES_LARGO.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Período año */}
              <div>
                <label htmlFor="decl-anio" className="label-section block mb-2">Año del Período</label>
                <input
                  id="decl-anio"
                  type="number"
                  value={form.periodo_anio}
                  onChange={(e) => setForm({ ...form, periodo_anio: Number(e.target.value) })}
                  min={2020}
                  max={2099}
                  className="input-field w-full"
                />
              </div>

              {/* Fecha envío */}
              <div>
                <label htmlFor="decl-fecha" className="label-section block mb-2">Fecha de Envío</label>
                <input
                  id="decl-fecha"
                  type="date"
                  value={form.fecha_envio}
                  onChange={(e) => setForm({ ...form, fecha_envio: e.target.value })}
                  className="input-field w-full"
                />
              </div>

              {/* Monto */}
              <div>
                <label className="label-section block mb-2">Monto Declarado (DOP)</label>
                <input
                  type="number"
                  value={form.monto_declarado}
                  onChange={(e) => setForm({ ...form, monto_declarado: e.target.value })}
                  placeholder="0.00"
                  min={0}
                  className="input-field w-full"
                />
              </div>

              {/* Confirmación DGII */}
              <div className="col-span-2">
                <label className="label-section block mb-2">
                  Número de Confirmación DGII
                  <span className="text-on-surface-faint font-normal ml-1">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.numero_confirmacion}
                  onChange={(e) => setForm({ ...form, numero_confirmacion: e.target.value })}
                  placeholder="Ej. 2024-IT1-000001"
                  className="input-field w-full font-mono"
                />
              </div>

              {/* Notas */}
              <div className="col-span-2">
                <label className="label-section block mb-2">
                  Notas
                  <span className="text-on-surface-faint font-normal ml-1">(opcional)</span>
                </label>
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  rows={2}
                  className="input-field w-full resize-none"
                  placeholder="Observaciones adicionales..."
                />
              </div>
            </div>

            {saveErr && <div className="alert-amber text-sm">{saveErr}</div>}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-secondary py-2.5 px-5 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary py-2.5 px-5 text-sm"
              >
                {saving ? "Guardando..." : "Guardar Declaración"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
