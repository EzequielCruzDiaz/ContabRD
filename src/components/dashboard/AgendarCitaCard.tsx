"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AgendarCitaCard() {
  const [open, setOpen]       = useState(false);
  const [nombre, setNombre]   = useState("");
  const [telefono, setTel]    = useState("");
  const [fecha, setFecha]     = useState("");
  const [tema, setTema]       = useState("");
  const [saving, setSaving]   = useState(false);
  const [done, setDone]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("citas").insert({
      usuario_id: user?.id,
      nombre,
      telefono,
      fecha_preferida: fecha,
      tema,
    });
    setSaving(false);
    setDone(true);
  }

  function handleClose() {
    setOpen(false);
    setDone(false);
    setNombre(""); setTel(""); setFecha(""); setTema("");
  }

  return (
    <>
      <div className="bg-surface-lowest rounded-[var(--radius-card)] p-5 shadow-card">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-success-light flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <div>
            <p className="font-display font-bold text-primary text-sm">Consultoría Premium</p>
            <p className="text-xs text-on-surface-faint mt-0.5">
              Habla con un contador experto hoy mismo.
            </p>
          </div>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="btn-primary w-full py-2.5 text-sm">
          Agendar Cita
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleClose}>
          <div className="bg-surface-lowest rounded-(--radius-card) p-8 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl font-bold text-primary">Agendar Consultoría</h3>
              <button type="button" onClick={handleClose} className="topbar-icon-btn" aria-label="Cerrar">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {done ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-success-light flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-display font-bold text-primary text-lg mb-1">¡Solicitud enviada!</p>
                <p className="text-sm text-on-surface-muted">Nos pondremos en contacto contigo pronto.</p>
                <button type="button" onClick={handleClose} className="mt-6 btn-primary py-2.5 px-8 text-sm">
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="cita-nombre" className="label-section mb-1 block">Nombre completo</label>
                  <input
                    id="cita-nombre"
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Juan Pérez"
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label htmlFor="cita-tel" className="label-section mb-1 block">Teléfono</label>
                  <input
                    id="cita-tel"
                    type="tel"
                    required
                    value={telefono}
                    onChange={(e) => setTel(e.target.value)}
                    placeholder="809-000-0000"
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label htmlFor="cita-fecha" className="label-section mb-1 block">Fecha preferida</label>
                  <input
                    id="cita-fecha"
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label htmlFor="cita-tema" className="label-section mb-1 block">Tema a tratar</label>
                  <textarea
                    id="cita-tema"
                    required
                    rows={3}
                    value={tema}
                    onChange={(e) => setTema(e.target.value)}
                    placeholder="Ej: Revisión declaración IT-1, optimización fiscal..."
                    className="input-field w-full resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary w-full py-3 text-sm mt-2"
                >
                  {saving ? "Enviando..." : "Confirmar Solicitud"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
