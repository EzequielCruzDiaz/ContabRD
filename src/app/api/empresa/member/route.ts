import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function PATCH(req: Request) {
  const { memberId, rol } = await req.json();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: caller } = await supabase
    .from("profiles").select("empresa_id, rol").eq("id", user.id).single();
  if (caller?.rol !== "admin") {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ rol })
    .eq("id", memberId)
    .eq("empresa_id", caller.empresa_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { memberId } = await req.json();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: caller } = await supabase
    .from("profiles").select("empresa_id, rol").eq("id", user.id).single();
  if (caller?.rol !== "admin") {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  // Remove access by clearing empresa_id (don't delete the auth user)
  const { error } = await supabase
    .from("profiles")
    .update({ empresa_id: null })
    .eq("id", memberId)
    .eq("empresa_id", caller.empresa_id)
    .neq("id", user.id); // can't remove yourself

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
