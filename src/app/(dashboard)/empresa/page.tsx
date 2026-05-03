"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RolUsuario } from "@/types";

interface TeamMember {
  id: string;
  nombre: string;
  rol: RolUsuario;
  activo: boolean;
}

interface EmpresaData {
  id: string;
  nombre: string;
  rnc: string | null;
  direccion: string | null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function RoleBadge({ rol }: { rol: RolUsuario }) {
  if (rol === "admin")
    return <span className="role-badge-admin">Admin</span>;
  if (rol === "contador")
    return <span className="role-badge-contador">Contador</span>;
  return <span className="role-badge-readonly">Solo Lectura</span>;
}

export default function EmpresaPage() {
  const [empresa,    setEmpresa]    = useState<EmpresaData | null>(null);
  const [rnc,        setRnc]        = useState("");
  const [nombre,     setNombre]     = useState("");
  const [direccion,  setDireccion]  = useState("");
  const [team,       setTeam]       = useState<TeamMember[]>([]);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [inviting,   setInviting]   = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteMsg,  setInviteMsg]  = useState<{ ok: boolean; text: string } | null>(null);
  const [openMenu,   setOpenMenu]   = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const empresaId = empresa?.id ?? "";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("empresa_id")
        .eq("id", user.id)
        .single();

      if (!profile?.empresa_id) return;

      const [{ data: emp }, { data: members }] = await Promise.all([
        supabase
          .from("empresas")
          .select("id, nombre, rnc, direccion")
          .eq("id", profile.empresa_id)
          .single(),
        supabase
          .from("profiles")
          .select("id, nombre, rol")
          .eq("empresa_id", profile.empresa_id),
      ]);

      if (emp) {
        setEmpresa(emp);
        setRnc(emp.rnc ?? "");
        setNombre(emp.nombre ?? "");
        setDireccion(emp.direccion ?? "");
      }

      if (members) {
        setTeam(
          members.map((m) => ({
            id: m.id,
            nombre: m.nombre ?? "—",
            rol: (m.rol ?? "usuario") as RolUsuario,
            activo: true,
          }))
        );
      }
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!empresa) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("empresas")
      .update({ nombre, rnc: rnc || null, direccion: direccion || null })
      .eq("id", empresa.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || !empresaId) return;
    setInviteSending(true);
    setInviteMsg(null);
    const res = await fetch("/api/empresa/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim(), empresaId }),
    });
    const data = await res.json();
    setInviteSending(false);
    if (data.ok) {
      setInviteMsg({ ok: true, text: `Invitación enviada a ${inviteEmail.trim()}` });
      setInviteEmail("");
      setTimeout(() => { setInviting(false); setInviteMsg(null); }, 3000);
    } else {
      setInviteMsg({ ok: false, text: data.error ?? "Error al enviar invitación" });
    }
  }

  async function handleChangeRol(memberId: string, rol: RolUsuario) {
    setOpenMenu(null);
    await fetch("/api/empresa/member", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, rol }),
    });
    setTeam((prev) => prev.map((m) => m.id === memberId ? { ...m, rol } : m));
  }

  async function handleRemove(memberId: string) {
    setOpenMenu(null);
    const res = await fetch("/api/empresa/member", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    if (res.ok) {
      setTeam((prev) => prev.filter((m) => m.id !== memberId));
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="label-section mb-2">Administración Central</p>
        <h2 className="font-display text-3xl font-extrabold text-primary tracking-tight">
          Gestión de Empresa
        </h2>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-8">

        {/* ── Left: Datos Fiscales ── */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <section className="bg-surface-lowest rounded-(--radius-card) p-8 shadow-card">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-display text-xl font-bold text-primary">Datos Fiscales</h3>
              <svg className="w-6 h-6 text-primary opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label htmlFor="rnc" className="empresa-field-label">
                  RNC (Registro Nacional de Contribuyente)
                </label>
                <input
                  id="rnc"
                  type="text"
                  value={rnc}
                  onChange={(e) => setRnc(e.target.value)}
                  placeholder="000-00000-0"
                  className="empresa-input font-mono"
                />
              </div>

              <div>
                <label htmlFor="razon-social" className="empresa-field-label">
                  Razón Social
                </label>
                <input
                  id="razon-social"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre de la empresa"
                  className="empresa-input"
                />
              </div>

              <div>
                <label htmlFor="direccion" className="empresa-field-label">
                  Dirección Fiscal
                </label>
                <textarea
                  id="direccion"
                  rows={3}
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Av. Abraham Lincoln, Santo Domingo"
                  className="empresa-textarea"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary w-full py-3 text-sm"
                >
                  {saving ? "Guardando…" : saved ? "✓ Información actualizada" : "Actualizar Información"}
                </button>
              </div>
            </form>
          </section>

          {/* DGII Verification Notice */}
          <div className="dgii-verify-notice">
            <svg className="w-5 h-5 text-warning shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-warning-text mb-1">Verificación DGII Activa</p>
              <p className="text-xs text-warning-text opacity-80 leading-relaxed">
                Su empresa se encuentra al día con sus obligaciones fiscales según la última consulta del sistema.
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: Equipo de Trabajo ── */}
        <div className="col-span-12 lg:col-span-7">
          <section className="bg-surface-lowest rounded-(--radius-card) shadow-card overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="px-8 py-6 flex justify-between items-center sidebar-divider bg-surface-low">
              <div>
                <h3 className="font-display text-xl font-bold text-primary">Equipo de Trabajo</h3>
                <p className="text-sm text-on-surface-muted mt-0.5">
                  Gestione los accesos y permisos de su organización
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInviting(true)}
                className="btn-primary py-2.5 px-5 text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
                Invitar Usuario
              </button>
            </div>

            {/* Invite banner */}
            {inviting && (
              <div className="px-8 py-4 bg-surface-low space-y-2 sidebar-divider">
                <div className="flex items-center gap-4">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="correo@empresa.do"
                    className="empresa-input flex-1 text-sm"
                    aria-label="Correo electrónico para invitar"
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  />
                  <button
                    type="button"
                    disabled={inviteSending || !inviteEmail.trim()}
                    className="btn-primary py-2.5 px-4 text-sm shrink-0"
                    onClick={handleInvite}
                  >
                    {inviteSending ? "Enviando…" : "Enviar Invitación"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary py-2.5 px-4 text-sm shrink-0"
                    onClick={() => { setInviting(false); setInviteMsg(null); setInviteEmail(""); }}
                    aria-label="Cancelar invitación"
                  >
                    Cancelar
                  </button>
                </div>
                {inviteMsg && (
                  <p className={`text-xs font-semibold ${inviteMsg.ok ? "text-success" : "text-danger"}`}>
                    {inviteMsg.text}
                  </p>
                )}
              </div>
            )}

            {/* Team Table */}
            <div className="flex-1 overflow-x-auto">
              <table className="facturas-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {team.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-on-surface-faint py-10 text-sm">
                        Cargando equipo…
                      </td>
                    </tr>
                  ) : (
                    team.map((member) => (
                      <tr key={member.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className={`member-initials ${member.rol === "admin" ? "member-initials-navy" : ""}`}>
                              {getInitials(member.nombre)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-primary">{member.nombre}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <RoleBadge rol={member.rol} />
                        </td>
                        <td>
                          {member.activo ? (
                            <span className="member-status-active">Activo</span>
                          ) : (
                            <span className="member-status-pending">Pendiente</span>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="relative inline-block" ref={openMenu === member.id ? menuRef : null}>
                            <button
                              type="button"
                              aria-label="Más opciones"
                              className="topbar-icon-btn"
                              onClick={() => setOpenMenu(openMenu === member.id ? null : member.id)}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                              </svg>
                            </button>
                            {openMenu === member.id && (
                              <div className="absolute right-0 mt-1 w-48 bg-surface-lowest rounded-xl shadow-2xl border border-surface-high z-50 py-1 text-sm">
                                <p className="px-3 py-2 text-xs font-bold text-on-surface-faint uppercase tracking-wider">Cambiar rol</p>
                                {(["admin", "contador", "usuario"] as RolUsuario[]).map((r) => (
                                  <button
                                    key={r}
                                    type="button"
                                    onClick={() => handleChangeRol(member.id, r)}
                                    className={`w-full text-left px-4 py-2 hover:bg-surface-low transition-colors capitalize ${member.rol === r ? "font-bold text-primary" : "text-on-surface"}`}
                                  >
                                    {r === "admin" ? "Administrador" : r === "contador" ? "Contador" : "Solo Lectura"}
                                    {member.rol === r && " ✓"}
                                  </button>
                                ))}
                                <div className="my-1 border-t border-surface-high" />
                                <button
                                  type="button"
                                  onClick={() => handleRemove(member.id)}
                                  className="w-full text-left px-4 py-2 text-danger hover:bg-danger-light transition-colors"
                                >
                                  Remover acceso
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer note */}
            <div className="px-8 py-5 bg-surface-low flex items-start gap-3">
              <svg className="w-4 h-4 text-on-surface-faint shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <p className="text-xs text-on-surface-faint leading-relaxed">
                El rol <strong className="font-semibold text-on-surface-muted">Contador</strong> permite generar reportes y cargar facturas, pero no autorizar pagos finales ni modificar la estructura de la empresa.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
