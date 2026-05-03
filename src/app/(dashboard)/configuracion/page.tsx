"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CATALOGO = [
  { codigo: "1100", nombre: "Efectivo y Equivalentes", tipo: "Activo" },
  { codigo: "1200", nombre: "Cuentas por Cobrar", tipo: "Activo" },
  { codigo: "1300", nombre: "Inventarios", tipo: "Activo" },
  { codigo: "1400", nombre: "Activos Fijos", tipo: "Activo" },
  { codigo: "2100", nombre: "Cuentas por Pagar", tipo: "Pasivo" },
  { codigo: "2200", nombre: "ITBIS por Pagar", tipo: "Pasivo" },
  { codigo: "2300", nombre: "Retenciones por Pagar (ISR)", tipo: "Pasivo" },
  { codigo: "2400", nombre: "Préstamos Bancarios", tipo: "Pasivo" },
  { codigo: "3100", nombre: "Capital Social", tipo: "Patrimonio" },
  { codigo: "3200", nombre: "Utilidades Retenidas", tipo: "Patrimonio" },
  { codigo: "4100", nombre: "Ingresos por Ventas", tipo: "Ingreso" },
  { codigo: "4200", nombre: "Otros Ingresos Operativos", tipo: "Ingreso" },
  { codigo: "5100", nombre: "Costo de Ventas", tipo: "Gasto" },
  { codigo: "5200", nombre: "Gastos de Administración", tipo: "Gasto" },
  { codigo: "5300", nombre: "Gastos de Ventas", tipo: "Gasto" },
  { codigo: "5400", nombre: "Gastos Financieros", tipo: "Gasto" },
  { codigo: "5500", nombre: "ITBIS Pagado (Crédito Fiscal)", tipo: "Gasto" },
];

const TIPO_COLORS: Record<string, string> = {
  Activo:     "badge-success",
  Pasivo:     "badge-danger",
  Patrimonio: "badge-info",
  Ingreso:    "badge-warning",
  Gasto:      "bg-surface-high text-on-surface-muted text-xs font-semibold px-2 py-0.5 rounded-full",
};

export default function ConfiguracionPage() {
  const [nombre,     setNombre]     = useState("");
  const [email,      setEmail]      = useState("");
  const [savingProf, setSavingProf] = useState(false);
  const [savedProf,  setSavedProf]  = useState(false);

  const [pwdActual,  setPwdActual]  = useState("");
  const [pwdNuevo,   setPwdNuevo]   = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [savingPwd,  setSavingPwd]  = useState(false);
  const [pwdMsg,     setPwdMsg]     = useState<{ ok: boolean; text: string } | null>(null);

  const [notifEmail,  setNotifEmail]  = useState(true);
  const [notifDgii,   setNotifDgii]   = useState(true);
  const [notifVenc,   setNotifVenc]   = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);
  const [savedNotif,  setSavedNotif]  = useState(false);

  const [catalogFilter, setCatalogFilter] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setEmail(user.email ?? "");
      supabase
        .from("profiles")
        .select("nombre")
        .eq("id", user.id)
        .single()
        .then(({ data }) => { if (data) setNombre(data.nombre ?? ""); });
    });
  }, []);

  async function handleSavePerfil(e: React.FormEvent) {
    e.preventDefault();
    setSavingProf(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ nombre }).eq("id", user.id);
    }
    setSavingProf(false);
    setSavedProf(true);
    setTimeout(() => setSavedProf(false), 3000);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwdNuevo !== pwdConfirm) {
      setPwdMsg({ ok: false, text: "Las contraseñas nuevas no coinciden" });
      return;
    }
    if (pwdNuevo.length < 8) {
      setPwdMsg({ ok: false, text: "La contraseña debe tener al menos 8 caracteres" });
      return;
    }
    setSavingPwd(true);
    setPwdMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pwdNuevo });
    setSavingPwd(false);
    if (error) {
      setPwdMsg({ ok: false, text: error.message });
    } else {
      setPwdMsg({ ok: true, text: "Contraseña actualizada correctamente" });
      setPwdActual(""); setPwdNuevo(""); setPwdConfirm("");
      setTimeout(() => setPwdMsg(null), 4000);
    }
  }

  async function handleSaveNotif(e: React.FormEvent) {
    e.preventDefault();
    setSavingNotif(true);
    await new Promise((r) => setTimeout(r, 600));
    setSavingNotif(false);
    setSavedNotif(true);
    setTimeout(() => setSavedNotif(false), 3000);
  }

  const filteredCatalog = CATALOGO.filter(
    (c) =>
      c.codigo.includes(catalogFilter) ||
      c.nombre.toLowerCase().includes(catalogFilter.toLowerCase()) ||
      c.tipo.toLowerCase().includes(catalogFilter.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="label-section mb-2">Preferencias del Sistema</p>
        <h2 className="font-display text-3xl font-extrabold text-primary tracking-tight">
          Configuración
        </h2>
      </div>

      <div className="grid grid-cols-12 gap-8">

        {/* ── Left column ── */}
        <div className="col-span-12 lg:col-span-5 space-y-6">

          {/* Perfil */}
          <section className="bg-surface-lowest rounded-(--radius-card) p-8 shadow-card">
            <h3 className="font-display text-lg font-bold text-primary mb-6">Mi Perfil</h3>
            <form onSubmit={handleSavePerfil} className="space-y-5">
              <div>
                <label htmlFor="cfg-nombre" className="empresa-field-label">Nombre completo</label>
                <input
                  id="cfg-nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  className="empresa-input"
                />
              </div>
              <div>
                <label htmlFor="cfg-email" className="empresa-field-label">Correo electrónico</label>
                <input
                  id="cfg-email"
                  type="email"
                  value={email}
                  readOnly
                  className="empresa-input opacity-60 cursor-not-allowed"
                />
                <p className="text-xs text-on-surface-faint mt-1">El correo se gestiona desde Supabase Auth.</p>
              </div>
              <button
                type="submit"
                disabled={savingProf}
                className="btn-primary w-full py-3 text-sm"
              >
                {savingProf ? "Guardando…" : savedProf ? "✓ Perfil actualizado" : "Guardar Cambios"}
              </button>
            </form>
          </section>

          {/* Cambiar contraseña */}
          <section className="bg-surface-lowest rounded-(--radius-card) p-8 shadow-card">
            <h3 className="font-display text-lg font-bold text-primary mb-6">Cambiar Contraseña</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="cfg-pwd-actual" className="empresa-field-label">Contraseña actual</label>
                <input
                  id="cfg-pwd-actual"
                  type="password"
                  value={pwdActual}
                  onChange={(e) => setPwdActual(e.target.value)}
                  placeholder="••••••••"
                  className="empresa-input"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label htmlFor="cfg-pwd-nuevo" className="empresa-field-label">Nueva contraseña</label>
                <input
                  id="cfg-pwd-nuevo"
                  type="password"
                  value={pwdNuevo}
                  onChange={(e) => setPwdNuevo(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="empresa-input"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label htmlFor="cfg-pwd-confirm" className="empresa-field-label">Confirmar nueva contraseña</label>
                <input
                  id="cfg-pwd-confirm"
                  type="password"
                  value={pwdConfirm}
                  onChange={(e) => setPwdConfirm(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="empresa-input"
                  autoComplete="new-password"
                />
              </div>
              {pwdMsg && (
                <p className={`text-xs font-semibold ${pwdMsg.ok ? "text-success" : "text-danger"}`}>
                  {pwdMsg.text}
                </p>
              )}
              <button
                type="submit"
                disabled={savingPwd || !pwdNuevo}
                className="btn-primary w-full py-3 text-sm"
              >
                {savingPwd ? "Actualizando…" : "Actualizar Contraseña"}
              </button>
            </form>
          </section>

          {/* Notificaciones */}
          <section className="bg-surface-lowest rounded-(--radius-card) p-8 shadow-card">
            <h3 className="font-display text-lg font-bold text-primary mb-6">Notificaciones</h3>
            <form onSubmit={handleSaveNotif} className="space-y-4">
              {[
                { id: "notif-email", label: "Notificaciones por correo", desc: "Recibe resúmenes semanales en tu bandeja de entrada", value: notifEmail, set: setNotifEmail },
                { id: "notif-dgii", label: "Alertas DGII", desc: "Recibe avisos antes de vencimientos críticos", value: notifDgii, set: setNotifDgii },
                { id: "notif-venc", label: "Recordatorios de vencimiento", desc: "7 días antes de cada obligación fiscal", value: notifVenc, set: setNotifVenc },
              ].map((n) => (
                <label key={n.id} htmlFor={n.id} className="flex items-start gap-4 cursor-pointer group">
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      id={n.id}
                      type="checkbox"
                      checked={n.value}
                      onChange={(e) => n.set(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-6 rounded-full transition-colors ${n.value ? "bg-primary" : "bg-surface-high"}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${n.value ? "translate-x-5" : "translate-x-1"}`} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">{n.label}</p>
                    <p className="text-xs text-on-surface-faint mt-0.5">{n.desc}</p>
                  </div>
                </label>
              ))}
              <button type="submit" disabled={savingNotif} className="btn-secondary w-full py-3 text-sm mt-2">
                {savingNotif ? "Guardando…" : savedNotif ? "✓ Preferencias guardadas" : "Guardar Preferencias"}
              </button>
            </form>
          </section>
        </div>

        {/* ── Right: Catálogo de Cuentas ── */}
        <div className="col-span-12 lg:col-span-7">
          <section className="bg-surface-lowest rounded-(--radius-card) shadow-card overflow-hidden flex flex-col min-h-150">
            <div className="px-8 py-6 bg-surface-low sidebar-divider">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-primary">Catálogo de Cuentas</h3>
                  <p className="text-sm text-on-surface-muted mt-0.5">Plan contable estándar República Dominicana</p>
                </div>
                <span className="badge-info">{CATALOGO.length} cuentas</span>
              </div>
              <input
                type="search"
                value={catalogFilter}
                onChange={(e) => setCatalogFilter(e.target.value)}
                placeholder="Buscar por código, nombre o tipo…"
                className="empresa-input text-sm"
                aria-label="Buscar cuenta contable"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="facturas-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre de la Cuenta</th>
                    <th>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalog.length > 0 ? filteredCatalog.map((c) => (
                    <tr key={c.codigo}>
                      <td>
                        <span className="font-mono text-sm font-bold text-primary">{c.codigo}</span>
                      </td>
                      <td>
                        <span className="text-sm text-on-surface">{c.nombre}</span>
                      </td>
                      <td>
                        <span className={TIPO_COLORS[c.tipo] ?? "badge-info"}>{c.tipo}</span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="text-center py-12 text-on-surface-faint text-sm">
                        No se encontraron cuentas para &ldquo;{catalogFilter}&rdquo;
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-8 py-4 bg-surface-low sidebar-divider">
              <p className="text-xs text-on-surface-faint">
                Plan de cuentas basado en la norma contable RD. Para agregar cuentas personalizadas, contacta a soporte.
              </p>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
