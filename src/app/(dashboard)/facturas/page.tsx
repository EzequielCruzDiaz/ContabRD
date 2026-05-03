"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import type { Factura } from "@/types";

type Tab = "historial" | "procesar";

type AsientoLinea = { cuenta: string; debito: number | null; credito: number | null };

type DatosExtraidos = {
  rnc_proveedor?: string;
  ncf?: string;
  proveedor?: string;
  fecha_factura?: string;
  subtotal?: number;
  itbis?: number;
  total?: number;
  asiento_contable?: AsientoLinea[];
};

export default function FacturasPage() {
  const router = useRouter();
  const [tab,       setTab]       = useState<Tab>("historial");
  const [facturas,  setFacturas]  = useState<Factura[]>([]);
  const [loading,   setLoading]   = useState(true);

  // Upload state
  const [file,       setFile]       = useState<File | null>(null);
  const [preview,    setPreview]    = useState<string | null>(null);
  const [uploading,  setUploading]  = useState(false);
  const [datos,      setDatos]      = useState<DatosExtraidos | null>(null);
  const [uploadErr,  setUploadErr]  = useState<string | null>(null);
  const [dragOver,   setDragOver]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [filterNcf, setFilterNcf] = useState("todos");

  const supabase = createClient();

  const fetchFacturas = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles").select("empresa_id").eq("id", user.id).single();

    const query = supabase
      .from("facturas")
      .select("*")
      .eq("empresa_id", profile?.empresa_id ?? "")
      .order("fecha_factura", { ascending: false });

    const { data } = await query;
    setFacturas((data ?? []) as Factura[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchFacturas(); }, [fetchFacturas]);

  function handleFileChange(f: File) {
    setFile(f);
    setDatos(null);
    setUploadErr(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setUploadErr(null);

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/factura", { method: "POST", body: form });
    const body = await res.json();

    if (!res.ok) {
      setUploadErr(body.error ?? "Error al procesar la factura.");
    } else {
      setDatos(body.datos);
      fetchFacturas();
    }
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileChange(f);
  }

  function exportCsv() {
    const headers = ["Fecha","NCF","RNC Emisor","Proveedor","Subtotal","ITBIS","Total","Estado"];
    const rows = filteredFacturas.map((f) => [
      f.fecha_factura ?? "",
      f.ncf ?? "",
      f.rnc_proveedor ?? "",
      f.proveedor ?? "",
      f.subtotal ?? 0,
      f.itbis ?? 0,
      f.total ?? 0,
      f.estado,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `facturas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPeriodo = facturas.reduce((s, f) => s + (f.total ?? 0), 0);
  const filteredFacturas = filterNcf === "todos"
    ? facturas
    : facturas.filter((f) => f.tipo_ncf === filterNcf);

  return (
    <div className="space-y-8">
      {/* Header + Tabs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-3xl font-extrabold text-primary tracking-tight">
              {tab === "procesar" ? "Procesar Factura" : "Historial de Facturas"}
            </h2>
            <p className="text-on-surface-muted mt-1">
              {tab === "procesar"
                ? "Sube un documento para extracción automática via OCR."
                : "Gestión detallada de comprobantes fiscales procesados."}
            </p>
          </div>
          {tab === "historial" && (
            <button type="button" onClick={exportCsv} className="btn-secondary flex items-center gap-2 py-2.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Exportar CSV
            </button>
          )}
          {tab === "procesar" && datos && (
            <button type="button" onClick={() => {
              const rows = [
                ["Campo","Valor"],
                ["RNC Emisor",   datos.rnc_proveedor ?? ""],
                ["NCF",          datos.ncf ?? ""],
                ["Proveedor",    datos.proveedor ?? ""],
                ["Fecha",        datos.fecha_factura ?? ""],
                ["Subtotal",     datos.subtotal ?? 0],
                ["ITBIS",        datos.itbis ?? 0],
                ["Total",        datos.total ?? 0],
              ];
              const csv  = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url  = URL.createObjectURL(blob);
              const a    = document.createElement("a");
              a.href = url; a.download = `factura-${datos.ncf ?? "ocr"}.csv`; a.click();
              URL.revokeObjectURL(url);
            }} className="btn-secondary flex items-center gap-2 py-2.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Exportar
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex tabs-border">
          <button
            type="button"
            onClick={() => setTab("historial")}
            className={`tab-btn ${tab === "historial" ? "tab-btn-active" : ""}`}
          >
            Historial
          </button>
          <button
            type="button"
            onClick={() => setTab("procesar")}
            className={`tab-btn ${tab === "procesar" ? "tab-btn-active" : ""}`}
          >
            + Procesar nueva
          </button>
        </div>
      </div>

      {/* ── Historial Tab ── */}
      {tab === "historial" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-surface-lowest rounded-(--radius-card) p-5 shadow-card flex flex-wrap gap-4 items-end">
            <div>
              <label className="label-section block mb-2">Tipo de NCF</label>
              <select
                id="filter-ncf"
                value={filterNcf}
                onChange={(e) => setFilterNcf(e.target.value)}
                className="input-field w-auto pr-10"
                aria-label="Filtrar por tipo de NCF"
              >
                <option value="todos">Todos los tipos</option>
                <option value="B01">B01 — Crédito Fiscal</option>
                <option value="B02">B02 — Consumidor Final</option>
                <option value="B14">B14 — Régimen Especial</option>
                <option value="B15">B15 — Gubernamental</option>
                <option value="B16">B16 — Exportaciones</option>
              </select>
            </div>
            <button
              type="button"
              onClick={fetchFacturas}
              className="btn-primary py-2.5 px-5 text-sm"
            >
              Aplicar
            </button>
          </div>

          {/* Table */}
          <div className="bg-surface-lowest rounded-(--radius-card) shadow-card overflow-hidden">
            {loading ? (
              <div className="text-center py-16 text-on-surface-faint">
                <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm">Cargando facturas...</p>
              </div>
            ) : filteredFacturas.length === 0 ? (
              <div className="text-center py-16 text-on-surface-faint">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <p className="text-sm">No hay facturas registradas.</p>
              </div>
            ) : (
              <table className="facturas-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>NCF</th>
                    <th>RNC Emisor</th>
                    <th>Proveedor</th>
                    <th className="text-right">Subtotal</th>
                    <th className="text-right">ITBIS</th>
                    <th className="text-right">Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacturas.map((f) => (
                    <tr key={f.id}>
                      <td className="text-on-surface-muted whitespace-nowrap">
                        {f.fecha_factura ?? "—"}
                      </td>
                      <td>
                        <span className="font-mono text-xs bg-surface-low px-2 py-1 rounded text-primary">
                          {f.ncf ?? "—"}
                        </span>
                      </td>
                      <td className="text-on-surface-muted font-mono text-xs">{f.rnc_proveedor ?? "—"}</td>
                      <td className="font-semibold text-primary">{f.proveedor ?? "—"}</td>
                      <td className="text-right text-on-surface-muted">{formatCurrency(f.subtotal ?? 0)}</td>
                      <td className="text-right text-on-surface-muted">{formatCurrency(f.itbis ?? 0)}</td>
                      <td className="text-right font-display font-bold text-primary">{formatCurrency(f.total ?? 0)}</td>
                      <td>
                        <span className={
                          f.estado === "registrado" ? "badge-success" :
                          f.estado === "error" ? "badge-danger" : "badge-warning"
                        }>
                          {f.estado === "registrado" ? "Válido" : f.estado === "error" ? "Error" : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={6} className="text-right font-semibold text-on-surface-muted pt-4 pr-2">
                      Total Período Seleccionado
                    </td>
                    <td className="text-right font-display font-extrabold text-primary text-base pt-4">
                      {formatCurrency(totalPeriodo)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Procesar Tab ── */}
      {tab === "procesar" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left: Upload */}
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              aria-label="Seleccionar archivo de factura"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            />

            {!preview ? (
              <div
                role="button"
                tabIndex={0}
                className={`upload-zone ${dragOver ? "upload-zone-active" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <div className="w-14 h-14 rounded-2xl bg-surface-high flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-on-surface-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <p className="font-display font-semibold text-primary mb-1">Subir factura</p>
                <p className="text-sm text-on-surface-faint">
                  Arrastra tu archivo PDF o imagen (JPG, PNG) aquí.
                </p>
              </div>
            ) : (
              <div className="relative rounded-(--radius-card) overflow-hidden bg-surface-low">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Vista previa de la factura" className="w-full object-contain max-h-96" />
                <button
                  type="button"
                  aria-label="Eliminar vista previa"
                  onClick={() => { setFile(null); setPreview(null); setDatos(null); }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-card flex items-center justify-center text-on-surface-muted hover:text-danger transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {file && !datos && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="btn-primary w-full py-4 text-base"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Procesando con IA...
                  </span>
                ) : "Extraer datos con OCR"}
              </button>
            )}

            {uploadErr && <div className="alert-amber text-sm">{uploadErr}</div>}
          </div>

          {/* Right: Extracted data */}
          <div className="space-y-6">
            <div className="bg-surface-lowest rounded-(--radius-card) p-6 shadow-card">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-primary">Datos Extraídos</h3>
                {datos && (
                  <span className="badge-success">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    NCF VÁLIDO (DGII)
                  </span>
                )}
              </div>

              {datos ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="label-section mb-1.5">RNC Emisor</p>
                      <div className="extracted-field font-mono">{datos.rnc_proveedor ?? "—"}</div>
                    </div>
                    <div>
                      <p className="label-section mb-1.5">NCF</p>
                      <div className="extracted-field font-mono">{datos.ncf ?? "—"}</div>
                    </div>
                  </div>
                  <div>
                    <p className="label-section mb-1.5">Nombre del Proveedor</p>
                    <div className="extracted-field">{datos.proveedor ?? "—"}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="label-section mb-1.5">Fecha</p>
                      <div className="extracted-field">{datos.fecha_factura ?? "—"}</div>
                    </div>
                    <div>
                      <p className="label-section mb-1.5">Subtotal (DOP$)</p>
                      <div className="extracted-field">{formatCurrency(datos.subtotal ?? 0)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="label-section mb-1.5">ITBIS (18%)</p>
                      <div className="extracted-field">{formatCurrency(datos.itbis ?? 0)}</div>
                    </div>
                    <div>
                      <p className="label-section mb-1.5">Total Factura (DOP$)</p>
                      <div className="extracted-field font-display font-bold text-primary">
                        {formatCurrency(datos.total ?? 0)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-on-surface-faint">
                  <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
                  </svg>
                  <p className="text-sm">Sube una factura para ver los datos extraídos.</p>
                </div>
              )}
            </div>

            {/* Asiento Sugerido */}
            {datos?.asiento_contable && (
              <div className="bg-surface-lowest rounded-(--radius-card) p-6 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-primary">Asiento Sugerido</h3>
                  <button type="button" onClick={() => router.push("/configuracion")} className="text-xs font-semibold text-primary hover:underline underline-offset-4">
                    Editar Catálogo
                  </button>
                </div>
                <div>
                  <div className="journal-row journal-header">
                    <span className="label-section">Cuenta</span>
                    <span className="label-section text-right">Débito</span>
                    <span className="label-section text-right">Crédito</span>
                  </div>
                  {datos.asiento_contable?.map((line, i) => (
                    <div key={i} className="journal-row">
                      <span className="text-on-surface">{line.cuenta}</span>
                      <span className="text-right font-mono text-on-surface">
                        {line.debito != null ? formatCurrency(line.debito) : "—"}
                      </span>
                      <span className="text-right font-mono text-on-surface">
                        {line.credito != null ? formatCurrency(line.credito) : "—"}
                      </span>
                    </div>
                  ))}
                  {(() => {
                    const totalDeb = datos.asiento_contable?.reduce((s, l) => s + (l.debito ?? 0), 0) ?? 0;
                    const totalCre = datos.asiento_contable?.reduce((s, l) => s + (l.credito ?? 0), 0) ?? 0;
                    return (
                      <div className="journal-row journal-total">
                        <span>Total</span>
                        <span className="text-right font-mono">{formatCurrency(totalDeb)}</span>
                        <span className="text-right font-mono">{formatCurrency(totalCre)}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
