"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./DashboardShell";

const pageTitles: Record<string, string> = {
  "/dashboard":      "Panel de Control Fiscal",
  "/facturas":       "Facturas",
  "/chat":           "Chat Asistente",
  "/consultas-dgii": "Consultas DGII",
  "/reportes":       "Reportes Financieros",
  "/empresa":        "Gestión de Empresa",
};

export default function Topbar() {
  const pathname = usePathname();
  const title    = pageTitles[pathname] ?? "QFiscal";
  const { toggle } = useSidebar();

  return (
    <header className="topbar">
      {/* Left: hamburger (mobile) + title + search */}
      <div className="flex items-center gap-4 flex-1">
        <button
          type="button"
          onClick={toggle}
          aria-label="Abrir menú"
          className="topbar-icon-btn lg:hidden shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <span className="font-display font-extrabold text-base tracking-tight text-primary shrink-0">
          {title}
        </span>
        <div className="relative w-full max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-faint">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Buscar RNC, Factura o NCF..."
            className="topbar-search"
          />
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-4">
        <button type="button" className="text-sm font-semibold text-primary hover:underline underline-offset-4 transition-colors">
          Cambiar Empresa
        </button>

        <Link href="/facturas" className="btn-primary py-2 px-5 text-sm">
          + Nueva Factura
        </Link>

        <div className="flex items-center gap-1 pl-4 topbar-divider">
          <button type="button" className="topbar-icon-btn" aria-label="Notificaciones">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </button>
          <button type="button" className="topbar-icon-btn" aria-label="Perfil">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
