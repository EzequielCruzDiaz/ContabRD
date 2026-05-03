import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DgiiClient } from "dgii-ts/client";

const NCF_REGEX = /^[A-Z]\d{2}\d{8,10}$/;

const client = new DgiiClient();

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { rnc, ncf } = await req.json();
  if (!ncf?.trim()) return NextResponse.json({ error: "NCF requerido" }, { status: 400 });

  const ncfNorm = ncf.trim().toUpperCase();

  if (!NCF_REGEX.test(ncfNorm)) {
    return NextResponse.json({ valid: false, reason: "Formato de NCF inválido" });
  }

  if (!rnc?.trim()) {
    return NextResponse.json({ valid: true, reason: "Formato correcto (sin verificación DGII — ingrese RNC del emisor)" });
  }

  try {
    const data = await client.getNCF(rnc.trim(), ncfNorm);
    if (!data) return NextResponse.json({ valid: false, reason: "NCF no encontrado en registros DGII" });
    return NextResponse.json({ valid: true, data });
  } catch {
    return NextResponse.json({ error: "Error al consultar la DGII. Intente de nuevo." }, { status: 502 });
  }
}
