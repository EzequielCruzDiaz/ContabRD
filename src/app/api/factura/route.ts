import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeImage } from "@/lib/ai/client";
import { SYSTEM_PROMPT } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No se recibió imagen" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  const text = await analyzeImage(
    base64,
    file.type,
    "Analiza esta factura y extrae los datos en el formato JSON indicado."
  );

  let datos: Record<string, unknown> = {};
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) datos = JSON.parse(jsonMatch[0]);
  } catch {}

  const { data: profile } = await supabase
    .from("profiles")
    .select("empresa_id")
    .eq("id", user.id)
    .single();

  const fileName = `${profile?.empresa_id}/${Date.now()}-${file.name}`;
  await supabase.storage.from("facturas").upload(fileName, file);
  const { data: urlData } = supabase.storage
    .from("facturas")
    .getPublicUrl(fileName);

  const { data: factura } = await supabase
    .from("facturas")
    .insert({
      ...datos,
      asiento_contable: Array.isArray(datos.asiento_contable)
        ? JSON.stringify(datos.asiento_contable)
        : datos.asiento_contable,
      empresa_id: profile?.empresa_id,
      usuario_id: user.id,
      archivo_url: urlData.publicUrl,
      datos_raw: datos,
      estado: datos.ncf ? "pendiente" : "error",
      error_mensaje: !datos.ncf ? "No se pudo leer el NCF" : null,
    })
    .select()
    .single();

  return NextResponse.json({ factura, datos });
}
