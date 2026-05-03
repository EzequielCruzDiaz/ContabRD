import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Service role bypasses RLS — returns only boolean availability, never leaks data
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Field = "email" | "rnc" | "razonSocial";

export async function POST(req: NextRequest) {
  const { field, value } = (await req.json()) as { field: Field; value: string };

  if (!field || !value?.trim()) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const v = value.trim();

  if (field === "email") {
    const { data, error } = await supabaseAdmin.rpc("email_exists", {
      check_email: v.toLowerCase(),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ available: !data });
  }

  if (field === "rnc") {
    const { data, error } = await supabaseAdmin
      .from("empresas")
      .select("id")
      .eq("rnc", v)
      .limit(1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ available: !data || data.length === 0 });
  }

  if (field === "razonSocial") {
    const { data, error } = await supabaseAdmin
      .from("empresas")
      .select("id")
      .ilike("nombre", v)
      .limit(1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ available: !data || data.length === 0 });
  }

  return NextResponse.json({ error: "Campo desconocido" }, { status: 400 });
}
