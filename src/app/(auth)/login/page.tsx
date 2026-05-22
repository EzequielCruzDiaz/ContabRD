"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const LOGIN_EMAIL_KEY = "contabrd_login_email";

export default function LoginPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // Restore saved email on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(LOGIN_EMAIL_KEY);
      if (saved) setEmail(saved);
    } catch { /* ignore */ }
  }, []);

  // Persist email while typing (not password — security)
  useEffect(() => {
    try {
      if (email) sessionStorage.setItem(LOGIN_EMAIL_KEY, email);
      else sessionStorage.removeItem(LOGIN_EMAIL_KEY);
    } catch { /* ignore */ }
  }, [email]);

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Credenciales incorrectas. Verifique su correo y contraseña.");
      setLoading(false);
      return;
    }

    // Persist the "remember me" preference so SessionGuard can enforce it
    localStorage.setItem("remember-me", remember ? "true" : "false");
    sessionStorage.setItem("session-started", "1");
    sessionStorage.removeItem(LOGIN_EMAIL_KEY);

    router.push("/dashboard");
    router.refresh();
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

            {/* Brand */}
            <div className="relative z-10">
              <h1 className="font-display font-extrabold text-3xl tracking-tight">QFiscal</h1>
              <div className="brand-accent-bar" />
            </div>

            {/* Quote + RD badge */}
            <div className="relative z-10">
              <blockquote className="mb-8">
                <p className="font-display text-2xl font-semibold leading-snug opacity-90">
                  &ldquo;La arquitectura de su éxito financiero, construida sobre la base de la precisión fiscal.&rdquo;
                </p>
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="frosted-icon h-12 w-12 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest opacity-60">República Dominicana</p>
                  <p className="text-xs opacity-40">Gestión Fiscal &amp; Contable</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Login Form ── */}
          <div className="bg-surface-lowest flex flex-col justify-center p-8 md:p-16">

            {/* Mobile logo */}
            <div className="md:hidden mb-8 text-center">
              <span className="font-display font-extrabold text-2xl tracking-tight text-primary">QFiscal</span>
            </div>

            <div className="mb-10">
              <h2 className="font-display text-2xl font-bold mb-2 text-primary">
                Bienvenido de nuevo
              </h2>
              <p className="text-on-surface-muted">
                Ingrese sus credenciales para acceder a su panel fiscal.
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-5">

              {/* Email */}
              <div>
                <label className="label-section block mb-2" htmlFor="email">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@empresa.do"
                    required
                    className={`input-field${!email ? " input-field-icon" : ""}`}
                  />
                  {!email && (
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-faint">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </span>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label-section" htmlFor="password">Contraseña</label>
                  <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline underline-offset-4">
                    ¿Olvidó su contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
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

              {/* Remember */}
              <div className="flex items-center gap-2.5 py-1">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer accent-primary"
                />
                <label htmlFor="remember" className="text-sm text-on-surface-muted cursor-pointer">
                  Recordar en este dispositivo
                </label>
              </div>

              {/* Error */}
              {error && <div className="alert-amber text-sm">{error}</div>}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-base group"
              >
                <span>{loading ? "Verificando..." : "Acceder"}</span>
                {!loading && (
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                )}
              </button>
            </form>

            <div className="auth-divider mt-10 pt-8 text-center">
              <p className="text-sm text-on-surface-muted">
                ¿Aún no tiene cuenta?{" "}
                <Link href="/register" className="font-semibold text-primary hover:underline underline-offset-4">
                  Registrar empresa
                </Link>
              </p>
            </div>
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
