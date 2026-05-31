import Link from "next/link";

const STEPS = [
  {
    n: "1",
    title: "Sube tu primera factura",
    desc: "Usa OCR con IA para extraer datos automáticamente.",
    href: "/facturas",
    label: "Subir factura",
    color: "bg-success-light",
    iconColor: "text-success",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    n: "2",
    title: "Verifica tu RNC y NCF",
    desc: "Consulta el estado de tus comprobantes ante la DGII.",
    href: "/consultas-dgii",
    label: "Ir a consultas",
    color: "bg-info-light",
    iconColor: "text-info",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    n: "3",
    title: "Configura tu empresa",
    desc: "Completa los datos fiscales y agrega a tu equipo.",
    href: "/empresa",
    label: "Configurar empresa",
    color: "bg-warning-light",
    iconColor: "text-warning",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
  },
];

export default function WelcomeBanner({ nombre }: { nombre?: string }) {
  return (
    <div className="bg-surface-lowest rounded-(--radius-card) p-8 shadow-card border border-surface-high">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-primary">
            Bienvenido{nombre ? `, ${nombre}` : ""} a QFiscal
          </h3>
          <p className="text-sm text-on-surface-muted mt-0.5">
            Sigue estos pasos para comenzar a gestionar tu contabilidad.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STEPS.map((s) => (
          <div key={s.n} className="flex flex-col gap-3 p-5 rounded-xl bg-surface-low">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center ${s.iconColor}`}>
                {s.icon}
              </div>
              <span className="text-xs font-bold text-on-surface-faint uppercase tracking-wider">Paso {s.n}</span>
            </div>
            <div>
              <p className="font-semibold text-primary text-sm">{s.title}</p>
              <p className="text-xs text-on-surface-muted mt-0.5">{s.desc}</p>
            </div>
            <Link href={s.href} className="mt-auto text-xs font-bold text-primary hover:underline underline-offset-4">
              {s.label} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
