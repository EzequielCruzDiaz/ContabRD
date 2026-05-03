import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DgiiClient } from "dgii-ts/client";

const client = new DgiiClient();

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { rnc } = await req.json();
  if (!rnc?.trim()) return NextResponse.json({ error: "RNC requerido" }, { status: 400 });

  try {
    const data = await client.getContribuyente(rnc.trim());
    if (!data) return NextResponse.json({ error: "RNC no encontrado en el registro de la DGII" }, { status: 404 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Error al consultar la DGII. Intente de nuevo." }, { status: 502 });
  }
}
