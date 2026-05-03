export type DgiiEvent = {
  mes: string;
  dia: string;
  titulo: string;
  desc: string;
  urgente: boolean;
};

const MESES = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
const MESES_LARGO = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function nextBusinessDay(d: Date): Date {
  const copy = new Date(d);
  const dow = copy.getDay();
  if (dow === 6) copy.setDate(copy.getDate() + 2);
  else if (dow === 0) copy.setDate(copy.getDate() + 1);
  return copy;
}

function eventDate(year: number, month: number, day: number): Date {
  const d = new Date(year, month, day);
  return nextBusinessDay(d);
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatEvent(fecha: Date, titulo: string, desc: string, today: Date): DgiiEvent {
  const dias = Math.ceil((fecha.getTime() - today.getTime()) / 86_400_000);
  return {
    mes: MESES[fecha.getMonth()],
    dia: String(fecha.getDate()).padStart(2, "0"),
    titulo,
    desc,
    urgente: dias <= 7,
  };
}

export function getUpcomingDgiiEvents(today: Date = new Date(), count = 4): DgiiEvent[] {
  const events: { fecha: Date; titulo: string; desc: string }[] = [];
  const y = today.getFullYear();
  const m = today.getMonth(); // 0-indexed

  // Generate candidates across next 3 months
  for (let offset = 0; offset <= 2; offset++) {
    const totalMonths = m + offset;
    const year  = y + Math.floor(totalMonths / 12);
    const month = totalMonths % 12; // 0-indexed

    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear  = month === 0 ? year - 1 : year;

    // IT-1 (ITBIS): 20th of following month
    events.push({
      fecha: eventDate(year, month, 20),
      titulo: "IT-1 (ITBIS)",
      desc: `Presentación y pago del ITBIS de ${MESES_LARGO[prevMonth]} ${prevYear}`,
    });

    // IR-17 (Retenciones): 10th of following month
    events.push({
      fecha: eventDate(year, month, 10),
      titulo: "IR-17 (Retenciones)",
      desc: `Retenciones efectuadas en ${MESES_LARGO[prevMonth]} ${prevYear}`,
    });

    // 606 / 607: 20th of following month
    events.push({
      fecha: eventDate(year, month, 20),
      titulo: "Formatos 606 y 607",
      desc: `Compras y ventas de ${MESES_LARGO[prevMonth]} ${prevYear}`,
    });

    // TSS: last business day of current month
    events.push({
      fecha: eventDate(year, month, lastDayOfMonth(year, month)),
      titulo: "TSS (Seg. Social)",
      desc: `Nómina de ${MESES_LARGO[month]} ${year}`,
    });
  }

  // IR-2 anual: April 30
  const ir2Year = m >= 4 ? y + 1 : y;
  events.push({
    fecha: eventDate(ir2Year, 3, 30),
    titulo: "IR-2 (ISR Anual)",
    desc: `Declaración jurada ISR año fiscal ${ir2Year - 1}`,
  });

  return events
    .filter((e) => e.fecha >= today)
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
    .reduce<{ fecha: Date; titulo: string; desc: string }[]>((acc, e) => {
      const key = `${e.fecha.toDateString()}-${e.titulo}`;
      if (!acc.some((x) => `${x.fecha.toDateString()}-${x.titulo}` === key)) acc.push(e);
      return acc;
    }, [])
    .slice(0, count)
    .map((e) => formatEvent(e.fecha, e.titulo, e.desc, today));
}
