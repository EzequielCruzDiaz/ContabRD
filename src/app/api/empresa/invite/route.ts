import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { email, empresaId } = await req.json();
  if (!email || !empresaId) {
    return NextResponse.json({ error: "email y empresaId requeridos" }, { status: 400 });
  }

  // Verify caller is admin of this empresa
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("empresa_id, rol")
    .eq("id", user.id)
    .single();

  if (profile?.empresa_id !== empresaId || profile.rol !== "admin") {
    return NextResponse.json({ error: "Solo administradores pueden invitar usuarios" }, { status: 403 });
  }

  // Use service role client to invite
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { empresa_id: empresaId },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
