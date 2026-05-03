"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setLoading(false);
      setError("No se pudo actualizar la contraseña. El enlace puede haber expirado.");
      return;
    }

    // Sign out the recovery session so the user logs in fresh with the new password
    await supabase.auth.signOut();
    setLoading(false);
    setDone(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <main className="grow flex items-center justify-center p-6 md:p-12">
        <div className="auth-card w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 overflow-hidden">

          {/* ── Left: Brand Panel ── */}
          <div className="editorial-gradient relative hidden md:flex flex-col justify-between p-12 text-white overflow-hidden">
            <div className="brand-pattern" />
            <div className="brand-ring-1" />
            <div className="brand-ring-2" />

            <div className="relative z-10">
              <h1 className="font-display font-extrabold text-3xl tracking-tight">QFiscal</h1>
              <div className="brand-accent-bar" />
            </div>

            <div className="relative z-10">
              <blockquote className="mb-8">
                <p className="font-display text-2xl font-semibold leading-snug opacity-90">
                  "Proteja su plataforma con una contraseña segura y robusta."
                </p>
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="frosted-icon h-12 w-12 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest opacity-60">Nueva contraseña</p>
                  <p className="text-xs opacity-40">Mínimo 8 caracteres recomendado</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Form ── */}
          <div className="bg-surface-lowest flex flex-col justify-center p-8 md:p-16">

            {/* Mobile logo */}
            <div className="md:hidden mb-8 text-center">
              <span className="font-display font-extrabold text-2xl tracking-tight text-primary">QFiscal</span>
            </div>

            {done ? (
              /* ── Success state ── */
              <div className="text-center">
                <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-success-light flex items-center justify-center">
                  <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <h2 className="font-display text-2xl font-bold mb-3 text-primary">
                  Contraseña actualizada
                </h2>
                <p className="text-on-surface-muted text-sm mb-2">
                  Su contraseña ha sido cambiada exitosamente.
                </p>
                <p className="text-on-surface-faint text-xs mb-6">
                  Redirigiendo al inicio de sesión...
                </p>
                <Link href="/login" className="btn-primary w-full py-3 text-sm">
                  Iniciar sesión ahora
                </Link>
              </div>
            ) : (
              /* ── Form state ── */
              <>
                <div className="mb-10">
                  <h2 className="font-display text-2xl font-bold mb-2 text-primary">
                    Nueva contraseña
                  </h2>
                  <p className="text-on-surface-muted text-sm">
                    Elija una contraseña segura para proteger su cuenta fiscal.
                  </p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-5">

                  {/* New password */}
                  <div>
                    <label className="label-section block mb-2" htmlFor="password">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        required
                        minLength={8}
                        className={`input-field${!password ? " input-field-icon" : ""}`}
                      />
                      {!password && (
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-faint">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="label-section block mb-2" htmlFor="confirm">
                      Confirmar Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="confirm"
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Repita la contraseña"
                        required
                        className={`input-field${!confirm ? " input-field-icon" : ""}`}
                      />
                      {!confirm && (
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-faint">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Password strength hint */}
                  {password && (
                    <p className="text-xs text-on-surface-faint">
                      {password.length < 8
                        ? "Contraseña muy corta"
                        : password.length < 12
                        ? "Contraseña aceptable — considere hacerla más larga"
                        : "Contraseña segura"}
                    </p>
                  )}

                  {/* Error */}
                  {error && <div className="alert-amber text-sm">{error}</div>}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-4 text-base group"
                  >
                    <span>{loading ? "Actualizando..." : "Establecer nueva contraseña"}</span>
                    {!loading && (
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    )}
                  </button>
                </form>

                <div className="auth-divider mt-10 pt-8 text-center">
                  <p className="text-sm text-on-surface-muted">
                    ¿Necesita ayuda?{" "}
                    <Link href="/login" className="font-semibold text-primary hover:underline underline-offset-4">
                      Volver al inicio de sesión
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="auth-footer py-6 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-on-surface-faint">
            © 2025 QFiscal. República Dominicana. Todos los derechos reservados.
          </p>
          <nav className="flex gap-6">
            {[
              { label: "Privacidad", href: "/privacidad" },
              { label: "Términos de Servicio", href: "/terminos" },
              { label: "Ayuda Fiscal", href: "https://dgii.gov.do", external: true },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="text-sm text-on-surface-faint hover:underline underline-offset-4"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
